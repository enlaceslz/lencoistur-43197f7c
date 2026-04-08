
-- Remove any remaining public INSERT policy on sgs_risk_terms
DROP POLICY IF EXISTS "Public can submit risk terms with valid booking" ON public.sgs_risk_terms;
DROP POLICY IF EXISTS "Public can create risk terms" ON public.sgs_risk_terms;
DROP POLICY IF EXISTS "Anyone can create risk terms" ON public.sgs_risk_terms;

-- Ensure only admins can insert risk terms
CREATE POLICY "Only admins can insert risk terms"
  ON public.sgs_risk_terms
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
