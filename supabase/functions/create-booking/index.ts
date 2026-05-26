import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const allowedTypes = new Set(["passeio", "tour", "package", "translado", "transfer"]);
const allowedPayMethods = new Set(["pix", "card", "info"]);

function previewEmail(email?: string | null): string | null {
  if (!email) return null;
  const normalized = email.trim().toLowerCase();
  const [local = "", domain = ""] = normalized.split("@");
  if (!domain) return "***";
  return `${local.slice(0, 3)}***@${domain}`;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isNonEmptyString(value: unknown, maxLength = 255): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= maxLength;
}

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

    const { 
      type, itemName, date, guests, payMethod, customerName, 
      customerEmail, customerPhone, cpf, passport, country, 
      birthDate, notes, companions, collaboratorId, partner_id,
      unitPrice: overrideUnitPrice,
      discount: overrideDiscount,
      publicUnitPrice: overridePublicUnitPrice,
      items // New field for multiple items
    } = body;

    const trimmedEmail = typeof customerEmail === "string" ? customerEmail.trim().toLowerCase() : "";
    const guestsNum = Number(guests);

    // If items is not provided, create a single-item array for processing
    const bookingItems = items && Array.isArray(items) ? items : [{
      type, itemName, date, guests: guestsNum,
      unitPrice: overrideUnitPrice,
      discount: overrideDiscount,
      publicUnitPrice: overridePublicUnitPrice
    }];

    if (!isNonEmptyString(customerName) || !isValidEmail(trimmedEmail) || !allowedPayMethods.has(String(payMethod))) {
      return new Response(
        JSON.stringify({ error: "Campos do cliente ou método de pagamento inválidos" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    for (const item of bookingItems) {
      if (
        !allowedTypes.has(String(item.type)) ||
        !isNonEmptyString(item.itemName) ||
        !Number.isInteger(Number(item.guests)) ||
        Number(item.guests) < 1
      ) {
        console.error("Invalid booking item received", item);
        return new Response(
          JSON.stringify({ error: `Dados do item inválidos: ${item.itemName || 'Sem nome'}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization");
    let userId = null;
    let isAdmin = false;

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
      
      if (!authError && authData?.user) {
        userId = authData.user.id;
        const { data: roleData } = await supabaseAdmin
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .eq("role", "admin")
          .maybeSingle();
        isAdmin = !!roleData;
      }
    }

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
    const createdBookings = [];

    // Resolve or create customer once
    const { data: existingCustomer } = await supabaseAdmin
      .from("customers")
      .select("id")
      .eq("email", trimmedEmail)
      .maybeSingle();

    let customerId = existingCustomer?.id;

    if (!customerId) {
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

      if (custErr) throw custErr;
      customerId = newCustomer.id;
    } else {
      const updateData: any = {};
      if (customerName) updateData.name = String(customerName).trim();
      if (customerPhone) updateData.phone = String(customerPhone).trim();
      if (cpf) updateData.cpf = cpf;
      if (passport) updateData.passport = passport;
      if (country) updateData.country = country;
      if (birthDate) updateData.birth_date = birthDate;

      if (Object.keys(updateData).length > 0) {
        await supabaseAdmin.from("customers").update(updateData).eq("id", customerId);
      }
    }

    for (const item of bookingItems) {
      let unitPrice: number;
      let publicUnitPrice: number;
      let pixDiscountPercent = 0;
      const guestsNum = Number(item.guests);
      const type = item.type;
      const itemName = item.itemName;

      if (type === "passeio" || type === "tour") {
        const cleanItemName = itemName.replace(/\s*\((Coletivo|Privativo)\)$/, "");
        const { data: tour } = await supabaseAdmin
          .from("tours")
          .select("price, private_price, partner_price, partner_private_price, name, pix_discount")
          .eq("name", cleanItemName)
          .eq("active", true)
          .maybeSingle();

        if (!tour) throw new Error(`Passeio não encontrado: ${cleanItemName}`);
        
        const isPrivate = itemName.includes("(Privativo)");
        const basePrice = isPrivate ? (tour.private_price || 130000) : tour.price;
        const partnerPriceDef = isPrivate ? tour.partner_private_price : tour.partner_price;
        
        publicUnitPrice = basePrice;
        unitPrice = calculatePartnerPrice(basePrice, partnerPriceDef, partnerData);
        pixDiscountPercent = tour.pix_discount || 0;
      } else if (type === "package") {
        const { data: pkg } = await supabaseAdmin
          .from("packages")
          .select("original_price, discount_price, partner_price, name")
          .eq("name", itemName)
          .eq("active", true)
          .maybeSingle();

        if (!pkg) throw new Error(`Pacote não encontrado: ${itemName}`);
        
        const basePrice = pkg.discount_price || pkg.original_price;
        publicUnitPrice = basePrice;
        unitPrice = calculatePartnerPrice(basePrice, pkg.partner_price, partnerData);
        pixDiscountPercent = 5;
      } else {
        const parts = itemName.split(" → ");
        const { data: route } = await supabaseAdmin
          .from("transfer_routes")
          .select("price, partner_price, pix_discount")
          .eq("origin", parts[0] || "")
          .eq("destination", parts[1] || "")
          .eq("active", true)
          .maybeSingle();

        if (!route) throw new Error("Translado não encontrado");
        publicUnitPrice = route.price;
        unitPrice = calculatePartnerPrice(route.price, route.partner_price, partnerData);
        pixDiscountPercent = route.pix_discount || 0;
      }
      
      if (isAdmin) {
        if (item.unitPrice !== undefined) unitPrice = Number(item.unitPrice);
        if (item.publicUnitPrice !== undefined) publicUnitPrice = Number(item.publicUnitPrice);
      }

      const isPrivate = itemName.includes("(Privativo)");
      const total = isPrivate ? unitPrice : unitPrice * guestsNum;
      const publicTotal = isPrivate ? publicUnitPrice : publicUnitPrice * guestsNum;
      
      const calculatedDiscount = payMethod === "pix" && pixDiscountPercent > 0 && !partner_id
        ? Math.round(total * pixDiscountPercent / 100)
        : 0;
        
      const discount = (isAdmin && item.discount !== undefined) ? Number(item.discount) : calculatedDiscount;
      const finalTotal = total - discount;
      const pixCode = payMethod === "pix" ? generatePixCode() : null;

      const { data: booking, error: bookingErr } = await supabaseAdmin
        .from("bookings")
        .insert({
          customer_id: customerId,
          user_id: userId,
          type: type === "translado" ? "transfer" : type === "passeio" ? "tour" : type,
          item_name: itemName,
          date: item.date || null,
          guests: guestsNum,
          unit_price: unitPrice,
          total,
          discount,
          final_total: finalTotal,
          public_unit_price: publicUnitPrice,
          public_total: publicTotal,
          pay_method: payMethod,
          status: "pendente",
          payment_status: "pendente",
          pix_code: pixCode,
          notes: notes || null,
          booking_code: generateBookingCode(),
          collaborator_id: collaboratorId || null,
          partner_id: partner_id || null,
          birth_date: birthDate || null,
          cpf: cpf || null,
        })
        .select("*, customers!customer_id(*)")
        .single();

      if (bookingErr) throw bookingErr;
      createdBookings.push(booking);
    }

    // Add dependents only once if provided
    if (companions?.length > 0 && customerId) {
      const deps = companions.map((c: any) => ({
        customer_id: customerId,
        name: c.name,
        cpf: c.cpf || null,
        birth_date: c.birthDate || null,
        relationship: c.relationship || 'Acompanhante'
      }));
      await supabaseAdmin.from("dependents").insert(deps);
    }

    return new Response(JSON.stringify(createdBookings.length === 1 ? createdBookings[0] : createdBookings), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Unhandled error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Erro interno. Tente novamente." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});