-- Hardening: remove grants anon sobre tabelas orfas do stack "bolao" (removido) e push_subscriptions.
--
-- O stack bolaoai foi removido (ver correcao 15/08/2026 - traefik/supabase-kong). Suas tabelas
-- (matches, teams, players, groups, planos, palpites, ganhadores, referees, scorers, stadiums,
-- match_*, bolao_matches, v_standings, v_top_scorers) permanecem no banco com os dados, mas NAO
-- sao referenciadas pelo frontend, edge functions, scripts ou migrations atuais (auditado).
-- O grant SELECT ao role anon sobre elas era so lixo remanescente (superficie de ataque desnecessaria).
-- Tambem: push_subscriptions (0 linhas) nao e usado pelo frontend.

-- Conservador: apenas REVOKE para anon; os dados das tabelas sao preservados (nao dropping).
REVOKE SELECT ON public.bolao_matches      FROM anon;
REVOKE SELECT ON public.ganhadores         FROM anon;
REVOKE SELECT ON public.groups             FROM anon;
REVOKE SELECT ON public.match_events       FROM anon;
REVOKE SELECT ON public.match_lineups      FROM anon;
REVOKE SELECT ON public.match_statistics   FROM anon;
REVOKE SELECT ON public.matches            FROM anon;
REVOKE SELECT ON public.palpites           FROM anon;
REVOKE SELECT ON public.planos             FROM anon;
REVOKE SELECT ON public.players            FROM anon;
REVOKE SELECT ON public.referees           FROM anon;
REVOKE SELECT ON public.scorers            FROM anon;
REVOKE SELECT ON public.stadiums           FROM anon;
REVOKE SELECT ON public.teams              FROM anon;
REVOKE SELECT ON public.v_standings        FROM anon;
REVOKE SELECT ON public.v_top_scorers      FROM anon;
REVOKE SELECT ON public.push_subscriptions FROM anon;
