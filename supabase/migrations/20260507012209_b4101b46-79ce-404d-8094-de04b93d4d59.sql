-- Create a table for linking packages with transfers
CREATE TABLE IF NOT EXISTS public.package_transfers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
    transfer_route_id UUID NOT NULL REFERENCES public.transfer_routes(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.package_transfers ENABLE ROW LEVEL SECURITY;

-- Policies for package_transfers
CREATE POLICY "Public package_transfers are viewable by everyone" ON public.package_transfers FOR SELECT USING (true);
CREATE POLICY "Admin package_transfers are manageable by authenticated users" ON public.package_transfers FOR ALL USING (auth.role() = 'authenticated');

-- Add banner_url to packages
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS banner_url TEXT;