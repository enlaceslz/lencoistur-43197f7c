
-- ============ COLLABORATORS: admin only ============
DROP POLICY IF EXISTS "Admins have full access to collaborators" ON public.collaborators;
CREATE POLICY "Admins manage collaborators"
  ON public.collaborators FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ============ COLLABORATOR_PAYMENTS: admin only ============
DROP POLICY IF EXISTS "Admins can manage collaborator payments" ON public.collaborator_payments;
DROP POLICY IF EXISTS "Admins have full access to collaborator payments" ON public.collaborator_payments;
DROP POLICY IF EXISTS "Collaborator payments are viewable by everyone" ON public.collaborator_payments;
CREATE POLICY "Admins manage collaborator payments"
  ON public.collaborator_payments FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ============ COLLABORATOR_TYPES: admin write, public read ok (reference data) ============
DROP POLICY IF EXISTS "Admin can do everything on collaborator_types" ON public.collaborator_types;
DROP POLICY IF EXISTS "Admins can manage collaborator types" ON public.collaborator_types;
CREATE POLICY "Admins manage collaborator types"
  ON public.collaborator_types FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ============ CUSTOMER_INTERACTIONS: admin only (real check) ============
DROP POLICY IF EXISTS "Admins can do everything on customer_interactions" ON public.customer_interactions;
CREATE POLICY "Admins manage customer interactions"
  ON public.customer_interactions FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ============ PACKAGE_TRANSFERS: admin manage ============
DROP POLICY IF EXISTS "Admin package_transfers are manageable by authenticated users" ON public.package_transfers;
CREATE POLICY "Admins manage package_transfers"
  ON public.package_transfers FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ============ PACKAGE_TOURS: standardize admin check ============
DROP POLICY IF EXISTS "Admins can manage package tours" ON public.package_tours;
CREATE POLICY "Admins manage package_tours"
  ON public.package_tours FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ============ PACKAGES: standardize admin check ============
DROP POLICY IF EXISTS "Admins can manage packages" ON public.packages;
CREATE POLICY "Admins manage packages"
  ON public.packages FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ============ NOTIFICATIONS: remove NULL leak, restrict insert ============
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;

CREATE POLICY "Authenticated insert notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users view own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- ============ BOOKINGS: tighten public update (require signed term exists) ============
DROP POLICY IF EXISTS "Public can update booking status after signing" ON public.bookings;
CREATE POLICY "Public confirm booking only when term signed"
  ON public.bookings FOR UPDATE TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.sgs_risk_terms t WHERE t.booking_id = bookings.id AND t.signature_data IS NOT NULL))
  WITH CHECK (status IN ('confirmada','pendente'));

-- ============ STORAGE: financeiro bucket -> private, admin only ============
UPDATE storage.buckets SET public = false WHERE id = 'financeiro';
DROP POLICY IF EXISTS "Acesso público aos anexos financeiros" ON storage.objects;
CREATE POLICY "Admins read financeiro"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'financeiro' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins write financeiro"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'financeiro' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update financeiro"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'financeiro' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete financeiro"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'financeiro' AND has_role(auth.uid(), 'admin'::app_role));

-- ============ STORAGE: customer-documents -> restrict DELETE to admin ============
DROP POLICY IF EXISTS "Admins can delete customer documents" ON storage.objects;
CREATE POLICY "Admins delete customer documents"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'customer-documents' AND has_role(auth.uid(), 'admin'::app_role));
