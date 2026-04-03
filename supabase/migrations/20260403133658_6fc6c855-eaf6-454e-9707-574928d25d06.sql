
-- ============================================
-- SGS - Sistema de Gestão de Segurança
-- ============================================

-- 1. Matriz de Risco Operacional
CREATE TABLE public.sgs_risks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  risk_code TEXT NOT NULL UNIQUE,
  tour_id UUID REFERENCES public.tours(id),
  stage TEXT NOT NULL CHECK (stage IN ('venda_recepcao', 'trajeto_ida', 'passeio_dunas', 'retorno', 'pos_passeio')),
  activity TEXT NOT NULL,
  hazard TEXT NOT NULL,
  probability INTEGER NOT NULL CHECK (probability BETWEEN 1 AND 5),
  impact INTEGER NOT NULL CHECK (impact BETWEEN 1 AND 5),
  risk_level INTEGER GENERATED ALWAYS AS (probability * impact) STORED,
  control_measures TEXT,
  treatment_measures TEXT,
  responsible TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'monitorando', 'tratando', 'resolvido')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Ações Corretivas
CREATE TABLE public.sgs_corrective_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action_code TEXT NOT NULL UNIQUE,
  risk_id UUID REFERENCES public.sgs_risks(id) ON DELETE SET NULL,
  incident_id UUID,
  description TEXT NOT NULL,
  responsible TEXT NOT NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  completed_date DATE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluida', 'atrasada', 'cancelada')),
  evidence TEXT,
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Registro de Incidentes
CREATE TABLE public.sgs_incidents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  incident_code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('incidente', 'quase_incidente', 'acidente')),
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  tour_id UUID REFERENCES public.tours(id),
  location TEXT NOT NULL,
  guide_name TEXT,
  description TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('baixa', 'media', 'alta', 'critica')),
  people_involved TEXT,
  action_taken TEXT,
  photos TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto', 'investigando', 'resolvido', 'fechado')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add FK from corrective_actions to incidents
ALTER TABLE public.sgs_corrective_actions 
  ADD CONSTRAINT fk_incident FOREIGN KEY (incident_id) REFERENCES public.sgs_incidents(id) ON DELETE SET NULL;

-- 4. Termos de Ciência de Risco
CREATE TABLE public.sgs_risk_terms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  nationality TEXT,
  phone TEXT,
  tour_name TEXT NOT NULL,
  risks_informed TEXT[] NOT NULL DEFAULT '{}',
  cancellation_policy TEXT,
  accepted BOOLEAN NOT NULL DEFAULT false,
  signature_data TEXT,
  signed_at TIMESTAMP WITH TIME ZONE,
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Briefings de Segurança
CREATE TABLE public.sgs_briefings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tour_id UUID REFERENCES public.tours(id),
  booking_id UUID REFERENCES public.bookings(id),
  guide_name TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  safety_rules BOOLEAN NOT NULL DEFAULT false,
  tour_risks BOOLEAN NOT NULL DEFAULT false,
  lagoon_behavior BOOLEAN NOT NULL DEFAULT false,
  group_distance BOOLEAN NOT NULL DEFAULT false,
  emergency_orientation BOOLEAN NOT NULL DEFAULT false,
  language TEXT NOT NULL DEFAULT 'pt' CHECK (language IN ('pt', 'en', 'es')),
  notes TEXT,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Equipe (guias, motoristas, apoio)
CREATE TABLE public.sgs_staff (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('guia', 'motorista', 'apoio')),
  phone TEXT,
  email TEXT,
  document TEXT,
  certifications TEXT[] DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT true,
  blocked BOOLEAN NOT NULL DEFAULT false,
  block_reason TEXT,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. Treinamentos da Equipe
CREATE TABLE public.sgs_staff_trainings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID REFERENCES public.sgs_staff(id) ON DELETE CASCADE NOT NULL,
  training_name TEXT NOT NULL,
  training_type TEXT NOT NULL CHECK (training_type IN ('primeiros_socorros', 'resgate_lagoa', 'conducao_offroad', 'atendimento_turista', 'outro')),
  completed_date DATE NOT NULL,
  expiry_date DATE,
  certificate_url TEXT,
  status TEXT NOT NULL DEFAULT 'valido' CHECK (status IN ('valido', 'vencendo', 'vencido')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 8. Auditorias
CREATE TABLE public.sgs_audits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_code TEXT NOT NULL UNIQUE,
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  auditor TEXT NOT NULL,
  score NUMERIC(5,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'em_andamento' CHECK (status IN ('em_andamento', 'concluida', 'cancelada')),
  observations TEXT,
  improvement_plan TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 9. Itens de Auditoria
CREATE TABLE public.sgs_audit_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_id UUID REFERENCES public.sgs_audits(id) ON DELETE CASCADE NOT NULL,
  item_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('veiculo', 'epi', 'resgate', 'documentacao', 'briefing', 'termo_risco', 'outro')),
  compliant BOOLEAN NOT NULL DEFAULT false,
  observation TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 10. Conformidade de Fornecedores
CREATE TABLE public.sgs_supplier_compliance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE,
  supplier_name TEXT NOT NULL,
  supplier_type TEXT NOT NULL CHECK (supplier_type IN ('veiculo', 'condutor', 'parceiro')),
  documentation_ok BOOLEAN NOT NULL DEFAULT false,
  vehicle_inspection_ok BOOLEAN DEFAULT false,
  vehicle_inspection_date DATE,
  certifications TEXT[] DEFAULT '{}',
  certification_expiry DATE,
  status TEXT NOT NULL DEFAULT 'regular' CHECK (status IN ('regular', 'irregular', 'bloqueado', 'vencido')),
  blocked BOOLEAN NOT NULL DEFAULT false,
  block_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 11. Pesquisa de Segurança do Cliente
CREATE TABLE public.sgs_safety_surveys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  felt_safe INTEGER CHECK (felt_safe BETWEEN 1 AND 5),
  guide_explained_risks BOOLEAN,
  danger_situations BOOLEAN,
  danger_description TEXT,
  overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5),
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.sgs_risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sgs_corrective_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sgs_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sgs_risk_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sgs_briefings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sgs_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sgs_staff_trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sgs_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sgs_audit_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sgs_supplier_compliance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sgs_safety_surveys ENABLE ROW LEVEL SECURITY;

-- Public access policies (will be restricted when auth is added)
CREATE POLICY "Public access sgs_risks" ON public.sgs_risks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access sgs_corrective_actions" ON public.sgs_corrective_actions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access sgs_incidents" ON public.sgs_incidents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access sgs_risk_terms" ON public.sgs_risk_terms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access sgs_briefings" ON public.sgs_briefings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access sgs_staff" ON public.sgs_staff FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access sgs_staff_trainings" ON public.sgs_staff_trainings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access sgs_audits" ON public.sgs_audits FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access sgs_audit_items" ON public.sgs_audit_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access sgs_supplier_compliance" ON public.sgs_supplier_compliance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access sgs_safety_surveys" ON public.sgs_safety_surveys FOR ALL USING (true) WITH CHECK (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.sgs_risks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sgs_incidents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sgs_corrective_actions;
