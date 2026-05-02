-- 1. Vincular Parceiros às Reservas (para comissionamento de vendas externas)
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES public.partners(id) ON DELETE SET NULL;

-- 2. Vincular Contas a Pagar aos Parceiros (pagamento de fornecedores/comissões)
ALTER TABLE public.contas_pagar 
ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES public.partners(id) ON DELETE SET NULL;

-- 3. Vincular Parceiros aos Passeios (operadores padrão)
ALTER TABLE public.tours 
ADD COLUMN IF NOT EXISTS main_operator_id UUID REFERENCES public.partners(id) ON DELETE SET NULL;

-- 4. Vincular Parceiros aos Translados (fretistas preferenciais)
ALTER TABLE public.transfer_routes 
ADD COLUMN IF NOT EXISTS preferred_partner_id UUID REFERENCES public.partners(id) ON DELETE SET NULL;

-- 5. Índices de performance para os novos relacionamentos
CREATE INDEX IF NOT EXISTS idx_bookings_partner ON public.bookings(partner_id);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_partner ON public.contas_pagar(partner_id);
CREATE INDEX IF NOT EXISTS idx_tours_operator ON public.tours(main_operator_id);
CREATE INDEX IF NOT EXISTS idx_transfers_partner ON public.transfer_routes(preferred_partner_id);
