-- Create packages table
CREATE TABLE public.packages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    days INTEGER NOT NULL DEFAULT 1,
    original_price INTEGER,
    discount_price INTEGER,
    tag TEXT,
    highlights TEXT[],
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create package_tours join table
CREATE TABLE public.package_tours (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    package_id UUID REFERENCES public.packages(id) ON DELETE CASCADE,
    tour_id UUID REFERENCES public.tours(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_tours ENABLE ROW LEVEL SECURITY;

-- Policies for packages
CREATE POLICY "Packages are viewable by everyone" ON public.packages FOR SELECT USING (true);
CREATE POLICY "Admins can manage packages" ON public.packages FOR ALL USING (auth.uid() IN (SELECT user_id FROM public.user_management WHERE role = 'administrador'));

-- Policies for package_tours
CREATE POLICY "Package tours are viewable by everyone" ON public.package_tours FOR SELECT USING (true);
CREATE POLICY "Admins can manage package tours" ON public.package_tours FOR ALL USING (auth.uid() IN (SELECT user_id FROM public.user_management WHERE role = 'administrador'));

-- Updated at trigger
CREATE TRIGGER update_packages_updated_at
BEFORE UPDATE ON public.packages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
