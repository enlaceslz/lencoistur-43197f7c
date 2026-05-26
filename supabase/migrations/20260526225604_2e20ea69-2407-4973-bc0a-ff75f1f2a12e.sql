-- 1) Replace public safety_surveys INSERT policy with token-validated SECURITY DEFINER RPC
DROP POLICY IF EXISTS "Public can create surveys with validation" ON public.sgs_safety_surveys;

-- Create an RPC that validates the booking exists (by id + booking_code as a shared secret) before inserting
CREATE OR REPLACE FUNCTION public.submit_safety_survey(
  p_booking_id uuid,
  p_booking_code text,
  p_felt_safe integer,
  p_overall_rating integer,
  p_guide_explained_risks boolean DEFAULT NULL,
  p_danger_situations boolean DEFAULT NULL,
  p_danger_description text DEFAULT NULL,
  p_comments text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  -- Validate ratings
  IF p_felt_safe IS NULL OR p_felt_safe < 1 OR p_felt_safe > 5 THEN
    RAISE EXCEPTION 'Invalid felt_safe rating';
  END IF;
  IF p_overall_rating IS NULL OR p_overall_rating < 1 OR p_overall_rating > 5 THEN
    RAISE EXCEPTION 'Invalid overall_rating';
  END IF;

  -- Validate booking exists and code matches (acts as shared secret to prevent enumeration)
  IF NOT EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE id = p_booking_id 
      AND booking_code = p_booking_code
  ) THEN
    RAISE EXCEPTION 'Invalid booking reference';
  END IF;

  INSERT INTO public.sgs_safety_surveys (
    booking_id, felt_safe, overall_rating, guide_explained_risks, 
    danger_situations, danger_description, comments
  ) VALUES (
    p_booking_id, p_felt_safe, p_overall_rating, p_guide_explained_risks,
    p_danger_situations, p_danger_description, p_comments
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_safety_survey(uuid, text, integer, integer, boolean, boolean, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_safety_survey(uuid, text, integer, integer, boolean, boolean, text, text) TO anon, authenticated;

-- 2) Clean up redundant PERMISSIVE deny policies on user_roles
DROP POLICY IF EXISTS "Deny auth insert user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Deny delete user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Deny update user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Deny public insert user_roles" ON public.user_roles;

-- 3) Fix mutable search_path on get_public_booking_v2
CREATE OR REPLACE FUNCTION public.get_public_booking_v2(p_booking_id uuid)
 RETURNS TABLE(id uuid, booking_code text, item_name text, date text, guests integer, status text, payment_status text, type text, unit_price numeric, total numeric, discount numeric, final_total numeric, pay_method text, created_at timestamp with time zone, customer_name text, customer_email text, customer_cpf text, group_id uuid, public_unit_price numeric, public_total numeric)
 LANGUAGE plpgsql
 STABLE
 SET search_path = public
AS $function$
 BEGIN
     RETURN QUERY
     SELECT 
         b.id, b.booking_code, b.item_name, b.date, b.guests, b.status::text, b.payment_status::text, b.type::text,
         b.unit_price::numeric, b.total::numeric, b.discount::numeric, b.final_total::numeric, b.pay_method::text, b.created_at,
         c.name::text as customer_name, c.email::text as customer_email,
         COALESCE(b.cpf, c.cpf)::text as customer_cpf,
         b.group_id,
         b.public_unit_price::numeric,
         b.public_total::numeric
     FROM bookings b
     LEFT JOIN customers c ON b.customer_id = c.id
     WHERE b.id = p_booking_id 
        OR (b.group_id IS NOT NULL AND b.group_id = (SELECT group_id FROM bookings WHERE id = p_booking_id))
     ORDER BY b.date ASC;
 END;
 $function$;