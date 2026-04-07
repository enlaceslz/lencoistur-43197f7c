
-- 1. Remove permissive read policies from SGS tables (restrict to admins only)
DROP POLICY IF EXISTS "Auth users can read sgs_incidents" ON public.sgs_incidents;
DROP POLICY IF EXISTS "Auth users can read sgs_risks" ON public.sgs_risks;
DROP POLICY IF EXISTS "Auth users can read sgs_corrective_actions" ON public.sgs_corrective_actions;
DROP POLICY IF EXISTS "Auth users can read sgs_audits" ON public.sgs_audits;
DROP POLICY IF EXISTS "Auth users can read sgs_audit_items" ON public.sgs_audit_items;

-- 2. Fix recursive policy on user_roles - use has_role function instead
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
