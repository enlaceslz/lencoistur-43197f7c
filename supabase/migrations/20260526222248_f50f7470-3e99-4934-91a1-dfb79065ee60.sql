-- 1. Update get_public_booking_v2 to include booking-level CPF
DROP FUNCTION IF EXISTS public.get_public_booking_v2(uuid);
CREATE OR REPLACE FUNCTION public.get_public_booking_v2(p_booking_id uuid)
 RETURNS TABLE(id uuid, booking_code text, item_name text, date text, guests integer, status text, payment_status text, type text, final_total integer, pay_method text, created_at timestamp with time zone, customer_name text, customer_email text, customer_cpf text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
 AS $function$
 BEGIN
     RETURN QUERY
     SELECT 
         b.id, b.booking_code, b.item_name, b.date, b.guests, b.status, b.payment_status, b.type,
         b.final_total, b.pay_method, b.created_at,
         c.name as customer_name, c.email as customer_email,
         COALESCE(b.cpf, c.cpf) as customer_cpf
     FROM bookings b
     LEFT JOIN customers c ON b.customer_id = c.id
     WHERE b.id = p_booking_id;
 END;
 $function$;

-- 2. Update get_public_term_v2 to prioritize booking-level data for CPF and Birth Date
DROP FUNCTION IF EXISTS public.get_public_term_v2(uuid, text);
CREATE OR REPLACE FUNCTION public.get_public_term_v2(p_term_id uuid, p_token text)
 RETURNS TABLE(id uuid, customer_id uuid, customer_name text, customer_email text, customer_phone text, customer_cpf text, customer_passport text, customer_country text, customer_birth_date date, tour_name text, term_date date, accepted boolean, booking_id uuid, booking_code text, booking_item_name text, booking_date text, signature_data text, risks_informed text[], health_questions text[], pdf_url text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
 AS $function$
 BEGIN
     IF p_token IS NULL OR length(p_token) < 16 THEN
       RETURN;
     END IF;
     RETURN QUERY
     SELECT 
         t.id, t.customer_id, 
         COALESCE(t.customer_name, c.name), 
         c.email, 
         c.phone, 
         COALESCE(b.cpf, c.cpf) as customer_cpf, 
         c.passport, 
         c.country, 
         COALESCE(CAST(b.birth_date AS date), c.birth_date) as customer_birth_date,
         t.tour_name, t.term_date, t.accepted, t.booking_id,
         b.booking_code, b.item_name, b.date,
         t.signature_data, t.risks_informed, t.health_questions, t.pdf_url
     FROM sgs_risk_terms t
     LEFT JOIN customers c ON t.customer_id = c.id
     LEFT JOIN bookings b ON t.booking_id = b.id
     WHERE t.id = p_term_id 
       AND t.sign_access_token = p_token
       AND (t.sign_access_expires_at IS NULL OR t.sign_access_expires_at > now());
 END;
 $function$;

GRANT EXECUTE ON FUNCTION public.get_public_booking_v2(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_public_term_v2(uuid, text) TO anon, authenticated, service_role;
