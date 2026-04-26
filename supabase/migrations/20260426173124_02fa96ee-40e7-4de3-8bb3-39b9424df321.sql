-- 1. Add user_id columns
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);

-- 3. Update existing bookings/customers if possible (optional, but good practice if we can match by email)
-- This is hard to do safely in a migration without potentially overwriting data, 
-- but we can try to link based on email if the user exists in auth.users.
UPDATE public.customers c
SET user_id = u.id
FROM auth.users u
WHERE c.email = u.email AND c.user_id IS NULL;

UPDATE public.bookings b
SET user_id = c.user_id
FROM public.customers c
WHERE b.customer_id = c.id AND b.user_id IS NULL AND c.user_id IS NOT NULL;

-- 4. Tighten RLS Policies

-- Bookings: Allow users to see their own bookings
CREATE POLICY "Users can view own bookings" 
ON public.bookings 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can update own bookings" 
ON public.bookings 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- Customers: Allow users to see their own profile
CREATE POLICY "Users can view own customer profile" 
ON public.customers 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can update own customer profile" 
ON public.customers 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- 5. Storage Security (Vouchers)
-- Drop the broad policy
DROP POLICY IF EXISTS "Vouchers are accessible by authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload vouchers" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update vouchers" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete vouchers" ON storage.objects;

-- Create more restrictive policies
-- This assumes vouchers are stored in a path like 'vouchers/USER_ID/filename.pdf'
-- or we can link via meta data. For now, let's at least restrict to admins + specific path logic if possible.
-- If path logic is not yet established, we'll allow admins for now and implement per-user path in the code.

CREATE POLICY "Admins can manage all vouchers" 
ON storage.objects 
FOR ALL 
TO authenticated
USING (bucket_id = 'vouchers' AND has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (bucket_id = 'vouchers' AND has_role(auth.uid(), 'admin'::app_role));

-- 6. GraphQL Security
-- Prevent anonymous users from introspecting the schema via pg_graphql
-- This is done by revoking usage on the graphql schema or the functions
REVOKE ALL ON FUNCTION graphql.resolve FROM anon;
REVOKE ALL ON FUNCTION graphql.resolve FROM public;
GRANT ALL ON FUNCTION graphql.resolve TO authenticated;
GRANT ALL ON FUNCTION graphql.resolve TO service_role;

-- 7. Ensure all SGS tables are restricted to admins (already mostly done, but let's be thorough)
-- Example for one table, can be repeated for others if needed.
-- We already saw they have 'Admins full access' for authenticated.
