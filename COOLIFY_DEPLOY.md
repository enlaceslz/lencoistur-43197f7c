# Deploy no Coolify (VPS) — lencois.tur.br

Guia de deploy da aplicação **LençóisTour** em VPS gerenciada pelo **Coolify**, usando Docker + Nginx, para o domínio **https://lencois.tur.br**.

> Backend (Postgres, Auth, Storage, Edge Functions) é **self-hosted** via Supabase em Docker. O frontend é uma SPA estática servida por Nginx.

---

## 1. Pré-requisitos

- VPS Linux (Ubuntu 24.04): 4 vCPU / 8 GB RAM / 80 GB SSD
- Portas **80**, **443** e **5432** (Postgres local) liberadas
- **Coolify v4+** instalado com **Traefik** (coolify-proxy)
- Docker e Docker Compose instalados
- Acesso ao repositório Git (público ou via deploy key)
- Domínio **lencois.tur.br** com acesso ao DNS

Instalação rápida do Coolify:
```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

### Arquitetura Atual

```
┌─────────────────────────────────────────────────────────┐
│                    VPS (Ubuntu 24.04)                   │
├─────────────────────────────────────────────────────────┤
│  Coolify v4 + Traefik (coolify-proxy)                  │
│  ┌─────────────────┐  ┌─────────────────────────────┐ │
│  │ Frontend SPA    │  │ Supabase (Docker)            │ │
│  │ (Nginx :80)     │  │ - Postgres (:5432)          │ │
│  │ lencois.tur.br  │  │ - Auth, Storage, Realtime   │ │
│  │               │  │ - Atomic RPCs / RLS       │ │
│  └─────────────────┘  └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 2. DNS

No registrador do domínio, aponte para o IP da VPS:

| Tipo | Nome | Valor           | TTL  |
|------|------|-----------------|------|
| A    | @    | `IP_DA_VPS`     | 3600 |
| A    | www  | `IP_DA_VPS`     | 3600 |

Verifique propagação em [dnschecker.org](https://dnschecker.org).

---

## 3. Criar o recurso no Coolify

1. **+ New Resource → Public/Private Repository**
2. Cole a URL do repositório e escolha a branch (`main`)
3. **Build Pack**: `Dockerfile` (detectado automaticamente na raiz)
4. **Ports Exposes**: `80`

---

## 4. Variáveis de ambiente (Build Variables)

Adicione em **Environment Variables** e marque **"Build Variable"** — o Vite congela esses valores no bundle:

| Variável                        | Valor                                  |
|---------------------------------|----------------------------------------|
| `VITE_SUPABASE_URL`             | URL do projeto Lovable Cloud           |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Anon/Publishable key                   |
| `VITE_SUPABASE_PROJECT_ID`      | ID do projeto Lovable Cloud            |

O `Dockerfile` já declara `ARG` correspondentes e o Coolify injeta cada Build Variable como `--build-arg`.

> ⚠️ **Nunca** coloque `SUPABASE_SERVICE_ROLE_KEY` ou outros segredos aqui. Segredos servidor-side vivem apenas nas Edge Functions do Lovable Cloud.

Após alterar qualquer Build Variable → **Redeploy** completo (não basta restart).

---

## 5. Domínio HTTPS

Em **General → Domains**, defina:
```
https://lencois.tur.br
https://www.lencois.tur.br
```
O Coolify emite certificado via **Let's Encrypt** (Traefik). Requisitos:
- DNS propagado
- Portas 80 e 443 abertas (desafio HTTP-01)

Defina `https://lencois.tur.br` como primário e configure redirect `www → root`.

---

## 6. Deploy

1. Clique em **Deploy** e acompanhe **Deployments → Logs**.
2. Build multi-stage esperado:
   - Stage 1 (`oven/bun:1.1-alpine`): `bun install --frozen-lockfile` + `bun run build` → gera `/dist`
   - Stage 2 (`nginx:stable-alpine`): serve `/dist` em `/usr/share/nginx/html` na porta 80
3. Ao ficar **Running**, valide em https://lencois.tur.br

> O projeto usa **Bun** (`bun.lock`). Não substitua por `npm ci`/`pnpm install` no Dockerfile.

---

## 7. SPA routing e cache

O `nginx.conf` do projeto já cobre:
- Fallback SPA (`try_files $uri /index.html`) para React Router
- Cache longo em `/assets/*` (arquivos versionados pelo Vite)
- Headers básicos de segurança

Nenhuma configuração extra no Coolify para deep links / refresh.

---

## 8. Healthcheck e logs

**Healthcheck** (Configuration → Healthcheck):
- Path `/` • Port `80` • Interval `30s` • Timeout `10s` • Retries `3`
- Espera HTTP `200`. Já embutido no `Dockerfile` via `HEALTHCHECK`.

**Logs**:
- Build: Deployments → deploy → Logs
- Runtime (Nginx): Resource → Logs
- Erros 5xx: confirmar que `/dist/index.html` foi gerado e que as `VITE_SUPABASE_*` estavam no build

---

## 9. Atualizações e rollback

- **Auto Deploy on Push**: Configuration → General
- **Redeploy manual**: obrigatório após mudar Build Variables
- **Rollback**: histórico de deployments → Redeploy da versão anterior
- **Prune old images**: Configuration → Advanced (evita encher disco)

---

## 10. Backup / DR

**Frontend** (stateless): backup é o próprio repositório Git. Em perda da VPS:
1. Reprovisione Coolify em nova VPS
2. Recrie o recurso apontando para o mesmo repositório
3. Reponha as `VITE_SUPABASE_*` e redeploy

Faça backup da configuração do Coolify (Settings → Backups).

**Backend** (Lovable Cloud): Postgres, Storage (`tour-images`, `vouchers`, `company-documents`, `customer-documents`, `financeiro`, `avatars`) e Edge Functions ficam versionados no Cloud + repositório (`supabase/functions/*`). Export de dados: Cloud → Advanced settings → Export data.

---

## 11. Backend Self-hosted (Supabase em Docker)

O backend Supabase roda em containers Docker na mesma VPS:

### Serviços (em `/opt/supabase/docker/`)

| Serviço | Porta | Descrição |
|----------|-------|-----------|
| `studio` | 54323 | Interface Admin do Supabase |
| `postgres` | 5432 | Banco de dados principal |
| `kong` | 8000 | API Gateway |
| `auth` | 9999 | Autenticação (email/senha + Google) |
| `storage` | 5000 | Armazenamento de arquivos |
| `analytics` | 4000 | Analytics |

### Variáveis de Ambiente

```bash
# Em /opt/supabase/docker/.env
POSTGRES_PASSWORD=sua_senha_segura
ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
JWT_SECRET=seu_jwt_secret
SITE_URL=https://lencois.tur.br
ADDITIONAL_REDIRECT_URLS=https://bolao.ai.slz.br/auth/v1/callback
```

### Buckets de Storage

- `tour-images` — Imagens dos passeios
- `colaboradores` — Fotos de perfil da equipe
- `vouchers` — Vouchers gerados
- `company-documents` — Documentos da empresa
- `customer-documents` — Documentos dos clientes
- `financeiro` — Relatórios financeiros
- `avatars` — Avatares de usuários

### Google OAuth

O callback está hardcoded em `https://bolao.ai.slz.br/auth/v1/callback`. Para adicionar `lencois.tur.br`:
1. Acesse Google Cloud Console > APIs & Services > Credentials
2. Em OAuth 2.0 Client IDs, edite URIs de redirect autorizados
3. Adicione `https://lencois.tur.br/auth/v1/callback`

### Conexão do Frontend

O frontend aponta para o Supabase local via variáveis no build:

| Variável | Valor |
|----------|-------|
| `VITE_SUPABASE_URL` | `https://lencois.tur.br` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave anon do Supabase local |
| `VITE_SUPABASE_PROJECT_ID` | `lencoistur` |

---

## 12. Troubleshooting

| Sintoma | Causa provável | Ação |
|---|---|---|
| Build falha | Variáveis de build ausentes ou Dockerfile mal configurado | Verifique os ARG no build |
| Página em branco em produção | `VITE_SUPABASE_*` ausentes no build | Marque como Build Variable + Redeploy |
| 404 ao recarregar `/admin` | `nginx.conf` não copiado | Verifique stage 2 do Dockerfile |
| SSL não emite | DNS não propagou / porta 80 bloqueada | `dig lencois.tur.br`, libere 80/443 |
| CORS ou 401 no backend | Variáveis apontando para projeto errado | Conferência `VITE_SUPABASE_URL`/`_PUBLISHABLE_KEY` |
| Login 500 (NULL token) | Campos token ausentes na tabela `auth.users` | Execute seed/fix de tokens |
| 36 tabelas 403 (admin) | Permissões ausentes | Seed `user_management.permissions` com acesso total |
| FK duplicada | Constraint `contas_receber_booking_id_fkey` duplicada | Remova a FK redundante |
| Re-renders frequentes | Componentes sem React.memo | Aplicado em páginas admin de listas |
| Queries lentas | N+1 queries em loops | Otimizado com batch inserts e Promise.all |

### Comandos Úteis

```bash
# Ver logs do container
docker logs lencoistur
docker logs supabase-db

# Reiniciar container
docker restart lencoistur
docker-compose -f /opt/lencois/deploy/docker-compose.yml restart

# Acessar Postgres
docker exec -it supabase-db psql -U postgres -d postgres

# Verificar FKs
docker exec supabase-db psql -U postgres -d postgres -c "
SELECT conname FROM pg_constraint WHERE conrelid::regclass::text = 'contas_receber' AND contype = 'f';
"

# Rebuild sem cache
docker build --no-cache -t lencoistur:latest /opt/lencois/lencois-test
```

---

## 13. Segurança da VPS

- `apt update && apt upgrade -y` semanal
- **UFW**: libere apenas `22`, `80`, `443` (e `8000` restrito ao seu IP para o painel Coolify)
- SSH somente por chave, root desabilitado, considere **fail2ban**
- Painel Coolify: IP allowlist + 2FA

---

## 14. Checklist final

- [x] DNS `lencois.tur.br` e `www` configurado
- [x] Portas 80/5432 abertas no firewall (443 via Traefik)
- [x] Supabase self-hosted configurado em Docker
- [x] Frontend build com `VITE_SUPABASE_*` corretas
- [x] Domínios HTTPS adicionados no Coolify
- [x] Certificado Let's Encrypt emitido (Traefik)
- [x] Healthcheck configurado
- [x] Container rodando com Nginx
- [x] https://lencois.tur.br carregando corretamente
- [x] Login admin, reservas e checkout testados

---

## Arquivos relevantes

- `Dockerfile` — build multi-stage (node:20-alpine → nginx:stable-alpine)
- `nginx.conf` — fallback SPA + cache de assets versionados
- `docker-compose.yml` — orchestration do container frontend
- `/opt/supabase/docker/` — configuração do Supabase local
