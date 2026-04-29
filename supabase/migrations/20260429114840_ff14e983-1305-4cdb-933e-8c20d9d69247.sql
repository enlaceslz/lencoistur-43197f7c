ALTER TABLE public.sgs_empresa 
ADD COLUMN IF NOT EXISTS term_recommendations TEXT,
ADD COLUMN IF NOT EXISTS term_safety_risks TEXT;

-- Update with default values if they are null
UPDATE public.sgs_empresa 
SET term_recommendations = 'A atividade não requer nenhuma habilidade específica, mas recomenda-se:\nsaber nadar (teremos paradas para banhos nas lagoas);\nvestir-se com traje de banho, roupas e calçados confortáveis;\nlevar uma toalha (ou canga), um casaco corta-vento, chapéu ou boné, óculos de sol, REPELENTE e PROTETOR SOLAR;\nnão usar acessórios (brincos, relógios, pulseiras, anéis, colares) para evitar perdas ou danos;\nlevar água e algum lanche leve para consumir durante o percurso.'
WHERE term_recommendations IS NULL;

UPDATE public.sgs_empresa 
SET term_safety_risks = 'Os riscos inerentes ao passeio off-road na Rota das Emoções incluem: insolação, variações térmicas (hipotermia), picadas de insetos, mudanças climáticas bruscas, perda de objetos, incidentes veiculares (capotamento/colisão) e riscos aquáticos.\n\nNossas Medidas de Segurança:\n- Condutores com certificação e treinamento contínuo;\n- Equipamentos de resgate e comunicação em todas as viaturas;\n- Equipe preparada para Primeiros Socorros e Resgate;\n- Plano de Resposta a Emergências (PRE) rigorosamente seguido.\n\nA atividade poderá ser interrompida a qualquer momento por decisão técnica em caso de condições climáticas adversas ou riscos à integridade do grupo.'
WHERE term_safety_risks IS NULL;