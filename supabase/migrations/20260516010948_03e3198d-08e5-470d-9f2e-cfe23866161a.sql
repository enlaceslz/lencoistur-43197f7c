-- Add signed_at_counter column to sgs_risk_terms
ALTER TABLE public.sgs_risk_terms 
ADD COLUMN IF NOT EXISTS signed_at_counter BOOLEAN DEFAULT false;

-- Update the view or just the table structure is enough.
COMMENT ON COLUMN public.sgs_risk_terms.signed_at_counter IS 'Indicates if the risk term was signed physically at the counter.';
