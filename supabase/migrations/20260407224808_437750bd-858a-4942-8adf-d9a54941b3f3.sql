-- 1. Create app_role enum and user_roles table
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Only admins can view roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
));

-- 2. Create has_role security definer function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 3. Fix SGS tables: drop permissive policies, add admin-only policies

-- sgs_risks
DROP POLICY IF EXISTS "Public access sgs_risks" ON public.sgs_risks;
CREATE POLICY "Admins full access sgs_risks" ON public.sgs_risks FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Auth users can read sgs_risks" ON public.sgs_risks FOR SELECT TO authenticated
USING (true);

-- sgs_incidents
DROP POLICY IF EXISTS "Public access sgs_incidents" ON public.sgs_incidents;
CREATE POLICY "Admins full access sgs_incidents" ON public.sgs_incidents FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Auth users can read sgs_incidents" ON public.sgs_incidents FOR SELECT TO authenticated
USING (true);

-- sgs_corrective_actions
DROP POLICY IF EXISTS "Public access sgs_corrective_actions" ON public.sgs_corrective_actions;
CREATE POLICY "Admins full access sgs_corrective_actions" ON public.sgs_corrective_actions FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Auth users can read sgs_corrective_actions" ON public.sgs_corrective_actions FOR SELECT TO authenticated
USING (true);

-- sgs_audits
DROP POLICY IF EXISTS "Public access sgs_audits" ON public.sgs_audits;
CREATE POLICY "Admins full access sgs_audits" ON public.sgs_audits FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Auth users can read sgs_audits" ON public.sgs_audits FOR SELECT TO authenticated
USING (true);

-- sgs_audit_items
DROP POLICY IF EXISTS "Public access sgs_audit_items" ON public.sgs_audit_items;
CREATE POLICY "Admins full access sgs_audit_items" ON public.sgs_audit_items FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Auth users can read sgs_audit_items" ON public.sgs_audit_items FOR SELECT TO authenticated
USING (true);

-- sgs_staff
DROP POLICY IF EXISTS "Public access sgs_staff" ON public.sgs_staff;
CREATE POLICY "Admins full access sgs_staff" ON public.sgs_staff FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- sgs_staff_trainings
DROP POLICY IF EXISTS "Public access sgs_staff_trainings" ON public.sgs_staff_trainings;
CREATE POLICY "Admins full access sgs_staff_trainings" ON public.sgs_staff_trainings FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- sgs_briefings
DROP POLICY IF EXISTS "Public access sgs_briefings" ON public.sgs_briefings;
CREATE POLICY "Admins full access sgs_briefings" ON public.sgs_briefings FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- sgs_risk_terms
DROP POLICY IF EXISTS "Public access sgs_risk_terms" ON public.sgs_risk_terms;
CREATE POLICY "Admins full access sgs_risk_terms" ON public.sgs_risk_terms FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
-- Public can insert (tourists signing terms)
CREATE POLICY "Public can create risk terms" ON public.sgs_risk_terms FOR INSERT TO public
WITH CHECK (true);

-- sgs_safety_surveys
DROP POLICY IF EXISTS "Public access sgs_safety_surveys" ON public.sgs_safety_surveys;
CREATE POLICY "Admins full access sgs_safety_surveys" ON public.sgs_safety_surveys FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
-- Public can insert (tourists filling surveys)
CREATE POLICY "Public can create surveys" ON public.sgs_safety_surveys FOR INSERT TO public
WITH CHECK (true);

-- sgs_supplier_compliance
DROP POLICY IF EXISTS "Public access sgs_supplier_compliance" ON public.sgs_supplier_compliance;
CREATE POLICY "Admins full access sgs_supplier_compliance" ON public.sgs_supplier_compliance FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. Fix bookings table policies
DROP POLICY IF EXISTS "Anyone can update bookings" ON public.bookings;
CREATE POLICY "Admins can update bookings" ON public.bookings FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));