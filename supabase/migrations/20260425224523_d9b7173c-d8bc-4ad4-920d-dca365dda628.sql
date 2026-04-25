-- Update select policy for vouchers bucket to restrict to authenticated users
DROP POLICY IF EXISTS "Vouchers are publicly accessible" ON storage.objects;

CREATE POLICY "Vouchers are accessible by authenticated users" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'vouchers' AND auth.role() = 'authenticated');