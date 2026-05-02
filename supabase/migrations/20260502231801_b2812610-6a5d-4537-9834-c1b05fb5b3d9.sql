-- 1. Marketing: Rastreio de Conversão
ALTER TABLE public.marketing_leads 
ADD COLUMN IF NOT EXISTS converted_customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL;

-- 2. Marketing: Atribuição de Reservas a Campanhas
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS marketing_campaign_id UUID REFERENCES public.marketing_campaigns(id) ON DELETE SET NULL;

-- 3. SGS: Chaves Estrangeiras para Checklists
ALTER TABLE public.sgs_checklists 
ADD CONSTRAINT fk_sgs_checklists_veiculo 
FOREIGN KEY (veiculo_id) REFERENCES public.sgs_veiculos(id) ON DELETE SET NULL;

ALTER TABLE public.sgs_checklists 
ADD CONSTRAINT fk_sgs_checklists_condutor 
FOREIGN KEY (condutor_id) REFERENCES public.sgs_condutores(id) ON DELETE SET NULL;

ALTER TABLE public.sgs_checklists 
ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL;

-- 4. SGS: Auditorias
ALTER TABLE public.sgs_audits 
ADD COLUMN IF NOT EXISTS auditor_id UUID REFERENCES public.collaborators(id) ON DELETE SET NULL;

-- 5. Índices de Performance
CREATE INDEX IF NOT EXISTS idx_leads_converted ON public.marketing_leads(converted_customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_campaign ON public.bookings(marketing_campaign_id);
CREATE INDEX IF NOT EXISTS idx_sgs_checklists_booking ON public.sgs_checklists(booking_id);
CREATE INDEX IF NOT EXISTS idx_sgs_audits_auditor ON public.sgs_audits(auditor_id);
