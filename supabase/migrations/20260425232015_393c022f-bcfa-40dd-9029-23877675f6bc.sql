ALTER TABLE public.customers 
ADD COLUMN birth_date DATE,
ADD COLUMN notes TEXT,
ADD COLUMN status TEXT DEFAULT 'regular';

COMMENT ON COLUMN public.customers.status IS 'Status of the customer: regular, vip, blocked';
