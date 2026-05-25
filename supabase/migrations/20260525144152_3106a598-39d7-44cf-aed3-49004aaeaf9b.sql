-- Drop the owner SELECT policy that exposed sign_access_token
DROP POLICY IF EXISTS "Admins and owners can view signed risk terms" ON public.sgs_risk_terms;

-- Recreate owner-safe SELECT: admins only (owners use RPCs)
CREATE POLICY "Admins can view risk terms"
ON public.sgs_risk_terms
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Helper: lookup term id by booking + token (without exposing token to clients)
CREATE OR REPLACE FUNCTION public.find_signable_term_id(p_booking_id uuid, p_token text)
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF p_token IS NULL OR length(p_token) < 16 THEN
    RETURN NULL;
  END IF;
  SELECT id INTO v_id
  FROM sgs_risk_terms
  WHERE booking_id = p_booking_id
    AND sign_access_token = p_token
    AND (sign_access_expires_at IS NULL OR sign_access_expires_at > now())
  LIMIT 1;
  RETURN v_id;
END;
$$;