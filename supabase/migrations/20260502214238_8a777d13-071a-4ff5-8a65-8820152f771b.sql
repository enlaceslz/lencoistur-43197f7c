-- Add new columns to collaborators
ALTER TABLE public.collaborators 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'Outro',
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS zip_code TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS cnh TEXT,
ADD COLUMN IF NOT EXISTS cadastur TEXT;

-- Update existing data to have a default type if needed
UPDATE public.collaborators SET type = 'Outro' WHERE type IS NULL;

-- Make document (CPF) required and unique if not already
-- First check for any null documents and set a placeholder or handle them
UPDATE public.collaborators SET document = 'PENDENTE-' || id::text WHERE document IS NULL;

ALTER TABLE public.collaborators ALTER COLUMN document SET NOT NULL;
ALTER TABLE public.collaborators ADD CONSTRAINT collaborators_document_unique UNIQUE (document);

-- Add constraint for collaborator types
ALTER TABLE public.collaborators ADD CONSTRAINT collaborators_type_check 
CHECK (type IN ('Guia', 'Motorista', 'Vendedor', 'Freelancer', 'Outro'));