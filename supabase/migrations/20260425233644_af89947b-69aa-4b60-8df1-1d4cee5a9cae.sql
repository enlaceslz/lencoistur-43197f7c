-- Create dependents table
CREATE TABLE public.dependents (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    cpf TEXT,
    birth_date DATE,
    relationship TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dependents ENABLE ROW LEVEL SECURITY;

-- Create policies for admins
CREATE POLICY "Admins can do everything on dependents" 
ON public.dependents 
FOR ALL 
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_dependents_updated_at
BEFORE UPDATE ON public.dependents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();