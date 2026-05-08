ALTER TABLE public.bookings 
ADD COLUMN public_total INTEGER,
ADD COLUMN public_unit_price INTEGER;

COMMENT ON COLUMN public.bookings.public_total IS 'Valor total exibido ao cliente (preço de venda/site)';
COMMENT ON COLUMN public.bookings.public_unit_price IS 'Preço unitário exibido ao cliente';