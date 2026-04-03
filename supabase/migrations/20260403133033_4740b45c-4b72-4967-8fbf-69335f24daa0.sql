
-- Customers table
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  cpf TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Bookings table
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_code TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('tour', 'transfer')),
  item_name TEXT NOT NULL,
  date TEXT,
  guests INTEGER NOT NULL DEFAULT 1,
  unit_price INTEGER NOT NULL,
  total INTEGER NOT NULL,
  discount INTEGER NOT NULL DEFAULT 0,
  final_total INTEGER NOT NULL,
  pay_method TEXT NOT NULL CHECK (pay_method IN ('pix', 'card')),
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('confirmada', 'pendente', 'cancelada', 'concluida')),
  payment_status TEXT NOT NULL DEFAULT 'pendente' CHECK (payment_status IN ('pago', 'pendente')),
  pix_code TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tours table for admin management
CREATE TABLE public.tours (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  location TEXT,
  duration TEXT,
  price INTEGER NOT NULL,
  rating NUMERIC(2,1) DEFAULT 5.0,
  reviews_count INTEGER DEFAULT 0,
  tag TEXT,
  images TEXT[] DEFAULT '{}',
  includes TEXT[] DEFAULT '{}',
  highlights TEXT[] DEFAULT '{}',
  difficulty TEXT DEFAULT 'Moderado',
  group_size TEXT DEFAULT 'Até 12 pessoas',
  departure TEXT DEFAULT '08:00',
  operator TEXT DEFAULT 'LençóisTour',
  category TEXT DEFAULT 'adventure',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Transfer routes table
CREATE TABLE public.transfer_routes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  duration TEXT,
  distance TEXT,
  price INTEGER NOT NULL,
  vehicle_type TEXT,
  seats INTEGER DEFAULT 10,
  departures TEXT[] DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Reviews table
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tour_id UUID REFERENCES public.tours(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  avatar TEXT,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  country TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Partners table
CREATE TABLE public.partners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  commission_rate NUMERIC(5,2) DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- Public read access for tours, transfer_routes, reviews (visitor-facing)
CREATE POLICY "Anyone can view active tours" ON public.tours FOR SELECT USING (active = true);
CREATE POLICY "Anyone can view active transfers" ON public.transfer_routes FOR SELECT USING (active = true);
CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);

-- Public insert for bookings and customers (no auth required for booking)
CREATE POLICY "Anyone can create bookings" ON public.bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can create customers" ON public.customers FOR INSERT WITH CHECK (true);

-- Public read for bookings by booking_code (for status check)
CREATE POLICY "Anyone can read bookings by code" ON public.bookings FOR SELECT USING (true);
CREATE POLICY "Anyone can read customers" ON public.customers FOR SELECT USING (true);

-- Partners visible publicly
CREATE POLICY "Anyone can view active partners" ON public.partners FOR SELECT USING (active = true);

-- Enable realtime for bookings
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
