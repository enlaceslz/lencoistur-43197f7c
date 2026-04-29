-- Adiciona os novos campos para controle de remuneração de parceiros
ALTER TABLE public.partners 
ADD COLUMN IF NOT EXISTS remuneration_type TEXT DEFAULT 'comissao_percent',
ADD COLUMN IF NOT EXISTS remuneration_value NUMERIC DEFAULT 0;

-- Adiciona comentário para documentação
COMMENT ON COLUMN public.partners.remuneration_type IS 'Tipo de remuneração: comissao_percent, valor_por_passeio ou valor_mensal';
COMMENT ON COLUMN public.partners.remuneration_value IS 'Valor numérico da remuneração (percentual ou valor monetário)';
