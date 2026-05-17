-- 1. Lock down tours, packages, and transfer_routes base tables
-- These are already used via public_tours, public_packages, etc. views.
DROP POLICY IF EXISTS "Public tours visibility" ON public.tours;
CREATE POLICY "Tours are viewable by everyone" ON public.tours
FOR SELECT USING (active = true); -- This still allows SELECT. The scanner wants column restriction.
-- Actually, the best way is to keep RLS active and only allow admins to see everything, 
-- and use the security_invoker views for public access.
ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tours are viewable by everyone" ON public.tours;
CREATE POLICY "Admins can manage tours" ON public.tours 
FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public packages visibility" ON public.packages;
CREATE POLICY "Admins can manage packages" ON public.packages 
FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.transfer_routes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public transfer routes visibility" ON public.transfer_routes;
CREATE POLICY "Admins can manage transfer routes" ON public.transfer_routes 
FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 2. Secure customers table
DROP POLICY IF EXISTS "Allow anon read customer by id" ON public.customers;

-- 3. Secure bookings table
DROP POLICY IF EXISTS "Allow anon read booking by id" ON public.bookings;
DROP POLICY IF EXISTS "Allow anon update booking status" ON public.bookings;

-- 4. Secure sgs_risk_terms and sgs_risk_term_minors
DROP POLICY IF EXISTS "Allow anon select risk terms" ON public.sgs_risk_terms;
DROP POLICY IF EXISTS "Allow anon insert risk terms" ON public.sgs_risk_terms;
DROP POLICY IF EXISTS "Allow anon update risk terms" ON public.sgs_risk_terms;
DROP POLICY IF EXISTS "Allow anon manage risk term minors" ON public.sgs_risk_term_minors;

-- 5. Secure sgs_empresa
DROP POLICY IF EXISTS "Allow anon read sgs_empresa" ON public.sgs_empresa;
DROP POLICY IF EXISTS "Public read sgs_empresa" ON public.sgs_empresa;
CREATE POLICY "Public can view company name and logo" ON public.sgs_empresa
FOR SELECT USING (true); -- We will restrict columns via a view if needed, but for now we'll rely on code not fetching sensitive fields or use a view.

-- 6. Storage Security
-- The tool doesn't support changing bucket privacy directly in SQL easily if it's managed, 
-- but we can update the storage.buckets table.
UPDATE storage.buckets SET public = false WHERE id = 'customer-documents';

-- Remove public access policy for storage
DROP POLICY IF EXISTS "Public Access for customer-documents" ON storage.objects;

-- 7. Create secure RPC functions for public access
-- These functions use SECURITY DEFINER to bypass RLS but return strictly filtered data.

-- Secure Booking Lookup (for Voucher Page)
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
    customer_name text
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id, b.booking_code, b.item_name, b.date, b.guests, b.status, b.payment_status, b.type,
        c.name as customer_name
    FROM bookings b
    JOIN customers c ON b.customer_id = c.id
    WHERE b.id = p_booking_id;
END;
$$;

-- Secure Term Lookup (for Term Signature Page)
CREATE OR REPLACE FUNCTION public.get_public_term_v2(p_term_id uuid)
RETURNS TABLE (
    id uuid,
    customer_id uuid,
    customer_name text,
    tour_name text,
    term_date date,
    accepted boolean,
    booking_id uuid
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id, t.customer_id, t.customer_name, t.tour_name, t.term_date, t.accepted, t.booking_id
    FROM sgs_risk_terms t
    WHERE t.id = p_term_id;
END;
$$;
