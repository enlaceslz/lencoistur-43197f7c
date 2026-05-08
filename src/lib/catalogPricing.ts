import { supabase } from "@/integrations/supabase/client";

export type CatalogItemType = "tour" | "package" | "transfer";

export interface CatalogPricingRequestItem {
  key: string;
  type: CatalogItemType;
  id?: string;
  slug?: string;
}

export interface CatalogPricingResultItem {
  publicPrice: number;
  effectivePrice: number;
  publicPrivatePrice?: number | null;
  effectivePrivatePrice?: number | null;
  pixDiscount?: number;
}

export interface CatalogPricingResponse {
  partner: { id: string; name: string } | null;
  items: Record<string, CatalogPricingResultItem>;
}

export async function fetchPartnerCatalogPricing(
  partnerId: string,
  items: CatalogPricingRequestItem[],
): Promise<CatalogPricingResponse> {
  const { data, error } = await supabase.functions.invoke("catalog-pricing", {
    body: { partnerId, items },
  });

  if (error) throw error;

  return (data ?? { partner: null, items: {} }) as CatalogPricingResponse;
}