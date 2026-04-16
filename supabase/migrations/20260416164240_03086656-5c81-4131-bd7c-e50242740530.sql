-- Add private tour pricing and vehicle capacity to tours
ALTER TABLE public.tours
ADD COLUMN private_price integer NOT NULL DEFAULT 1300,
ADD COLUMN vehicle_capacity integer NOT NULL DEFAULT 9;