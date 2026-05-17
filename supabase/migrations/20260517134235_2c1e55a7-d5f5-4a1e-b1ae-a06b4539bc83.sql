CREATE POLICY "Users view own dependents"
ON public.dependents
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.customers c
    WHERE c.id = dependents.customer_id
      AND c.user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin'::app_role)
);