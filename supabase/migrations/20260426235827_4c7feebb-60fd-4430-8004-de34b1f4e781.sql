-- Secure sgs_equipment
DROP POLICY IF EXISTS "Admin full access to sgs_equipment" ON public.sgs_equipment;
CREATE POLICY "Authenticated users full access to sgs_equipment" ON public.sgs_equipment 
FOR ALL USING (auth.role() = 'authenticated'::text);

-- Secure sgs_procedures
DROP POLICY IF EXISTS "Admin full access to sgs_procedures" ON public.sgs_procedures;
CREATE POLICY "Authenticated users full access to sgs_procedures" ON public.sgs_procedures 
FOR ALL USING (auth.role() = 'authenticated'::text);
