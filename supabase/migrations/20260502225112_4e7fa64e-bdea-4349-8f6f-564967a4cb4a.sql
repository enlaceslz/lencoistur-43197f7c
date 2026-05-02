-- Create a table for user management
CREATE TABLE IF NOT EXISTS public.user_management (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    full_name TEXT,
    email TEXT,
    role TEXT NOT NULL DEFAULT 'operador', -- administrador, gerente, operador, financeiro
    status TEXT NOT NULL DEFAULT 'ativo', -- ativo, inativo
    permissions JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_management ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can do everything on user_management" 
ON public.user_management 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

CREATE POLICY "Users can view their own management entry" 
ON public.user_management 
FOR SELECT 
USING (user_id = auth.uid());

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_user_management_updated_at ON public.user_management;
CREATE TRIGGER tr_user_management_updated_at
BEFORE UPDATE ON public.user_management
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
