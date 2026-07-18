-- Fix RLS for site_settings and notifications tables
-- 2026-07-18
-- 
-- NOTA: o sistema de roles usa user_roles + has_role(auth.uid(), role::app_role)
-- has_role() consulta a tabela user_roles, NAO auth.users.app_metadata
-- O admin Andre tem role='admin' em user_roles, entao has_role funciona corretamente

-- 1. Fix site_settings: faltava GRANT para authenticated
GRANT INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;

-- 2. Fix notifications: faltava coluna user_id + RLS + GRANTs
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;

DROP POLICY IF EXISTS "notif_admin_all" ON public.notifications;

CREATE POLICY "user_own_notifications" ON public.notifications
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
