-- Insert default company if not exists
INSERT INTO public.sgs_empresa (
  nome_fantasia, 
  razao_social, 
  cnpj, 
  cadastur, 
  email, 
  telefone, 
  endereco,
  cidade,
  estado
)
SELECT 
  'Lençóis Tour', 
  'Lençóis Tour Turismo e Viagens Ltda', 
  '45.678.901/0001-23', 
  '12.345678.10.0001-9', 
  'contato@lencoistur.com.br', 
  '(98) 98588-0954', 
  'Rua da Areia, 123 - Centro', 
  'Santo Amaro do Maranhão', 
  'MA'
WHERE NOT EXISTS (SELECT 1 FROM public.sgs_empresa);
