import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface GallerySettings {
  images?: { src: string; alt: string }[];
}

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
  exibirParceiros?: boolean;
  banners?: { url: string; id: string }[];
  bannerUrl?: string;
  bannerTransition?: "fade" | "slide";
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
  gallery: GallerySettings | null;
}

const fetchSiteSettings = async (): Promise<SiteSettingsResult> => {
  const { data, error } = await supabase
    .from("site_settings")
    .select("key, value")
    .in("key", ["site", "empresa", "gallery"]);

  if (error) throw error;

  const site = (data?.find((s) => s.key === "site")?.value as unknown as SiteSettings) ?? null;
  const empresa = (data?.find((s) => s.key === "empresa")?.value as unknown as EmpresaSettings) ?? null;
  const gallery = (data?.find((s) => s.key === "gallery")?.value as unknown as GallerySettings) ?? null;

  return { site, empresa, gallery };
};

/**
 * Cached site settings shared across every consumer via react-query.
 * Previously each mount refetched (HeroSection, GallerySection and
 * PartnersSection each hit `site_settings` directly), generating thousands of
 * redundant DB calls. Now a single cached query feeds Navbar, Footer and the
 * home sections. staleTime = 5 min: settings change rarely, dedup across the
 * whole app.
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
    gallery: data?.gallery ?? null,
    loading: isLoading,
  };
};
