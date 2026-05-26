DROP FUNCTION IF EXISTS public.get_public_booking_v2(uuid);

CREATE OR REPLACE FUNCTION public.get_public_booking_v2(p_booking_id uuid)
 RETURNS TABLE(id uuid, booking_code text, item_name text, date text, guests integer, status text, payment_status text, type text, unit_price numeric, total numeric, discount numeric, final_total numeric, pay_method text, created_at timestamp with time zone, customer_name text, customer_email text, customer_cpf text, group_id uuid, public_unit_price numeric, public_total numeric)
 LANGUAGE plpgsql
 STABLE
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