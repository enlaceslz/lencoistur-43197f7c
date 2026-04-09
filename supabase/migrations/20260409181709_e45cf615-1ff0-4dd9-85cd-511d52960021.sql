-- Remove public INSERT policy on bookings (now handled by edge function with service role)
DROP POLICY IF EXISTS "Anyone can create bookings with validation" ON public.bookings;

-- Remove public INSERT policy on customers (now handled by edge function with service role)  
DROP POLICY IF EXISTS "Public can create customers with validation" ON public.customers;