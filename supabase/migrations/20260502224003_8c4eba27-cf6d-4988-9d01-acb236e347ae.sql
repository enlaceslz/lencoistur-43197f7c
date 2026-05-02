-- Create table for collaborator types if it doesn't exist
CREATE TABLE IF NOT EXISTS public.collaborator_types (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    color TEXT DEFAULT '#3b82f6',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on collaborator_types
ALTER TABLE public.collaborator_types ENABLE ROW LEVEL SECURITY;

-- Policies for collaborator_types
CREATE POLICY "Collaborator types are viewable by everyone" 
ON public.collaborator_types FOR SELECT USING (true);

CREATE POLICY "Admins can manage collaborator types" 
ON public.collaborator_types FOR ALL USING (true); -- Simplified for admin context, adjust if needed

-- Insert default types for the region
INSERT INTO public.collaborator_types (name, description, color)
VALUES 
('Guia Credenciado', 'Profissional com CADASTUR para condução de grupos', '#10b981'),
('Motorista 4x4', 'Condutor especializado em trilhas de areia e Toyotas', '#f59e0b'),
('Marinheiro / Condutor de Lancha', 'Piloto para passeios no Rio Preguiças', '#0ea5e9'),
('Agenciador / Freelancer', 'Parceiro comercial para captação de clientes', '#8b5cf6')
ON CONFLICT (name) DO NOTHING;

-- Create table for collaborator payments (financial integration)
CREATE TABLE IF NOT EXISTS public.collaborator_payments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    collaborator_id UUID REFERENCES public.collaborators(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
    due_date DATE NOT NULL DEFAULT CURRENT_DATE,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on collaborator_payments
ALTER TABLE public.collaborator_payments ENABLE ROW LEVEL SECURITY;

-- Policies for collaborator_payments
CREATE POLICY "Collaborator payments are viewable by everyone" 
ON public.collaborator_payments FOR SELECT USING (true);

CREATE POLICY "Admins can manage collaborator payments" 
ON public.collaborator_payments FOR ALL USING (true);
