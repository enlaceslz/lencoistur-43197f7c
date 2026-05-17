-- Remove blanket public SELECT on sgs_empresa
DROP POLICY IF EXISTS "Public can view company name and logo" ON public.sgs_empresa;

-- Expose only safe public fields via a SECURITY DEFINER function
CREATE OR REPLACE FUNCTION public.get_public_company_info()
RETURNS TABLE (
    razao_social text,
    nome_fantasia text,
    logo_url text,
    cidade text,
    estado text,
    term_recommendations text,
    term_safety_risks text
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.razao_social, e.nome_fantasia, e.logo_url, e.cidade, e.estado,
        e.term_recommendations, e.term_safety_risks
    FROM sgs_empresa e
    LIMIT 1;
END;
$$;
