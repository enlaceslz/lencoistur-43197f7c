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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    // Validate required fields
    const { type, itemName, date, guests, payMethod, customerName, customerEmail, customerPhone } = body;

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

    if (!["pix", "cartao", "dinheiro", "transferencia"].includes(payMethod)) {
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

    // Look up the actual price from the database
    let unitPrice: number;

    if (type === "passeio") {
      const { data: tour, error: tourErr } = await supabaseAdmin
        .from("tours")
        .select("price, name")
        .eq("name", itemName)
        .eq("active", true)
        .single();

      if (tourErr || !tour) {
        return new Response(
          JSON.stringify({ error: "Passeio não encontrado ou inativo" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      unitPrice = tour.price;
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
        .select("price")
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
    }

    const total = unitPrice * guestsNum;
    const pixCode = payMethod === "pix" ? generatePixCode() : null;

    // Create customer atomically
    const { data: customer, error: customerErr } = await supabaseAdmin
      .from("customers")
      .insert({
        name: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone,
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
        // Use existing customer
        const { data: booking, error: bookingErr } = await supabaseAdmin
          .from("bookings")
          .insert({
            customer_id: existing.id,
            type,
            item_name: itemName,
            date: date || null,
            guests: guestsNum,
            unit_price: unitPrice,
            total,
            discount: 0,
            final_total: total,
            pay_method: payMethod,
            status: "pendente",
            payment_status: "pendente",
            pix_code: pixCode,
            booking_code: "TEMP",
          })
          .select("*, customers(*)")
          .single();

        if (bookingErr || !booking) {
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

    // Create booking with server-validated price
    const { data: booking, error: bookingErr } = await supabaseAdmin
      .from("bookings")
      .insert({
        customer_id: customer.id,
        type,
        item_name: itemName,
        date: date || null,
        guests: guestsNum,
        unit_price: unitPrice,
        total,
        discount: 0,
        final_total: total,
        pay_method: payMethod,
        status: "pendente",
        payment_status: "pendente",
        pix_code: pixCode,
        booking_code: "TEMP",
      })
      .select("*, customers(*)")
      .single();

    if (bookingErr || !booking) {
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
