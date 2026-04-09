-- Add pix_discount percentage column to tours
ALTER TABLE public.tours
ADD COLUMN pix_discount integer NOT NULL DEFAULT 0;

-- Add same column to transfer_routes
ALTER TABLE public.transfer_routes
ADD COLUMN pix_discount integer NOT NULL DEFAULT 0;