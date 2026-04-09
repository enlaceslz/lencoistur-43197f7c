
-- Drop and recreate the booking insert policy with pay_method validation
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
  AND pay_method IN ('pix', 'cartao', 'dinheiro', 'transferencia')
  AND EXISTS (
    SELECT 1 FROM customers WHERE customers.id = bookings.customer_id
  )
  AND (
    EXISTS (
      SELECT 1 FROM tours
      WHERE tours.name = bookings.item_name
        AND tours.active = true
        AND tours.price = bookings.unit_price
        AND bookings.type = 'passeio'
    )
    OR EXISTS (
      SELECT 1 FROM transfer_routes
      WHERE (transfer_routes.origin || ' → ' || transfer_routes.destination) = bookings.item_name
        AND transfer_routes.active = true
        AND transfer_routes.price = bookings.unit_price
        AND bookings.type = 'translado'
    )
  )
);
