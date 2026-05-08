
-- ============================================
-- 1. BOOKINGS: Remove public blanket SELECT
-- ============================================
DROP POLICY IF EXISTS "Public can view bookings by code" ON public.bookings;

CREATE POLICY "Public blocked from viewing bookings"
  ON public.bookings
  FOR SELECT
  USING (false);

-- ============================================
-- 2. CUSTOMERS: Remove public SELECT entirely
-- ============================================
DROP POLICY IF EXISTS "Public can view customers for terms" ON public.customers;

-- ============================================
-- 3. DEPENDENTS: Remove public SELECT entirely
-- ============================================
DROP POLICY IF EXISTS "Public can view dependents for terms" ON public.dependents;

CREATE POLICY "Public blocked from viewing dependents"
  ON public.dependents
  FOR SELECT
  USING (false);

-- ============================================
-- 4. SGS_RISK_TERMS: Restrict to backend flow
-- ============================================
DROP POLICY IF EXISTS "Public can view term to sign" ON public.sgs_risk_terms;
DROP POLICY IF EXISTS "Anyone can insert risk terms" ON public.sgs_risk_terms;
DROP POLICY IF EXISTS "Public update only own unsigned term" ON public.sgs_risk_terms;

-- Only admins can directly read terms
CREATE POLICY "Only admins can view risk terms"
  ON public.sgs_risk_terms
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Authenticated users can view own signed terms (linked via booking)
CREATE POLICY "Users can view own signed terms"
  ON public.sgs_risk_terms
  FOR SELECT
  USING (
    (EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = sgs_risk_terms.booking_id
      AND (b.user_id = auth.uid() OR b.customer_id IN (
        SELECT id FROM public.customers WHERE user_id = auth.uid()
      ))
    ) AND signature_data IS NOT NULL)
  );

-- ============================================
-- 5. DOCUMENTS: Remove user self-service term reads
-- ============================================
DROP POLICY IF EXISTS "Users can view own signed terms" ON public.documents;

-- Only admins can view documents
CREATE POLICY "Only admins can view documents"
  ON public.documents
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));
