GRANT SELECT ON public.tours TO anon, authenticated;
CREATE POLICY "Public can read active tours" ON public.tours FOR SELECT TO anon, authenticated USING (active = true);