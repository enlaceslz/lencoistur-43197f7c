-- Corrige views públicas que omitiam colunas partner_price,
-- causando 400 (Bad Request) / "column does not exist" no frontend
-- (erros20.txt: public_tours e public_packages).
-- Usa DROP/CREATE (e não CREATE OR REPLACE) porque a view já existe
-- com estrutura de colunas diferente, o que impede o replace posicional.

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
  partner_price,
  partner_private_price,
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
  partner_price,
  tag,
  highlights,
  active,
  created_at,
  updated_at,
  nights,
  banner_url
FROM public.packages
WHERE active = true;

-- View dependente de public_tours (recriada junto para manter o grafo)
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

-- Mantém o contexto de segurança definido na migration 20260508093734
ALTER VIEW public.public_tours SET (security_invoker = true);
ALTER VIEW public.public_packages SET (security_invoker = true);

GRANT SELECT ON TABLE public.public_tours TO anon, authenticated;
GRANT SELECT ON TABLE public.public_packages TO anon, authenticated;
GRANT SELECT ON TABLE public.public_package_tour_items TO anon, authenticated;
