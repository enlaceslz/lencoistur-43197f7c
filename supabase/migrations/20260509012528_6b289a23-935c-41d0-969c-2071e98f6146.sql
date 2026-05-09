-- Fix mutable search path for security definer functions
ALTER FUNCTION public.has_role(uid uuid, requested_role public.app_role) SET search_path = public;
ALTER FUNCTION public.generate_booking_code() SET search_path = public;

-- Tighten storage policies to prevent bucket listing
-- Avatars
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] IS NOT NULL);

-- Tour images
DROP POLICY IF EXISTS "Public can view tour images" ON storage.objects;
CREATE POLICY "Public can view tour images" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'tour-images' AND (storage.foldername(name))[1] IS NOT NULL);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_booking_code ON public.bookings(booking_code);
CREATE INDEX IF NOT EXISTS idx_marketing_leads_email ON public.marketing_leads(email);

-- Ensure marketing_leads are viewable by admins
CREATE POLICY "Admins can view marketing leads"
ON public.marketing_leads
FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Revoke execute on sensitive functions from public if not needed
-- Both has_role and generate_booking_code are used by other functions/triggers, 
-- but we should be explicit about who can call them directly.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM public;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.generate_booking_code() FROM public;
GRANT EXECUTE ON FUNCTION public.generate_booking_code() TO authenticated, service_role;
