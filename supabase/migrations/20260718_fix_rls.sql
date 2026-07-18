-- Fix RLS policies for site_settings and notifications tables
-- 2026-07-18

-- 1. Create is_admin() function (checks user_management via email join)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY INVOKER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_management um
    JOIN auth.users au ON au.email = um.email
    WHERE au.id = auth.uid()
      AND um.role = 'admin'
      AND um.status = 'ativo'
  );
$$;

-- 2. Fix site_settings RLS
DROP POLICY IF EXISTS "Admins can insert settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admins can update settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admins can delete settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admins can insert site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admins can update site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admins can delete site_settings" ON public.site_settings;

CREATE POLICY "Admins can insert site_settings" ON public.site_settings
  FOR INSERT TO authenticated WITH CHECK (is_admin());

CREATE POLICY "Admins can update site_settings" ON public.site_settings
  FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Admins can delete site_settings" ON public.site_settings
  FOR DELETE TO authenticated USING (is_admin());

GRANT INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;

-- 3. Fix notifications table
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;

DROP POLICY IF EXISTS "notif_admin_all" ON public.notifications;
DROP POLICY IF EXISTS "Users can read own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can read all notifications" ON public.notifications;

CREATE POLICY "user_own_notifications" ON public.notifications
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
