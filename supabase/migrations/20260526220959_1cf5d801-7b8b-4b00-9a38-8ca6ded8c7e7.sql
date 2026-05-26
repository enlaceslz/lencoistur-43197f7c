-- Add birth_date column to bookings table
ALTER TABLE public.bookings ADD COLUMN birth_date DATE;

-- Comment for clarity
COMMENT ON COLUMN public.bookings.birth_date IS 'Customer birth date at the time of booking';
