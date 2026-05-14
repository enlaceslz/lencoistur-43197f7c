ALTER TABLE public.bookings ADD COLUMN partner_net_price NUMERIC;
COMMENT ON COLUMN public.bookings.partner_net_price IS 'Valor NET do parceiro para este passeio';