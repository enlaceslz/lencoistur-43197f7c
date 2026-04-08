-- 1. Fix bookings INSERT policy: validate customer_id exists, force pix_code=null and notes=null
DROP POLICY IF EXISTS "Anyone can create bookings with validation" ON public.bookings;

CREATE POLICY "Anyone can create bookings with validation"
ON public.bookings
FOR INSERT
TO public
WITH CHECK (
  status = 'pendente'
  AND payment_status = 'pendente'
  AND discount = 0
  AND unit_price > 0
  AND guests >= 1
  AND guests <= 50
  AND total = (unit_price * guests)
  AND final_total = total
  AND notes IS NULL
  AND EXISTS (SELECT 1 FROM public.customers WHERE customers.id = bookings.customer_id)
  AND (
    EXISTS (
      SELECT 1 FROM public.tours
      WHERE tours.name = bookings.item_name
        AND tours.active = true
        AND tours.price = bookings.unit_price
        AND bookings.type = 'passeio'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.transfer_routes
      WHERE (transfer_routes.origin || ' → ' || transfer_routes.destination) = bookings.item_name
        AND transfer_routes.active = true
        AND transfer_routes.price = bookings.unit_price
        AND bookings.type = 'translado'
    )
  )
);

-- 2. Fix safety surveys: require valid booking_id
DROP POLICY IF EXISTS "Public can create surveys with validation" ON public.sgs_safety_surveys;

CREATE POLICY "Public can create surveys with validation"
ON public.sgs_safety_surveys
FOR INSERT
TO public
WITH CHECK (
  felt_safe IS NOT NULL AND felt_safe >= 1 AND felt_safe <= 5
  AND overall_rating IS NOT NULL AND overall_rating >= 1 AND overall_rating <= 5
  AND booking_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.bookings WHERE bookings.id = sgs_safety_surveys.booking_id)
);

-- 3. Fix risk terms: require valid booking_id
DROP POLICY IF EXISTS "Public can create risk terms with validation" ON public.sgs_risk_terms;

CREATE POLICY "Public can create risk terms with validation"
ON public.sgs_risk_terms
FOR INSERT
TO public
WITH CHECK (
  accepted = true
  AND signed_at IS NOT NULL
  AND customer_name IS NOT NULL AND char_length(customer_name) >= 2
  AND tour_name IS NOT NULL AND char_length(tour_name) >= 2
  AND array_length(risks_informed, 1) >= 1
  AND booking_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.bookings WHERE bookings.id = sgs_risk_terms.booking_id)
);