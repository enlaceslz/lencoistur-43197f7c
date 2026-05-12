-- Update the bucket to be public
UPDATE storage.buckets SET public = true WHERE id = 'customer-documents';

-- Try creating policies without ALTER TABLE
CREATE POLICY "Public Access for customer-documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'customer-documents');

CREATE POLICY "Authenticated users can upload to customer-documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'customer-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete from customer-documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'customer-documents' AND auth.role() = 'authenticated');
