import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SiteSettings {
  titulo: string;
  metaDescricao: string;
  whatsappUrl: string;
  instagram: string;
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

export const useSiteSettings = () => {
  const [site, setSite] = useState<SiteSettings | null>(null);
  const [empresa, setEmpresa] = useState<EmpresaSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from("site_settings")
          .select("key, value");

        if (error) throw error;
        
        if (data) {
          const siteData = data.find(s => s.key === "site")?.value as unknown as SiteSettings;
          const empresaData = data.find(s => s.key === "empresa")?.value as unknown as EmpresaSettings;
          
          if (siteData) setSite(siteData);
          if (empresaData) setEmpresa(empresaData);
        }
      } catch (err) {
        console.error("Error fetching site settings:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return { site, settings: site, empresa, loading };
};
