-- Update packages policies
DROP POLICY IF EXISTS "Anyone can view active packages" ON public.packages;
DROP POLICY IF EXISTS "Admins manage packages" ON public.packages;

CREATE POLICY "Public packages visibility" 
ON public.packages 
FOR SELECT 
TO public
USING (active = true);

CREATE POLICY "Admins full access packages" 
ON public.packages 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Update transfer_routes policies
DROP POLICY IF EXISTS "Anyone can view active transfer routes" ON public.transfer_routes;
DROP POLICY IF EXISTS "Admins can manage transfer_routes" ON public.transfer_routes;

CREATE POLICY "Public transfer_routes visibility" 
ON public.transfer_routes 
FOR SELECT 
TO public
USING (active = true);

CREATE POLICY "Admins full access transfer_routes" 
ON public.transfer_routes 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Grants
GRANT SELECT ON public.packages TO anon, authenticated;
GRANT SELECT ON public.transfer_routes TO anon, authenticated;
