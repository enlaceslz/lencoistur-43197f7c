# Deploy no Coolify (VPS) — lencois.tur.br

Guia de deploy da aplicação **LençóisTour** em VPS gerenciada pelo **Coolify**, usando Docker + Bun + Nginx, para o domínio **https://lencois.tur.br**.

> Backend (Postgres, Auth, Storage, Edge Functions) permanece no **Lovable Cloud**. Este deploy hospeda apenas a SPA estática.

---

## 1. Pré-requisitos

- VPS Linux (Ubuntu 22.04+): 2 vCPU / 4 GB RAM / 40 GB SSD
- Portas **80** e **443** liberadas
- **Coolify v4+** instalado
- Acesso ao repositório Git (público ou via deploy key)
- Domínio **lencois.tur.br** com acesso ao DNS

Instalação rápida do Coolify:
```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
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

## 11. Backend (Lovable Cloud)

- Postgres + RLS default-deny em todas as tabelas
- Edge Functions: `catalog-pricing`, `create-booking`, `handle-public-term`, `send-term-email`, `ai-analysis`, `chat`
- Auth (email/senha + Google) e Storage

Não replique o backend na VPS. Apenas garanta que as `VITE_SUPABASE_*` apontem para o projeto Cloud correto.

---

## 12. Troubleshooting

| Sintoma | Causa provável | Ação |
|---|---|---|
| Build falha em `bun install` | Lockfile desatualizado | Rode `bun install` local e commit `bun.lock` |
| Página em branco em produção | `VITE_SUPABASE_*` ausentes no build | Marque como Build Variable + Redeploy |
| 404 ao recarregar `/admin` | `nginx.conf` não copiado | Verifique stage 2 do Dockerfile |
| SSL não emite | DNS não propagou / porta 80 bloqueada | `dig lencois.tur.br`, libere 80/443 |
| CORS ou 401 no backend | Vars apontando para projeto errado | Confira `VITE_SUPABASE_URL`/`_PUBLISHABLE_KEY` |
| Edge Function 500 | Erro na função no Cloud | Veja logs no painel Lovable Cloud |
| Container em restart loop (OOM) | RAM insuficiente | Suba VPS para 4 GB+ ou adicione swap |

---

## 13. Segurança da VPS

- `apt update && apt upgrade -y` semanal
- **UFW**: libere apenas `22`, `80`, `443` (e `8000` restrito ao seu IP para o painel Coolify)
- SSH somente por chave, root desabilitado, considere **fail2ban**
- Painel Coolify: IP allowlist + 2FA

---

## 14. Checklist final

- [ ] DNS `lencois.tur.br` e `www` apontando para o IP da VPS
- [ ] Portas 80/443 abertas no firewall
- [ ] `VITE_SUPABASE_*` configuradas como **Build Variables**
- [ ] Domínios HTTPS adicionados no Coolify
- [ ] Certificado Let's Encrypt emitido
- [ ] Healthcheck respondendo em `/` porta 80
- [ ] Auto Deploy on Push habilitado
- [ ] Backup do Coolify configurado
- [ ] VPS endurecida (UFW + SSH por chave)
- [ ] https://lencois.tur.br carregando corretamente
- [ ] Login admin, reservas e checkout testados em produção

---

## Arquivos relevantes

- `Dockerfile` — build multi-stage (Bun 1.1 Alpine → Nginx Alpine)
- `nginx.conf` — fallback SPA + cache de assets versionados
- `bun.lock` — fonte de verdade para reprodutibilidade do build
- `.env` — gerenciado pelo Lovable Cloud (não versionar em produção)
