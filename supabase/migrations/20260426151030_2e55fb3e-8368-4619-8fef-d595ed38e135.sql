ALTER TABLE public.sgs_risk_terms 
ADD COLUMN health_questions TEXT[],
ADD COLUMN safety_controls_informed BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN public.sgs_risk_terms.health_questions IS 'Lista de condições de saúde declaradas pelo cliente no momento da assinatura.';
COMMENT ON COLUMN public.sgs_risk_terms.safety_controls_informed IS 'Confirmação de que o cliente recebeu e compreendeu as orientações de segurança.';