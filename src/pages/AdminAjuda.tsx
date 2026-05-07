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
    id: "termos",
    icon: FileText,
    title: "Termos de Risco",
    subtitle: "Conformidade ISO 21103",
    color: "bg-red-600",
    overview: "Módulo para gestão dos Termos de Ciência de Risco. Gerencie assinaturas digitais, valide documentação e assegure a conformidade legal em todas as atividades.",
    steps: [
      { title: "Gerar Termo", desc: "Vincule o termo a uma reserva existente ou crie um registro avulso." },
      { title: "Coleta de Assinatura", desc: "Envie o link por WhatsApp ou assine no próprio painel durante o briefing." },
      { title: "Monitoramento", desc: "Acompanhe termos pendentes e gerencie assinaturas de menores de idade." }
    ],
    tips: [
      "Sempre colete a assinatura antes do início do passeio",
      "O termo assinado gera automaticamente um PDF armazenado no histórico do cliente"
    ],
    faq: [
      { q: "O termo tem validade legal?", a: "Sim, atende aos requisitos da ABNT NBR ISO 21103 para turismo de aventura." }
    ]
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
        <div className="glass-card rounded-[2.5rem] p-8 md:p-12 mb-10 border-none shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-primary/10 transition-all duration-700" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="max-w-2xl">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                  <BookOpen size={28} strokeWidth={2.5} />
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-foreground tracking-tighter uppercase">Central de Ajuda</h2>
              </div>
              <p className="text-sm md:text-base font-medium text-muted-foreground leading-relaxed">
                Guia interativo e documentação técnica do ecossistema <span className="text-primary font-bold">LençóisTour</span>. 
                Explore os módulos abaixo para dominar cada funcionalidade do sistema.
              </p>
            </div>
            
            <div className="relative w-full md:w-96 group/search">
              <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within/search:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Pesquisar guia..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setSelectedModule(null); }}
                className="w-full h-14 pl-14 pr-6 bg-muted/30 border border-border/40 rounded-2xl text-sm font-bold text-foreground outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all placeholder:text-muted-foreground/30 uppercase tracking-widest shadow-inner"
              />
            </div>
          </div>
        </div>

        {/* Module Grid or Detail */}
        {!active ? (
          <div className="space-y-12">
            {/* Modules Grid */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <HelpCircle size={22} className="text-primary" strokeWidth={3} />
                <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Arquitetura de Módulos</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
                {filtered.map((mod) => {
                  const Icon = mod.icon;
                  return (
                    <div
                      key={mod.id}
                      className="glass-card admin-card-hover rounded-[2rem] p-6 cursor-pointer group relative overflow-hidden flex flex-col border border-border/50 transition-all hover:border-primary/30 shadow-sm"
                      onClick={() => setSelectedModule(mod.id)}
                    >
                      <div className={`absolute top-0 left-0 w-1.5 h-full transition-colors ${mod.color.replace('bg-', 'bg-')}`} />
                      
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-12 h-12 rounded-2xl ${mod.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500`}>
                          <Icon size={24} strokeWidth={2.5} />
                        </div>
                        {mod.badge && <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-black text-[8px] uppercase px-2 py-0.5 rounded-full">{mod.badge}</Badge>}
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="font-black text-foreground text-sm uppercase tracking-wider group-hover:text-primary transition-colors">{mod.title}</h4>
                        <p className="text-[10px] font-bold text-muted-foreground mt-1 leading-relaxed opacity-70">{mod.subtitle}</p>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
                        <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">Ver Documentação</span>
                        <ArrowRight size={14} className="text-primary group-hover:translate-x-1 transition-transform" strokeWidth={3} />
                      </div>
                    </div>
                  );
                })}
              </div>
              {filtered.length === 0 && (
                <div className="text-center py-20 glass-card rounded-[2.5rem] border-2 border-dashed border-border/40">
                  <Search size={48} className="mx-auto mb-4 text-muted-foreground/20" />
                  <p className="text-lg font-black text-muted-foreground uppercase tracking-widest">Nenhum guia encontrado</p>
                </div>
              )}
            </div>

            {/* Flow Diagrams */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Workflow size={22} className="text-primary" strokeWidth={3} />
                <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Fluxos Operacionais Integrados</h3>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {flowDiagrams.map((flow) => {
                  const Icon = flow.icon;
                  return (
                    <div key={flow.title} className="glass-card rounded-[2rem] p-8 border border-border/50 shadow-sm relative overflow-hidden flex flex-col">
                       <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                          <Icon size={20} strokeWidth={2.5} />
                        </div>
                        <h4 className="font-black text-foreground text-xs uppercase tracking-wider">{flow.title}</h4>
                      </div>
                      
                      <div className="space-y-4 flex-1">
                        {flow.steps.map((step, i) => (
                          <div key={i} className="flex items-start gap-4">
                            <div className="flex flex-col items-center">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${i === flow.steps.length - 1 ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-primary/10 text-primary"}`}>
                                {i === flow.steps.length - 1 ? <CheckCircle2 size={12} strokeWidth={3} /> : i + 1}
                              </div>
                              {i < flow.steps.length - 1 && <div className="w-0.5 h-6 bg-border/40 my-1" />}
                            </div>
                            <span className="text-[11px] font-bold text-muted-foreground leading-relaxed pt-1 uppercase tracking-tight">{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Legends */}
            <div className="glass-card rounded-[2.5rem] p-8 border border-border/50 shadow-sm overflow-hidden relative group">
              <div className="flex items-center gap-3 mb-8">
                <Info size={22} className="text-primary" strokeWidth={3} />
                <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Sistema Visual de Feedback</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { color: "bg-emerald-500", label: "Sucesso / Ativo", desc: "Confirmado, conforme ou pago" },
                  { color: "bg-amber-500", label: "Pendente / Atenção", desc: "Requer verificação manual" },
                  { color: "bg-rose-500", label: "Urgente / Bloqueado", desc: "Vencido, erro ou impedimento" },
                  { color: "bg-blue-500", label: "Informativo", desc: "Dados extras ou andamento" },
                  { badge: true, label: "Categorização", desc: "Filtros, tags e tipos de dados" },
                  { icon: AlertTriangle, label: "Alertas SGS", desc: "Avisos críticos de segurança" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-muted/20 border border-border/40 hover:bg-white hover:shadow-lg transition-all">
                    {item.color ? (
                      <div className={`w-4 h-4 rounded-full ${item.color} shadow-sm shrink-0`} />
                    ) : item.badge ? (
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[8px] font-black uppercase px-2 shrink-0">TAG</Badge>
                    ) : (
                      <AlertTriangle size={18} className="text-amber-500 shrink-0" strokeWidth={3} />
                    )}
                    <div>
                      <p className="text-[10px] font-black text-foreground uppercase tracking-widest">{item.label}</p>
                      <p className="text-[10px] font-medium text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-in-fade">
            <button
              onClick={() => setSelectedModule(null)}
              className="h-10 px-6 rounded-xl bg-white border border-border/50 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary hover:text-white transition-all mb-8 shadow-sm flex items-center gap-2 group"
            >
              <ArrowRight size={14} className="rotate-180 group-hover:-translate-x-1 transition-transform" strokeWidth={3} />
              Voltar para a Central
            </button>

            <div className="glass-card rounded-[2.5rem] border-none shadow-2xl overflow-hidden">
              <div className={`h-3 w-full ${active.color}`} />
              
              <div className="p-8 md:p-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                  <div className="flex items-center gap-6">
                    <div className={`${active.color} w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl`}>
                      <active.icon size={32} strokeWidth={2.5} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-2xl md:text-3xl font-black text-foreground uppercase tracking-tight">{active.title}</h3>
                        {active.badge && <Badge className="bg-primary/10 text-primary border-none font-black text-[9px] uppercase px-2 py-0.5 rounded-full">{active.badge}</Badge>}
                      </div>
                      <p className="text-sm font-bold text-muted-foreground uppercase tracking-[0.2em]">{active.subtitle}</p>
                    </div>
                  </div>
                </div>

                <div className="grid lg:grid-cols-12 gap-12">
                  <div className="lg:col-span-8 space-y-12">
                    {/* Overview */}
                    <div className="bg-primary/5 p-8 rounded-[2rem] border border-primary/10 relative overflow-hidden group">
                      <BookOpen size={64} className="absolute -right-4 -bottom-4 text-primary/5 group-hover:scale-110 transition-transform duration-700" />
                      <div className="flex items-start gap-4 relative z-10">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm shrink-0">
                          <Info size={20} strokeWidth={2.5} />
                        </div>
                        <p className="text-base font-medium text-foreground/80 leading-relaxed italic">{active.overview}</p>
                      </div>
                    </div>

                    {/* Step by step */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 mb-2">
                        <CheckCircle2 size={22} className="text-emerald-500" strokeWidth={3} />
                        <h4 className="text-xl font-black text-foreground uppercase tracking-tight">Guia de Implementação</h4>
                      </div>
                      
                      <div className="space-y-4">
                        {active.steps.map((step, i) => (
                          <div key={i} className="flex items-start gap-6 p-6 rounded-[2rem] bg-muted/20 border border-border/40 hover:bg-white hover:shadow-xl transition-all group">
                            <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center text-sm font-black shrink-0 shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                              {i + 1}
                            </div>
                            <div>
                              <p className="text-base font-black text-foreground uppercase tracking-tight mb-1">{step.title}</p>
                              <p className="text-sm font-medium text-muted-foreground leading-relaxed">{step.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-4 space-y-8">
                    {/* Tips */}
                    {active.tips.length > 0 && (
                      <div className="glass-card rounded-[2rem] p-8 border border-amber-200/50 bg-amber-50/30">
                        <div className="flex items-center gap-3 mb-6">
                          <Lightbulb size={20} className="text-amber-500" strokeWidth={3} />
                          <h4 className="text-base font-black text-foreground uppercase tracking-tight">Dicas Pro</h4>
                        </div>
                        <div className="space-y-4">
                          {active.tips.map((tip, i) => (
                            <div key={i} className="flex items-start gap-3">
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                              <p className="text-xs font-bold text-amber-900/70 leading-relaxed uppercase tracking-tighter">{tip}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* FAQ */}
                    {active.faq.length > 0 && (
                      <div className="space-y-6">
                         <div className="flex items-center gap-3">
                          <HelpCircle size={20} className="text-primary" strokeWidth={3} />
                          <h4 className="text-base font-black text-foreground uppercase tracking-tight">Dúvidas Comuns</h4>
                        </div>
                        <Accordion type="single" collapsible className="w-full space-y-3">
                          {active.faq.map((item, i) => (
                            <AccordionItem key={i} value={`faq-${i}`} className="border border-border/50 rounded-2xl px-4 bg-white shadow-sm overflow-hidden">
                              <AccordionTrigger className="text-xs font-black uppercase tracking-widest text-left hover:no-underline py-4">
                                {item.q}
                              </AccordionTrigger>
                              <AccordionContent className="text-xs font-medium text-muted-foreground leading-relaxed pb-4 pt-2 border-t border-border/20">
                                {item.a}
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminAjuda;
