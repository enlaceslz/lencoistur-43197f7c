INSERT INTO public.site_settings (key, value)
VALUES ('gallery', '{"images": []}')
ON CONFLICT (key) DO NOTHING;