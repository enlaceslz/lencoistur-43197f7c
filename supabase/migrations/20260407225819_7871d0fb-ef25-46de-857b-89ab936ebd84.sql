DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'bookings') THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.bookings;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'sgs_risks') THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.sgs_risks;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'sgs_corrective_actions') THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.sgs_corrective_actions;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'sgs_incidents') THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.sgs_incidents;
  END IF;
END $$;