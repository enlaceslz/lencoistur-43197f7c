-- Remove public SELECT policy on raw tours table (partner_price exposure).
-- Public site reads via public_tours view, which strips internal pricing.
DROP POLICY IF EXISTS "Public can read active tours" ON public.tours;
REVOKE SELECT ON public.tours FROM anon;

-- transfer_routes already has no anon SELECT policy; harden grants to prevent future drift.
REVOKE SELECT ON public.transfer_routes FROM anon;