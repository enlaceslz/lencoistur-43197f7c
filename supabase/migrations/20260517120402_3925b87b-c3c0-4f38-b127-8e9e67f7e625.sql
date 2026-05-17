DROP FUNCTION IF EXISTS public.get_public_booking_v2(uuid);

CREATE OR REPLACE FUNCTION public.get_public_booking_v2(p_booking_id uuid)
RETURNS TABLE (
    id uuid,
    booking_code text,
    item_name text,
    date text,
    guests int,
    status text,
    payment_status text,
    type text,
    unit_price int,
    total int,
    discount int,
    final_total int,
    pay_method text,
    pix_code text,
    created_at timestamptz,
    notes text,
    customer_name text,
    customer_email text,
    customer_phone text,
    customer_cpf text,
    customer_passport text
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id, b.booking_code, b.item_name, b.date, b.guests, b.status, b.payment_status, b.type,
        b.unit_price, b.total, b.discount, b.final_total, b.pay_method, b.pix_code, b.created_at, b.notes,
        c.name as customer_name, c.email as customer_email, c.phone as customer_phone, c.cpf as customer_cpf, c.passport as customer_passport
    FROM bookings b
    LEFT JOIN customers c ON b.customer_id = c.id
    WHERE b.id = p_booking_id;
END;
$$;
