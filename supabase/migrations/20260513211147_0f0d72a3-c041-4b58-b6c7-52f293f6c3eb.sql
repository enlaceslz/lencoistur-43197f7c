-- Enable public access for tours
CREATE POLICY "Anyone can view active tours" ON public.tours
FOR SELECT USING (active = true);

-- Enable public access for packages
CREATE POLICY "Anyone can view active packages" ON public.packages
FOR SELECT USING (active = true);

-- Enable public access for transfer_routes
CREATE POLICY "Anyone can view active transfer routes" ON public.transfer_routes
FOR SELECT USING (active = true);

-- Also ensure public can view tour reviews
-- (Linter says it's already there but let's be safe if it's missing)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'reviews' AND policyname = 'Anyone can view reviews'
    ) THEN
        CREATE POLICY "Anyone can view reviews" ON public.reviews
        FOR SELECT USING (true);
    END IF;
END $$;
