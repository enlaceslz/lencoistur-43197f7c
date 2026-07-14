import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Partner, PartnerType, DEFAULT_PARTNER_TYPES } from "./types";

const PARTNERS_KEY = ["partners", "list"] as const;
const PARTNER_TYPES_KEY = ["partner-types"] as const;
const COMPANY_KEY = ["sgs-empresa", "single"] as const;

async function fetchPartners(): Promise<Partner[]> {
  const { data, error } = await supabase
    .from("partners")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []) as Partner[];
}

async function fetchPartnerTypes(): Promise<PartnerType[]> {
  const { data, error } = await supabase
    .from("partner_types")
    .select("*")
    .order("label", { ascending: true });
  if (error) throw error;
  if (!data || data.length === 0) return DEFAULT_PARTNER_TYPES;
  return data as PartnerType[];
}

async function fetchCompany(): Promise<any | null> {
  const { data } = await supabase.from("sgs_empresa").select("*").limit(1).maybeSingle();
  return data ?? null;
}

/**
 * Shared, cached partners/types/company data.
 * Replaces per-mount refetches; realtime not needed (admin-only edits).
 */
export function usePartnersData() {
  const queryClient = useQueryClient();

  const partnersQ = useQuery({
    queryKey: PARTNERS_KEY,
    queryFn: fetchPartners,
    staleTime: 60_000,
  });
  const typesQ = useQuery({
    queryKey: PARTNER_TYPES_KEY,
    queryFn: fetchPartnerTypes,
    staleTime: 5 * 60_000,
  });
  const companyQ = useQuery({
    queryKey: COMPANY_KEY,
    queryFn: fetchCompany,
    staleTime: 5 * 60_000,
  });

  const refreshPartners = useCallback(
    () => queryClient.invalidateQueries({ queryKey: PARTNERS_KEY }),
    [queryClient]
  );
  const refreshTypes = useCallback(
    () => queryClient.invalidateQueries({ queryKey: PARTNER_TYPES_KEY }),
    [queryClient]
  );

  return {
    partners: partnersQ.data ?? [],
    partnerTypes: typesQ.data ?? [],
    company: companyQ.data ?? null,
    loading: partnersQ.isLoading || typesQ.isLoading,
    refreshPartners,
    refreshTypes,
  };
}
