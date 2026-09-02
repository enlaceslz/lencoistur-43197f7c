-- Fix: edge functions (create-booking, catalog-pricing, chat, ai-analysis, etc.) usam o
-- rol service_role via PostgREST e precisam de GRANT explicito nas tabelas que leem/escrevem.
-- Sem isso falham com "permission denied for table <tabela>". RLS continua intacto
-- (service_role tem BYPASSRLS). Este stack restringue os grants por default, por isso o
-- service_role nao tinha SELECT sobre o catálogo.
GRANT SELECT ON public.tours TO service_role;
GRANT SELECT ON public.packages TO service_role;
GRANT SELECT ON public.transfer_routes TO service_role;
GRANT SELECT ON public.reviews TO service_role;
GRANT SELECT ON public.partners TO service_role;
GRANT SELECT ON public.user_roles TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.bookings TO service_role;
GRANT SELECT ON public.marketing_leads TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO service_role, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dependents TO service_role, authenticated;

-- NOTA (fuga de precios de parceiro):
-- As views public_tours/public_packages têm security_invoker=on e dependen de que o role
-- anon tenha SELECT sobre as tabelas base tours/packages. REVOKE SELECT anon sobre tours
-- NÃO é possível sem romper o catálogo público (PostgREST exige privilege de base para
-- resolver a view mesmo com security_invoker). Além disso, ToursSection.tsx e
-- CheckoutPage.tsx leem private_price/partner_price/pix_discount de public_tours.
-- A solução definitiva (schema dedicado public_api ou edge functions) fica documentada;
-- NÃO revocar aqui. Ver nota no lencois.md.