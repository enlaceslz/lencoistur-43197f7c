
-- 1. Remove broad authenticated policies on financeiro bucket (admin policies remain)
DROP POLICY IF EXISTS "Usuários autenticados podem fazer upload de anexos" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar anexos" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar anexos" ON storage.objects;

-- 2. Restrict company-documents bucket INSERT to admins only
DROP POLICY IF EXISTS "Admins and Customers can upload company documents" ON storage.objects;
CREATE POLICY "Admins can upload company documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'company-documents' AND has_role(auth.uid(), 'admin'::app_role));

-- 3. Restrict public INSERT on documents to signed terms only
DROP POLICY IF EXISTS "Public can insert signed terms" ON public.documents;
CREATE POLICY "Public can insert signed terms"
ON public.documents FOR INSERT TO anon, authenticated
WITH CHECK (type = 'termo_assinado');

-- 4. sgs_empresa: keep public read (needed for signing UI to show company info/term template),
-- but the warning is acceptable since CNPJ/contact are also displayed on receipts/site footer.
-- No change.
