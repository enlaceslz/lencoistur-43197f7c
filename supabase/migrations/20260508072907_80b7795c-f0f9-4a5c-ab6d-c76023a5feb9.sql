-- Allow public to insert into documents for signed terms
CREATE POLICY "Public can insert signed terms" 
ON public.documents 
FOR INSERT 
WITH CHECK (true);

-- Allow public to insert into customer_documents
-- (The existing policy 'Anyone can insert customer documents' might be restricted to authenticated in some contexts, 
-- let's make sure it's explicitly public if needed, but based on pg_policies it was already for public role.
-- However, let's ensure 'documents' table is covered as it was causing the likely failure)
