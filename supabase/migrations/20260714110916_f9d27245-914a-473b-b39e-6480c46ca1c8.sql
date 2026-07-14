
-- Fix user_management policies: scope to authenticated instead of public
DROP POLICY IF EXISTS "Admins can do everything on user_management" ON public.user_management;
DROP POLICY IF EXISTS "Users can view their own management entry" ON public.user_management;

CREATE POLICY "Admins can do everything on user_management"
ON public.user_management
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own management entry"
ON public.user_management
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
