-- Add voucher_url column to bookings table
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS voucher_url TEXT;

-- Create vouchers storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('vouchers', 'vouchers', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for vouchers bucket
CREATE POLICY "Vouchers are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'vouchers');

CREATE POLICY "Authenticated users can upload vouchers" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'vouchers' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update vouchers" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'vouchers' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete vouchers" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'vouchers' AND auth.role() = 'authenticated');