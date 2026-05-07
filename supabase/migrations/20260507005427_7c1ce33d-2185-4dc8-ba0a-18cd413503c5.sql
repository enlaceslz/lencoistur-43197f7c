-- Add new columns to partners table for better management
ALTER TABLE public.partners 
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS bank_agency TEXT,
ADD COLUMN IF NOT EXISTS bank_account TEXT,
ADD COLUMN IF NOT EXISTS bank_pix_key TEXT,
ADD COLUMN IF NOT EXISTS credit_limit DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Add index for tags search
CREATE INDEX IF NOT EXISTS idx_partners_tags ON public.partners USING GIN(tags);