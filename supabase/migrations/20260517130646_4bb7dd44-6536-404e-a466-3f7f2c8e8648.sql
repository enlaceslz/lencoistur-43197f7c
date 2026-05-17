
-- 1. Voucher RPC: remove sensitive PII and financial breakdown
DROP FUNCTION IF EXISTS public.get_public_booking_v2(uuid);
CREATE OR REPLACE FUNCTION public.get_public_booking_v2(p_booking_id uuid)
 RETURNS TABLE(id uuid, booking_code text, item_name text, date text, guests integer, status text, payment_status text, type text, final_total integer, pay_method text, created_at timestamp with time zone, customer_name text, customer_email text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        b.id, b.booking_code, b.item_name, b.date, b.guests, b.status, b.payment_status, b.type,
        b.final_total, b.pay_method, b.created_at,
        c.name as customer_name, c.email as customer_email
    FROM bookings b
    LEFT JOIN customers c ON b.customer_id = c.id
    WHERE b.id = p_booking_id;
END;
$function$;

-- 2. Search RPC: strip all PII (CPF, passport, email, phone, birth date, country)
DROP FUNCTION IF EXISTS public.search_public_booking(text);
CREATE OR REPLACE FUNCTION public.search_public_booking(p_query text)
 RETURNS TABLE(id uuid, booking_code text, item_name text, date text, customer_id uuid, customer_name text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        b.id, b.booking_code, b.item_name, b.date, b.customer_id,
        c.name
    FROM bookings b
    JOIN customers c ON b.customer_id = c.id
    WHERE 
        b.id::text = p_query 
        OR b.booking_code ILIKE p_query
        OR b.booking_code ILIKE 'RES-' || to_char(now(), 'YYYY') || '-' || LPAD(p_query, 4, '0');
END;
$function$;

-- 3. Term RPC: require a valid, non-expired access token (no NULL fallback)
DROP FUNCTION IF EXISTS public.get_public_term_v2(uuid, text);
DROP FUNCTION IF EXISTS public.get_public_term_v2(uuid);
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
        COALESCE(t.customer_name, c.name), c.email, c.phone, c.cpf, c.passport, c.country, c.birth_date,
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
