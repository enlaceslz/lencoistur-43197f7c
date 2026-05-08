
-- 1. sgs_risk_term_minors: replace public ALL with scoped policies
DROP POLICY IF EXISTS "Public can manage risk term minors" ON public.sgs_risk_term_minors;

CREATE POLICY "Admins manage risk term minors"
ON public.sgs_risk_term_minors FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow public INSERT only when linked to an unsigned risk term (signing flow)
CREATE POLICY "Public can insert minors during signing"
ON public.sgs_risk_term_minors FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.sgs_risk_terms t
    WHERE t.id = risk_term_id
      AND t.signature_data IS NULL
  )
);

-- 2. customer_documents: restrict SELECT to admin (uploads stay open for signing flow)
DROP POLICY IF EXISTS "Anyone can view customer documents" ON public.customer_documents;

CREATE POLICY "Admins can view customer documents"
ON public.customer_documents FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update customer documents"
ON public.customer_documents FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete customer documents"
ON public.customer_documents FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. vouchers bucket: make private
UPDATE storage.buckets SET public = false WHERE id = 'vouchers';

-- Drop any prior public SELECT policies on vouchers
DROP POLICY IF EXISTS "Vouchers public read" ON storage.objects;
DROP POLICY IF EXISTS "Public read vouchers" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view vouchers" ON storage.objects;

CREATE POLICY "Admins manage vouchers bucket"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'vouchers' AND has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (bucket_id = 'vouchers' AND has_role(auth.uid(), 'admin'::app_role));

-- 4. avatars bucket: enforce ownership on UPDATE/DELETE
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Avatar update" ON storage.objects;
DROP POLICY IF EXISTS "Avatar delete" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete avatars" ON storage.objects;

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR has_role(auth.uid(), 'admin'::app_role)
  )
)
WITH CHECK (
  bucket_id = 'avatars'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);
