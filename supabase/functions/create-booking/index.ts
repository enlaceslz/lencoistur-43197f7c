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
      publicUnitPrice: overridePublicUnitPrice
    } = body;

    const trimmedEmail = typeof customerEmail === "string" ? customerEmail.trim().toLowerCase() : "";
    const guestsNum = Number(guests);

    if (
      !allowedTypes.has(String(type)) ||
      !isNonEmptyString(itemName) ||
      !isNonEmptyString(customerName) ||
      !isValidEmail(trimmedEmail) ||
      !allowedPayMethods.has(String(payMethod)) ||
      !Number.isInteger(guestsNum) ||
      guestsNum < 1 ||
      guestsNum > 50
    ) {
      console.error("Invalid booking payload received", {
        type,
        itemName: typeof itemName === "string" ? itemName.slice(0, 80) : null,
        payMethod,
        guests,
        customerEmail: previewEmail(trimmedEmail),
      });
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios faltando" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Receiving booking request summary", {
      type,
      itemName: itemName.trim().slice(0, 80),
      payMethod,
      guests: guestsNum,
      customerEmail: previewEmail(trimmedEmail),
      hasPartner: Boolean(partner_id),
      hasCollaborator: Boolean(collaboratorId),
    });
    
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
        // Check if user is admin
        const { data: roleData } = await supabaseAdmin
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .eq("role", "admin")
          .maybeSingle();
        isAdmin = !!roleData;
      }
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
    
    // Apply overrides if provided (allowed ONLY for Admins)
    if (isAdmin) {
      if (overrideUnitPrice !== undefined) unitPrice = Number(overrideUnitPrice);
      if (overridePublicUnitPrice !== undefined) publicUnitPrice = Number(overridePublicUnitPrice);
    } else if (overrideUnitPrice !== undefined || overridePublicUnitPrice !== undefined) {
      console.warn(`Attempted unauthorized price override by user ${userId || 'anonymous'}`);
    }

    const total = isPrivate ? unitPrice : unitPrice * guestsNum;
    const publicTotal = isPrivate ? publicUnitPrice : publicUnitPrice * guestsNum;
    
    const calculatedDiscount = payMethod === "pix" && pixDiscountPercent > 0 && !partner_id
      ? Math.round(total * pixDiscountPercent / 100)
      : 0;
      
    const discount = (isAdmin && overrideDiscount !== undefined) ? Number(overrideDiscount) : calculatedDiscount;
    const finalTotal = total - discount;
    const pixCode = payMethod === "pix" ? generatePixCode() : null;

    if (date && (typeof date !== "string" || date.length > 100)) {
      return new Response(
        JSON.stringify({ error: "Data inválida" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (notes && (typeof notes !== "string" || notes.length > 2000)) {
      return new Response(
        JSON.stringify({ error: "Observações inválidas" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (customerPhone && (typeof customerPhone !== "string" || customerPhone.length > 30)) {
      return new Response(
        JSON.stringify({ error: "Telefone inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (cpf && (typeof cpf !== "string" || cpf.length > 20)) {
      return new Response(
        JSON.stringify({ error: "CPF inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (passport && (typeof passport !== "string" || passport.length > 40)) {
      return new Response(
        JSON.stringify({ error: "Passaporte inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (country && (typeof country !== "string" || country.length > 80)) {
      return new Response(
        JSON.stringify({ error: "País inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (birthDate && (typeof birthDate !== "string" || birthDate.length > 20)) {
      return new Response(
        JSON.stringify({ error: "Data de nascimento inválida" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (companions && (!Array.isArray(companions) || companions.length > 20)) {
      return new Response(
        JSON.stringify({ error: "Acompanhantes inválidos" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (companions?.some((c: any) => !isNonEmptyString(c?.name, 120))) {
      return new Response(
        JSON.stringify({ error: "Nome de acompanhante inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    const { data: existingCustomer } = await supabaseAdmin
      .from("customers")
      .select("id")
      .eq("email", trimmedEmail)
      .maybeSingle();

    let customerId = existingCustomer?.id;

    if (!customerId) {
      console.log("Creating customer record for booking", {
        customerEmail: previewEmail(trimmedEmail),
      });
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

    // Check for duplicate booking
    const { data: duplicate } = await supabaseAdmin
      .from("bookings")
      .select("id")
      .eq("customer_id", customerId)
      .eq("item_name", itemName)
      .eq("date", date || null)
      .neq("status", "cancelada")
      .maybeSingle();

    if (duplicate) {
      console.log("Duplicate booking detected", { customerId, itemName, date });
      return new Response(
        JSON.stringify({ error: "Você já possui uma reserva ativa para este passeio nesta data." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const booking = await createBookingRecord(customerId);
    console.log("Booking created successfully", {
      bookingId: booking.id,
      customerId,
      type: booking.type,
      payMethod: booking.pay_method,
    });
    return new Response(JSON.stringify(booking), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Unhandled error:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno. Tente novamente." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});