-- Fix partner_types policies
DROP POLICY IF EXISTS "Partner types are manageable by authenticated users" ON public.partner_types;
CREATE POLICY "Partner types are manageable by admins" 
ON public.partner_types 
FOR ALL 
TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix document_types policies
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.document_types;
CREATE POLICY "Document types are viewable by authenticated users" 
ON public.document_types 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Document types are manageable by admins" 
ON public.document_types 
FOR ALL 
TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role));
