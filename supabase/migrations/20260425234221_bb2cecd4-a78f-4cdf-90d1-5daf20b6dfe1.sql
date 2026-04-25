-- Fix voucher storage policies
DROP POLICY IF EXISTS "Authenticated users can upload vouchers" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update vouchers" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete vouchers" ON storage.objects;

CREATE POLICY "Authenticated users can upload vouchers"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'vouchers');

CREATE POLICY "Authenticated users can update vouchers"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'vouchers');

CREATE POLICY "Authenticated users can delete vouchers"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'vouchers');
