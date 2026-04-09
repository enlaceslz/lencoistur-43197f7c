-- Marketing Leads
CREATE TABLE public.marketing_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  email text,
  source text NOT NULL DEFAULT 'Manual',
  interest text,
  status text NOT NULL DEFAULT 'morno',
  score integer NOT NULL DEFAULT 50,
  last_contact timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.marketing_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access marketing_leads" ON public.marketing_leads
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Marketing Campaigns
CREATE TABLE public.marketing_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'whatsapp',
  status text NOT NULL DEFAULT 'rascunho',
  audience text,
  message text,
  subject text,
  sent integer NOT NULL DEFAULT 0,
  delivered integer NOT NULL DEFAULT 0,
  read_count integer NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  bounces integer NOT NULL DEFAULT 0,
  scheduled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access marketing_campaigns" ON public.marketing_campaigns
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Remarketing Rules
CREATE TABLE public.remarketing_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_name text NOT NULL,
  delay text NOT NULL DEFAULT '1h',
  channel text NOT NULL DEFAULT 'WhatsApp',
  message text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  conversions integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.remarketing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access remarketing_rules" ON public.remarketing_rules
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
