-- Create collaborators table
CREATE TABLE public.collaborators (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    document TEXT, -- CPF/CNPJ
    pix_key TEXT,
    pix_type TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    payment_type TEXT NOT NULL CHECK (payment_type IN ('commission', 'daily', 'monthly', 'per_tour')),
    payment_value DECIMAL(10,2) NOT NULL DEFAULT 0,
    observation TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create collaborator_payments table for history and finance integration
CREATE TABLE public.collaborator_payments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    collaborator_id UUID REFERENCES public.collaborators(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
    due_date DATE NOT NULL,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaborator_payments ENABLE ROW LEVEL SECURITY;

-- Admin policies
CREATE POLICY "Admins have full access to collaborators" ON public.collaborators FOR ALL USING (true);
CREATE POLICY "Admins have full access to collaborator payments" ON public.collaborator_payments FOR ALL USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_collaborators_updated_at
BEFORE UPDATE ON public.collaborators
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
