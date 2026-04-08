
INSERT INTO storage.buckets (id, name, public) VALUES ('tour-images', 'tour-images', true);

CREATE POLICY "Public can view tour images"
ON storage.objects FOR SELECT
USING (bucket_id = 'tour-images');

CREATE POLICY "Admins can upload tour images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'tour-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update tour images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'tour-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete tour images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'tour-images' AND public.has_role(auth.uid(), 'admin'));
