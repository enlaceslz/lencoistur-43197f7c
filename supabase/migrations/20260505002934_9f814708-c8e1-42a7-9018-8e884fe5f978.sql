-- Melhorias na Matriz de Riscos
ALTER TABLE public.sgs_risks 
ADD COLUMN IF NOT EXISTS residual_probability INTEGER,
ADD COLUMN IF NOT EXISTS residual_impact INTEGER,
ADD COLUMN IF NOT EXISTS residual_risk_level INTEGER;

-- Melhorias no Registro de Incidentes
ALTER TABLE public.sgs_incidents
ADD COLUMN IF NOT EXISTS lessons_learned TEXT,
ADD COLUMN IF NOT EXISTS pre_activated BOOLEAN DEFAULT false;

-- Melhorias no Cadastro de Condutores
ALTER TABLE public.sgs_condutores
ADD COLUMN IF NOT EXISTS first_aid_expiry DATE,
ADD COLUMN IF NOT EXISTS training_history JSONB DEFAULT '[]'::jsonb;
