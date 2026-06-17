# Deploy no Coolify (VPS) — lencois.tur.br

Este guia descreve como realizar o deploy da aplicação **LençóisTour** em uma VPS gerenciada pelo **Coolify**, usando Docker, com o domínio **https://lencois.tur.br**.

---

## 1. Pré-requisitos

- VPS Linux (Ubuntu 22.04+ recomendado) com:
  - Mínimo 2 vCPU / 4 GB RAM / 40 GB SSD
  - Portas **80** e **443** liberadas no firewall
  - IPv4 público fixo
- **Coolify v4+** instalado e rodando na VPS
- Acesso ao repositório Git do projeto (público ou via deploy key)
- Domínio **lencois.tur.br** registrado, com acesso ao painel de DNS

### Instalação rápida do Coolify (caso ainda não tenha)
```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```
Após a instalação, acesse `http://SEU_IP_VPS:8000` para concluir o setup inicial.

---

## 2. Configuração de DNS para `lencois.tur.br`

No painel do seu registrador (Registro.br ou outro), adicione os registros apontando para o IP da VPS:

| Tipo  | Nome | Valor              | TTL  |
|-------|------|--------------------|------|
| A     | @    | `IP_DA_SUA_VPS`    | 3600 |
| A     | www  | `IP_DA_SUA_VPS`    | 3600 |

> A propagação pode levar de alguns minutos até 24h. Verifique em [dnschecker.org](https://dnschecker.org).

---

## 3. Criar o recurso no Coolify

1. Acesse o painel do Coolify e selecione (ou crie) um **Project** e um **Environment** (ex.: `production`).
2. Clique em **+ New Resource → Public Repository** (ou **Private Repository** com deploy key).
3. Cole a URL do repositório Git do projeto.
4. Em **Build Pack**, selecione **Dockerfile** — o Coolify detectará o `Dockerfile` na raiz automaticamente.
5. Em **Branch**, selecione a branch de produção (ex.: `main`).
6. Em **Ports Exposes**, confirme `80` (porta exposta pelo Nginx dentro do container).

---

## 4. Variáveis de Ambiente

Em **Environment Variables**, adicione as variáveis abaixo (necessárias em build-time pelo Vite — marque a opção **"Build Variable"** para cada uma):

| Variável                          | Valor                                                    |
|-----------------------------------|----------------------------------------------------------|
| `VITE_SUPABASE_URL`               | URL do projeto Supabase (Lovable Cloud)                  |
| `VITE_SUPABASE_PUBLISHABLE_KEY`   | Anon/Publishable key do Supabase                         |
| `VITE_SUPABASE_PROJECT_ID`        | ID do projeto Supabase                                   |

> ⚠️ Estas variáveis precisam estar disponíveis **durante o build** (Vite injeta os valores nos assets estáticos). Caso altere alguma, é necessário fazer um **Redeploy** (build completo), não apenas restart.

Nunca cadastre secrets do tipo service-role ou chaves privadas aqui — elas devem ficar apenas em Edge Functions/servidor.

---

## 5. Configurar o domínio `lencois.tur.br`

1. Na aba **General / Domains** do recurso no Coolify, defina os FQDNs:
   ```
   https://lencois.tur.br
   https://www.lencois.tur.br
   ```
2. O Coolify provisiona automaticamente certificado SSL via **Let's Encrypt** (Traefik). Garanta que:
   - O DNS já propagou para o IP da VPS
   - As portas **80** e **443** estão abertas (necessárias para o desafio HTTP-01)
3. Opcionalmente, defina `https://lencois.tur.br` como domínio primário e configure redirect `www → root` (ou vice-versa).

---

## 6. Deploy

1. Clique em **Deploy** e acompanhe os logs em **Deployments → Logs**.
2. Build esperado (multi-stage):
   - Stage 1 (`node:20-slim`) → `pnpm install --frozen-lockfile` + `pnpm run build` (Vite gera `/dist`)
   - Stage 2 (`nginx:stable-alpine`) → serve `/dist` em `/usr/share/nginx/html` na porta 80
3. Após o status ficar **Running**, acesse https://lencois.tur.br para validar.

> Observação: o projeto usa **pnpm** (via `corepack`). Não substitua por `npm ci` no Dockerfile — o `pnpm-lock.yaml` é a fonte de verdade.

---

## 7. SPA Routing e cache (já configurado)

O `nginx.conf` incluso no projeto cuida de:
- **Fallback SPA** (`try_files $uri /index.html`) — necessário para React Router
- Cache longo para assets versionados em `/assets/*`
- Headers básicos de segurança

Nenhuma configuração extra é necessária no Coolify para deep links funcionarem após refresh.

---

## 8. Healthcheck e logs

### Healthcheck (Coolify → Configuration → Healthcheck)
- **Path**: `/`  • **Port**: `80`
- **Interval**: `30s` • **Timeout**: `10s` • **Retries**: `3`
- Espera-se HTTP `200` retornando o `index.html`.

### Logs
- **Build logs**: Coolify → Deployments → selecione o deploy → **Logs**
- **Runtime logs** (Nginx): Coolify → Resource → **Logs** (stdout/stderr do container)
- Para erros 5xx persistentes, verifique se o build gerou `/dist/index.html` e se as variáveis `VITE_SUPABASE_*` estavam presentes **no momento do build**.

---

## 9. Atualizações futuras

- **Auto Deploy on Push**: ative em **Configuration → General** para que cada push na branch de produção dispare um novo build.
- **Manual Redeploy**: use sempre que alterar variáveis de ambiente marcadas como Build Variable (Vite congela esses valores no bundle).
- **Rollback**: o Coolify mantém histórico de deployments — clique em uma versão anterior e use **Redeploy** para reverter.
- **Limpeza**: ative **Configuration → Advanced → Prune old images** para evitar enchimento do disco da VPS.

---

## 10. Backup e Disaster Recovery

### Frontend (VPS / Coolify)
- O frontend é stateless — o "backup" é o próprio repositório Git. Em caso de perda da VPS:
  1. Reprovisione o Coolify em nova VPS.
  2. Recrie o recurso apontando para o mesmo repositório e branch.
  3. Recoloque as variáveis `VITE_SUPABASE_*` e refaça o deploy.
- Faça backup periódico da **configuração do Coolify** (Settings → Backups).

### Backend (Lovable Cloud)
- Backups automáticos do PostgreSQL são gerenciados pelo Lovable Cloud.
- Storage buckets (`tour-images`, `vouchers`, `company-documents`, `customer-documents`, `financeiro`, `avatars`) ficam no Lovable Cloud — sem backup local necessário.
- Edge Functions ficam versionadas no repositório (`supabase/functions/*`).

---

## 11. Backend (Lovable Cloud)

Este deploy contempla apenas o **frontend** (SPA estática servida pelo Nginx). O backend permanece no **Lovable Cloud**:
- PostgreSQL + RLS (todas as tabelas com políticas default-deny)
- Edge Functions (`catalog-pricing`, `create-booking`, `handle-public-term`, `send-term-email`, `ai-analysis`, `chat`)
- Auth e Storage

Não é necessário hospedar backend na VPS. As variáveis `VITE_SUPABASE_*` devem apontar para o projeto Cloud correto.

---

## 12. Troubleshooting

| Sintoma | Causa provável | Ação |
|---|---|---|
| Build falha em `pnpm install` | Lockfile desatualizado | Rode `pnpm install` localmente, commit `pnpm-lock.yaml` |
| Página em branco em produção | `VITE_SUPABASE_*` ausentes no build | Marque como **Build Variable** e faça **Redeploy** |
| 404 ao recarregar `/admin` | `nginx.conf` não foi copiado | Verifique stage 2 do Dockerfile e refaça build |
| SSL não emite | DNS não propagou ou porta 80 bloqueada | `dig lencois.tur.br`, libere 80/443 no firewall |
| CORS/401 ao chamar backend | URL/Anon key apontando para projeto errado | Confira `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` |
| Edge Function 500 | Função fora do Lovable Cloud | Verifique no painel Lovable Cloud |
| Container reinicia em loop | OOM | Suba a VPS para 4 GB+ ou aumente swap |

---

## 13. Segurança da VPS

- Mantenha o SO atualizado: `apt update && apt upgrade -y` (semanal).
- Use **UFW**: libere apenas `22`, `80`, `443` (e `8000` apenas do seu IP, para o painel Coolify).
- Desative login root por senha — use chaves SSH e considere **fail2ban**.
- Proteja o painel Coolify (`:8000`) com IP allowlist e 2FA.

---

## 14. Checklist final

- [ ] DNS `lencois.tur.br` e `www.lencois.tur.br` → IP da VPS
- [ ] Portas 80/443 abertas no firewall da VPS
- [ ] Variáveis `VITE_SUPABASE_*` configuradas como **Build Variables**
- [ ] Domínios HTTPS adicionados no Coolify
- [ ] Certificado Let's Encrypt emitido com sucesso
- [ ] Healthcheck configurado (`/` na porta 80)
- [ ] Auto Deploy on Push habilitado
- [ ] Backup do Coolify configurado
- [ ] Firewall da VPS endurecido (UFW + SSH com chave)
- [ ] https://lencois.tur.br carregando a aplicação
- [ ] Login admin, reservas e checkout testados em produção

---

## Arquivos relevantes
- `Dockerfile` — build multi-stage (Node 20 slim + pnpm → Nginx Alpine)
- `nginx.conf` — fallback SPA + cache de assets
- `.env` — gerenciado pelo Lovable Cloud (não comitar em produção)
- `pnpm-lock.yaml` — fonte de verdade para reprodutibilidade do build
