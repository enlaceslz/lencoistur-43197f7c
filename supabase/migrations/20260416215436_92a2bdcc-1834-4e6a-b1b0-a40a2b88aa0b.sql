ALTER TABLE public.tours
  ADD COLUMN IF NOT EXISTS mode_collective_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS mode_private_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS default_mode text NOT NULL DEFAULT 'privativo';

ALTER TABLE public.tours
  DROP CONSTRAINT IF EXISTS tours_default_mode_check;

ALTER TABLE public.tours
  ADD CONSTRAINT tours_default_mode_check CHECK (default_mode IN ('coletivo', 'privativo'));