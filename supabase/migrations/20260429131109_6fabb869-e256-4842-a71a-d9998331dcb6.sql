-- Create customer_documents table
CREATE TABLE IF NOT EXISTS public.customer_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    category TEXT DEFAULT 'outros', -- 'recibo', 'termo', 'documento', 'outros'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.customer_documents ENABLE ROW LEVEL SECURITY;

-- Policies for customer_documents
CREATE POLICY "Admins can manage customer documents"
ON public.customer_documents
FOR ALL
USING (true)
WITH CHECK (true);

-- Create storage bucket for customer documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('customer-documents', 'customer-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Admins can upload customer documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'customer-documents');

CREATE POLICY "Admins can view customer documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'customer-documents');

CREATE POLICY "Admins can delete customer documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'customer-documents');

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_customer_documents
    BEFORE UPDATE ON public.customer_documents
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();