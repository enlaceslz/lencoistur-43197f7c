-- 1. Fix Bookings Security
DROP POLICY IF EXISTS "Users can update own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can update bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can read all bookings" ON public.bookings;

CREATE POLICY "Admins can manage all bookings"
ON public.bookings
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

-- 2. Fix SGS Module Access
-- sgs_procedures
DROP POLICY IF EXISTS "Authenticated users full access to sgs_procedures" ON public.sgs_procedures;
DROP POLICY IF EXISTS "Admins full access to sgs_procedures" ON public.sgs_procedures;
ALTER TABLE public.sgs_procedures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins full access to sgs_procedures"
ON public.sgs_procedures
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- sgs_equipment
DROP POLICY IF EXISTS "Authenticated users full access to sgs_equipment" ON public.sgs_equipment;
DROP POLICY IF EXISTS "Admins full access to sgs_equipment" ON public.sgs_equipment;
ALTER TABLE public.sgs_equipment ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins full access to sgs_equipment"
ON public.sgs_equipment
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- 3. Enable Term Signing for Customers
-- sgs_risk_terms
DROP POLICY IF EXISTS "Only admins can insert risk terms" ON public.sgs_risk_terms;
DROP POLICY IF EXISTS "Anyone with a booking can insert risk terms" ON public.sgs_risk_terms;
CREATE POLICY "Anyone with a booking can insert risk terms"
ON public.sgs_risk_terms
FOR INSERT
TO public
WITH CHECK (EXISTS (SELECT 1 FROM public.bookings WHERE id = booking_id));

DROP POLICY IF EXISTS "Users can view own risk terms" ON public.sgs_risk_terms;
CREATE POLICY "Users can view own risk terms"
ON public.sgs_risk_terms
FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM public.bookings WHERE id = booking_id AND user_id = auth.uid()) OR has_role(auth.uid(), 'admin'));

-- 4. Enable Document Upload for Terms
-- documents
DROP POLICY IF EXISTS "Admins full access documents" ON public.documents;
DROP POLICY IF EXISTS "Admins manage all documents" ON public.documents;
CREATE POLICY "Admins manage all documents"
ON public.documents
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can insert signed terms" ON public.documents;
CREATE POLICY "Users can insert signed terms"
ON public.documents
FOR INSERT
TO public
WITH CHECK (type = 'termo_assinado');

DROP POLICY IF EXISTS "Users can view own signed terms" ON public.documents;
CREATE POLICY "Users can view own signed terms"
ON public.documents
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin') OR (type = 'termo_assinado' AND name LIKE '%' || auth.uid()::text || '%'));

-- 5. Marketing Leads
DROP POLICY IF EXISTS "Admins full access marketing_leads" ON public.marketing_leads;
DROP POLICY IF EXISTS "Admins manage leads" ON public.marketing_leads;
CREATE POLICY "Admins manage leads"
ON public.marketing_leads
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Public can submit leads" ON public.marketing_leads;
CREATE POLICY "Public can submit leads"
ON public.marketing_leads
FOR INSERT
TO public
WITH CHECK (true);

-- 6. Storage Policies
DROP POLICY IF EXISTS "Admins can upload company documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins and Customers can upload company documents" ON storage.objects;
CREATE POLICY "Admins and Customers can upload company documents"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'company-documents');

DROP POLICY IF EXISTS "Admins can view company documents" ON storage.objects;
CREATE POLICY "Admins can view company documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'company-documents' AND has_role(auth.uid(), 'admin'));
