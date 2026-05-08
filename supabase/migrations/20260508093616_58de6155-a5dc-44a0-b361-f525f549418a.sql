DROP POLICY IF EXISTS "Anyone can view active tours" ON public.tours;
DROP POLICY IF EXISTS "Anyone can view active transfers" ON public.transfer_routes;
DROP POLICY IF EXISTS "Packages are viewable by everyone" ON public.packages;

DROP VIEW IF EXISTS public.public_package_tour_items;
DROP VIEW IF EXISTS public.public_transfer_routes;
DROP VIEW IF EXISTS public.public_packages;
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

GRANT SELECT ON TABLE public.public_tours TO anon, authenticated;
GRANT SELECT ON TABLE public.public_packages TO anon, authenticated;
GRANT SELECT ON TABLE public.public_transfer_routes TO anon, authenticated;
GRANT SELECT ON TABLE public.public_package_tour_items TO anon, authenticated;

DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
);