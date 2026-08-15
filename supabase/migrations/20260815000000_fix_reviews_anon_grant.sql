-- Corrige 401 na listagem de reviews no frontend (erros01.txt).
-- A tabela reviews tinha policy RLS "reviews public read" para anon,
-- mas o role anon NÃO possuía GRANT SELECT na tabela, então o PostgREST
-- devolvia 401 em /rest/v1/reviews mesmo com apikey.
-- O GRANT é necessário para o PostgREST executar o SELECT (a policy só
-- filtra linhas, não concede acesso à tabela).

GRANT SELECT ON TABLE public.reviews TO anon;
