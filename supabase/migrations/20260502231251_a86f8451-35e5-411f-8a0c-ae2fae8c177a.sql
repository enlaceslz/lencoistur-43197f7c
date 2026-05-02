-- 1. Garantir que as tabelas de referência tenham IDs únicos e não nulos
-- 2. Estabelecer chaves estrangeiras para Reservas
ALTER TABLE public.bookings 
ADD CONSTRAINT fk_bookings_customer 
FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;

-- 3. Vincular Financeiro (Contas a Receber) às Reservas
ALTER TABLE public.contas_receber 
ADD CONSTRAINT fk_contas_receber_booking 
FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;

-- 4. Vincular Incidentes de Segurança às Reservas (para rastreabilidade)
ALTER TABLE public.sgs_incidents 
ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL;

-- 5. Vincular Gestão de Usuários ao Auth do Supabase
ALTER TABLE public.user_management 
ADD CONSTRAINT fk_user_management_auth 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 6. Adicionar índices para performance de busca nos relacionamentos
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON public.bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_contas_receber_booking_id ON public.contas_receber(booking_id);
CREATE INDEX IF NOT EXISTS idx_user_management_user_id ON public.user_management(user_id);
