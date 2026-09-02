-- Fechamento da fuga de preços de parceiro (P1).
--
-- Contexto: as views publicas public_tours/public_packages expunham partner_price e
-- partner_private_price (precos de parceiro) via REST publico. Por serem definidas com
-- security_invoker = true, exigiam grant SELECT ao anon sobre as tabelas base
-- (public.tours, public.packages, public.transfer_routes, public.package_tours), o que
-- permitia o anon ler os precos de parceiro diretamente em /rest/v1/tours, /packages etc.
--
-- Solucao (Opcao B, validada em producao):
--   1) Views publicas passam a security-definer (security_invoker = off), executando como
--      owner (postgres). Assim o anon le ATRAVES da view SEM precisar de SELECT na base.
--   2) As views NAO incluem as colunas partner_price/partner_private_price (preco de
--      parceiro passa a ser entregue somente via edge function catalog-pricing).
--   3) Revoga-se o SELECT do anon sobre as tabelas base, fechando o acesso direto.
--
-- Resultado validado (API, role anon):
--   /rest/v1/public_tours            => 200, somente precos publicos
--   /rest/v1/public_tours?select=partner_price => 400 (coluna inexistente)
--   /rest/v1/tours / packages / transfer_routes => 401 permission denied
--   OpenAPI: partner_price e partner_private_price ausentes.

-- --- Views publicas security-definer, SEM precos de parceiro -------------------------
DROP VIEW IF EXISTS public.public_package_tour_items;
DROP VIEW IF EXISTS public.public_tours;
CREATE VIEW public.public_tours AS
SELECT
  id,
  name,
  slug,
  description,
  location,
  duration,
  price,
  rating,
  reviews_count,
  tag,
  images,
  includes,
  highlights,
  difficulty,
  group_size,
  departure,
  operator,
  category,
  active,
  created_at,
  updated_at,
  pix_discount,
  private_price,
  vehicle_capacity,
  mode_collective_enabled,
  mode_private_enabled,
  default_mode,
  meta_title,
  meta_description
FROM public.tours
WHERE active = true;

DROP VIEW IF EXISTS public.public_packages;
CREATE VIEW public.public_packages AS
SELECT
  id,
  name,
  slug,
  description,
  days,
  original_price,
  discount_price,
  tag,
  highlights,
  active,
  created_at,
  updated_at,
  nights,
  banner_url
FROM public.packages
WHERE active = true;

DROP VIEW IF EXISTS public.public_transfer_routes;
CREATE VIEW public.public_transfer_routes AS
SELECT
  id,
  origin,
  destination,
  duration,
  distance,
  price,
  vehicle_type,
  seats,
  departures,
  active,
  created_at,
  updated_at,
  pix_discount
FROM public.transfer_routes
WHERE active = true;

-- View dependente (grafo recriado junto)
DROP VIEW IF EXISTS public.public_package_tour_items;
CREATE VIEW public.public_package_tour_items AS
SELECT
  pt.package_id,
  pt.tour_id,
  pt.sort_order,
  t.name AS tour_name,
  t.slug AS tour_slug,
  t.images AS tour_images,
  t.description AS tour_description
FROM public.package_tours pt
JOIN public.public_tours t ON t.id = pt.tour_id;

-- Garante security-definer (executa como owner, sem exigir SELECT do anon na base)
ALTER VIEW public.public_tours             SET (security_invoker = off);
ALTER VIEW public.public_packages          SET (security_invoker = off);
ALTER VIEW public.public_transfer_routes   SET (security_invoker = off);
ALTER VIEW public.public_package_tour_items SET (security_invoker = off);

-- Grants somente sobre as views (nao sobre as bases)
GRANT SELECT ON TABLE public.public_tours             TO anon, authenticated;
GRANT SELECT ON TABLE public.public_packages          TO anon, authenticated;
GRANT SELECT ON TABLE public.public_transfer_routes   TO anon, authenticated;
GRANT SELECT ON TABLE public.public_package_tour_items TO anon, authenticated;

-- --- Revoga SELECT do anon sobre as tabelas base (fecha fuga direta) -----------------
REVOKE SELECT ON public.tours           FROM anon;
REVOKE SELECT ON public.packages        FROM anon;
REVOKE SELECT ON public.transfer_routes FROM anon;
REVOKE SELECT ON public.package_tours   FROM anon;
