-- Drop the existing permissive booking INSERT policy
DROP POLICY IF EXISTS "Anyone can create bookings with validation" ON public.bookings;

-- Create a stricter policy: discount must be 0 for public inserts,
-- and unit_price must match the tour or transfer_route price
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