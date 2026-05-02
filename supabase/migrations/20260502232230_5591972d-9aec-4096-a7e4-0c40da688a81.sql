-- 1. IA Gateway: Configurações de Contexto
ALTER TABLE public.ai_settings 
ADD COLUMN IF NOT EXISTS context_window INTEGER DEFAULT 10;

-- 2. Auditoria de Configurações do Site
ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3. SEO Avançado para Passeios
ALTER TABLE public.tours 
ADD COLUMN IF NOT EXISTS meta_title TEXT,
ADD COLUMN IF NOT EXISTS meta_description TEXT;

-- 4. Auditoria de Segurança (Compliance ISO)
ALTER TABLE public.sgs_risks ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE public.sgs_incidents ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE public.sgs_checklists ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- 5. Índices de Auditoria
CREATE INDEX IF NOT EXISTS idx_sgs_risks_creator ON public.sgs_risks(created_by);
CREATE INDEX IF NOT EXISTS idx_sgs_incidents_creator ON public.sgs_incidents(created_by);
CREATE INDEX IF NOT EXISTS idx_sgs_checklists_creator ON public.sgs_checklists(created_by);
