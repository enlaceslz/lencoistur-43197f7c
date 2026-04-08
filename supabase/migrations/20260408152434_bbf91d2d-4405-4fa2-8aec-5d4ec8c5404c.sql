
-- Fix 1: Replace permissive bookings INSERT policy with validated one
DROP POLICY IF EXISTS "Anyone can create bookings" ON public.bookings;

CREATE POLICY "Anyone can create bookings with validation"
ON public.bookings
FOR INSERT
TO public
WITH CHECK (
  status = 'pendente'
  AND payment_status = 'pendente'
  AND discount >= 0
  AND discount <= 20
  AND unit_price > 0
  AND guests >= 1
  AND guests <= 50
  AND total = unit_price * guests
  AND final_total >= 0
);

-- Fix 2: Replace permissive sgs_risk_terms INSERT policy with validated one
DROP POLICY IF EXISTS "Public can create risk terms" ON public.sgs_risk_terms;

CREATE POLICY "Public can create risk terms with validation"
ON public.sgs_risk_terms
FOR INSERT
TO public
WITH CHECK (
  accepted = true
  AND signed_at IS NOT NULL
  AND customer_name IS NOT NULL
  AND char_length(customer_name) >= 2
  AND tour_name IS NOT NULL
  AND char_length(tour_name) >= 2
  AND array_length(risks_informed, 1) >= 1
);

-- Fix 3: Add basic validation to customers INSERT
DROP POLICY IF EXISTS "Anyone can create customers" ON public.customers;

CREATE POLICY "Anyone can create customers with validation"
ON public.customers
FOR INSERT
TO public
WITH CHECK (
  char_length(name) >= 2
  AND char_length(email) >= 5
  AND email LIKE '%@%.%'
);

-- Fix 4: Add basic validation to sgs_safety_surveys INSERT
DROP POLICY IF EXISTS "Public can create surveys" ON public.sgs_safety_surveys;

CREATE POLICY "Public can create surveys with validation"
ON public.sgs_safety_surveys
FOR INSERT
TO public
WITH CHECK (
  felt_safe IS NOT NULL
  AND felt_safe >= 1
  AND felt_safe <= 5
  AND overall_rating IS NOT NULL
  AND overall_rating >= 1
  AND overall_rating <= 5
);
