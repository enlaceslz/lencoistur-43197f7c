
-- Image mapping:
-- IMG1: Dunas com pessoas (grupo nas dunas) - photo-1704644411334-f6ca48963d6c
-- IMG2: Lagoa com dunas (praia/lagoa) - photo-1650623598032-4fddce25b34f
-- IMG3: Panorama dunas e lagoas - photo-1561916108-2d4d48d132c8
-- IMG4: Dunas verticais - photo-1680323535239-25b4b65eee75
-- IMG5: Lagoa cercada dunas - photo-1672271688662-3a03bbb75ec9
-- IMG6: Lagoa no deserto - photo-1671385054651-f017771dea4a
-- IMG7: Farol Mandacaru - photo-1679095007377-e6c8e13f9178

UPDATE public.tours SET images = ARRAY[
  'https://images.unsplash.com/photo-1650623598032-4fddce25b34f?w=1200&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1561916108-2d4d48d132c8?w=1200&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1672271688662-3a03bbb75ec9?w=1200&q=80&auto=format&fit=crop'
] WHERE slug = 'lagoas-azuis';

UPDATE public.tours SET images = ARRAY[
  'https://images.unsplash.com/photo-1679095007377-e6c8e13f9178?w=1200&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1561916108-2d4d48d132c8?w=1200&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1650623598032-4fddce25b34f?w=1200&q=80&auto=format&fit=crop'
] WHERE slug = 'passeio-de-barco';

UPDATE public.tours SET images = ARRAY[
  'https://images.unsplash.com/photo-1680323535239-25b4b65eee75?w=1200&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1671385054651-f017771dea4a?w=1200&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1704644411334-f6ca48963d6c?w=1200&q=80&auto=format&fit=crop'
] WHERE slug = 'roteiro-ecologico';

UPDATE public.tours SET images = ARRAY[
  'https://images.unsplash.com/photo-1671385054651-f017771dea4a?w=1200&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1672271688662-3a03bbb75ec9?w=1200&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1561916108-2d4d48d132c8?w=1200&q=80&auto=format&fit=crop'
] WHERE slug = 'passeio-gastronomico';

UPDATE public.tours SET images = ARRAY[
  'https://images.unsplash.com/photo-1704644411334-f6ca48963d6c?w=1200&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1679095007377-e6c8e13f9178?w=1200&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1650623598032-4fddce25b34f?w=1200&q=80&auto=format&fit=crop'
] WHERE slug = 'roteiro-cultural';

UPDATE public.tours SET images = ARRAY[
  'https://images.unsplash.com/photo-1561916108-2d4d48d132c8?w=1200&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1671385054651-f017771dea4a?w=1200&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1672271688662-3a03bbb75ec9?w=1200&q=80&auto=format&fit=crop'
] WHERE slug = 'descida-de-caiaque';

UPDATE public.tours SET images = ARRAY[
  'https://images.unsplash.com/photo-1672271688662-3a03bbb75ec9?w=1200&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1680323535239-25b4b65eee75?w=1200&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1650623598032-4fddce25b34f?w=1200&q=80&auto=format&fit=crop'
] WHERE slug = 'trekking-nas-dunas';

UPDATE public.tours SET images = ARRAY[
  'https://images.unsplash.com/photo-1704644411334-f6ca48963d6c?w=1200&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1561916108-2d4d48d132c8?w=1200&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1680323535239-25b4b65eee75?w=1200&q=80&auto=format&fit=crop'
] WHERE slug = 'passeio-de-quadriciclo';
