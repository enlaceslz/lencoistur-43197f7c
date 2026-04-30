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
    subtitle: "Ficha 360º do Cliente",
    color: "bg-cyan-500",
    badge: "Atualizado",
    overview: "Módulo avançado de CRM com visão completa do cliente. Agora com suporte a dependentes, histórico financeiro integrado, anexo de documentos pessoais e rastreamento de fidelidade.",
    steps: [
      { title: "Visualize a base", desc: "Acesse a lista completa de clientes com busca inteligente por CPF, nome ou email." },
      { title: "Ficha do Cliente", desc: "Clique em um cliente para abrir a ficha completa: dados básicos, dependentes e documentos." },
      { title: "Gestão de Dependentes", desc: "Adicione familiares ou acompanhantes vinculados ao titular para facilitar reservas em grupo." },
      { title: "Histórico Financeiro", desc: "Acompanhe todos os pagamentos realizados e reservas associadas ao perfil do cliente." },
    ],
    tips: [
      "Clientes são criados automaticamente no checkout ou manualmente no painel",
      "Anexe cópias de documentos (RG/CPF) para agilizar briefings de segurança",
      "O sistema identifica clientes recorrentes automaticamente para ações de fidelidade",
    ],
    faq: [
      { q: "Como funciona a gestão de dependentes?", a: "Dentro da ficha do cliente, você pode cadastrar nomes e documentos de dependentes, que ficam disponíveis para seleção rápida em novas reservas." },
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
    subtitle: "Gestão de Caixa e DRE",
    color: "bg-amber-500",
    badge: "Integrado",
    overview: "Controle financeiro total com integração nativa às reservas. Gerencie contas a receber (automáticas), contas a pagar (fixas e variáveis) e acompanhe a saúde financeira via Fluxo de Caixa e DRE.",
    steps: [
      { title: "Contas a Receber", desc: "Visualize receitas vindas de reservas. O sistema cria o registro assim que a reserva é confirmada." },
      { title: "Contas a Pagar", desc: "Registre despesas operacionais, manutenções e comissões de parceiros." },
      { title: "Fluxo de Caixa", desc: "Gráficos de entradas vs saídas reais para controle de liquidez diário." },
      { title: "DRE Mensal", desc: "Demonstrativo de Resultado com cálculo automático de lucro líquido por período." },
    ],
    tips: [
      "Sempre categorize as despesas para que o DRE seja preciso por setor",
      "O sistema alerta sobre contas que vencem hoje diretamente no Dashboard",
      "Use a integração com reservas para evitar lançamentos manuais de receita",
    ],
    faq: [
      { q: "As receitas são automáticas?", a: "Sim, ao mudar o status de uma reserva para 'Pago' ou 'Confirmado', um registro de entrada é gerado no Financeiro." },
    ],
  },
  {
    id: "avaliacoes",
    icon: Star,
    title: "Avaliações",
    subtitle: "Qualidade e NPS",
    color: "bg-yellow-500",
    overview: "Gerencie o feedback dos clientes. Monitore a satisfação média, comentários específicos e utilize as melhores avaliações como prova social no seu site.",
    steps: [
      { title: "Lista de feedbacks", desc: "Acompanhe nota (1-5), comentário e passeio correspondente de cada cliente." },
      { title: "Filtros de Qualidade", desc: "Identifique passeios com notas baixas para ações de melhoria imediata." },
    ],
    tips: [
      "Responda a todas as avaliações, especialmente as negativas, para mostrar comprometimento",
      "Notas 4 e 5 são destacadas automaticamente na vitrine do site",
    ],
    faq: [],
  },
  {
    id: "marketing",
    icon: Megaphone,
    title: "Marketing",
    subtitle: "Funil de Vendas e Leads",
    color: "bg-rose-500",
    overview: "Central de aquisição de clientes. Gerencie leads vindos do site, acompanhe o funil de vendas (score de lead) e configure automações de remarketing.",
    steps: [
      { title: "Gestão de Leads", desc: "Acompanhe o status de cada potencial cliente: Novo → Qualificado → Convertido." },
      { title: "Score de Lead", desc: "O sistema atribui pontuação baseada no interesse e perfil para priorizar o atendimento." },
      { title: "Campanhas", desc: "Crie anúncios e links rastreáveis para medir a origem das suas vendas." },
    ],
    tips: [
      "Leads com score > 80 devem ser contatados em menos de 15 minutos",
      "O remarketing automático ajuda a recuperar até 25% dos carrinhos abandonados",
    ],
    faq: [],
  },
  {
    id: "ia",
    icon: Bot,
    title: "Inteligência Artificial",
    subtitle: "Chatbot e Insights",
    color: "bg-indigo-500",
    badge: "Inovador",
    overview: "Utilize o poder da IA para automatizar o atendimento via Chatbot no site e gerar relatórios analíticos preditivos sobre seu negócio.",
    steps: [
      { title: "Treinamento do Chatbot", desc: "O robô aprende sobre seus passeios e preços automaticamente a partir do catálogo." },
      { title: "Relatórios de IA", desc: "Peça à IA para analisar tendências de venda ou sugerir mudanças de preço para a temporada." },
    ],
    tips: [
      "O chatbot atende 24h por dia, reduzindo a carga da sua equipe de vendas",
      "Use a IA para prever a demanda da próxima alta temporada baseada no histórico",
    ],
    faq: [],
  },
  {
    id: "documentos",
    icon: FileText,
    title: "Documentação",
    subtitle: "Arquivo Digital Seguro",
    color: "bg-teal-500",
    overview: "Gestão centralizada de documentos da empresa (Alvarás, CADASTUR) e dos clientes. Receba alertas automáticos de documentos perto do vencimento.",
    steps: [
      { title: "Upload Seguro", desc: "Arraste e solte arquivos PDF/JPG para armazenamento criptografado na nuvem." },
      { title: "Controle de Validade", desc: "Defina datas de expiração e receba alertas por email e no Dashboard." },
    ],
    tips: [
      "Nunca opere com o CADASTUR vencido — configure o alerta para 60 dias antes",
      "Documentos de clientes (termos assinados) ficam vinculados à reserva para fácil acesso",
    ],
    faq: [],
  },
  {
    id: "relatorios",
    icon: BarChart3,
    title: "Relatórios",
    subtitle: "Business Intelligence",
    color: "bg-slate-500",
    badge: "Novo",
    overview: "Painéis visuais e gráficos dinâmicos para análise profunda de Reservas, Financeiro, CRM e Marketing. Exporte dados em CSV para ferramentas externas.",
    steps: [
      { title: "Gráficos de Performance", desc: "Visualize a evolução de vendas e leads através de gráficos de linha e barras." },
      { title: "Análise de Receita", desc: "Veja a distribuição de faturamento por tipo de passeio e canal de venda." },
      { title: "Exportação", desc: "Gere planilhas detalhadas para contabilidade ou auditorias externas." },
    ],
    tips: [
      "Compare os períodos (ano anterior vs atual) para medir o crescimento real",
      "O relatório de ocupação ajuda a decidir sobre promoções em datas de baixa demanda",
    ],
    faq: [],
  },
  {
    id: "sgs",
    icon: Shield,
    title: "SGS — Segurança",
    subtitle: "ISO 21101 / 21102",
    color: "bg-red-500",
    badge: "ISO Compliant",
    overview: "Módulo robusto para gestão de riscos e segurança. Atende integralmente às normas ISO 21101 e 21102, além das exigências do PGSAT (ICMBio).",
    steps: [
      { title: "Matriz de Riscos", desc: "Identifique perigos, avalie riscos e defina medidas de controle preventivas." },
      { title: "Checklists & Veículos", desc: "Inspeções diárias de frota e equipamentos antes de cada operação." },
      { title: "Briefings & Termos", desc: "Gestão de orientações de segurança e coleta de assinaturas digitais de termos de risco." },
      { title: "Incidentes & Ações", desc: "Registro detalhado de ocorrências e gestão de ações corretivas/preventivas." },
    ],
    tips: [
      "O preenchimento do checklist é requisito legal para operação em trilhas",
      "Briefings bem feitos reduzem o risco de incidentes em até 70%",
      "Mantenha o cadastro de condutores e seus treinamentos sempre em dia",
    ],
    faq: [
      { q: "O que é o PGSAT?", a: "É o Plano de Gestão de Segurança para Atividades Turísticas exigido para operar em Unidades de Conservação Federais." },
    ],
  },
  {
    id: "config",
    icon: Settings,
    title: "Configurações",
    subtitle: "Ajustes de Sistema",
    color: "bg-gray-500",
    overview: "Ajustes finos da plataforma: dados da empresa, permissões de usuários e parâmetros globais de reserva.",
    steps: [
      { title: "Dados da Empresa", desc: "Atualize endereço, CNPJ e contatos que aparecem nos comprovantes." },
      { title: "Preferências", desc: "Configure tempos de expiração de reserva e taxas padrão." },
    ],
    tips: [
      "Revise as configurações de segurança da conta periodicamente",
    ],
    faq: [],
  },
];

const flowDiagrams = [
  {
    title: "Ciclo de Vida da Reserva",
    icon: Workflow,
    steps: ["Cliente escolhe no site", "Preenchimento de dados e dependentes", "Pagamento (PIX/Cartão)", "Confirmação automática/manual", "Geração de registro no Financeiro", "Check-in e Briefing de Segurança", "Realização do passeio ✅"],
  },
  {
    title: "Gestão Financeira Integrada",
    icon: Zap,
    steps: ["Venda realizada (Receita)", "Lançamento automático no Contas a Receber", "Registro de custos (Combustível/Guias)", "Cálculo de comissões de parceiros", "Fechamento de Caixa", "Análise de DRE e Lucratividade 📊"],
  },
  {
    title: "Segurança e Conformidade (SGS)",
    icon: Shield,
    steps: ["Matriz de Riscos atualizada", "Verificação de equipamentos e veículos", "Briefing obrigatório com turistas", "Coleta de Termo de Responsabilidade", "Execução segura com condutor habilitado", "Registro de feedback ou incidentes 🔍"],
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
