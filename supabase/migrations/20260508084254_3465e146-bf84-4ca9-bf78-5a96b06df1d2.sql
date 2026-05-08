
-- 1. notifications: restrict insert to own user_id or admin
DROP POLICY IF EXISTS "Authenticated insert notifications" ON public.notifications;
CREATE POLICY "Users insert own notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- 2. avatars: drop loose UPDATE/DELETE policies, keep only scoped ones
DO $$
DECLARE p record;
BEGIN
  FOR p IN
    SELECT polname FROM pg_policy
    WHERE polrelid = 'storage.objects'::regclass
      AND polname IN ('Users can update their own avatars','Users can delete their own avatars','Avatar images are publicly accessible upload','Anyone can upload avatars')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', p.polname);
  END LOOP;
END $$;

-- 3. customer_documents: remove public insert, admin-only
DROP POLICY IF EXISTS "Anyone can insert customer documents" ON public.customer_documents;
CREATE POLICY "Admins insert customer documents"
ON public.customer_documents
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 4. sgs_risk_terms: tighten UPDATE - only unsigned AND booking exists
DROP POLICY IF EXISTS "Public can update unsigned risk terms" ON public.sgs_risk_terms;
DROP POLICY IF EXISTS "Public update unsigned terms" ON public.sgs_risk_terms;
CREATE POLICY "Public update only own unsigned term"
ON public.sgs_risk_terms
FOR UPDATE
TO anon, authenticated
USING (signature_data IS NULL AND booking_id IS NOT NULL)
WITH CHECK (booking_id IS NOT NULL);

-- 5. bookings: tighten public update - require term signed AND status only confirmada
DROP POLICY IF EXISTS "Public confirm booking only when term signed" ON public.bookings;
CREATE POLICY "Public confirm booking only when term signed"
ON public.bookings
FOR UPDATE
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.sgs_risk_terms t
    WHERE t.booking_id = bookings.id
      AND t.signature_data IS NOT NULL
  )
)
WITH CHECK (status = 'confirmada');
