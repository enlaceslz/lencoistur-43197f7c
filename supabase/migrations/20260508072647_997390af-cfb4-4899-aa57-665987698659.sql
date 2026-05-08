-- Allow public insertion of risk terms even if booking_id is null (avulso cases)
DROP POLICY IF EXISTS "Anyone with a booking can insert risk terms" ON public.sgs_risk_terms;
CREATE POLICY "Anyone can insert risk terms" 
ON public.sgs_risk_terms 
FOR INSERT 
WITH CHECK (true);

-- Ensure public can update their own terms (signing)
DROP POLICY IF EXISTS "Public can sign their own term" ON public.sgs_risk_terms;
CREATE POLICY "Public can update risk terms" 
ON public.sgs_risk_terms 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- Fix companion signatures (minors) for public access
DROP POLICY IF EXISTS "Authenticated users can manage sgs_risk_term_minors" ON public.sgs_risk_term_minors;
DROP POLICY IF EXISTS "Public can insert minors for risk term" ON public.sgs_risk_term_minors;
DROP POLICY IF EXISTS "Public can sign for minors" ON public.sgs_risk_term_minors;
DROP POLICY IF EXISTS "Public can view minors for term" ON public.sgs_risk_term_minors;

CREATE POLICY "Public can manage risk term minors" 
ON public.sgs_risk_term_minors 
FOR ALL 
USING (true)
WITH CHECK (true);
