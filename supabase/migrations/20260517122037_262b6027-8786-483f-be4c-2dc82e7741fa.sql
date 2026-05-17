
-- 1. Remove public SELECT on transfer_routes base table (partner_price exposure)
DROP POLICY IF EXISTS "Public transfer_routes visibility" ON public.transfer_routes;

-- 2. Remove public SELECT on package_tours / package_transfers junction tables
DROP POLICY IF EXISTS "Package tours are viewable by everyone" ON public.package_tours;
DROP POLICY IF EXISTS "Public package_transfers are viewable by everyone" ON public.package_transfers;

-- 3. Restrict collaborator_types / partner_types to authenticated users
DROP POLICY IF EXISTS "Collaborator types are viewable by everyone" ON public.collaborator_types;
CREATE POLICY "Authenticated can view collaborator types"
  ON public.collaborator_types FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Partner types are viewable by everyone" ON public.partner_types;
CREATE POLICY "Authenticated can view partner types"
  ON public.partner_types FOR SELECT TO authenticated USING (true);

-- 4. Tighten customer-documents storage to admins only
DROP POLICY IF EXISTS "Authenticated users can upload to customer-documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete from customer-documents" ON storage.objects;

CREATE POLICY "Admins upload to customer-documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'customer-documents' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete from customer-documents"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'customer-documents' AND public.has_role(auth.uid(), 'admin'));
