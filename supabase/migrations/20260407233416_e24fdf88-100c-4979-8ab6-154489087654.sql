
-- Allow admins full CRUD on tours
CREATE POLICY "Admins can manage tours" ON public.tours
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admins to manage reviews
CREATE POLICY "Admins can manage reviews" ON public.reviews
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
