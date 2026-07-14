import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SiteSettings {
  titulo: string;
  metaDescricao: string;
  whatsappUrl: string;
  instagram: string;
  facebook?: string;
  tiktok?: string;
  corPrimaria: string;
  logoUrl: string | null;
  footerDesc?: string;
  footerTours?: string[];
}

export interface EmpresaSettings {
  nome: string;
  cnpj: string;
  telefone: string;
  whatsapp: string;
  endereco: string;
  email: string;
}

interface SiteSettingsResult {
  site: SiteSettings | null;
  empresa: EmpresaSettings | null;
}

const fetchSiteSettings = async (): Promise<SiteSettingsResult> => {
  const { data, error } = await supabase
    .from("site_settings")
    .select("key, value")
    .in("key", ["site", "empresa"]);

  if (error) throw error;

  const site = (data?.find((s) => s.key === "site")?.value as unknown as SiteSettings) ?? null;
  const empresa = (data?.find((s) => s.key === "empresa")?.value as unknown as EmpresaSettings) ?? null;

  return { site, empresa };
};

/**
 * Cached site settings shared across every consumer via react-query.
 * Previously each mount refetched — this generated thousands of DB calls
 * (see slow_queries: `site_settings` was the #1 hotspot).
 * staleTime = 5 min: settings change rarely, dedup across the whole app.
 */
export const useSiteSettings = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["site-settings"],
    queryFn: fetchSiteSettings,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  });

  return {
    site: data?.site ?? null,
    settings: data?.site ?? null,
    empresa: data?.empresa ?? null,
    loading: isLoading,
  };
};
