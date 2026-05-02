-- Create collaborator types table
CREATE TABLE IF NOT EXISTS public.collaborator_types (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    color TEXT DEFAULT '#3b82f6',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.collaborator_types ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin can do everything on collaborator_types" 
ON public.collaborator_types 
FOR ALL 
USING (true);

-- Insert default types
INSERT INTO public.collaborator_types (name, description, color)
VALUES 
('Guia', 'Profissional que acompanha os turistas', '#10b981'),
('Motorista', 'Responsável pelo transporte', '#f59e0b'),
('Vendedor', 'Responsável pelas vendas e reservas', '#3b82f6'),
('Freelancer', 'Colaborador eventual', '#8b5cf6'),
('Outro', 'Outros tipos de prestadores', '#64748b')
ON CONFLICT (name) DO NOTHING;