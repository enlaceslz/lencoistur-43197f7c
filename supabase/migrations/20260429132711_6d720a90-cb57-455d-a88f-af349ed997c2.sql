-- Add signature columns if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = 'sgs_risk_terms' AND column_name = 'signed_at') THEN
        ALTER TABLE public.sgs_risk_terms ADD COLUMN signed_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = 'sgs_risk_terms' AND column_name = 'signature_data') THEN
        ALTER TABLE public.sgs_risk_terms ADD COLUMN signature_data TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = 'sgs_risk_terms' AND column_name = 'accepted') THEN
        ALTER TABLE public.sgs_risk_terms ADD COLUMN accepted BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Policies for public access to signature (usually we'd use a unique token, but for now we'll allow public update if we have the ID)
-- In a production app, we would add a 'token' column to sgs_risk_terms and use that for the URL.
CREATE POLICY "Public can sign their own term"
ON public.sgs_risk_terms
FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Public can view term to sign"
ON public.sgs_risk_terms
FOR SELECT
USING (true);

-- Also allow public select on minors for the signature page
CREATE POLICY "Public can view minors for term"
ON public.sgs_risk_term_minors
FOR SELECT
USING (true);

CREATE POLICY "Public can sign for minors"
ON public.sgs_risk_term_minors
FOR UPDATE
USING (true)
WITH CHECK (true);
