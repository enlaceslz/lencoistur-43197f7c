ALTER TABLE public.contas_receber 
ADD COLUMN partner_id UUID REFERENCES public.partners(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.contas_receber.partner_id IS 'Link to the partner associated with this receivable.';