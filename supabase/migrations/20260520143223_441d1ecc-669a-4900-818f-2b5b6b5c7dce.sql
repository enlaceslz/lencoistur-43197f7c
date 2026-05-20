-- Adicionar campos de inteligência à tabela de leads
ALTER TABLE public.marketing_leads 
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS engagement_history JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS conversion_date TIMESTAMP WITH TIME ZONE;

-- Criar índice para melhorar performance de consultas por data de conversão
CREATE INDEX IF NOT EXISTS idx_marketing_leads_conversion_date ON public.marketing_leads(conversion_date);