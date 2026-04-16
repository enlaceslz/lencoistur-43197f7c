import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Home, Compass, Car, Users, UserCheck, CreditCard, Star,
  ShoppingCart, Megaphone, Bot, FileText, Shield, BarChart3,
  Settings, Search, ArrowRight, CheckCircle2, AlertTriangle,
  Info, HelpCircle, Lightbulb, BookOpen, Workflow, Zap
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ModuleGuide {
  id: string;
  icon: any;
  title: string;
  subtitle: string;
  color: string;
  badge?: string;
  overview: string;
  steps: { title: string; desc: string }[];
  tips: string[];
  faq: { q: string; a: string }[];
}

const modules: ModuleGuide[] = [
  {
    id: "dashboard",
    icon: Home,
    title: "Dashboard",
    subtitle: "Visão geral do sistema",
    color: "bg-blue-500",
    overview: "O Dashboard é sua página inicial. Ele exibe indicadores-chave (KPIs) como receita do mês, reservas pendentes, avaliações recentes e alertas do sistema. Use-o para ter uma visão rápida da saúde do negócio.",
    steps: [
      { title: "Acesse o painel", desc: "Ao fazer login, você já está no Dashboard. Os cards coloridos no topo mostram seus principais números." },
      { title: "Analise os KPIs", desc: "Cada card mostra um indicador: receita, reservas, avaliações e ocupação. Clique neles para ir ao módulo correspondente." },
      { title: "Verifique os alertas", desc: "O sino (🔔) no cabeçalho mostra notificações: documentos vencendo, ações atrasadas e reservas pendentes." },
    ],
    tips: [
      "Acesse o Dashboard diariamente para monitorar pendências",
      "Notificações vermelhas indicam urgência — resolva-as primeiro",
      "Os KPIs atualizam automaticamente a cada 60 segundos",
    ],
    faq: [
      { q: "Os dados são em tempo real?", a: "Sim, o Dashboard consulta o banco de dados a cada acesso e as notificações atualizam a cada minuto." },
      { q: "Posso personalizar os KPIs?", a: "No momento, os indicadores são fixos. Use o módulo Relatórios para análises customizadas." },
    ],
  },
  {
    id: "passeios",
    icon: Compass,
    title: "Passeios",
    subtitle: "Catálogo de experiências",
    color: "bg-emerald-500",
    overview: "Gerencie todos os passeios e experiências oferecidos. Cadastre novos roteiros, defina preços, duração, imagens e desconto PIX. Os passeios aparecem automaticamente no site para reserva online.",
    steps: [
      { title: "Visualize o catálogo", desc: "A lista mostra todos os passeios com nome, preço, duração e status (ativo/inativo)." },
      { title: "Adicione um passeio", desc: "Clique em 'Novo Passeio' e preencha: nome, slug (URL), preço, duração, descrição, imagens e destaques." },
      { title: "Edite ou desative", desc: "Use os botões de ação para editar detalhes ou desativar temporariamente um passeio." },
      { title: "Configure desconto PIX", desc: "No campo 'Desconto PIX (%)' defina a porcentagem de desconto para pagamentos via PIX." },
    ],
    tips: [
      "Use fotos reais de alta qualidade — elas aumentam a conversão em até 40%",
      "O campo 'slug' define a URL do passeio (ex: /passeios/lagoa-azul)",
      "Desativar um passeio não exclui reservas existentes",
    ],
    faq: [
      { q: "Como defino o desconto PIX?", a: "No formulário do passeio, preencha 'Desconto PIX (%)'. O valor original e o com desconto aparecem automaticamente no site." },
      { q: "Posso adicionar várias imagens?", a: "Sim, o campo de imagens aceita múltiplas URLs. A primeira imagem será a capa do passeio." },
    ],
  },
  {
    id: "reservas",
    icon: ShoppingCart,
    title: "Reservas",
    subtitle: "Gestão de pedidos",
    color: "bg-orange-500",
    badge: "Fluxo principal",
    overview: "Central de gerenciamento de todas as reservas. Visualize, filtre por status, confirme pagamentos e acompanhe o ciclo de vida completo de cada reserva.",
    steps: [
      { title: "Consulte reservas", desc: "Use os filtros (status, data, tipo) para encontrar reservas específicas. A busca aceita código ou nome do cliente." },
      { title: "Verifique o pagamento", desc: "O status de pagamento aparece em cada linha. 'Pendente' precisa de confirmação manual ou automática." },
      { title: "Confirme a reserva", desc: "Altere o status para 'Confirmado' após validar o pagamento. O cliente recebe notificação." },
      { title: "Gerencie cancelamentos", desc: "Para cancelar, altere o status para 'Cancelado'. Considere a política de reembolso." },
    ],
    tips: [
      "Reservas com pagamento pendente por mais de 48h devem ser revisadas",
      "O código da reserva (ex: LT-XXXX) é gerado automaticamente",
      "Reservas confirmadas geram automaticamente um 'Conta a Receber' no Financeiro",
    ],
    faq: [
      { q: "Como o cliente faz uma reserva?", a: "Pelo site: escolhe passeio/translado → seleciona data e pessoas → preenche dados → paga via PIX ou cartão. A reserva aparece aqui automaticamente." },
      { q: "Posso criar reserva manualmente?", a: "Sim, no painel. Mas o fluxo principal é pelo site, onde os dados são validados automaticamente." },
    ],
  },
  {
    id: "translados",
    icon: Car,
    title: "Translados",
    subtitle: "Rotas e transfers",
    color: "bg-violet-500",
    overview: "Configure e gerencie rotas de transfer (aeroporto, entre cidades). Defina origem, destino, preço, tipo de veículo e horários de saída.",
    steps: [
      { title: "Liste as rotas", desc: "Veja todas as rotas ativas com origem → destino, preço e horários." },
      { title: "Crie nova rota", desc: "Defina origem, destino, preço, veículo (van/SUV), capacidade e horários de saída." },
      { title: "Ative/Desative", desc: "Rotas inativas não aparecem no site mas mantêm o histórico de reservas." },
    ],
    tips: [
      "Horários de saída são exibidos como opções para o cliente no checkout",
      "Defina o desconto PIX para incentivar pagamento instantâneo",
    ],
    faq: [
      { q: "Posso ter múltiplos horários por rota?", a: "Sim, o campo 'Horários de Saída' aceita vários horários que o cliente escolhe no momento da reserva." },
    ],
  },
  {
    id: "crm",
    icon: Users,
    title: "Clientes (CRM)",
    subtitle: "Base de clientes",
    color: "bg-cyan-500",
    overview: "Cadastro completo de clientes com nome, email, telefone e CPF. Vinculado automaticamente às reservas — cada reserva registra ou atualiza o cliente.",
    steps: [
      { title: "Visualize clientes", desc: "A tabela mostra todos os clientes com seus dados e data de cadastro." },
      { title: "Busque por nome/email", desc: "Use a barra de busca para localizar clientes rapidamente." },
      { title: "Veja histórico", desc: "Clique no cliente para ver todas as reservas associadas." },
    ],
    tips: [
      "Clientes são criados automaticamente no checkout — não é preciso cadastrar manualmente",
      "O CPF é validado no nível do banco de dados (11 dígitos numéricos)",
      "Use o CRM para identificar clientes recorrentes e oferecer benefícios",
    ],
    faq: [
      { q: "O cliente pode editar seus próprios dados?", a: "Atualmente, a edição é feita pelo administrador. O cliente consulta reservas pelo código + email." },
    ],
  },
  {
    id: "parceiros",
    icon: UserCheck,
    title: "Parceiros",
    subtitle: "Guias, motoristas e operadores",
    color: "bg-pink-500",
    overview: "Gerencie parceiros de negócio: guias turísticos, motoristas, agências e operadores. Registre dados profissionais como CADASTUR, CNH e comissões.",
    steps: [
      { title: "Cadastre parceiros", desc: "Preencha nome, tipo (guia/motorista/agência), contato, CADASTUR e taxa de comissão." },
      { title: "Gerencie status", desc: "Parceiros podem ser ativados/desativados conforme a temporada." },
      { title: "Acompanhe documentação", desc: "Verifique validade de CNH, CADASTUR e outros documentos obrigatórios." },
    ],
    tips: [
      "Mantenha o CADASTUR atualizado — é obrigatório para operação em UCs",
      "A comissão é informativa — o cálculo de repasse é feito no Financeiro",
    ],
    faq: [
      { q: "Qual a diferença entre parceiro e fornecedor SGS?", a: "Parceiros são colaboradores comerciais (guias, agências). Fornecedores SGS são prestadores avaliados pelo sistema de segurança (veículos terceirizados, etc.)." },
    ],
  },
  {
    id: "financeiro",
    icon: CreditCard,
    title: "Financeiro",
    subtitle: "Contas, fluxo de caixa e DRE",
    color: "bg-amber-500",
    badge: "Integrado",
    overview: "Módulo financeiro completo com Contas a Receber (vinculadas a reservas), Contas a Pagar, Fluxo de Caixa e DRE simplificado. Dados reais do banco.",
    steps: [
      { title: "Contas a Receber", desc: "Visualize receitas pendentes e recebidas. Registros são criados automaticamente a partir de reservas confirmadas." },
      { title: "Contas a Pagar", desc: "Cadastre despesas: fornecedores, comissões, manutenção. Defina vencimento e categoria." },
      { title: "Fluxo de Caixa", desc: "Gráfico mostra entradas vs saídas por período. Use para prever necessidades de capital." },
      { title: "DRE", desc: "Demonstrativo de Resultado: receita bruta − despesas = resultado líquido." },
    ],
    tips: [
      "Reservas confirmadas criam automaticamente um registro em Contas a Receber",
      "Categorize despesas corretamente para um DRE preciso",
      "O Fluxo de Caixa usa dados reais — não é projeção",
    ],
    faq: [
      { q: "O financeiro se conecta às reservas?", a: "Sim! Contas a Receber são vinculadas por booking_id. Quando uma reserva é confirmada, a receita correspondente aparece automaticamente." },
    ],
  },
  {
    id: "avaliacoes",
    icon: Star,
    title: "Avaliações",
    subtitle: "Feedback de clientes",
    color: "bg-yellow-500",
    overview: "Gerencie avaliações dos passeios. Veja notas, comentários e país de origem dos avaliadores. As melhores avaliações podem ser exibidas no site.",
    steps: [
      { title: "Consulte avaliações", desc: "Tabela com autor, nota (1-5 estrelas), comentário e passeio avaliado." },
      { title: "Filtre por nota/passeio", desc: "Use filtros para identificar experiências que precisam de melhoria." },
    ],
    tips: [
      "Avaliações com nota 4-5 são exibidas automaticamente na seção de depoimentos do site",
      "Responda avaliações negativas rapidamente para melhorar a reputação",
    ],
    faq: [],
  },
  {
    id: "marketing",
    icon: Megaphone,
    title: "Marketing",
    subtitle: "Leads, campanhas e remarketing",
    color: "bg-rose-500",
    overview: "Central de marketing com gestão de leads (score, origem, status), campanhas de email/WhatsApp e regras de remarketing automatizado.",
    steps: [
      { title: "Gerencie leads", desc: "Cada lead tem nome, origem, score (0-100) e status (novo → qualificado → convertido)." },
      { title: "Crie campanhas", desc: "Configure campanhas de email ou WhatsApp com segmentação por audiência." },
      { title: "Configure remarketing", desc: "Defina gatilhos automáticos: ex. 'carrinho abandonado → enviar WhatsApp em 2h'." },
    ],
    tips: [
      "Leads com score alto (>70) devem receber contato prioritário",
      "O remarketing por WhatsApp tem taxa de abertura 5x maior que email",
    ],
    faq: [
      { q: "Como os leads são gerados?", a: "Podem ser cadastrados manualmente ou importados. Futuramente, o formulário do site alimentará automaticamente." },
    ],
  },
  {
    id: "ia",
    icon: Bot,
    title: "Inteligência Artificial",
    subtitle: "Chatbot e análises IA",
    color: "bg-indigo-500",
    overview: "Módulo de IA com chatbot para atendimento ao cliente e análises inteligentes dos dados do sistema (tendências, sugestões, previsões).",
    steps: [
      { title: "Chatbot público", desc: "O chatbot no site responde perguntas sobre passeios, preços e disponibilidade 24/7." },
      { title: "Análise IA", desc: "Solicite relatórios inteligentes como 'tendências de reserva' ou 'perfil dos clientes'." },
    ],
    tips: [
      "O chatbot tem limite de 2000 caracteres por mensagem e 20 interações por sessão",
      "As análises IA usam dados reais do banco para gerar insights",
    ],
    faq: [
      { q: "Qual modelo de IA é usado?", a: "O sistema usa modelos avançados via Lovable AI Gateway, sem necessidade de chave API externa." },
    ],
  },
  {
    id: "documentos",
    icon: FileText,
    title: "Documentação",
    subtitle: "Certificados e licenças",
    color: "bg-teal-500",
    overview: "Gestão de documentos empresariais: alvarás, licenças, CADASTUR, autorizações ICMBio. Controle de validade com alertas de vencimento.",
    steps: [
      { title: "Cadastre documentos", desc: "Nome, tipo (alvará/licença/certificado), data de validade e arquivo PDF." },
      { title: "Monitore vencimentos", desc: "Documentos que vencem em 30 dias aparecem como alerta amarelo. Vencidos aparecem em vermelho." },
      { title: "Faça upload", desc: "Anexe o PDF do documento. Ele fica armazenado de forma segura (bucket privado)." },
    ],
    tips: [
      "Configure todos os documentos obrigatórios logo ao iniciar o sistema",
      "Os alertas de vencimento aparecem no Dashboard e nas notificações",
    ],
    faq: [
      { q: "Os documentos são acessíveis publicamente?", a: "Não. Os PDFs são armazenados em bucket privado, acessíveis apenas por administradores autenticados." },
    ],
  },
  {
    id: "relatorios",
    icon: BarChart3,
    title: "Relatórios",
    subtitle: "Análises e exportações",
    color: "bg-slate-500",
    overview: "Central de inteligência com 6 categorias de análise: Reservas, Financeiro, CRM, Passeios, SGS e Marketing. Filtros temporais e exportação CSV.",
    steps: [
      { title: "Selecione a categoria", desc: "Escolha entre as abas: Reservas, Financeiro, CRM, Passeios, SGS ou Marketing." },
      { title: "Aplique filtros", desc: "Use o seletor de período (7 dias, 30 dias, 90 dias, 1 ano) para ajustar a análise." },
      { title: "Exporte dados", desc: "Clique em 'Exportar CSV' para baixar os dados filtrados em planilha." },
      { title: "Imprima", desc: "Use 'Imprimir' para gerar uma versão otimizada para impressão." },
    ],
    tips: [
      "O relatório de CRM mostra o ranking de clientes por receita gerada",
      "A exportação CSV usa UTF-8 com BOM para compatibilidade com Excel",
    ],
    faq: [],
  },
  {
    id: "sgs",
    icon: Shield,
    title: "SGS — Segurança",
    subtitle: "Sistema de Gestão de Segurança",
    color: "bg-red-500",
    badge: "ISO 21101/21102",
    overview: "Sistema completo de gestão de segurança turística baseado nas normas ISO 21101 e 21102 e no Plano VATTI. Inclui gestão de riscos, incidentes, veículos, condutores, checklists, briefings e auditorias.",
    steps: [
      { title: "Dashboard SGS", desc: "Visão geral com KPIs de segurança, distribuição de riscos e ações rápidas." },
      { title: "Operação", desc: "Gerencie veículos (frota), condutores, visitantes, rotas/trilhas, checklists diários e briefings de segurança." },
      { title: "Gestão de Riscos", desc: "Matriz de riscos (probabilidade × impacto), registro de incidentes/ocorrências, ações corretivas, termos de risco e pesquisas de segurança." },
      { title: "Conformidade", desc: "Dados da empresa, equipe ISO 21102, fornecedores avaliados, auditorias internas e PGSAT (ICMBio)." },
    ],
    tips: [
      "Preencha a Matriz de Riscos antes de iniciar operações — é requisito da ISO",
      "Checklists diários devem ser feitos antes de cada saída de veículo",
      "Briefings de segurança são obrigatórios antes de cada passeio",
      "Registre TODOS os incidentes, mesmo os menores — é exigência normativa",
    ],
    faq: [
      { q: "O que é o PGSAT?", a: "Plano de Gestão de Segurança para Atividades Turísticas, exigido pelo ICMBio para operação em Unidades de Conservação." },
      { q: "Preciso preencher tudo para operar?", a: "Para conformidade ISO, sim. Comece pela empresa, riscos e equipe. Os demais módulos complementam gradualmente." },
    ],
  },
  {
    id: "config",
    icon: Settings,
    title: "Configurações",
    subtitle: "Ajustes do sistema",
    color: "bg-gray-500",
    overview: "Configurações gerais do sistema: dados da conta, preferências e ajustes operacionais.",
    steps: [
      { title: "Acesse o menu", desc: "No rodapé da barra lateral, clique em 'Configurações'." },
      { title: "Ajuste preferências", desc: "Configure parâmetros operacionais conforme necessário." },
    ],
    tips: [
      "Mantenha seus dados de acesso seguros — use senhas fortes",
    ],
    faq: [],
  },
];

const flowDiagrams = [
  {
    title: "Fluxo de Reserva Online",
    icon: Workflow,
    steps: ["Cliente acessa o site", "Escolhe passeio ou translado", "Seleciona data e quantidade", "Preenche dados pessoais", "Escolhe forma de pagamento", "Recebe código da reserva", "Admin confirma pagamento", "Reserva confirmada ✅"],
  },
  {
    title: "Fluxo Financeiro",
    icon: Zap,
    steps: ["Reserva confirmada", "Conta a Receber gerada", "Admin registra despesas", "Fluxo de Caixa atualiza", "DRE calculado automaticamente", "Relatório disponível 📊"],
  },
  {
    title: "Fluxo de Segurança (SGS)",
    icon: Shield,
    steps: ["Cadastrar riscos na matriz", "Criar checklists de veículos", "Registrar condutores e treinamentos", "Briefing antes do passeio", "Termo de risco assinado", "Em caso de incidente → registrar", "Ação corretiva se necessário", "Auditoria periódica 🔍"],
  },
];

const AdminAjuda = () => {
  const [search, setSearch] = useState("");
  const [selectedModule, setSelectedModule] = useState<string | null>(null);

  const filtered = search.trim()
    ? modules.filter(
        (m) =>
          m.title.toLowerCase().includes(search.toLowerCase()) ||
          m.subtitle.toLowerCase().includes(search.toLowerCase()) ||
          m.overview.toLowerCase().includes(search.toLowerCase())
      )
    : modules;

  const active = selectedModule ? modules.find((m) => m.id === selectedModule) : null;

  return (
    <AdminLayout title="Central de Ajuda">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-[hsl(217,91%,60%)] to-[hsl(217,91%,45%)] rounded-2xl p-6 sm:p-8 text-white">
          <div className="flex items-center gap-3 mb-3">
            <BookOpen size={28} />
            <h2 className="text-2xl font-bold font-display">Central de Ajuda</h2>
          </div>
          <p className="text-white/80 text-sm max-w-2xl mb-5">
            Guia completo e ilustrativo de todos os módulos do sistema LençóisTour. Clique em qualquer módulo para ver instruções detalhadas, fluxos e dicas.
          </p>
          <div className="relative max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
            <Input
              placeholder="Buscar módulo ou funcionalidade..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setSelectedModule(null); }}
              className="pl-10 bg-white/15 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20"
            />
          </div>
        </div>

        {/* Module Grid or Detail */}
        {!active ? (
          <>
            {/* Modules Grid */}
            <div>
              <h3 className="text-lg font-bold text-[hsl(220,25%,18%)] mb-4 flex items-center gap-2">
                <HelpCircle size={20} className="text-[hsl(217,91%,60%)]" />
                Módulos do Sistema
                <Tooltip>
                  <TooltipTrigger>
                    <Info size={14} className="text-[hsl(220,15%,60%)]" />
                  </TooltipTrigger>
                  <TooltipContent>Clique em um módulo para ver o guia completo</TooltipContent>
                </Tooltip>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filtered.map((mod) => {
                  const Icon = mod.icon;
                  return (
                    <Card
                      key={mod.id}
                      className="cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 border-[hsl(220,20%,92%)]"
                      onClick={() => setSelectedModule(mod.id)}
                    >
                      <CardContent className="p-4 flex items-start gap-3">
                        <div className={`${mod.color} w-10 h-10 rounded-xl flex items-center justify-center shrink-0`}>
                          <Icon size={20} className="text-white" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-sm text-[hsl(220,25%,18%)]">{mod.title}</h4>
                            {mod.badge && <Badge variant="secondary" className="text-[9px] px-1.5 py-0">{mod.badge}</Badge>}
                          </div>
                          <p className="text-xs text-[hsl(220,15%,55%)] mt-0.5">{mod.subtitle}</p>
                        </div>
                        <ArrowRight size={14} className="text-[hsl(220,15%,75%)] shrink-0 mt-1 ml-auto" />
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              {filtered.length === 0 && (
                <div className="text-center py-12 text-[hsl(220,15%,55%)]">
                  <Search size={40} className="mx-auto mb-3 opacity-30" />
                  <p>Nenhum módulo encontrado para "{search}"</p>
                </div>
              )}
            </div>

            {/* Flow Diagrams */}
            <div>
              <h3 className="text-lg font-bold text-[hsl(220,25%,18%)] mb-4 flex items-center gap-2">
                <Workflow size={20} className="text-[hsl(217,91%,60%)]" />
                Fluxos Principais
                <Tooltip>
                  <TooltipTrigger>
                    <Info size={14} className="text-[hsl(220,15%,60%)]" />
                  </TooltipTrigger>
                  <TooltipContent>Diagramas visuais dos processos mais importantes</TooltipContent>
                </Tooltip>
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {flowDiagrams.map((flow) => {
                  const Icon = flow.icon;
                  return (
                    <Card key={flow.title} className="border-[hsl(220,20%,92%)]">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Icon size={16} className="text-[hsl(217,91%,60%)]" />
                          {flow.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-0">
                          {flow.steps.map((step, i) => (
                            <div key={i} className="flex items-start gap-2.5 py-1.5">
                              <div className="flex flex-col items-center">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${i === flow.steps.length - 1 ? "bg-emerald-100 text-emerald-700" : "bg-[hsl(217,91%,95%)] text-[hsl(217,91%,50%)]"}`}>
                                  {i === flow.steps.length - 1 ? <CheckCircle2 size={14} /> : i + 1}
                                </div>
                                {i < flow.steps.length - 1 && <div className="w-px h-3 bg-[hsl(220,20%,88%)]" />}
                              </div>
                              <span className="text-xs text-[hsl(220,15%,40%)] pt-1">{step}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Legends */}
            <Card className="border-[hsl(220,20%,92%)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Info size={16} className="text-[hsl(217,91%,60%)]" />
                  Legendas e Ícones do Sistema
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-[hsl(220,20%,97%)]">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-[hsl(220,15%,40%)]"><strong>Verde</strong> — Ativo, confirmado, conforme, pago</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-[hsl(220,20%,97%)]">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="text-[hsl(220,15%,40%)]"><strong>Amarelo</strong> — Pendente, atenção necessária</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-[hsl(220,20%,97%)]">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-[hsl(220,15%,40%)]"><strong>Vermelho</strong> — Urgente, vencido, bloqueado, erro</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-[hsl(220,20%,97%)]">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-[hsl(220,15%,40%)]"><strong>Azul</strong> — Informativo, em andamento</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-[hsl(220,20%,97%)]">
                    <Badge variant="secondary" className="text-[9px]">Badge</Badge>
                    <span className="text-[hsl(220,15%,40%)]"><strong>Badge</strong> — Categorias, status e tags</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-[hsl(220,20%,97%)]">
                    <AlertTriangle size={14} className="text-amber-500" />
                    <span className="text-[hsl(220,15%,40%)]"><strong>Triângulo</strong> — Alerta ou aviso de segurança</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          /* Module Detail View */
          <div>
            <button
              onClick={() => setSelectedModule(null)}
              className="text-sm text-[hsl(217,91%,60%)] hover:underline mb-4 flex items-center gap-1"
            >
              ← Voltar para todos os módulos
            </button>

            <Card className="border-[hsl(220,20%,92%)]">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`${active.color} w-12 h-12 rounded-xl flex items-center justify-center`}>
                    <active.icon size={24} className="text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-xl">{active.title}</CardTitle>
                      {active.badge && <Badge>{active.badge}</Badge>}
                    </div>
                    <p className="text-sm text-[hsl(220,15%,55%)]">{active.subtitle}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Overview */}
                <div className="p-4 bg-[hsl(217,91%,97%)] rounded-xl border border-[hsl(217,91%,90%)]">
                  <div className="flex items-start gap-2">
                    <BookOpen size={16} className="text-[hsl(217,91%,60%)] mt-0.5 shrink-0" />
                    <p className="text-sm text-[hsl(220,15%,35%)]">{active.overview}</p>
                  </div>
                </div>

                {/* Step by step */}
                <div>
                  <h4 className="font-semibold text-[hsl(220,25%,18%)] mb-3 flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    Passo a Passo
                  </h4>
                  <div className="space-y-3">
                    {active.steps.map((step, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-[hsl(220,20%,97%)] border border-[hsl(220,20%,93%)]">
                        <div className="w-7 h-7 rounded-full bg-[hsl(217,91%,60%)] text-white flex items-center justify-center text-xs font-bold shrink-0">
                          {i + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[hsl(220,25%,18%)]">{step.title}</p>
                          <p className="text-xs text-[hsl(220,15%,50%)] mt-0.5">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tips */}
                {active.tips.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-[hsl(220,25%,18%)] mb-3 flex items-center gap-2">
                      <Lightbulb size={16} className="text-amber-500" />
                      Dicas Úteis
                    </h4>
                    <div className="space-y-2">
                      {active.tips.map((tip, i) => (
                        <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-100">
                          <Lightbulb size={14} className="text-amber-500 mt-0.5 shrink-0" />
                          <p className="text-xs text-amber-800">{tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* FAQ */}
                {active.faq.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-[hsl(220,25%,18%)] mb-3 flex items-center gap-2">
                      <HelpCircle size={16} className="text-[hsl(217,91%,60%)]" />
                      Perguntas Frequentes
                    </h4>
                    <Accordion type="single" collapsible className="w-full">
                      {active.faq.map((item, i) => (
                        <AccordionItem key={i} value={`faq-${i}`}>
                          <AccordionTrigger className="text-sm text-left">{item.q}</AccordionTrigger>
                          <AccordionContent className="text-xs text-[hsl(220,15%,45%)]">{item.a}</AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminAjuda;
