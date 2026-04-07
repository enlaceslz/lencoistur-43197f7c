
-- Allow admins full CRUD on transfer_routes
CREATE POLICY "Admins can manage transfer_routes" ON public.transfer_routes
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
