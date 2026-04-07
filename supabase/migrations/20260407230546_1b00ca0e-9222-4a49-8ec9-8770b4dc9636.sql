-- 1. Customers: restrict reads to admins only
DROP POLICY IF EXISTS "Anyone can read customers" ON public.customers;
CREATE POLICY "Admins can read customers" ON public.customers FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 2. Bookings: restrict SELECT to admins
DROP POLICY IF EXISTS "Anyone can read bookings by code" ON public.bookings;
CREATE POLICY "Admins can read all bookings" ON public.bookings FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 3. Partners: restrict reads to admins
DROP POLICY IF EXISTS "Anyone can view active partners" ON public.partners;
CREATE POLICY "Admins can view partners" ON public.partners FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage partners" ON public.partners FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. User roles: explicit deny for writes
CREATE POLICY "Deny public insert user_roles" ON public.user_roles FOR INSERT TO public
WITH CHECK (false);
CREATE POLICY "Deny auth insert user_roles" ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (false);
CREATE POLICY "Deny update user_roles" ON public.user_roles FOR UPDATE TO authenticated
USING (false);
CREATE POLICY "Deny delete user_roles" ON public.user_roles FOR DELETE TO authenticated
USING (false);