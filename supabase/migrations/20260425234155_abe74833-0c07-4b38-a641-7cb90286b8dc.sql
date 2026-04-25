-- Fix dependents table RLS policy
DROP POLICY IF EXISTS "Admins can do everything on dependents" ON public.dependents;

CREATE POLICY "Admins can do everything on dependents"
ON public.dependents
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Ensure storage policies for vouchers are secure
-- Currently they are accessible by any authenticated user. 
-- We'll keep them restricted to authenticated users for now but ensure it's explicitly set.
DROP POLICY IF EXISTS "Vouchers are accessible by authenticated users" ON storage.objects;
CREATE POLICY "Vouchers are accessible by authenticated users"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'vouchers');

-- Note: In a real-world scenario, we'd want to restrict this further, 
-- but since customers are not directly linked to auth.users, 
-- 'authenticated' (internal staff) is the best we can do for now.
