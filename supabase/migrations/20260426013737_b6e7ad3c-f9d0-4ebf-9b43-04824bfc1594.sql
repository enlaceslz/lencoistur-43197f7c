-- Create AI settings table
CREATE TABLE IF NOT EXISTS public.ai_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bot_name TEXT DEFAULT 'Assistente LençóisTour',
    tone TEXT DEFAULT 'Amigável',
    instructions TEXT DEFAULT 'Sempre sugira o WhatsApp para finalizar reservas. Mencione promoções ativas quando relevante.',
    automations JSONB DEFAULT '[
        {"name": "Resposta automática a perguntas", "active": true},
        {"name": "Sugestão de passeios por preferência", "active": true},
        {"name": "Encaminhar para humano após 3 falhas", "active": true},
        {"name": "Coletar lead automaticamente", "active": true},
        {"name": "Enviar resumo diário por e-mail", "active": false},
        {"name": "Tradução automática (EN/ES/FR)", "active": false}
    ]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;

-- AI Settings Policies
CREATE POLICY "Admins can view AI settings" 
ON public.ai_settings FOR SELECT 
TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage AI settings" 
ON public.ai_settings FOR ALL 
TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert initial settings if empty
INSERT INTO public.ai_settings (bot_name)
SELECT 'Assistente LençóisTour'
WHERE NOT EXISTS (SELECT 1 FROM public.ai_settings);

-- Security Hardening: Explicitly set roles for critical policies
-- Bookings
DROP POLICY IF EXISTS "Admins can read all bookings" ON public.bookings;
CREATE POLICY "Admins can read all bookings" 
ON public.bookings FOR SELECT 
TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Finance (Contas Pagar/Receber)
DROP POLICY IF EXISTS "Admins full access contas_pagar" ON public.contas_pagar;
CREATE POLICY "Admins full access contas_pagar" 
ON public.contas_pagar FOR ALL 
TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins full access contas_receber" ON public.contas_receber;
CREATE POLICY "Admins full access contas_receber" 
ON public.contas_receber FOR ALL 
TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role));

-- CRM
DROP POLICY IF EXISTS "Admins can read customers" ON public.customers;
CREATE POLICY "Admins can read customers" 
ON public.customers FOR SELECT 
TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Marketing Leads
DROP POLICY IF EXISTS "Admins full access marketing_leads" ON public.marketing_leads;
CREATE POLICY "Admins full access marketing_leads" 
ON public.marketing_leads FOR ALL 
TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Performance Indexes for IA Analysis
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON public.bookings(created_at);
CREATE INDEX IF NOT EXISTS idx_bookings_type_item_name ON public.bookings(type, item_name);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at);
CREATE INDEX IF NOT EXISTS idx_marketing_leads_status ON public.marketing_leads(status);
