-- Update bookings table constraints
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_pay_method_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_pay_method_check CHECK (pay_method = ANY (ARRAY['pix'::text, 'card'::text, 'info'::text, 'dinheiro'::text, 'transferencia'::text, 'cartao'::text]));

ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_type_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_type_check CHECK (type = ANY (ARRAY['tour'::text, 'transfer'::text, 'passeio'::text, 'translado'::text]));
