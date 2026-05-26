ALTER TABLE public.bookings ADD COLUMN cpf TEXT;
COMMENT ON COLUMN public.bookings.cpf IS 'CPF do cliente no momento da reserva para histórico e sincronização';