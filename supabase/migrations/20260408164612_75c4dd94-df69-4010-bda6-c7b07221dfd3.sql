
-- 1. Fix sgs_risk_terms: remove public INSERT, only admins can manage
DROP POLICY IF EXISTS "Public can create risk terms with validation" ON public.sgs_risk_terms;

-- 2. Fix customers: add rate-limit-style uniqueness check (email unique constraint) and tighten validation
DROP POLICY IF EXISTS "Anyone can create customers with validation" ON public.customers;

-- Add unique constraint on email if not exists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'customers_email_unique') THEN
    ALTER TABLE public.customers ADD CONSTRAINT customers_email_unique UNIQUE (email);
  END IF;
END $$;

-- Recreate customer insert with stronger validation
CREATE POLICY "Public can create customers with validation"
  ON public.customers
  FOR INSERT
  TO public
  WITH CHECK (
    char_length(name) >= 2
    AND char_length(name) <= 200
    AND char_length(email) >= 5
    AND char_length(email) <= 254
    AND email ~* '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    AND (phone IS NULL OR (char_length(phone) >= 8 AND char_length(phone) <= 20))
    AND (cpf IS NULL OR char_length(cpf) = 14)
  );
