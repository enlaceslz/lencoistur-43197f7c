-- Fix sgs_risk_term_minors policy
DROP POLICY IF EXISTS "Authenticated users can manage sgs_risk_term_minors" ON public.sgs_risk_term_minors;
CREATE POLICY "Authenticated users can manage sgs_risk_term_minors" 
ON public.sgs_risk_term_minors 
FOR ALL 
TO authenticated 
USING (auth.uid() IS NOT NULL) 
WITH CHECK (auth.uid() IS NOT NULL);

-- Fix documents table policy
DROP POLICY IF EXISTS "Users can insert signed terms" ON public.documents;
CREATE POLICY "Users can insert signed terms" 
ON public.documents 
FOR INSERT 
TO authenticated
WITH CHECK (type = 'termo_assinado'::text);

-- Fix storage.objects policies
DROP POLICY IF EXISTS "Admins and Customers can upload company documents" ON storage.objects;
CREATE POLICY "Admins and Customers can upload company documents" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'company-documents'::text);

-- Fix marketing_leads
DROP POLICY IF EXISTS "Public can submit leads" ON public.marketing_leads;
CREATE POLICY "Public can submit leads" 
ON public.marketing_leads 
FOR INSERT 
TO anon, authenticated
WITH CHECK (name IS NOT NULL AND email IS NOT NULL);
