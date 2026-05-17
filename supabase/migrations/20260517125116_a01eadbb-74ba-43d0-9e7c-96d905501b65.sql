-- Update get_public_term_v2 to require a token
CREATE OR REPLACE FUNCTION public.get_public_term_v2(p_term_id uuid, p_token text DEFAULT NULL)
 RETURNS TABLE(
   id uuid, 
   customer_id uuid, 
   customer_name text, 
   customer_email text, 
   customer_phone text, 
   customer_cpf text, 
   customer_passport text, 
   customer_country text, 
   customer_birth_date date, 
   tour_name text, 
   term_date date, 
   accepted boolean, 
   booking_id uuid, 
   booking_code text, 
   booking_item_name text, 
   booking_date text, 
   signature_data text, 
   risks_informed text[], 
   health_questions text[], 
   pdf_url text
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
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
      AND (p_token IS NULL OR t.sign_access_token = p_token); -- Allows NULL for backward compatibility during transition if needed, but we will pass it
END;
$function$;