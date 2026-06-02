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
2. Build esperado:
   - Stage 1: `node:20-alpine` → `npm ci` + `npm run build` (Vite gera `/dist`)
   - Stage 2: `nginx:alpine` serve `/dist` na porta 80
3. Após o status ficar **Running**, acesse https://lencois.tur.br para validar.

---

## 7. SPA Routing e cache (já configurado)

O `nginx.conf` incluso no projeto cuida de:
- **Fallback SPA** (`try_files $uri /index.html`) — necessário para React Router
- Cache longo para assets versionados em `/assets/*`
- Headers básicos de segurança

Nenhuma configuração extra é necessária no Coolify para deep links funcionarem após refresh.

---

## 8. Atualizações futuras

- **Auto Deploy on Push**: ative em **Configuration → General** para que cada push na branch de produção dispare um novo build.
- **Manual Redeploy**: use sempre que alterar variáveis de ambiente marcadas como Build Variable.
- **Rollback**: o Coolify mantém histórico de deployments — clique em uma versão anterior e use **Redeploy** para reverter.

---

## 9. Backend (Lovable Cloud / Supabase)

Este deploy contempla apenas o **frontend** (SPA estática servida pelo Nginx). O backend permanece no **Lovable Cloud** (Supabase gerenciado):
- Banco de dados PostgreSQL + RLS
- Edge Functions (`catalog-pricing`, `create-booking`, `handle-public-term`, `send-term-email`, `ai-analysis`, `chat`)
- Auth e Storage

Não é necessário hospedar o Supabase na VPS. Apenas certifique-se de que as variáveis `VITE_SUPABASE_*` apontam para o projeto Cloud correto.

Se desejar migrar o backend para self-hosted (Supabase OSS no Coolify), será necessário um guia separado e adaptações no projeto.

---

## 10. Checklist final

- [ ] DNS `lencois.tur.br` e `www.lencois.tur.br` → IP da VPS
- [ ] Portas 80/443 abertas no firewall da VPS
- [ ] Variáveis `VITE_SUPABASE_*` configuradas como Build Variables
- [ ] Domínios HTTPS adicionados no Coolify
- [ ] Certificado Let's Encrypt emitido com sucesso
- [ ] https://lencois.tur.br carregando a aplicação
- [ ] Login admin, reservas e checkout testados em produção

---

## Arquivos relevantes
- `Dockerfile` — build multi-stage (Node 20 → Nginx Alpine)
- `nginx.conf` — fallback SPA + cache de assets
- `.env` — gerenciado pelo Lovable Cloud (não comitar manualmente em produção)
