-- Table for safety and rescue equipment (P5)
CREATE TABLE public.sgs_equipment (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- 'resgate', 'primeiros_socorros', 'comunicacao', 'veiculo', 'outro'
    status TEXT NOT NULL DEFAULT 'operacional', -- 'operacional', 'manutencao', 'descartado'
    last_inspection DATE,
    next_inspection DATE,
    responsible TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for Standard Operating Procedures (POPs) (P5)
CREATE TABLE public.sgs_procedures (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL, -- 'seguranca', 'emergencia', 'operacional', 'atendimento'
    description TEXT,
    file_url TEXT,
    version TEXT DEFAULT '1.0',
    status TEXT DEFAULT 'vigente', -- 'vigente', 'obsoleto', 'rascunho'
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sgs_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sgs_procedures ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admin full access to sgs_equipment" ON public.sgs_equipment FOR ALL USING (true);
CREATE POLICY "Admin full access to sgs_procedures" ON public.sgs_procedures FOR ALL USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_sgs_equipment_updated_at BEFORE UPDATE ON public.sgs_equipment FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sgs_procedures_updated_at BEFORE UPDATE ON public.sgs_procedures FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
