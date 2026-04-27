-- Add missing columns to sgs_risk_terms
ALTER TABLE public.sgs_risk_terms 
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id),
ADD COLUMN IF NOT EXISTS tour_id UUID REFERENCES public.tours(id),
ADD COLUMN IF NOT EXISTS vehicle_id UUID REFERENCES public.sgs_veiculos(id),
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.sgs_empresa(id),
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS cpf TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city_state TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
ADD COLUMN IF NOT EXISTS has_allergy BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS allergy_details TEXT,
ADD COLUMN IF NOT EXISTS has_fainting_convulsions BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS recent_surgery BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_diabetes BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_obese BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_sedentary BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_immobilized_part BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_special_needs BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_phobia BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS phobia_details TEXT,
ADD COLUMN IF NOT EXISTS under_influence BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS takes_medication BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS medication_details TEXT,
ADD COLUMN IF NOT EXISTS term_date DATE DEFAULT CURRENT_DATE;

-- Create sgs_risk_term_minors if it doesn't exist
CREATE TABLE IF NOT EXISTS public.sgs_risk_term_minors (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    risk_term_id UUID REFERENCES public.sgs_risk_terms(id) ON DELETE CASCADE NOT NULL,
    full_name TEXT NOT NULL,
    cpf TEXT,
    birth_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for the new table
ALTER TABLE public.sgs_risk_term_minors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage sgs_risk_term_minors" ON public.sgs_risk_term_minors FOR ALL TO authenticated USING (true);
