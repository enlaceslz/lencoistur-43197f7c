-- ============================================================================
-- Migration: 20260718200718_maintenance_fixes.sql
-- Data: 2026-07-18
-- Autor: Manutenção LençóisTur
--
-- Correções aplicadas em produção (lencois.tur.br / Supabase self-hosted):
--   1. Policy de leitura pública do bucket `tour-images` (ausente antes).
--   2. Usuário administrador (Liliavatti) em auth.users + user_roles.
--   3. População de imagens de capa dos passeios em tours.images.
--
-- IMPORTANTE: as imagens dos passeios foram enviadas via Storage API para
--   tour-images/tours/<slug>-<arquivo>.jpg e as URLs gravadas em tours.images.
--   Esta migration NÃO reenvia os binários (isso é feito pelo Storage), apenas
--   garante a policy e o perfil de usuário. As URLs de imagem estão abaixo como
--   referência caso precise reaplicar em outro ambiente.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) Leitura pública do bucket tour-images
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public read tour images" ON storage.objects;

CREATE POLICY "Public read tour images"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'tour-images');

-- ----------------------------------------------------------------------------
-- 2) Usuário administrador (Liliavatti)
--   _auth.users.role DEVE permanecer 'authenticated' (usado como database role
--    no JWT). A autorização de aplicação é feita por user_roles + has_role().
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_id uuid := 'e8af7a62-96c2-4c90-8744-ad37c86e17ac';
  v_now timestamptz := now();
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_id) THEN
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data, is_super_admin,
      created_at, updated_at, is_sso_user, is_anonymous
    ) VALUES (
      v_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'vatti@lencois.tur.br',
      crypt('$ucesso_2026', gen_salt('bf')),
      v_now, NULL,
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Liliavatti"}'::jsonb,
      true, v_now, v_now, false, false
    );
  ELSE
    UPDATE auth.users
      SET encrypted_password = crypt('$ucesso_2026', gen_salt('bf')),
          email_confirmed_at = COALESCE(email_confirmed_at, v_now),
          is_super_admin = true,
          role = 'authenticated',
          updated_at = v_now
    WHERE id = v_id;
  END IF;

  -- Garantir que colunas varchar não fiquem NULL (causa de erro 500 no GoTrue)
  UPDATE auth.users SET
    confirmation_token    = COALESCE(confirmation_token, ''),
    recovery_token        = COALESCE(recovery_token, ''),
    email_change_token_new = COALESCE(email_change_token_new, ''),
    email_change_token_current = COALESCE(email_change_token_current, ''),
    phone_change_token    = COALESCE(phone_change_token, ''),
    reauthentication_token = COALESCE(reauthentication_token, ''),
    phone_change          = COALESCE(phone_change, ''),
    email_change          = COALESCE(email_change, '')
  WHERE id = v_id;

  -- Perfil em user_management
  UPDATE public.user_management
    SET user_id = v_id, role = 'admin', status = 'ativo', updated_at = v_now
  WHERE email = 'vatti@lencois.tur.br';

  IF NOT FOUND THEN
    INSERT INTO public.user_management (id, user_id, full_name, email, role, status, created_at, updated_at)
    VALUES (v_id, v_id, 'Liliavatti', 'vatti@lencois.tur.br', 'admin', 'ativo', v_now, v_now);
  END IF;

  -- Papéis de aplicação (user_roles usa enum app_role)
  INSERT INTO public.user_roles (user_id, role, created_at)
  VALUES (v_id, 'admin', v_now), (v_id, 'tenant_admin', v_now)
  ON CONFLICT DO NOTHING;
END $$;

-- ----------------------------------------------------------------------------
-- 3) URLs de imagem de capa dos passeios (referência)
--    Reaplicar apenas se tours.images estiver vazio em outro ambiente.
--    Os arquivos físicos devem ser enviados ao bucket tour-images/tours/ via
--    Storage API (não via INSERT direto, para gravar xattrs corretamente).
-- ----------------------------------------------------------------------------
-- UPDATE public.tours SET images = ARRAY['https://lencois.tur.br/storage/v1/object/public/tour-images/tours/caiaque-tour-caiaque.jpg'] WHERE slug = 'caiaque';
-- UPDATE public.tours SET images = ARRAY['https://lencois.tur.br/storage/v1/object/public/tour-images/tours/lagoas-azuis-tour-lagoas-azuis-hero.jpg'] WHERE slug = 'lagoas-azuis';
-- UPDATE public.tours SET images = ARRAY['https://lencois.tur.br/storage/v1/object/public/tour-images/tours/quadriciclo-tour-quadriciclo.jpg'] WHERE slug = 'quadriciclo';
-- UPDATE public.tours SET images = ARRAY['https://lencois.tur.br/storage/v1/object/public/tour-images/tours/ecologico-tour-roteiro-ecologico.jpg'] WHERE slug = 'ecologico';
-- UPDATE public.tours SET images = ARRAY['https://lencois.tur.br/storage/v1/object/public/tour-images/tours/gastronomico-tour-gastronomico.jpg'] WHERE slug = 'gastronomico';
