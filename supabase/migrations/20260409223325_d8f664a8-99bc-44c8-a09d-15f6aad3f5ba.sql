
-- Make bucket private
UPDATE storage.buckets SET public = false WHERE id = 'company-documents';

-- Drop old public SELECT policy
DROP POLICY IF EXISTS "Public can view company documents" ON storage.objects;

-- Only admins can view company documents
CREATE POLICY "Admins can view company documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'company-documents' AND public.has_role(auth.uid(), 'admin'::public.app_role));
