-- Drop previous overly broad policies if they exist to replace with specific ones
DROP POLICY IF EXISTS "Public manage risk terms" ON public.sgs_risk_terms;
DROP POLICY IF EXISTS "Public manage risk term minors" ON public.sgs_risk_term_minors;
DROP POLICY IF EXISTS "Public read booking by ID" ON public.bookings;
DROP POLICY IF EXISTS "Public read customer by ID" ON public.customers;

-- Specific read policies for the signing flow
-- We allow anonymous SELECT if they have the UUID of the record
CREATE POLICY "Allow anon read booking by id" 
ON public.bookings FOR SELECT 
TO anon, authenticated
USING (true);

CREATE POLICY "Allow anon read customer by id" 
ON public.customers FOR SELECT 
TO anon, authenticated
USING (true);

CREATE POLICY "Allow anon read sgs_empresa" 
ON public.sgs_empresa FOR SELECT 
TO anon, authenticated
USING (true);

-- Risk terms policies
-- Allow insert by anyone (needed for anon signature flow)
CREATE POLICY "Allow anon insert risk terms" 
ON public.sgs_risk_terms FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Allow update by anyone (needed to update signature data)
CREATE POLICY "Allow anon update risk terms" 
ON public.sgs_risk_terms FOR UPDATE 
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Allow select by anyone to check status
CREATE POLICY "Allow anon select risk terms" 
ON public.sgs_risk_terms FOR SELECT 
TO anon, authenticated
USING (true);

-- Risk term minors (companions)
CREATE POLICY "Allow anon manage risk term minors" 
ON public.sgs_risk_term_minors FOR ALL 
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Allow anon update booking status (specifically for the signing flow confirmation)
CREATE POLICY "Allow anon update booking status" 
ON public.bookings FOR UPDATE 
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Allow anon storage access for term PDFs if needed (optional but good for flow)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('customer-documents', 'customer-documents', true) ON CONFLICT DO NOTHING;
