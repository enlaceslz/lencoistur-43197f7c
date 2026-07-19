# 🏖️ LençóisTour – Sistema de Gestão de Turismo de Aventura

Sistema completo para operação de turismo de aventura na **Rota das Emoções – Lençóis Maranhenses, Santo Amaro – MA**, desenvolvido para a empresa **LENÇÓIS TOUR**.

> **URL de produção:** [lencois.tur.br](https://lencois.tur.br)
> **Backend:** Self-hosted Supabase (VPS Ubuntu 24.04, Docker, Coolify v4+, Traefik)

---

## 🌐 Idiomas Suportados

- 🇧🇷 Português (padrão)
- 🇺🇸 Inglês
- 🇪🇸 Espanhol

---

## 📦 Módulos do Sistema

### Frontend (Site Público)

| Funcionalidade | Descrição |
|----------------|-----------|
| Landing Page | Hero, galeria HD dos Lençóis Maranhenses, depoimentos, FAQ, parceiros |
| Catálogo de Passeios | Listagem com filtros, detalhes, imagens em alta resolução |
| Translados | Rotas com preços, veículo, distância e horários |
| Motor de Reservas | Checkout completo com geração de código PIX |
| Chatbot IA | Assistente virtual multilíngue (Lovable AI) |
| WhatsApp Float | Botão flutuante para contato rápido |
| Minhas Reservas | Consulta por código de reserva e e-mail |

### Painel Administrativo (`/admin`)

| Módulo | Rota | Descrição |
|--------|------|-----------|
| Dashboard | `/admin` | KPIs em tempo real, gráficos de receita e reservas |
| CRM – Clientes | `/admin/crm` | Gestão de clientes com filtros, exportação CSV, WhatsApp integrado |
| Reservas | `/admin/reservas` | Gestão de reservas, confirmação/cancelamento, status de pagamento. Inclui criação de reservas com relacionamento direto a clientes. |
| Passeios | `/admin/passeios` | CRUD com upload de imagens (URL ou arquivo, alta resolução) |
| Translados | `/admin/translados` | Gestão de rotas de transfer |
| Financeiro | `/admin/financeiro` | Relatórios financeiros e métricas |
| Colaboradores | `/admin/colaboradores` | Gestão de equipe, perfis e relatórios PDF profissionais (A4) com filtros |
| Parceiros | `/admin/parceiros` | CRUD de parceiros por tipo, ativação/desativação, busca avançada |
| Avaliações | `/admin/avaliacoes` | Reviews dos clientes |
| Marketing | `/admin/marketing` | Campanhas WhatsApp/E-mail, gestão de leads, remarketing |
| IA | `/admin/ia` | Configurações do chatbot IA |
| Configurações | `/admin/config` | Senha admin, upload de logo, configurações do site |
| Documentos | `/admin/documentos` | Repositório central de documentos e arquivos |

### SGS – Sistema de Gestão de Segurança (`/admin/sgs`)

Módulo de segurança em conformidade com **ABNT NBR ISO 21101, 21102, 21103** e exigências da **Devolutiva VATI**.

| Submódulo | Rota | Descrição |
|-----------|------|-----------|
| Dashboard | `/admin/sgs` | Indicadores de segurança, gráficos e alertas |
| Matriz de Riscos | `/admin/sgs/riscos` | Risco operacional (P×I=NR) – 9 etapas, 3 níveis |
| Incidentes | `/admin/sgs/incidentes` | Registro com fotos, severidade e ações tomadas |
| Ações Corretivas | `/admin/sgs/acoes` | Tratamento e acompanhamento de riscos |
| Equipe | `/admin/sgs/equipe` | Competência, treinamentos e certificações (ISO 21102) |
| Auditorias | `/admin/sgs/auditorias` | Auditorias internas com checklist e plano de melhoria |
| Fornecedores | `/admin/sgs/fornecedores` | Conformidade documental e veicular |
| Termos de Ciência | `/admin/sgs/termos` | Termos de risco com assinatura digital (P6) |
| Resumo/Briefings | `/admin/sgs/briefings` | Briefings de segurança pré-passeio |
| Pesquisas | `/admin/sgs/pesquisas` | Pesquisas de satisfação e segurança pós-passeio |

#### Automações SGS
- Risco NR ≥ 6 → ação corretiva automática
- Incidente grave → ação corretiva automática
- Fornecedor irregular → bloqueio automático

#### Classificação de Risco (NR = P × I)
| Nível | Faixa | Ação |
|-------|-------|------|
| 🟢 Aceitável | NR < 6 | Monitorar |
| 🟡 Temporário | 6 ≤ NR ≤ 11 | Ação corretiva obrigatória |
| 🔴 Inaceitável | NR ≥ 12 | Suspender atividade |

---

## 🗄️ Banco de Dados

### Tabelas Principais (17 tabelas com RLS ativo)

| Tabela | Descrição |
|--------|-----------|
| `customers` | Clientes (validação de email, nome, telefone, CPF) |
| `bookings` | Reservas com validação server-side (preço, quantidade, status) |
| `tours` | Catálogo de passeios com imagens e metadados |
| `transfer_routes` | Rotas de translado |
| `partners` | Parceiros e fornecedores |
| `reviews` | Avaliações dos clientes (leitura pública) |
| `user_roles` | Controle de acesso RBAC (admin/moderator/user) |

### Tabelas SGS (Segurança)

| Tabela | Descrição |
|--------|-----------|
| `sgs_risks` | Matriz de riscos operacionais |
| `sgs_incidents` | Registro de incidentes |
| `sgs_corrective_actions` | Ações corretivas |
| `sgs_risk_terms` | Termos de ciência de risco |
| `sgs_briefings` | Briefings de segurança |
| `sgs_staff` | Equipe operacional |
| `sgs_staff_trainings` | Treinamentos da equipe |
| `sgs_audits` | Auditorias internas |
| `sgs_audit_items` | Itens de checklist de auditoria |
| `sgs_supplier_compliance` | Conformidade de fornecedores |
| `sgs_safety_surveys` | Pesquisas de segurança pós-passeio |

---

## 🔒 Segurança

| Camada | Implementação |
|--------|---------------|
| Autenticação | Supabase Auth (email/senha) |
| Autorização | RBAC via tabela `user_roles` + função `has_role()` (SECURITY DEFINER) |
| RLS | Ativo em todas as 17 tabelas |
| Proteção de Rotas | Componente `AdminRoute` no frontend |
| Validação de Dados | Server-side via RLS policies (preço, status, formato) |
| Booking Code | Gerado por trigger (`LT-YYYYMMDD-XXXX`) anti-enumeração |
| Escalação de Privilégios | INSERT/UPDATE/DELETE bloqueados na tabela `user_roles` |
| Storage | Buckets `tour-images` e `colaboradores` para imagens e fotos de perfil |
| Rate Limiting | Traefik (Coolify): `/login` (5/min, burst 10), `/admin/*` (20/min, burst 40) e `/auth/v1/token` (10/min, burst 20) — mitigação de brute force |
| Headers Segurança | Traefik injeta `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, HSTS e `Permissions-Policy` em `/login` e `/admin` |

### Edge Functions
| Função | Descrição |
|--------|-----------|
| `chat` | Chatbot IA com Lovable AI Gateway |
| `create-booking` | Processamento seguro de novas reservas |
| `auth-email-hook` | Envio de e-mails transacionais e de autenticação customizados |

---

## 🛠️ Tecnologias

| Categoria | Stack |
|-----------|-------|
| Frontend | React 18, TypeScript 5, Vite 5, Tailwind CSS 3 |
| UI | shadcn/ui, Radix UI, Lucide Icons |
| Backend | Lovable Cloud (PostgreSQL, Auth, Edge Functions, Storage) |
| IA | Lovable AI (modelos Google/OpenAI) |
| i18n | i18next (PT/EN/ES) |
| Gráficos | Recharts |
| State | TanStack React Query |
| Validação | Zod |
| Formulários | React Hook Form |

---

## 🏗️ Arquitetura Técnica

O sistema utiliza uma arquitetura **Serverless** centrada no ecossistema Supabase:

1.  **Frontend SPA:** Construído com Vite + React, garantindo carregamento instantâneo e SEO otimizado.
2.  **Segurança (RLS):** Toda a lógica de acesso a dados é definida diretamente no banco (Row Level Security), impedindo acessos não autorizados mesmo se o frontend for comprometido.
3.  **Hooks Customizados:** Centralização da lógica de negócios em `src/hooks/` (ex: `useBookings`) para facilitar a manutenção e testes.
4.  **Componentização UI:** Utiliza a biblioteca baseada em Radix UI para garantir acessibilidade (WAI-ARIA) e consistência visual.

---

## 🚀 Como Executar

```bash
npm install
npm run dev
```

Acesse: `http://localhost:8080`

---

## 🌐 Deploy em VPS (Ubuntu/Debian)

Caso seja necessário hospedar o frontend fora da Lovable Cloud em um servidor próprio:

### 1. Pré-requisitos
- Node.js 20+ e NPM/Bun
- Servidor Web (Nginx recomendado)

### 2. Build do Projeto
```bash
npm install
npm run build
```
Os arquivos estáticos serão gerados na pasta `dist/`.

### 3. Configuração do Nginx
Crie um arquivo em `/etc/nginx/sites-available/lencoistur`:
```nginx
server {
    listen 80;
    server_name seu-dominio.com;
    root /var/www/lencoistur/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 4. Variáveis de Ambiente
Certifique-se de que as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estão configuradas no ambiente de build ou no arquivo `.env.production`.

---

## 📋 Normas de Referência

- **ABNT NBR ISO 21101** – Sistema de Gestão de Segurança para Turismo de Aventura
- **ABNT NBR ISO 21102** – Competência dos Líderes de Turismo de Aventura
- **ABNT NBR ISO 21103** – Informações aos Participantes de Turismo de Aventura
- **Devolutiva VATI** – Plano de Ação para Segurança Turística

---

## ⚡ Otimizações de Performance

### Frontend
- `React.memo` aplicado em componentes de lista em páginas admin (CRM, Colaboradores, Passeios, Documentos, Avaliações, Translados, Pacotes, SGS)
- Sidebar memoizado com `isActive` prop
- `AdminRoute` memoizado para evitar re-renders desnecessários

### Backend (Supabase)
- **Operações transacionais atômicas via RPC (SECURITY DEFINER):**
  - `confirm_payment_transaction(p_booking_id, p_group_id)` — atualiza status + batch insert `contas_receber` em uma transação; ignora duplicatas via `NOT EXISTS`
  - `cancel_booking_transaction(p_booking_id, p_group_id)` — cancela reserva + atualiza `contas_receber` atomicamente
  - `update_booking_customer_transaction(p_booking_id, p_customer_id, p_customer_data, p_items, p_companions)` — sincroniza customer, itens (insert/update/delete), dependentes em transação única
  - `mark_term_signed_transaction(p_booking_id)` — upsert atômico em `sgs_risk_terms` (unique constraint em `booking_id`)
  - `complete_booking_transaction(p_booking_id)` — marca "concluída" + gera comissões/parcelas com `FOR UPDATE` lock
  - `delete_booking_transaction(p_booking_id, p_group_id)` — deleta financeiro → booking em ordem respeitando FKs, tudo atomicamente
- **Eliminação de N+1 queries em `useBookings.ts`:**
  - `confirmPayment`: batch insert de `contas_receber` (antes 1 query por item)
  - `updateBooking`: batch insert + `Promise.all` para updates
  - `completeBooking`: paralelização de queries com `Promise.all`
  - `addBooking`: `confirmPayment` em paralelo via `Promise.allSettled` (tolerância a falha parcial)
- **Substituição de `select("*")` por colunas explícitas em:**
  - `AdminFinanceiro.tsx`, `AdminRelatorios.tsx`, `AdminReservas.tsx`
  - `ToursPage.tsx`, `TourDetail.tsx`
- **Constraint única em `sgs_risk_terms.booking_id`** para evitar termos duplicados
- **Verificação de duplicata no DB** (AdminReservas) em vez de estado local stale

### Infraestrutura
- Nginx com headers de cache para assets estáticos
- Build Docker multi-stage (node:20-alpine → nginx:stable-alpine)

---

## 🚀 Migration SQL Recente

**20260715000001_atomic_booking_ops.sql**

Adiciona 4 funções RPC SECURITY DEFINER para operações atômicas:

- **`confirm_payment_transaction(p_booking_id, p_group_id)`** — Atualiza status + batch insert `contas_receber` (evita duplicatas)
- **`cancel_booking_transaction(p_booking_id, p_group_id)`** — Cancela reserva + atualiza `contas_receber`
- **`update_booking_customer_transaction(p_booking_id, p_customer_id, p_customer_data, p_items, p_companions)`** — Sincroniza customer, itens, dependentes em uma única transação
- **`mark_term_signed_transaction(p_booking_id)`** — Upsert atômico em `sgs_risk_terms` (novo unique constraint em `booking_id`)

**20260715000002_complete_delete_rpc.sql**

Adiciona:

- **`complete_booking_transaction(p_booking_id)`** — Marca "concluída" + gera comissões/parcelas
- **`delete_booking_transaction(p_booking_id, p_group_id)`** — Deleta registros financeiros na ordem correta de chave estrangeira

Todas functions concedidas a `authenticated` (e `anon` conforme necessário).

O frontend (`src/hooks/useBookings.ts`) utiliza agora os RPCs transacionais, eliminando `N+1` e falhas nas transações financeiras.

---

## 🛠️ Histórico de Manutenção

### 2026-07-18 – Correções de acesso e mídia

- **Módulo Pacotes (`AdminPacotes.tsx`):** o botão "Salvar Alterações" ficava fora da área visível em telas menores (dentro de um formulário com `overflow-y-auto` dentro de `DialogContent` com `overflow-hidden`). Corrigido tornando a barra de ações (`Cancelar`/`Salvar`) `sticky bottom-0` com fundo sólido e sombra, e removido o `pb-20` compensatório da coluna lateral.
- **Storage (`tour-images`):** adicionada policy de leitura pública (`Public read tour images` — `SELECT` para `anon` e `authenticated`), ausente anteriormente. Sem ela, as imagens dos passeios não eram servidas anonimamente.
- **Catálogo de Passeios (`tours`):** os registros estavam com `images = {}` (vazio). Foram populadas as imagens de capa de cada passeio (`caiaque`, `lagoas-azuis`, `quadriciclo`, `ecologico`, `gastronomico`) no bucket `tour-images`, com as URLs gravadas em `tours.images`.
- **Usuário administrador:** criado usuário de autenticação (`auth.users`) vinculado ao perfil em `user_management` e autorizado via `user_roles` (`admin` + `tenant_admin`). Observação: `auth.users.role` deve permanecer `authenticated` (o Supabase usa esse valor como database role no JWT); a autorização de aplicação é feita pela função `has_role()` sobre `user_roles`.

### Notas de deploy

As alterações de código (`src/pages/AdminPacotes.tsx`) exigem `npm run build` e reimplantação do container que serve `lencois.tur.br` para chegarem ao ambiente de produção. As correções de banco/storage (policies, `tours.images`, usuário) foram aplicadas diretamente na instância de produção.

---

## ⚡ Otimizações de Performance (manutenção 2026-07-19)

### Aplicado nesta sessão
- **Home – `ToursSection.tsx`:** substituído `select("*")` por colunas explícitas (`id, slug, name, description, location, duration, rating, reviews_count, price, private_price, partner_price, mode_collective_enabled, mode_private_enabled, pix_discount, tag, images`). A home deixou de baixar `includes`/`highlights`/campos longos de todos os passeios.
- **Home – `PackagesSection.tsx`:** substituído `select("*")` por colunas explícitas em `public_packages`.
- Consultas já otimizadas (não mexer): `useBookings` (RPC atômicas, `staleTime`, realtime dedup), `useSiteSettings` e `usePartnersData` (React Query com cache compartilhado).

### Aplicado (admin, 2026-07-19)
- `AdminTranslados`: `select("*")` → colunas explícitas em `transfer_routes`.
- `AdminPasseios`: `select("*")` → colunas explícitas em `tours` (lista + edição cobertas).
- `useNotifications`: update incremental via realtime (sem refetch completo).

### Recomendações pendentes (requerem refatoração de formulário)
- `AdminCRM` (`customers`) e `AdminColaboradores` (`collaborators`): usam `payload = { ...form }` no upsert, então reduzir o `select` exige antes tornar o payload explícito — manter `select("*")` até refatorar.
- Módulos SGS (`sgs_risks`, `sgs_incidents`, `sgs_staff`, etc.): listagens com `select("*")`; reduzir colunas onde o formulário usar payload explícito.
- Migrar listas admin de `useEffect`+`useState` para `useQuery` (cache + dedup).
- Padronizar paginação/limite em listas grandes.

---

## 🔍 Revisão de Código (manutenção 2026-07-19)

### Aplicado
- **`AboutSection.tsx`:** removido `dangerouslySetInnerHTML` (XSS potencial via i18n) — passou a usar `<Trans>` com componente `strong`, renderização segura.
- **`AdminConfig.tsx`:** `JSON.parse(localStorage)` envolto em `try/catch` (evita crash se o `backup_history` estiver corrompido).

### Segurança — verificado (OK)
- Nenhum segredo/chave (`service_role`, JWT) commitado; `.env` está no `.gitignore`.
- Autenticação via client Supabase (sem token manual em `localStorage`/`sessionStorage`); `localStorage` usado apenas para UI (sidebar, cookie consent, backup metadata).
- Sem `eval`/`new Function`/`innerHTML`.
- **Rate limiting em produção (Traefik/Coolify):** implantado `lencois-ratelimit.yaml` em `/data/coolify/proxy/dynamic/` (arquivo separado do `lencois.yaml` gerenciado pelo Coolify, para não ser sobrescrito). Protege `/login` (5 req/min, burst 10), `/admin/*` (20 req/min, burst 40) e `/auth/v1/token` (10 req/min, burst 20) contra brute force; injeta ainda headers de segurança (`X-Frame-Options`, `X-Content-Type-Options`, HSTS, `Referrer-Policy`). Testado: burst gera `429`.

### Qualidade / débito técnico (recomendações)
- Uso generalizado de `any` (pior em `AdminRelatorios` 33, `AdminSGSTermos` 24, `AdminReservas` 18, `AdminPacotes` 17, `AdminConfig` 17). Tipar payloads/retornos do Supabase reduziria erros em runtime.
- `dangerouslySetInnerHTML` remanescente em `components/ui/chart.tsx` (estilos do Recharts — padrão da lib, baixo risco).
- Validação de entrada confia em `toast` no frontend; regras críticas (preço, CPF) devem continuar validadas server-side via RLS (já ativo).

---

## 🎨 UI/UX (manutenção 2026-07-19)

### Aplicado
- **`AdminLogin.tsx`:** `autoComplete="email"` → `autoComplete="username"` no campo de e-mail (prática recomendada para formulários de login; elimina o aviso de acessibilidade "Password forms should have username fields" do Chrome e melhora o preenchimento automático/gerenciadores de senha).
- **`AdminPasseios.tsx`:** `loading="lazy"` na miniatura de imagem na tabela de passeios (lazy-load em listagens).

### Verificado (boas práticas já presentes)
- Imagens com `alt` em toda a UI pública e admin.
- `AdminLogin`: labels associadas (`htmlFor`), `aria-label` no toggle de senha, foco visível (`focus:ring`), responsivo (`max-w-md` + `px-4`), estados de loading/erro.
- Ícones decorativos com `pointer-events-none` (não interceptam clique).

### Recomendações
- Adotar `focus-visible:` consistente em todos os botões/links (além de `focus:`).
- Garantir contraste AA em textos `muted-foreground` sobre fundos claros.
- Testar fluxos com navegação por teclado e leitor de tela (NVDA/VoiceOver).

---

## 🛡️ Tratamento de Erros (manutenção 2026-07-19)

### Aplicado
- **`AdminConfig.tsx` (`handleRestore`):** `JSON.parse` do arquivo de backup agora tem tratamento específico — JSON malformado retorna mensagem amigável ("Arquivo de backup corrompido ou inválido") em vez de erro genérico.

### Verificado (já robusto)
- `AIChatbot.tsx`: try/catch no `fetch` (streaming SSE) + `JSON.parse` por linha, com mensagem amigável (`chatbot.error`).
- `CookieConsentBanner.tsx`: `JSON.parse(localStorage)` com fallback para reexibir o banner.
- `AdminParceiros.lookupCnpj`: try/catch com mensagem "CNPJ não encontrado na base da Receita Federal".
- `AdminCRM.handleCepSearch` / `AdminColaboradores.handleCepSearch`: try/catch (ViaCEP).
- `AdminConfig`: backup/restore e upload com try/catch, mensagens `toast`, `finally` para reset de loading, confirmações destrutivas via `window.confirm`.

### Recomendações
- Padronizar mensagens de erro em um helper `getErrorMessage(err)` (evita expor stack traces internos ao usuário).
- Substituir `window.confirm` por diálogos acessíveis (o `Dialog` já existe no projeto).
- Validar respostas de APIs externas (ViaCEP/BrasilAPI) antes de espalhar nos formulários.

---

## 🧩 Componentização (manutenção 2026-07-19)

### Aplicado
- Criado `src/components/StatCard.tsx` — componente reutilizável de responsabilidade única para exibir métricas (ícone, valor, label, descrição). Substitui o JSX inline duplicado nas páginas admin.
- `AdminTranslados.tsx` e `AdminPacotes.tsx`: grids de estatísticas refatorados para usar `<StatCard>` (menos duplicação, SRP).
- `AdminParceiros.tsx` mantido com seu estilo próprio de cards (gradiente colorido) — não forçado ao padrão genérico para preservar o design.

### Recomendações (refatoração maior, fora do escopo pontual)
- `AdminCRM` (1656 linhas), `AdminConfig` (2092), `AdminColaboradores` (1269), `AdminPasseios` (1327): dividir em subcomponentes (formulários, modais, tabelas) e extrair hooks de dados (`useXData`) já iniciado em `usePartnersData`.
- Extrair componentes de tabela genéricos (`DataTable`) reutilizáveis entre módulos admin.
- Mover lógica de backup/restore de `AdminConfig` para um hook/módulo dedicado.

## 🔒 Módulo SGS – Revisão de Segurança e Qualidade (2026-07-19)

### Aplicado
- **`AdminSGSDashboard.tsx`:** reduzido `select("*")` para colunas explícitas em 6 das 13 queries do dashboard (sgs_risks, sgs_incidents, sgs_corrective_actions, sgs_staff_trainings, sgs_veiculos, sgs_condutores). `sgs_condutores` passou a usar `{ count: "exact", head: true }` (zero dados transferidos, apenas contagem). Redução de carga no primeiro acesso ao dashboard SGS.

### Segurança — verificado (OK)
- **RLS ativo** em todas as 22 tabelas SGS verificadas (`pg_policies`). Confirma a documentação anterior.
- Sem `dangerouslySetInnerHTML`, `eval`, `innerHTML` em nenhuma página SGS.
- Nenhum segredo/chave exposto no frontend SGS.
- Termos de risco (`sgs_risk_terms` / `sgs_risk_term_minors`): FK `ON DELETE CASCADE` ativo — exclusão de termo limpa dependentes automaticamente.
- Geração de PDF usa template strings com dados do banco (assinaturas em base64 via `img src`) — risco controlado, sem entrada de usuário maliciosa.

### Qualidade (recomendações)
- **Uso excessivo de `any`** (piores: `AdminSGSTermos` 24, `AdminSGSDashboard` 16, `AdminSGSFornecedores` 1). Muitos casts `as any` no upsert — tipar com `Database['public']['Tables']['sgs_*']['Row']` reduziria erros de runtime.
- **`select("*")` remanescente** em 12 páginas SGS (justificado na maioria porque formulários de edição usam `{ ...form }` no upsert). Exceto `AdminSGSTermos` (linha 97-102) onde o `select("*")` em `customers` + `tours` + `veiculos` + `empresa` + `bookings` carrega dados desnecessários para a listagem (só `name` e `cpf` são usados na tabela).
- **`window.confirm`** em operações destrutivas (exclusão de termo, incidente, risco) — substituir por `Dialog` nativo do projeto melhoraria acessibilidade e consistência.
- **Transações atômicas:** exclusão de termo (linha 197-200) deleta minors manualmente antes do termo — redundante com CASCADE, mas código seguro. Ideal seria usar RPC `SECURITY DEFINER`.

---

## 📄 Licença

Projeto proprietário – **LENÇÓIS TOUR** © 2026. Todos os direitos reservados.
