-- Create function to update updated_at if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create table for partner types
CREATE TABLE IF NOT EXISTS public.partner_types (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    icon TEXT DEFAULT 'Building2',
    color TEXT DEFAULT 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.partner_types ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Partner types are viewable by everyone" 
ON public.partner_types 
FOR SELECT 
USING (true);

CREATE POLICY "Partner types are manageable by authenticated users" 
ON public.partner_types 
FOR ALL 
USING (auth.role() = 'authenticated');

-- Insert default types
INSERT INTO public.partner_types (name, label, icon, color) 
VALUES
('hotel', 'Hotel / Pousada', 'Building2', 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'),
('guia', 'Guia Turístico', 'Compass', 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'),
('motorista', 'Motorista', 'Car', 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'),
('agencia', 'Agência', 'Users', 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300')
ON CONFLICT (name) DO NOTHING;

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS update_partner_types_updated_at ON public.partner_types;
CREATE TRIGGER update_partner_types_updated_at
BEFORE UPDATE ON public.partner_types
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
