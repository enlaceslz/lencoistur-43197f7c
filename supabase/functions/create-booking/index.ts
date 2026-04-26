import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function generatePixCode(): string {
  const chars =
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let code = "00020126580014BR.GOV.BCB.PIX0136";
  for (let i = 0; i < 36; i++)
    code += chars[Math.floor(Math.random() * chars.length)];
  code += "5204000053039865802BR5925LENCOIS TOUR LTDA6013SANTO AMARO";
  return code;
}

function generateBookingCode(): string {
  const year = new Date().getFullYear();
  const num = String(Math.floor(Math.random() * 9999) + 1).padStart(4, "0");
  const letters = "ABCDEFGHIJKLMNPQRSTUVWXYZ";
  const randLetter = letters[Math.floor(Math.random() * letters.length)];
  return `RES-${year}-${num}${randLetter}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    // Validate required fields
    const { type, itemName, date, guests, payMethod, customerName, customerEmail, customerPhone, cpf, passport, country, birthDate } = body;

    if (!type || !itemName || !customerName || !customerEmail || !payMethod) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios faltando" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!["passeio", "translado"].includes(type)) {
      return new Response(
        JSON.stringify({ error: "Tipo inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!["pix", "cartao", "card", "dinheiro", "transferencia", "info"].includes(payMethod)) {
      return new Response(
        JSON.stringify({ error: "Método de pagamento inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const guestsNum = Number(guests);
    if (!Number.isInteger(guestsNum) || guestsNum < 1 || guestsNum > 50) {
      return new Response(
        JSON.stringify({ error: "Número de convidados inválido (1-50)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate customer fields
    const trimmedName = String(customerName).trim();
    const trimmedEmail = String(customerEmail).trim();
    const trimmedPhone = customerPhone ? String(customerPhone).trim() : null;

    if (trimmedName.length < 2 || trimmedName.length > 200) {
      return new Response(
        JSON.stringify({ error: "Nome deve ter entre 2 e 200 caracteres" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmedEmail) || trimmedEmail.length > 254) {
      return new Response(
        JSON.stringify({ error: "Email inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role to bypass RLS - server-side only
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Look up the actual price and pix_discount from the database
    let unitPrice: number;
    let pixDiscountPercent = 0;

    if (type === "passeio") {
      // Strip suffix like " (Coletivo)" or " (Privativo)" if present
      const cleanItemName = itemName.replace(/\s*\((Coletivo|Privativo)\)$/, "");
      
      const { data: tour, error: tourErr } = await supabaseAdmin
        .from("tours")
        .select("price, name, pix_discount")
        .eq("name", cleanItemName)
        .eq("active", true)
        .single();

      if (tourErr || !tour) {
        console.error(`Tour not found: "${cleanItemName}" (original: "${itemName}")`);
        return new Response(
          JSON.stringify({ error: `Passeio não encontrado ou inativo: ${cleanItemName}` }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      unitPrice = tour.price;
      pixDiscountPercent = tour.pix_discount || 0;
    } else {
      // translado - itemName format: "origin → destination"
      const parts = itemName.split(" → ");
      if (parts.length !== 2) {
        return new Response(
          JSON.stringify({ error: "Formato de translado inválido" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const { data: route, error: routeErr } = await supabaseAdmin
        .from("transfer_routes")
        .select("price, pix_discount")
        .eq("origin", parts[0])
        .eq("destination", parts[1])
        .eq("active", true)
        .single();

      if (routeErr || !route) {
        return new Response(
          JSON.stringify({ error: "Translado não encontrado ou inativo" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      unitPrice = route.price;
      pixDiscountPercent = route.pix_discount || 0;
    }

    const total = unitPrice * guestsNum;
    
    // Apply PIX discount server-side (only for PIX payments, capped 0-50%)
    const validPixDiscount = Math.max(0, Math.min(50, pixDiscountPercent));
    const discount = payMethod === "pix" && validPixDiscount > 0
      ? Math.round(total * validPixDiscount / 100)
      : 0;
    const finalTotal = total - discount;
    
    const pixCode = payMethod === "pix" ? generatePixCode() : null;

    // Helper to create booking
    const createBooking = async (customerId: string) => {
      const { data: booking, error: bookingErr } = await supabaseAdmin
        .from("bookings")
        .insert({
          customer_id: customerId,
          type,
          item_name: itemName,
          date: date || null,
          guests: guestsNum,
          unit_price: unitPrice,
          total,
          discount,
          final_total: finalTotal,
          pay_method: payMethod,
          status: "pendente",
          payment_status: "pendente",
          pix_code: pixCode,
          booking_code: generateBookingCode(),
        })
        .select("*, customers(*)")
        .single();

      if (bookingErr || !booking) {
        console.error("Error inserting booking:", bookingErr);
        return null;
      }
      return booking;
    };

    // Create customer atomically
    const { data: customer, error: customerErr } = await supabaseAdmin
      .from("customers")
      .insert({
        name: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone,
        cpf: cpf || null,
        passport: passport || null,
        country: country || "Brasil",
        birth_date: birthDate || null,
      })
      .select()
      .single();

    if (customerErr || !customer) {
      // If email already exists, try to find existing
      if (customerErr?.code === "23505") {
        const { data: existing } = await supabaseAdmin
          .from("customers")
          .select()
          .eq("email", trimmedEmail)
          .single();
        if (!existing) {
          return new Response(
            JSON.stringify({ error: "Erro ao processar cliente" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const booking = await createBooking(existing.id);
        if (!booking) {
          return new Response(
            JSON.stringify({ error: "Erro ao criar reserva" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(JSON.stringify(booking), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({ error: "Erro ao cadastrar cliente" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create booking with server-validated price and discount
    const booking = await createBooking(customer.id);
    if (!booking) {
      return new Response(
        JSON.stringify({ error: "Erro ao criar reserva" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(booking), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
