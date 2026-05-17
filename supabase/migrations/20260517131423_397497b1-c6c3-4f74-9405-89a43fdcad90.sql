-- Fix Function Search Path Mutable for triggers
ALTER FUNCTION public.handle_updated_at() SET search_path = public;
ALTER FUNCTION public.handle_booking_financial_flow() SET search_path = public;

-- Revoke execute from public for SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_booking_code() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_public_company_info() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_public_booking_v2(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.search_public_booking(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_public_term_v2(uuid, text) FROM PUBLIC;

-- Grant execute back to appropriate roles
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.generate_booking_code() TO authenticated, service_role;

-- These are intended to be callable by the public (anon)
GRANT EXECUTE ON FUNCTION public.get_public_company_info() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_public_booking_v2(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.search_public_booking(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_public_term_v2(uuid, text) TO anon, authenticated, service_role;
