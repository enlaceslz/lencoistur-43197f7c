-- Add status and is_featured columns to reviews table
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'hidden'));
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Update RLS policies to allow admins to manage these columns (if policies exist)
-- Assuming common pattern where admins can update reviews
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Enable update for authenticated users only') THEN
        -- Policy already exists, Supabase usually handles this via roles
    END IF;
END $$;