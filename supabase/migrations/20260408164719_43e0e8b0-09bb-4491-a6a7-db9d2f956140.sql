
-- Create function to auto-generate booking_code
CREATE OR REPLACE FUNCTION public.generate_booking_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.booking_code := 'LT-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(md5(random()::text), 1, 4));
  RETURN NEW;
END;
$$;

-- Create trigger to auto-set booking_code on insert
DROP TRIGGER IF EXISTS trg_generate_booking_code ON public.bookings;
CREATE TRIGGER trg_generate_booking_code
  BEFORE INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_booking_code();
