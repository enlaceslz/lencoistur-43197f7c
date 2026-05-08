-- Add partner price columns to tours
ALTER TABLE public.tours 
ADD COLUMN partner_price INTEGER,
ADD COLUMN partner_private_price INTEGER;

-- Add partner price column to packages
ALTER TABLE public.packages
ADD COLUMN partner_price INTEGER;

-- Comment on columns for clarity
COMMENT ON COLUMN public.tours.partner_price IS 'Preço coletivo para parceiros (em centavos)';
COMMENT ON COLUMN public.tours.partner_private_price IS 'Preço privativo para parceiros (em centavos)';
COMMENT ON COLUMN public.packages.partner_price IS 'Preço do pacote para parceiros (em centavos)';