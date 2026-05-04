-- Add tags to customers
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Create customer_interactions table
CREATE TABLE IF NOT EXISTS public.customer_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'note', 'call', 'email', 'meeting'
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.customer_interactions ENABLE ROW LEVEL SECURITY;

-- Create policies (assuming admin access for now as it's a CRM)
CREATE POLICY "Admins can do everything on customer_interactions"
ON public.customer_interactions
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
