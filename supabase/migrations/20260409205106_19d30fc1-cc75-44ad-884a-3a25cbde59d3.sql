-- Allow admins to insert customers
CREATE POLICY "Admins can insert customers"
ON public.customers
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to update customers
CREATE POLICY "Admins can update customers"
ON public.customers
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete customers
CREATE POLICY "Admins can delete customers"
ON public.customers
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));