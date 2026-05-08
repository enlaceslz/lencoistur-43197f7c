-- Drop the existing constraint
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_type_check;

-- Add the updated constraint including 'package'
ALTER TABLE public.bookings ADD CONSTRAINT bookings_type_check 
CHECK (type = ANY (ARRAY['tour'::text, 'transfer'::text, 'passeio'::text, 'translado'::text, 'package'::text]));
