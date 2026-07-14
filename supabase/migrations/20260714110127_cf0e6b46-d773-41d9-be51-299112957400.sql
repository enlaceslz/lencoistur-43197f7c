DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;
CREATE POLICY "Public can view approved reviews"
ON public.reviews
FOR SELECT
USING (status = 'approved');