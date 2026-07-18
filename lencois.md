# LençóisTur — Documentação de Deploy

## Visão Geral

Sistema de agendamento de passeios turísticos em Lençóis (BA).
SPA em Vite + React + TypeScript + shadcn, com backend Supabase self-hosted.
Domínio: https://lencois.tur.br

## Infraestrutura

### Servidor

- **Provedor:** DETA VPS
- **SO:** Ubuntu 24.04
- **Docker:** engine instalado
- **Coolify:** v4+ (container `coolify`)
- **Proxy:** Traefik v3.6 (`coolify-proxy`) com Let's Encrypt via `coolify`
- **IP:** 31.97.140.110

### Sistemas no Mesmo Servidor

- `bolaoai` — Bolão AI (https://bolao.ai.slz.br)
- `hotspot-*` — Hotspot Enlace (https://hotspot.enlace.slz.br)
- `9router` — Roteador 9Router
- `evo-crm-*` — Evo CRM
- `octoisp-*` — OctoISP
- `supabase-*` — Supabase self-hosted (compartilhado)

### Rede

Todos os containers usam a rede `coolify` (externo), criada pelo Coolify.

---

## Repositório

- **URL:** https://github.com/enlaceslz/lencoistur-43197f7c.git
- **Branch padrão:** `main`
- **Clone local:** `/opt/lencois/lencois-test`

### Estrutura

```
lencois-test/
├── Dockerfile              # Build em dois estágios: Node 20 → Nginx
├── nginx.conf              # Config do Nginx (SPA fallback)
├── docker-compose.yml      # Deploy local (cópia em /opt/lencois/deploy/)
├── package.json
├── supabase/
│   ├── migrations/         # ~140 migrations SQL
│   └── functions/          # Edge functions (ai-analysis, catalog-pricing, chat, etc.)
└── src/                    # Código da SPA
```

---

## Dockerfile

`/opt/lencois/lencois-test/Dockerfile`:

- **Stage 1 (build):** `node:20-alpine`, instala dependências com `npm install`, builda com `npm run build`
- **Stage 2 (runtime):** `nginx:stable-alpine`, serve o conteúdo de `/usr/share/nginx/html`
- **Build args:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`

---

## Deploy

### Imagem Docker

Construída localmente:

```bash
docker build \\
  --build-arg VITE_SUPABASE_URL=https://lencois.tur.br \\
  --build-arg VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... \\
  --build-arg VITE_SUPABASE_PROJECT_ID= \\
  -t lencoistur:latest \\
  /opt/lencois/lencois-test
```

### Docker Compose

Arquivo: `/opt/lencois/deploy/docker-compose.yml`

```yaml
name: lencoistur
services:
  app:
    container_name: lencoistur
    image: lencoistur:latest
    restart: unless-stopped
    networks:
      - coolify
    healthcheck:
      test: wget -q --spider http://127.0.0.1/ || exit 1
      interval: 30s
      timeout: 10s
      retries: 3
    labels:
      - traefik.enable=true

networks:
  coolify:
    external: true
```

### Comandos de Deploy

```bash
# Reconstruir e atualizar
cd /opt/lencois/lencois-test
docker build --build-arg VITE_SUPABASE_URL=https://lencois.tur.br \
  --build-arg VITE_SUPABASE_PUBLISHABLE_KEY="<anon-key>" \
  -t lencoistur:latest .
cd /opt/lencois/deploy
docker compose up -d
```

---

## Proxy (Traefik)

Arquivo: `/data/coolify/proxy/dynamic/lencois.yaml`

### Rotas

| Domínio | Path | Destino | TLS |
|---------|------|---------|-----|
| `lencois.tur.br` | `/` | `lencoistur:80` | Let's Encrypt |
| `lencois.tur.br` | `/auth/*` | `supabase-kong:8000` | Let's Encrypt |
| `lencois.tur.br` | `/rest/*` | `supabase-kong:8000` | Let's Encrypt |
| `lencois.tur.br` | `/storage/*` | `supabase-kong:8000` | Let's Encrypt |
| `lencois.tur.br` | `/realtime/*` | `supabase-kong:8000` | Let's Encrypt |
| `lencois.tur.br` | `/functions/*` | `supabase-kong:8000` | Let's Encrypt |
| `www.lencois.tur.br` | `/` | 301 → `lencois.tur.br` | Let's Encrypt |

### Middleware

- `redirect-to-https` — HTTP → HTTPS
- `lencoistur-redir-www` — `www.lencois.tur.br` → `lencois.tur.br` (permanente)

---

## Supabase (Self-Hosted)

Instalação em `/opt/supabase/docker/`.

### Configuração Relevante

No arquivo `/opt/supabase/docker/.env`:

```
SITE_URL=https://lencois.tur.br
ADDITIONAL_REDIRECT_URLS=https://bolao.ai.slz.br/**
```

### Serviços

| Container | Função |
|-----------|--------|
| `supabase-db` | PostgreSQL 17.6 |
| `supabase-kong` | API Gateway (Kong 3.9) |
| `supabase-auth` | GoTrue v2.189 (autenticação) |
| `supabase-rest` | PostgREST v14.12 |
| `supabase-storage` | Storage API v1.60 |
| `supabase-realtime` | Realtime v2.102 |
| `supabase-edge-functions` | Edge Runtime v1.74 |
| `supabase-studio` | Studio v2026.06.03 |
| `supabase-meta` | Postgres Meta v0.96 |
| `supabase-pooler` | Supavisor (pool de conexões) |
| `supabase-imgproxy` | Imgproxy v3.30 |

### Migrations

~145 arquivos SQL em `/opt/lencois/lencois-test/supabase/migrations/`.
Tabelas criadas: `bookings`, `tours`, `customers`, `partners`, `package_tours`,
`reviews`, `notifications`, `sgs_*` (gestão de segurança), `financeiro_*` etc.

Permissões PostgREST configuradas para `anon` e `authenticated` em todas as
tabelas públicas.

**Migrations recentes de operações atômicas:**

| Migration | Descrição |
|-----------|-----------|
| `20260715000001_atomic_booking_ops.sql` | 4 RPCs SECURITY DEFINER: `confirm_payment_transaction`, `cancel_booking_transaction`, `update_booking_customer_transaction`, `mark_term_signed_transaction` + unique constraint `sgs_risk_terms.booking_id` |
| `20260715000002_complete_delete_rpc.sql` | 2 RPCs SECURITY DEFINER: `complete_booking_transaction`, `delete_booking_transaction` |

### Edge Functions

Implantadas em `/opt/supabase/docker/volumes/functions/`:

- `ai-analysis` — Análise com IA
- `catalog-pricing` — Precificação de catálogo
- `chat` — Chat
- `create-booking` — Criação de reserva
- `handle-public-term` — Manipulação de termos públicos
- `send-term-email` — Envio de termo por email
- `hello` — Função de teste
- `main` — Função principal

---

## Pipeline de Build

1. `npm install` — instala dependências
2. `npm run build` — Vite gera `dist/`
3. Imagem Docker multi-estágio: build → nginx
4. Container executa nginx servindo arquivos estáticos

---

## Google OAuth

O callback do Google OAuth está hardcoded para
`https://bolao.ai.slz.br/auth/v1/callback`. Para o login com Google funcionar
no `lencois.tur.br`, é necessário:

1. Acessar https://console.cloud.google.com/apis/credentials
2. Editar o OAuth 2.0 Client ID do projeto
3. Adicionar `https://lencois.tur.br/auth/v1/callback` como **Authorized redirect URI**

---

## Manutenção

### Verificar Status

```bash
docker ps --filter name=lencoistur
curl -s -o /dev/null -w "%{http_code}" https://lencois.tur.br/
docker logs lencoistur --tail 20
```

### Rebuild Completo

```bash
cd /opt/lencois/lencois-test && git pull
docker build --build-arg VITE_SUPABASE_URL=https://lencois.tur.br \
  --build-arg VITE_SUPABASE_PUBLISHABLE_KEY="<anon-key>" \
  -t lencoistur:latest .
cd /opt/lencois/deploy && docker compose up -d
```

### Testes

```bash
cd /opt/lencois/lencois-test
npm test        # Vitest (1 teste de exemplo)
npm run lint    # ESLint
```

---

## Histórico de Commits Relevantes

| Hash | Descrição |
|------|-----------|
| `7f5dc4c` | Fix admin runtime crashes and 400/404 errors (format/date-fns, React #300, contas_pagar 400, img fallback) |
| `a9fcae8` | Fix admin crash: ReferenceError AdminLayout is not defined (bundle corrompido pelo minificador) |
| `cb270bb` | Switch Dockerfile from Bun to Node/npm for Coolify compat |
| `14a38af` | Fix canAccess: treat empty permissions as allow-all |
| `00b3da2` | Refactor sidebar: permission filtering, nested route active state |

### Correções de dados em produção (fora do git)

| Data | Tabela | Alteração | Motivo |
|------|--------|-----------|--------|
| 2026-07-18 | `packages` | `banner_url` de 2 pacotes (aventura-completa, romantico) setado para `NULL` | Apontavam para `/images/packages/*.jpg` inexistentes (HTTP 404 no console). Front usa fallback `/placeholder.svg` para `null`. Backup em `/root/backup-packages-banner_url-*.txt` |


---

## Otimizações de Performance

### Frontend
- `React.memo` aplicado em componentes de lista (CRM, Colaboradores, Passeios, etc.)
- `SidebarLink` memoizado com `isActive` prop
- `AdminRoute` memoizado para evitar re-renders

### Backend (Supabase)
- **Operações transacionais atômicas via RPC (SECURITY DEFINER):**
  - `confirm_payment_transaction(p_booking_id, p_group_id)` — atualiza status + batch insert `contas_receber` em uma transação; ignora duplicatas via `NOT EXISTS`
  - `cancel_booking_transaction(p_booking_id, p_group_id)` — cancela reserva + atualiza `contas_receber` atomicamente
  - `update_booking_customer_transaction(p_booking_id, p_customer_id, p_customer_data, p_items, p_companions)` — sincroniza customer, itens (insert/update/delete), dependentes em transação única
  - `mark_term_signed_transaction(p_booking_id)` — upsert atômico em `sgs_risk_terms` (unique constraint em `booking_id`)
  - `complete_booking_transaction(p_booking_id)` — marca "concluída" + gera comissões/parcelas com `FOR UPDATE` lock
  - `delete_booking_transaction(p_booking_id, p_group_id)` — deleta financeiro → booking em ordem respeitando FKs
- **Eliminação de N+1 queries em `useBookings.ts`:**
  - `confirmPayment`: batch insert de `contas_receber` (antes 1 query por item)
  - `updateBooking`: batch insert + `Promise.all` para updates
  - `completeBooking`: paralelização de queries com `Promise.all`
  - `addBooking`: `confirmPayment` em paralelo via `Promise.allSettled` (tolerância a falha parcial)
- **Substituição de `select("*")` por colunas explícitas:**
  - `AdminFinanceiro.tsx`, `AdminRelatorios.tsx`, `AdminReservas.tsx`
  - `ToursPage.tsx`, `TourDetail.tsx`
- **Constraint única em `sgs_risk_terms.booking_id`** para evitar termos duplicados
- **Verificação de duplicata no DB** (AdminReservas) em vez de estado local stale

### Infraestrutura
- Nginx com headers de cache para assets estáticos
- Build Docker multi-stage (node:20-alpine → nginx:stable-alpine)

---

## Observações

- O banco de dados Supabase é **compartilhado** com outros sistemas do servidor
- A chave anon key do Supabase está hardcoded no build da imagem (Vite compila
  as env vars no bundle estático)
- O Coolify está presente mas o deploy atual é manual via `docker compose`
- O container `lencoistur` roda na rede `coolify` para comunicação com o
  Traefik gerenciado pelo Coolify

---

## Auditoria SEO (concluída — 2026-07-18)

Briefing detalhado em `/root/lencois.md`. Itens entregues e revalidados em
produção pós-redeploy:
- i18n por URL (`/passeios`, `/en/passeios`, `/es/passeios`) com hreflang +
  canonical únicos e `x-default`.
- Brotli (`ngx_brotli` compilado do source), HSTS, headers de segurança,
  redirect www→non-www (308), 404 com SEO próprio.
- Prerender estático de 42 rotas (14×3), sitemap 42 URLs, robots.txt.
- Structured data: TravelAgency, Product/Offer, FAQPage, BreadcrumbList,
  ItemList, Review, Service. Páginas transacionais em `noindex`.
- JPEG optimization (quality=80 progressive), font preload, cache headers.
- **Pendente (externo):** submeter sitemap ao Google Search Console (requer
  acesso à conta do dono). **Futuro:** WebP, Service Worker.

---

## ⚠️ Pendências / Riscos conhecidos

### Convenção de preços — VERIFICADO (2026-07-18)

- **Convenção oficial:** todos os valores monetários são armazenados em
  **centavos** (inteiros). `formatCurrency(value)` divide por 100 para exibir.
- **Os dados JÁ estão corretos em centavos.** Ex: `tours.price=15000` →
  exibido **R$ 150,00** (correto). `packages.original_price=120000` →
  **R$ 1.200,00** (correto). A hipótese de multiplicar ×100 foi testada em 1
  linha, revelou-se ERRADA (quadruplicaria os preços) e foi **revertida 100%** —
  nenhuma tabela foi alterada. Backup de segurança mantido em
  `/root/backup-precos-20260718_171220/` (dump `--column-inserts`).
- **NÃO aplicar** `UPDATE coluna = coluna * 100`: os preços já seguem a
  convenção centavos e a UI exibe corretamente.
- **Nota:** ao inserir novos preços (admin), sempre gravar em centavos — o
  formulário do admin já faz isso (`Math.round(valor * 100)`).
- **Test Tour removido** (2026-07-18): registro de teste (`price=1000000`)
  excluído da tabela `tours` após verificar 0 referências (package_tours,
  reviews, sgs_*). Backup em `/root/backup-precos-20260718_171220/test_tour_deleted.sql`.
  Prerender rebuildado sem cache para refletir o catálogo limpo.

---

## Revisão de Módulos (2026-07-18)

Revisão de código dos módulos admin do LençóisTur. Foco: bugs funcionais,
consistência de centavos/reais e limpeza de imports mortos.

### Correções aplicadas
- **AdminCRM (`src/pages/AdminCRM.tsx`)**:
  - Filtro "Dependentes" quebrado (retornava lista vazia) — corrigido.
  - Wide view não atualizava após edição do cliente — corrigido (re-busca).
  - Imports lucide mortos removidos; variável `clientStats` morta removida.
  - Extraído `src/components/CustomerWideView.tsx` (eliminou ~170 linhas
    duplicadas entre pop-up e dialog).
  - Sinalização de CPF inválido na listagem/edição; CPF legado
    `000.000.000-00` limpo no banco (backup em `customers_pos_update.sql`).
- **AdminPacotes (`src/pages/AdminPacotes.tsx`)**: `original_price` (preço
  tachado "de R$ X") não era definido ao montar pacote por seleção de tours —
  agora recebe a soma dos itens, tornando o "de/por" coerente.

### Limpeza de imports mortos
- `AdminColaboradores`: 10 ícones lucide removidos.
- `financeiro/*` (ContasPagar, ContasReceber, FinanceiroStats): 12 ícones removidos.

### Verificações de consistência (sem alteração)
- **Centavos vs reais**: todos os módulos (`CRM`, `Colaboradores`, `Financeiro`,
  `Passeios`, `Pacotes`, `Reservas`, `Translados`, `Parceiros`) usam
  `NumericFormat` com `/100` (display) e `*100` (save), ou `parseCurrencyToNumber`
  (→ centavos), exibindo via `formatCurrency` (÷100). Consistente.
- `partners.commission_rate` é **percentual** (não centavos) — correto, não mexer.
- Varredura global: **nenhum** ícone lucide morto restante em `src/`.
- `tsc --noEmit` e `vite build` passam em todos os módulos revisados.

---

## Backup & Operação (2026-07-18)

### Banco de dados (Postgres / Supabase self-hosted)
- Container: `supabase-db` (postgres:17). Volume de dados:
  `/var/lib/docker/volumes/supabase_db-config/_data` (config) e o data dir
  montado em `/opt/supabase/docker/volumes/db/data`.
- **Backup automático diário (03:00)** via `/root/backup-lencois.sh`,
  agendado no crontab. Gera `/root/backups/lencois/lencois_YYYYMMDD_HHMMSS.sql.gz`
  (formato gzip, ~870KB) e mantém retenção de **7 dias**.
- **Histórico de backups pontuais** (manuais, pré-mudança) em
  `/root/backup-precos-20260718_171220/` — dumps de `customers`,
  `customer_documents`, `tours`/`packages` (com `--column-inserts`) e
  `test_tour_deleted.sql`, `customers_pos_update.sql`.
- **Restauração:** `gunzip -c arquivo.sql.gz | docker exec -i supabase-db psql -U postgres -d postgres`
  (usar `--clean --if-exists` para sobrescrever; cuidado com tabelas de
  terceiros no mesmo banco — o dump é do DB inteiro).

### Containers (Coolify + manual)
- `lencoistur` (app, rede `coolify`, Traefik): `restart: unless-stopped`,
  healthcheck via `wget`. Redeploy manual com `docker compose up -d` em
  `/opt/lencois/deploy`.
- Supabase stack saudável (db, rest, auth, storage, realtime, etc.).
- `docker system prune` semanal (domingo 04:00, `until=72h`).

### Melhorias no build (2026-07-18)
- Dockerfile: `npm install` → `npm ci` (builds reproduzíveis, lockfile
  obrigatório).
- `.dockerignore` já excluía `node_modules`, `.git`, `.env`, `dist`.
- Nenhuma credencial exposta nos commits do git.

### Correções aplicadas em 2026-07-18
- **RLS site_settings**: faltava `GRANT INSERT, UPDATE, DELETE ... TO authenticated`.
  Policies `has_role()` usam `user_roles` (correto) — admin André tem `role='admin'`
  em `user_roles`, então funciona. Migração em `supabase/migrations/20260718_fix_rls.sql`.
- **notifications**: tabela não tinha coluna `user_id` — GET retornava 400. Adicionada
  coluna, grants e policy RLS `user_own_notifications`.

### Pendências observadas (baixa prioridade)
- `validatePixKey` em `AdminConfig.tsx` duplica a lógica de validação de CPF que
  já existe em `src/lib/utils.ts:validateCPF` — diferenças de retorno impedem
  substituição direta sem refatoração.
- Backup/restore via `AdminConfig` é 100% client-side (`supabase.from().select("*")`
  → JSON → download → upload). Restore usa `.delete()` com sentinel UUID
  (`"00000000-..."`) que efetivamente apaga todos os registros. Funciona mas
  é frágil para dados grandes e sem atomicidade.
- Cobertura de testes: `src/test/example.test.ts` é o único arquivo de
  teste — nenhum módulo tem teste automatizado.


