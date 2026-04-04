# Lençóis Tour - Sistema de Gestão de Turismo de Aventura

Sistema completo para operação de turismo de aventura na **Rota das Emoções – Lençóis Maranhenses**, desenvolvido para a empresa **LENÇÓIS TOUR**.

## 🌐 Idiomas Suportados

- 🇧🇷 Português (padrão)
- 🇺🇸 Inglês
- 🇪🇸 Espanhol

## 📦 Módulos do Sistema

### Frontend (Site Público)
- **Landing Page** com hero, galeria, depoimentos, FAQ
- **Catálogo de Passeios** com filtros e detalhes
- **Translados** com rotas e preços
- **Motor de Reservas** com checkout e pagamento PIX
- **Chatbot IA** assistente virtual multilíngue
- **WhatsApp Float** para contato rápido
- **Minhas Reservas** consulta por código/email

### Painel Administrativo (`/admin`)

| Módulo | Rota | Descrição |
|--------|------|-----------|
| Dashboard | `/admin` | Visão geral com KPIs e gráficos |
| CRM | `/admin/crm` | Gestão de clientes |
| Reservas | `/admin/reservas` | Gestão de reservas e pagamentos |
| Passeios | `/admin/passeios` | Cadastro e gestão de passeios |
| Translados | `/admin/translados` | Rotas de transfer |
| Financeiro | `/admin/financeiro` | Relatórios financeiros |
| Parceiros | `/admin/parceiros` | Gestão de parceiros |
| Avaliações | `/admin/avaliacoes` | Reviews dos clientes |
| Marketing | `/admin/marketing` | Campanhas e analytics |
| IA | `/admin/ia` | Configurações do chatbot IA |
| Configurações | `/admin/config` | Configurações gerais |

### SGS – Sistema de Gestão de Segurança (`/admin/sgs`)

Módulo de segurança conforme normas **ABNT NBR ISO 21101, 21102 e 21103**.

| Submódulo | Rota | Descrição |
|-----------|------|-----------|
| Dashboard | `/admin/sgs` | Indicadores de segurança e gráficos |
| Riscos | `/admin/sgs/riscos` | Matriz de risco operacional (P×I=NR) |
| Incidentes | `/admin/sgs/incidentes` | Registro de incidentes e quase-acidentes |
| Ações Corretivas | `/admin/sgs/acoes` | Tratamento de riscos identificados |
| Equipe | `/admin/sgs/equipe` | Competência e treinamentos (ISO 21102) |
| Auditorias | `/admin/sgs/auditorias` | Auditorias internas de segurança |
| Fornecedores | `/admin/sgs/fornecedores` | Conformidade de fornecedores |

#### Automações SGS
- Risco NR > 10 → ação corretiva automática
- Incidente grave → ação corretiva automática
- Fornecedor irregular → bloqueio automático

## 🗄️ Banco de Dados (Supabase/PostgreSQL)

### Tabelas Principais

| Tabela | Descrição |
|--------|-----------|
| `customers` | Clientes cadastrados |
| `bookings` | Reservas de passeios e translados |
| `tours` | Catálogo de passeios |
| `transfer_routes` | Rotas de translado |
| `partners` | Parceiros e fornecedores |
| `reviews` | Avaliações dos clientes |

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

## 🛠️ Tecnologias

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **UI:** shadcn/ui + Radix UI + Lucide Icons
- **Backend:** Supabase (PostgreSQL + Auth + Edge Functions + Storage)
- **IA:** Lovable AI (Gemini) para chatbot
- **i18n:** i18next (PT/EN/ES)
- **Gráficos:** Recharts
- **State:** TanStack React Query

## 🚀 Como Executar

```bash
npm install
npm run dev
```

Acesse: `http://localhost:8080`

## 📋 Normas de Referência

- **ABNT NBR ISO 21101** – Sistema de Gestão de Segurança para Turismo de Aventura
- **ABNT NBR ISO 21102** – Competência dos Líderes de Turismo de Aventura
- **ABNT NBR ISO 21103** – Informações aos Participantes de Turismo de Aventura
