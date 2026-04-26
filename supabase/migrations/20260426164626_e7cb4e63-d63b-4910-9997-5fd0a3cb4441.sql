-- Add indexes to foreign keys for better performance and efficiency
CREATE INDEX IF NOT EXISTS idx_sgs_checklist_items_checklist_id ON public.sgs_checklist_items(checklist_id);
CREATE INDEX IF NOT EXISTS idx_sgs_checklists_veiculo_id ON public.sgs_checklists(veiculo_id);
CREATE INDEX IF NOT EXISTS idx_sgs_checklists_condutor_id ON public.sgs_checklists(condutor_id);
CREATE INDEX IF NOT EXISTS idx_sgs_risk_terms_booking_id ON public.sgs_risk_terms(booking_id);
CREATE INDEX IF NOT EXISTS idx_sgs_corrective_actions_risk_id ON public.sgs_corrective_actions(risk_id);
CREATE INDEX IF NOT EXISTS idx_sgs_corrective_actions_incident_id ON public.sgs_corrective_actions(incident_id);
CREATE INDEX IF NOT EXISTS idx_sgs_risks_tour_id ON public.sgs_risks(tour_id);
CREATE INDEX IF NOT EXISTS idx_reviews_tour_id ON public.reviews(tour_id);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON public.bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_sgs_staff_trainings_staff_id ON public.sgs_staff_trainings(staff_id);
CREATE INDEX IF NOT EXISTS idx_sgs_audit_items_audit_id ON public.sgs_audit_items(audit_id);
CREATE INDEX IF NOT EXISTS idx_sgs_supplier_compliance_partner_id ON public.sgs_supplier_compliance(partner_id);
CREATE INDEX IF NOT EXISTS idx_sgs_safety_surveys_booking_id ON public.sgs_safety_surveys(booking_id);
CREATE INDEX IF NOT EXISTS idx_sgs_incidents_tour_id ON public.sgs_incidents(tour_id);
CREATE INDEX IF NOT EXISTS idx_sgs_briefings_tour_id ON public.sgs_briefings(tour_id);
CREATE INDEX IF NOT EXISTS idx_sgs_briefings_booking_id ON public.sgs_briefings(booking_id);
