-- Popula package_tours (vazia) com a composição dos pacotes.
-- Os cards de combos na home (PackagesSection) mostravam placeholder cinza
-- porque a view public_package_tour_items não retornava nenhuma linha,
-- deixando os cards sem imagens dos passeios.
-- Com base na resposta do cliente: Aventura Completa = todos os 5 passeios;
-- Romântico = Lagoas Azuis + Gastronômico.
-- Idempotente: só insere se a tabela estiver vazia.

INSERT INTO public.package_tours (package_id, tour_id, sort_order)
SELECT v.package_id::uuid, v.tour_id::uuid, v.sort_order
FROM (VALUES
  ('59a5ff15-12b4-49d2-80bb-c75b137accdc', 'aa16429f-6565-4e58-93ee-0fb0e909a1f4', 1),  -- aventura-completa: lagoas-azuis
  ('59a5ff15-12b4-49d2-80bb-c75b137accdc', 'ce018c98-39a2-4977-88e5-9d8822a65dd5', 2),  -- aventura-completa: quadriciclo
  ('59a5ff15-12b4-49d2-80bb-c75b137accdc', 'b48c4271-048a-47c3-b6f6-ab42a844e773', 3),  -- aventura-completa: ecologico
  ('59a5ff15-12b4-49d2-80bb-c75b137accdc', '6b91ea3c-43c6-4aa0-a88d-396a7ec36bd1', 4),  -- aventura-completa: caiaque
  ('59a5ff15-12b4-49d2-80bb-c75b137accdc', '8326703a-f6f7-48d0-9fad-4b96035be92e', 5),  -- aventura-completa: gastronomico
  ('a6f3a435-2776-44fb-a518-7968c835b680', 'aa16429f-6565-4e58-93ee-0fb0e909a1f4', 1),  -- romantico: lagoas-azuis
  ('a6f3a435-2776-44fb-a518-7968c835b680', '8326703a-f6f7-48d0-9fad-4b96035be92e', 2)   -- romantico: gastronomico
) AS v(package_id, tour_id, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.package_tours);