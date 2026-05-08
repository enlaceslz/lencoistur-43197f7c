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
    console.log("Receiving booking request:", body);

    const { 
      type, itemName, date, guests, payMethod, customerName, 
      customerEmail, customerPhone, cpf, passport, country, 
      birthDate, notes, companions, collaboratorId, partner_id,
      publicUnitPrice: clientPublicUnitPrice,
      publicTotal: clientPublicTotal
    } = body;

    if (!type || !itemName || !customerName || !customerEmail || !payMethod) {
      console.error("Missing required fields:", { type, itemName, customerName, customerEmail, payMethod });
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios faltando" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const guestsNum = Number(guests);
    
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization");
    let userId = null;
    if (authHeader) {
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data: { user } } = await supabaseClient.auth.getUser();
      userId = user?.id;
    }

    let unitPrice: number;
    let publicUnitPrice: number;
    let pixDiscountPercent = 0;

    const getPartnerData = async (id: string) => {
      const { data } = await supabaseAdmin
        .from("partners")
        .select("commission_rate, remuneration_type, remuneration_value")
        .eq("id", id)
        .maybeSingle();
      return data;
    };

    const calculatePartnerPrice = (basePrice: number, partnerPriceDefined: number | undefined | null, partner: any) => {
      if (!partner) return basePrice;
      if (partnerPriceDefined && partnerPriceDefined > 0) return partnerPriceDefined;
      
      const rType = partner.remuneration_type || "comissao_percent";
      const rValue = partner.remuneration_value || partner.commission_rate || 0;

      if (rType === "comissao_percent") {
        return Math.round(basePrice * (1 - rValue / 100));
      } else if (rType === "valor_por_passeio") {
        return Math.max(0, basePrice - (rValue * 100));
      }
      return basePrice;
    };

    const partnerData = partner_id ? await getPartnerData(partner_id) : null;

    if (type === "passeio" || type === "tour") {
      const cleanItemName = itemName.replace(/\s*\((Coletivo|Privativo)\)$/, "");
      
      const { data: tour, error: tourErr } = await supabaseAdmin
        .from("tours")
        .select("price, private_price, partner_price, partner_private_price, name, pix_discount")
        .eq("name", cleanItemName)
        .eq("active", true)
        .maybeSingle();

      if (tourErr || !tour) {
        console.error("Tour not found or error:", { cleanItemName, tourErr });
        return new Response(
          JSON.stringify({ error: `Passeio não encontrado: ${cleanItemName}` }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const isPrivate = itemName.includes("(Privativo)");
      const basePrice = isPrivate ? (tour.private_price || 130000) : tour.price;
      const partnerPriceDef = isPrivate ? tour.partner_private_price : tour.partner_price;
      
      publicUnitPrice = basePrice;
      unitPrice = calculatePartnerPrice(basePrice, partnerPriceDef, partnerData);
      pixDiscountPercent = tour.pix_discount || 0;
    } else if (type === "package") {
      const { data: pkg, error: pkgErr } = await supabaseAdmin
        .from("packages")
        .select("original_price, discount_price, partner_price, name")
        .eq("name", itemName)
        .eq("active", true)
        .maybeSingle();

      if (pkgErr || !pkg) {
        console.error("Package not found or error:", { itemName, pkgErr });
        return new Response(
          JSON.stringify({ error: `Pacote não encontrado: ${itemName}` }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const basePrice = pkg.discount_price || pkg.original_price;
      publicUnitPrice = basePrice;
      unitPrice = calculatePartnerPrice(basePrice, pkg.partner_price, partnerData);
      pixDiscountPercent = 5;
    } else {
      const parts = itemName.split(" → ");
      const { data: route, error: routeErr } = await supabaseAdmin
        .from("transfer_routes")
        .select("price, partner_price, pix_discount")
        .eq("origin", parts[0] || "")
        .eq("destination", parts[1] || "")
        .eq("active", true)
        .maybeSingle();

      if (routeErr || !route) {
        console.error("Route not found or error:", { origin: parts[0], destination: parts[1], routeErr });
        return new Response(JSON.stringify({ error: "Translado não encontrado" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      publicUnitPrice = route.price;
      unitPrice = calculatePartnerPrice(route.price, route.partner_price, partnerData);
      pixDiscountPercent = route.pix_discount || 0;
    }
    
    const isPrivate = itemName.includes("(Privativo)");
    const total = isPrivate ? unitPrice : unitPrice * guestsNum;
    const publicTotal = isPrivate ? publicUnitPrice : publicUnitPrice * guestsNum;
    
    const discount = payMethod === "pix" && pixDiscountPercent > 0 && !partner_id
      ? Math.round(total * pixDiscountPercent / 100)
      : 0;
    const finalTotal = total - discount;
    const pixCode = payMethod === "pix" ? generatePixCode() : null;

    const createBookingRecord = async (customerId: string) => {
      const { data: booking, error: bookingErr } = await supabaseAdmin
        .from("bookings")
        .insert({
          customer_id: customerId,
          user_id: userId,
          type: type === "translado" ? "transfer" : type === "passeio" ? "tour" : type,
          item_name: itemName,
          date: date || null,
          guests: guestsNum,
          unit_price: unitPrice,
          total,
          discount,
          final_total: finalTotal,
          public_unit_price: clientPublicUnitPrice || publicUnitPrice,
          public_total: clientPublicTotal || publicTotal,
          pay_method: payMethod,
          status: "pendente",
          payment_status: "pendente",
          pix_code: pixCode,
          notes: notes || null,
          booking_code: generateBookingCode(),
          collaborator_id: collaboratorId || null,
          partner_id: partner_id || null,
        })
        .select("*, customers!customer_id(*)")
        .single();

      if (bookingErr) {
        console.error("Error inserting booking:", bookingErr);
        throw bookingErr;
      }
      
      if (companions?.length > 0) {
        const deps = companions.map((c: any) => ({
          customer_id: customerId,
          name: c.name,
          cpf: c.cpf || null,
          birth_date: c.birthDate || null,
          relationship: c.relationship || 'Acompanhante'
        }));
        await supabaseAdmin.from("dependents").insert(deps);
      }
      return booking;
    };

    const trimmedEmail = String(customerEmail).trim().toLowerCase();
    const { data: existingCustomer } = await supabaseAdmin
      .from("customers")
      .select("id")
      .eq("email", trimmedEmail)
      .maybeSingle();

    let customerId = existingCustomer?.id;

    if (!customerId) {
      console.log("Creating new customer:", { name: customerName, email: trimmedEmail });
      const { data: newCustomer, error: custErr } = await supabaseAdmin
        .from("customers")
        .insert({
          name: String(customerName).trim(),
          email: trimmedEmail,
          phone: customerPhone ? String(customerPhone).trim() : null,
          cpf: cpf || null,
          passport: passport || null,
          country: country || "Brasil",
          birth_date: birthDate || null,
        })
        .select("id")
        .single();

      if (custErr) {
        console.error("Error creating customer:", custErr);
        throw custErr;
      }
      customerId = newCustomer.id;
    }

    const booking = await createBookingRecord(customerId);
    console.log("Booking created successfully:", booking.id);
    return new Response(JSON.stringify(booking), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Unhandled error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});