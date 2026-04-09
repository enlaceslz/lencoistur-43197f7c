
-- Create documents table
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'outro',
  description TEXT,
  file_url TEXT,
  file_name TEXT,
  expiry_date DATE,
  status TEXT NOT NULL DEFAULT 'vigente',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access documents"
  ON public.documents FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Storage bucket for company documents
INSERT INTO storage.buckets (id, name, public) VALUES ('company-documents', 'company-documents', true);

CREATE POLICY "Admins can upload company documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'company-documents' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update company documents"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'company-documents' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete company documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'company-documents' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can view company documents"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'company-documents');
