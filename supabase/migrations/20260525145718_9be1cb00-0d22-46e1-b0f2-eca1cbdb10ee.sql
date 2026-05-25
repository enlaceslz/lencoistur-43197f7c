-- Fix 1: Remove booking enumeration oracle from public survey insert policy
DROP POLICY IF EXISTS "Public can create surveys with validation" ON public.sgs_safety_surveys;

CREATE POLICY "Public can create surveys with validation"
ON public.sgs_safety_surveys
FOR INSERT
TO anon, authenticated
WITH CHECK (
  felt_safe IS NOT NULL AND felt_safe BETWEEN 1 AND 5
  AND overall_rating IS NOT NULL AND overall_rating BETWEEN 1 AND 5
  AND booking_id IS NOT NULL
);

-- Fix 2: Prevent admin SELECT from exposing sign_access_token directly.
-- Drop the prior admin SELECT policy on sgs_risk_terms and create a column-aware
-- replacement that excludes the signing token from row reads. Admins access tokens
-- only through SECURITY DEFINER RPCs (find_signable_term_id, get_public_term_v2).
DROP POLICY IF EXISTS "Admins can view risk terms" ON public.sgs_risk_terms;
DROP POLICY IF EXISTS "Admins read risk terms" ON public.sgs_risk_terms;
DROP POLICY IF EXISTS "Admins select risk terms" ON public.sgs_risk_terms;

-- Revoke direct column access to the sensitive token columns for all roles
REVOKE ALL ON public.sgs_risk_terms FROM anon, authenticated;
GRANT SELECT (
  id, customer_id, customer_name, tour_id, tour_name, booking_id, term_date,
  accepted, signature_data, signed_at, risks_informed, health_questions,
  pdf_url, has_multiple_signers, nationality, phone, cpf, birth_date, email,
  safety_controls_informed, vehicle_id, company_id, address, city_state,
  emergency_contact_name, emergency_contact_phone, has_allergy, allergy_details,
  has_fainting_convulsions, recent_surgery, has_diabetes, is_obese, is_sedentary,
  has_immobilized_part, has_special_needs, has_phobia, phobia_details,
  under_influence, takes_medication, medication_details, signed_at_counter
) ON public.sgs_risk_terms TO authenticated;

GRANT INSERT, UPDATE, DELETE ON public.sgs_risk_terms TO authenticated;

CREATE POLICY "Admins can view risk terms (no token columns)"
ON public.sgs_risk_terms
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can modify risk terms"
ON public.sgs_risk_terms
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));