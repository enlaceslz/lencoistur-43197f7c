-- 1. Melhorar Contas a Pagar
ALTER TABLE public.contas_pagar 
ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS collaborator_id UUID REFERENCES public.collaborators(id) ON DELETE SET NULL;

-- 2. Melhorar Reviews (Avaliações Verificadas)
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL;

-- 3. Unificar Staff SGS com Colaboradores
ALTER TABLE public.sgs_staff 
ADD COLUMN IF NOT EXISTS collaborator_id UUID REFERENCES public.collaborators(id) ON DELETE SET NULL;

-- 4. Índices para performance
CREATE INDEX IF NOT EXISTS idx_contas_pagar_booking ON public.contas_pagar(booking_id);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_collaborator ON public.contas_pagar(collaborator_id);
CREATE INDEX IF NOT EXISTS idx_reviews_booking ON public.reviews(booking_id);
CREATE INDEX IF NOT EXISTS idx_sgs_staff_collaborator ON public.sgs_staff(collaborator_id);
