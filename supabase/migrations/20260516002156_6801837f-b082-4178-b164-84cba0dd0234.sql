-- Allow public access to company info for risk terms
CREATE POLICY "Public read sgs_empresa" 
ON public.sgs_empresa 
FOR SELECT 
USING (true);

-- Allow public access to bookings and customers for the signing process
-- These are used when a customer opens the term signature link
CREATE POLICY "Public read booking by ID" 
ON public.bookings 
FOR SELECT 
USING (true);

CREATE POLICY "Public read customer by ID" 
ON public.customers 
FOR SELECT 
USING (true);

-- Allow public access to risk terms and their companions/minors
-- This allows customers to view, sign (insert/update) their terms
CREATE POLICY "Public manage risk terms" 
ON public.sgs_risk_terms 
FOR ALL 
USING (true)
WITH CHECK (true);

CREATE POLICY "Public manage risk term minors" 
ON public.sgs_risk_term_minors 
FOR ALL 
USING (true)
WITH CHECK (true);
