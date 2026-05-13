-- Drop existing policies on tours to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view active tours" ON public.tours;
DROP POLICY IF EXISTS "Admins can manage tours" ON public.tours;
DROP POLICY IF EXISTS "Users can view active tours" ON public.tours;
DROP POLICY IF EXISTS "Admins manage tours" ON public.tours;

-- Policy for public visibility (anon and authenticated)
CREATE POLICY "Public tours visibility" 
ON public.tours 
FOR SELECT 
TO public
USING (active = true);

-- Policy for admin management
-- We use a direct check on user_roles table to be safer than relying on a custom function in RLS
CREATE POLICY "Admins full access" 
ON public.tours 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Ensure anon and authenticated roles have SELECT grant on tours and public_tours view
GRANT SELECT ON public.tours TO anon, authenticated;
GRANT SELECT ON public.public_tours TO anon, authenticated;

-- Just in case, also ensure grants on the view's underlying table are correct
GRANT SELECT ON public.tours TO anon, authenticated;
