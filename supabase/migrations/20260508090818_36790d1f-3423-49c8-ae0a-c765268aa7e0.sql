ALTER TABLE public.sgs_risk_terms
ADD COLUMN IF NOT EXISTS sign_access_token text,
ADD COLUMN IF NOT EXISTS sign_access_expires_at timestamp with time zone;

UPDATE public.sgs_risk_terms
SET sign_access_token = gen_random_uuid()::text
WHERE sign_access_token IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_sgs_risk_terms_sign_access_token
ON public.sgs_risk_terms (sign_access_token)
WHERE sign_access_token IS NOT NULL;

DROP POLICY IF EXISTS "Public can view bookings by code" ON public.bookings;
DROP POLICY IF EXISTS "Public blocked from viewing bookings" ON public.bookings;
DROP POLICY IF EXISTS "Public confirm booking only when term signed" ON public.bookings;

DROP POLICY IF EXISTS "Public can view customers for terms" ON public.customers;

DROP POLICY IF EXISTS "Public can view dependents for terms" ON public.dependents;
DROP POLICY IF EXISTS "Public blocked from viewing dependents" ON public.dependents;

DROP POLICY IF EXISTS "Public can view term to sign" ON public.sgs_risk_terms;
DROP POLICY IF EXISTS "Anyone can insert risk terms" ON public.sgs_risk_terms;
DROP POLICY IF EXISTS "Public update only own unsigned term" ON public.sgs_risk_terms;
DROP POLICY IF EXISTS "Only admins can view risk terms" ON public.sgs_risk_terms;
DROP POLICY IF EXISTS "Users can view own signed terms" ON public.sgs_risk_terms;
DROP POLICY IF EXISTS "Unsigned terms not readable directly" ON public.sgs_risk_terms;
DROP POLICY IF EXISTS "Backend can create unsigned terms for booking" ON public.sgs_risk_terms;
DROP POLICY IF EXISTS "Backend can update unsigned terms" ON public.sgs_risk_terms;
DROP POLICY IF EXISTS "Users can view own risk terms" ON public.sgs_risk_terms;

CREATE POLICY "Admins and owners can view signed risk terms"
ON public.sgs_risk_terms
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    signature_data IS NOT NULL
    AND (
      EXISTS (
        SELECT 1
        FROM public.bookings b
        LEFT JOIN public.customers c ON c.id = b.customer_id
        WHERE b.id = sgs_risk_terms.booking_id
          AND (b.user_id = auth.uid() OR c.user_id = auth.uid())
      )
      OR EXISTS (
        SELECT 1
        FROM public.customers c
        WHERE c.id = sgs_risk_terms.customer_id
          AND c.user_id = auth.uid()
      )
    )
  )
);

DROP POLICY IF EXISTS "Public can insert minors during signing" ON public.sgs_risk_term_minors;

DROP POLICY IF EXISTS "Public can view company info" ON public.sgs_empresa;

DROP POLICY IF EXISTS "Public can insert signed terms" ON public.documents;
DROP POLICY IF EXISTS "Users can insert signed terms" ON public.documents;
DROP POLICY IF EXISTS "Users can view own signed terms" ON public.documents;
DROP POLICY IF EXISTS "Admins view all documents" ON public.documents;
DROP POLICY IF EXISTS "Only admins can view documents" ON public.documents;

CREATE POLICY "Admins can view all documents"
ON public.documents
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

UPDATE storage.buckets
SET public = false
WHERE id = 'customer-documents';

DROP POLICY IF EXISTS "Public can upload customer documents" ON storage.objects;
DROP POLICY IF EXISTS "Public can view customer documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload customer documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view customer documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins delete customer documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins manage customer documents storage" ON storage.objects;
DROP POLICY IF EXISTS "Users view own customer documents storage" ON storage.objects;

CREATE POLICY "Admins manage customer documents storage"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'customer-documents'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
)
WITH CHECK (
  bucket_id = 'customer-documents'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Users view own customer documents storage"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'customer-documents'
  AND EXISTS (
    SELECT 1
    FROM public.customer_documents cd
    JOIN public.customers c ON c.id = cd.customer_id
    WHERE (cd.file_url = storage.objects.name OR cd.file_url LIKE ('%' || storage.objects.name))
      AND c.user_id = auth.uid()
  )
);