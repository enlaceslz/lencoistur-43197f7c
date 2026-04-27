ALTER TABLE public.sgs_risk_term_minors 
ADD COLUMN IF NOT EXISTS is_adult BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS responsible_name TEXT,
ADD COLUMN IF NOT EXISTS signature_data TEXT,
ADD COLUMN IF NOT EXISTS signed_at TIMESTAMP WITH TIME ZONE;

-- Also add a column to sgs_risk_terms to store if there are multiple signers
ALTER TABLE public.sgs_risk_terms
ADD COLUMN IF NOT EXISTS has_multiple_signers BOOLEAN DEFAULT FALSE;
