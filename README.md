# 🏖️ LençóisTour – Sistema de Gestão de Turismo de Aventura

Sistema completo para operação de turismo de aventura na **Rota das Emoções – Lençóis Maranhenses, Santo Amaro – MA**, desenvolvido para a empresa **LENÇÓIS TOUR**.

> **URL de produção:** [lencoistur.lovable.app](https://lencoistur.lovable.app)

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
| Reservas | `/admin/reservas` | Gestão de reservas, confirmação/cancelamento, status de pagamento |
| Passeios | `/admin/passeios` | CRUD com upload de imagens (URL ou arquivo, alta resolução) |
| Translados | `/admin/translados` | Gestão de rotas de transfer |
| Financeiro | `/admin/financeiro` | Relatórios financeiros e métricas |
| Parceiros | `/admin/parceiros` | CRUD de parceiros por tipo, ativação/desativação, busca avançada |
| Avaliações | `/admin/avaliacoes` | Reviews dos clientes |
| Marketing | `/admin/marketing` | Campanhas WhatsApp/E-mail, gestão de leads, remarketing |
| IA | `/admin/ia` | Configurações do chatbot IA |
| Configurações | `/admin/config` | Senha admin, upload de logo, configurações do site |

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
| Storage | Bucket `tour-images` público para leitura, upload restrito |

### Edge Functions
| Função | Descrição |
|--------|-----------|
| `chat` | Chatbot IA com Lovable AI Gateway |

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

## 📄 Licença

Projeto proprietário – **LENÇÓIS TOUR** © 2026. Todos os direitos reservados.
