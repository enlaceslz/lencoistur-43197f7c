import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ItemType = "tour" | "package" | "transfer";

const validTypes = new Set<ItemType>(["tour", "package", "transfer"]);

function isUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function calcPartnerPrice(basePrice: number, partnerPriceDefined: number | null | undefined, partner: { commission_rate: number | null; remuneration_type: string | null; remuneration_value: number | null } | null) {
  if (!partner) return basePrice;
  if (partnerPriceDefined && partnerPriceDefined > 0) return partnerPriceDefined;

  const remunerationType = partner.remuneration_type || "comissao_percent";
  const remunerationValue = partner.remuneration_value || partner.commission_rate || 0;

  if (remunerationType === "comissao_percent") return Math.round(basePrice * (1 - remunerationValue / 100));
  if (remunerationType === "valor_por_passeio") return Math.max(0, basePrice - remunerationValue * 100);
  return basePrice;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { partnerId, items } = await req.json();

    if (!isUuid(partnerId) || !Array.isArray(items) || items.length === 0 || items.length > 50) {
      return new Response(JSON.stringify({ error: "Invalid request" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: partner } = await supabaseAdmin
      .from("partners")
      .select("id, name, commission_rate, remuneration_type, remuneration_value")
      .eq("id", partnerId)
      .eq("active", true)
      .maybeSingle();

    if (!partner) {
      return new Response(JSON.stringify({ error: "Partner not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const responseItems: Record<string, unknown> = {};

    for (const rawItem of items) {
      const item = rawItem as { key?: string; type?: ItemType; id?: string };
      if (typeof item?.key !== "string" || !validTypes.has(item.type as ItemType) || !isUuid(item.id)) continue;

      if (item.type === "tour") {
        const { data } = await supabaseAdmin
          .from("tours")
          .select("id, price, private_price, partner_price, partner_private_price, pix_discount")
          .eq("id", item.id)
          .eq("active", true)
          .maybeSingle();

        if (data) {
          const publicPrice = data.price;
          const publicPrivatePrice = data.private_price || null;
          responseItems[item.key] = {
            publicPrice,
            publicPrivatePrice,
            effectivePrice: calcPartnerPrice(publicPrice, data.partner_price, partner),
            effectivePrivatePrice: publicPrivatePrice ? calcPartnerPrice(publicPrivatePrice, data.partner_private_price, partner) : null,
            pixDiscount: data.pix_discount || 0,
          };
        }
      }

      if (item.type === "package") {
        const { data } = await supabaseAdmin
          .from("packages")
          .select("id, original_price, discount_price, partner_price")
          .eq("id", item.id)
          .eq("active", true)
          .maybeSingle();

        if (data) {
          const publicPrice = data.discount_price || data.original_price || 0;
          responseItems[item.key] = {
            publicPrice,
            effectivePrice: calcPartnerPrice(publicPrice, data.partner_price, partner),
            pixDiscount: 0,
          };
        }
      }

      if (item.type === "transfer") {
        const { data } = await supabaseAdmin
          .from("transfer_routes")
          .select("id, price, partner_price, pix_discount")
          .eq("id", item.id)
          .eq("active", true)
          .maybeSingle();

        if (data) {
          responseItems[item.key] = {
            publicPrice: data.price || 0,
            effectivePrice: calcPartnerPrice(data.price || 0, data.partner_price, partner),
            pixDiscount: data.pix_discount || 0,
          };
        }
      }
    }

    return new Response(JSON.stringify({ partner: { id: partner.id, name: partner.name }, items: responseItems }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});