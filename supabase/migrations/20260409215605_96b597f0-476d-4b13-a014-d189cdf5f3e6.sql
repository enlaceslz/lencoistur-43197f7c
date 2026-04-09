
-- Create site_settings table for persisting configuration
CREATE TABLE public.site_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can read and manage settings
CREATE POLICY "Admins can read settings"
ON public.site_settings FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert settings"
ON public.site_settings FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update settings"
ON public.site_settings FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete settings"
ON public.site_settings FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Insert default settings
INSERT INTO public.site_settings (key, value) VALUES
('empresa', '{"nome":"LençóisTour","cnpj":"12.345.678/0001-90","telefone":"(98) 99999-0000","whatsapp":"(98) 99999-0000","endereco":"Santo Amaro do Maranhão, MA","email":"contato@lencoistour.com"}'::jsonb),
('site', '{"titulo":"LençóisTour - Passeios nos Lençóis Maranhenses","metaDescricao":"Descubra os Lençóis Maranhenses com a melhor experiência turística.","whatsappUrl":"https://wa.me/5598999990000","instagram":"https://instagram.com/lencoistour","corPrimaria":"#2563eb","logoUrl":null}'::jsonb),
('pagamentos', '{"pix":true,"cartao":true,"boleto":false,"pixChave":"12.345.678/0001-90","pixTipo":"CNPJ"}'::jsonb),
('notificacoes', '{"email":true,"whatsapp":true,"push":false,"novaReserva":true,"cancelamento":true,"pagamento":true}'::jsonb);
