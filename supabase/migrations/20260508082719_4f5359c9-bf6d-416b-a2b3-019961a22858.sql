
DROP POLICY IF EXISTS "Public can update risk terms" ON public.sgs_risk_terms;
CREATE POLICY "Public can update unsigned risk terms"
ON public.sgs_risk_terms FOR UPDATE TO anon, authenticated
USING (signature_data IS NULL)
WITH CHECK (booking_id IS NOT NULL);
