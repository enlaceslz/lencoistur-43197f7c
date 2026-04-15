
-- 1. SGS Empresa (UC operator company data)
CREATE TABLE public.sgs_empresa (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT,
  cnpj TEXT,
  cadastur TEXT,
  responsavel_nome TEXT,
  responsavel_cargo TEXT,
  responsavel_tecnico TEXT,
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  cidade TEXT,
  estado TEXT DEFAULT 'MA',
  uc_nome TEXT,
  uc_tipo TEXT,
  icmbio_autorizacao TEXT,
  icmbio_validade DATE,
  logo_url TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sgs_empresa ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins full access sgs_empresa" ON public.sgs_empresa FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2. SGS Veículos (fleet management)
CREATE TABLE public.sgs_veiculos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  marca TEXT NOT NULL,
  modelo TEXT NOT NULL,
  ano INTEGER,
  placa TEXT NOT NULL,
  renavam TEXT,
  chassi TEXT,
  cor TEXT,
  capacidade INTEGER DEFAULT 4,
  tipo TEXT NOT NULL DEFAULT '4x4',
  combustivel TEXT DEFAULT 'diesel',
  quilometragem INTEGER DEFAULT 0,
  seguradora TEXT,
  seguro_validade DATE,
  licenciamento_validade DATE,
  status TEXT NOT NULL DEFAULT 'ativo',
  observacoes TEXT,
  foto_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sgs_veiculos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins full access sgs_veiculos" ON public.sgs_veiculos FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3. SGS Condutores (own drivers)
CREATE TABLE public.sgs_condutores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cpf TEXT,
  cnh_numero TEXT,
  cnh_categoria TEXT DEFAULT 'B',
  cnh_validade DATE,
  telefone TEXT,
  email TEXT,
  treinamentos TEXT[] DEFAULT '{}'::TEXT[],
  primeiros_socorros BOOLEAN DEFAULT false,
  off_road BOOLEAN DEFAULT false,
  assinatura_url TEXT,
  foto_url TEXT,
  status TEXT NOT NULL DEFAULT 'ativo',
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sgs_condutores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins full access sgs_condutores" ON public.sgs_condutores FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 4. SGS Condutores Visitantes (external visitor drivers)
CREATE TABLE public.sgs_condutores_visitantes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cpf TEXT,
  cnh_numero TEXT,
  cnh_categoria TEXT,
  cnh_validade DATE,
  empresa_instituicao TEXT,
  veiculo_descricao TEXT,
  veiculo_placa TEXT,
  motivo TEXT,
  destino_uc TEXT,
  data_entrada DATE NOT NULL DEFAULT CURRENT_DATE,
  data_saida DATE,
  status TEXT NOT NULL DEFAULT 'pendente',
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sgs_condutores_visitantes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins full access sgs_condutores_visitantes" ON public.sgs_condutores_visitantes FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 5. SGS Checklists
CREATE TABLE public.sgs_checklists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'diario',
  veiculo_id UUID REFERENCES public.sgs_veiculos(id) ON DELETE SET NULL,
  condutor_id UUID REFERENCES public.sgs_condutores(id) ON DELETE SET NULL,
  responsavel TEXT,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'em_andamento',
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sgs_checklists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins full access sgs_checklists" ON public.sgs_checklists FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 6. SGS Checklist Items
CREATE TABLE public.sgs_checklist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  checklist_id UUID NOT NULL REFERENCES public.sgs_checklists(id) ON DELETE CASCADE,
  item_nome TEXT NOT NULL,
  categoria TEXT NOT NULL DEFAULT 'geral',
  conforme BOOLEAN DEFAULT false,
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sgs_checklist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins full access sgs_checklist_items" ON public.sgs_checklist_items FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 7. SGS Rotas (routes/trails)
CREATE TABLE public.sgs_rotas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'trilha',
  descricao TEXT,
  distancia_km NUMERIC,
  duracao_estimada TEXT,
  dificuldade TEXT DEFAULT 'moderado',
  pontos_interesse TEXT[] DEFAULT '{}'::TEXT[],
  riscos_conhecidos TEXT[] DEFAULT '{}'::TEXT[],
  capacidade_maxima INTEGER,
  status TEXT NOT NULL DEFAULT 'ativa',
  mapa_url TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sgs_rotas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins full access sgs_rotas" ON public.sgs_rotas FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 8. SGS PGSAT (document generation records)
CREATE TABLE public.sgs_pgsat (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL DEFAULT 'PGSAT',
  versao TEXT NOT NULL DEFAULT '1.0',
  status TEXT NOT NULL DEFAULT 'rascunho',
  data_emissao DATE DEFAULT CURRENT_DATE,
  data_validade DATE,
  responsavel TEXT,
  conteudo_json JSONB DEFAULT '{}'::JSONB,
  pdf_url TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sgs_pgsat ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins full access sgs_pgsat" ON public.sgs_pgsat FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
