import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import {
  Shield, AlertTriangle, CheckCircle, Users, TrendingUp, Activity, Phone, Building2,
  Plus, ArrowRight, Clock, FileText, ClipboardCheck, Car, UserCheck2, Map, Truck, Star,
  Wrench, ClipboardList, AlertCircle, Loader2
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

const AdminSGSDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ risks: 0, incidents: 0, actions: 0, expiring: 0, surveyAvg: 0, briefings: 0, terms: 0, pendingTerms: 0, veiculos: 0, condutores: 0, checklists: 0, equipment: 0, procedures: 0 });
  const [loading, setLoading] = useState(true);
  const [risksByLevel, setRisksByLevel] = useState<any[]>([]);
  const [incidentsByMonth, setIncidentsByMonth] = useState<any[]>([]);
  const [risksByStage, setRisksByStage] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [fleetAlerts, setFleetAlerts] = useState<any[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [risksRes, incidentsRes, actionsRes, staffRes, surveysRes, briefingsRes, termsRes, veiculosRes, condutoresRes, checklistsRes, bookingsRes, equipmentRes, proceduresRes] = await Promise.all([
      supabase.from("sgs_risks").select("*"),
      supabase.from("sgs_incidents").select("*").order("created_at", { ascending: false }),
      supabase.from("sgs_corrective_actions").select("*").in("status", ["pendente", "em_andamento"]),
      supabase.from("sgs_staff_trainings").select("*").eq("status", "vencendo"),
      supabase.from("sgs_safety_surveys").select("felt_safe"),
      supabase.from("sgs_briefings").select("id"),
      supabase.from("sgs_risk_terms").select("booking_id"),
      supabase.from("sgs_veiculos").select("*"),
      supabase.from("sgs_condutores").select("*"),
      supabase.from("sgs_checklists").select("id, created_at").order("created_at", { ascending: false }).limit(1),
      supabase.from("bookings").select("id").not("status", "eq", "cancelada"),
      supabase.from("sgs_equipment").select("id"),
      supabase.from("sgs_procedures").select("id"),
    ]);

    const risks = risksRes.data || [];
    const incidents = incidentsRes.data || [];
    const actions = actionsRes.data || [];
    const surveys = surveysRes.data || [];

    const avgSafety = surveys.length > 0
      ? (surveys.reduce((sum: number, s: any) => sum + (s.felt_safe || 0), 0) / surveys.length).toFixed(1)
      : "0";

    const termsIds = new Set((termsRes.data || []).map(t => t.booking_id));
    const pendingCount = (bookingsRes.data || []).filter(b => !termsIds.has(b.id)).length;

    setStats({
      risks: risks.filter((r: any) => r.status === "ativo").length,
      incidents: incidents.filter((i: any) => i.status !== "fechado").length,
      actions: actions.length,
      expiring: (staffRes.data || []).length,
      surveyAvg: Number(avgSafety),
      briefings: (briefingsRes.data || []).length,
      terms: (termsRes.data || []).length,
      pendingTerms: pendingCount,
      veiculos: (veiculosRes.data || []).length,
      condutores: (condutoresRes.data || []).length,
      checklists: (checklistsRes.data || []).length,
      equipment: (equipmentRes.data || []).length,
      procedures: (proceduresRes.data || []).length,
    });

    // Fleet Alerts
    const alerts: any[] = [];
    const now = new Date();
    const soon = new Date();
    soon.setDate(now.getDate() + 30);

    const isExpired = (d: string | null) => d && new Date(d) < now;
    const isExpiring = (d: string | null) => d && new Date(d) >= now && new Date(d) <= soon;

    (veiculosRes.data || []).forEach((v: any) => {
      if (isExpired(v.seguro_validade)) alerts.push({ type: 'veiculo', title: `Seguro Vencido: ${v.placa}`, desc: v.marca + ' ' + v.modelo, severity: 'alta', link: '/admin/sgs/veiculos' });
      else if (isExpiring(v.seguro_validade)) alerts.push({ type: 'veiculo', title: `Seguro Vencendo: ${v.placa}`, desc: v.marca + ' ' + v.modelo, severity: 'media', link: '/admin/sgs/veiculos' });
      
      if (isExpired(v.licenciamento_validade)) alerts.push({ type: 'veiculo', title: `Licenciamento Vencido: ${v.placa}`, desc: v.marca + ' ' + v.modelo, severity: 'alta', link: '/admin/sgs/veiculos' });
      else if (isExpiring(v.licenciamento_validade)) alerts.push({ type: 'veiculo', title: `Licenciamento Vencendo: ${v.placa}`, desc: v.marca + ' ' + v.modelo, severity: 'media', link: '/admin/sgs/veiculos' });
    });

    (condutoresRes.data || []).forEach((c: any) => {
      if (isExpired(c.cnh_validade)) alerts.push({ type: 'condutor', title: `CNH Vencida: ${c.nome}`, desc: 'Categoria ' + c.cnh_categoria, severity: 'alta', link: '/admin/sgs/condutores' });
      else if (isExpiring(c.cnh_validade)) alerts.push({ type: 'condutor', title: `CNH Vencendo: ${c.nome}`, desc: 'Categoria ' + c.cnh_categoria, severity: 'media', link: '/admin/sgs/condutores' });
    });

    setFleetAlerts(alerts.sort((a, b) => a.severity === 'alta' ? -1 : 1).slice(0, 6));

    // Recent activity from incidents
    const recent: any[] = [];
    incidents.slice(0, 3).forEach((inc: any) => {
      recent.push({
        type: "incident",
        title: `Incidente: ${inc.type}`,
        desc: inc.description?.slice(0, 80) + (inc.description?.length > 80 ? "..." : ""),
        date: inc.created_at,
        severity: inc.severity,
        link: "/admin/sgs/incidentes",
      });
    });
    actions.slice(0, 2).forEach((a: any) => {
      recent.push({
        type: "action",
        title: `Ação: ${a.action_code}`,
        desc: a.description?.slice(0, 80) + (a.description?.length > 80 ? "..." : ""),
        date: a.created_at,
        severity: a.status === "pendente" ? "alta" : "media",
        link: "/admin/sgs/acoes",
      });
    });
    recent.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setRecentActivity(recent.slice(0, 5));

    const acceptable = risks.filter((r: any) => r.risk_level < 6).length;
    const temporary = risks.filter((r: any) => r.risk_level >= 6 && r.risk_level < 12).length;
    const unacceptable = risks.filter((r: any) => r.risk_level >= 12).length;
    setRisksByLevel([
      { name: "Aceitável", value: acceptable, fill: "hsl(var(--primary))" },
      { name: "Temporário", value: temporary, fill: "hsl(var(--secondary))" },
      { name: "Inaceitável", value: unacceptable, fill: "hsl(var(--destructive))" },
    ]);

    const stageLabels: Record<string, string> = {
      venda_recepcao: "Venda", trajeto_ida: "Ida", passeio_dunas: "Dunas",
      travessia_rios: "Travessia", paradas: "Paradas", banho_lagoas: "Lagoas",
      passeio_barco: "Barco", trilhas: "Trilhas", trajeto_volta: "Volta",
    };
    const stageMap: Record<string, number> = {};
    risks.forEach((r: any) => { stageMap[r.stage] = (stageMap[r.stage] || 0) + 1; });
    setRisksByStage(Object.entries(stageMap).map(([stage, count]) => ({ name: stageLabels[stage] || stage, riscos: count })));

    const months: Record<string, number> = {};
    const reportDate = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(reportDate.getFullYear(), reportDate.getMonth() - i, 1);
      months[`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`] = 0;
    }
    incidents.forEach((inc: any) => { const key = inc.date?.slice(0, 7); if (key && key in months) months[key]++; });
    setIncidentsByMonth(Object.entries(months).map(([month, count]) => ({ name: month.slice(5), incidentes: count })));
    setLoading(false);
  };

  const generateP1Report = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFillColor(0, 102, 204);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text("P1 - Plano de Gestão de Segurança", pageWidth / 2, 20, { align: "center" });
    doc.setFontSize(10);
    doc.text("Conforme ABNT NBR ISO 21101 / 21102 / 21103 + Devolutiva VATTI", pageWidth / 2, 30, { align: "center" });
    
    doc.setTextColor(0, 0, 0);
    let currentY = 50;
    
    // Company Info
    const { data: company } = await supabase.from("sgs_empresa").select("*").limit(1).maybeSingle();
    doc.setFontSize(14);
    doc.text("Identificação da Organização", 14, currentY);
    currentY += 10;
    
    (doc as any).autoTable({
      startY: currentY,
      body: [
        ["Razão Social", company?.razao_social || "Lençóis Tour"],
        ["CNPJ", company?.cnpj || "—"],
        ["Endereço", company?.endereco || "—"],
        ["Responsável Técnico", company?.responsavel_tecnico || "—"],
        ["Data do Relatório", new Date().toLocaleDateString("pt-BR")],
      ],
      theme: 'grid',
      styles: { fontSize: 10 },
      columnStyles: { 0: { fontStyle: 'bold', width: 50 } }
    });
    
    currentY = (doc as any).lastAutoTable.finalY + 15;
    
    // Safety Policy
    doc.setFontSize(14);
    doc.text("Política de Segurança", 14, currentY);
    currentY += 7;
    doc.setFontSize(10);
    const policy = "A Lençóis Tour compromete-se a oferecer experiências de turismo de aventura com o mais alto padrão de segurança, seguindo as normas ABNT NBR ISO. Nossa gestão baseia-se na identificação proativa de riscos, treinamento contínuo da equipe e melhoria constante de nossos processos para garantir a integridade física de nossos clientes e colaboradores.";
    doc.text(doc.splitTextToSize(policy, pageWidth - 28), 14, currentY);
    
    currentY += 25;
    
    // KPIs
    doc.setFontSize(14);
    doc.text("Indicadores de Desempenho (KPIs)", 14, currentY);
    currentY += 10;
    
    (doc as any).autoTable({
      startY: currentY,
      head: [["Indicador", "Valor Atual"]],
      body: [
        ["Riscos Ativos Identificados", stats.risks.toString()],
        ["Incidentes em Aberto", stats.incidents.toString()],
        ["Ações Corretivas Pendentes", stats.actions.toString()],
        ["Média de Satisfação/Segurança", `${stats.surveyAvg}/5`],
        ["Briefings Realizados", stats.briefings.toString()],
        ["Termos de Risco Assinados", stats.terms.toString()],
      ],
      theme: 'striped',
      styles: { fontSize: 10 }
    });
    
    currentY = (doc as any).lastAutoTable.finalY + 15;
    
    // Emergency
    doc.setFontSize(14);
    doc.text("Contatos de Emergência", 14, currentY);
    currentY += 10;
    
    (doc as any).autoTable({
      startY: currentY,
      head: [["Instituição", "Telefone", "Localização"]],
      body: [
        ["Ambulância", "(98) 98757-0033", "Santo Amaro"],
        ["Hospital Municipal", "(98) 8917-4057", "Santo Amaro"],
        ["Corpo de Bombeiros", "193 / (98) 98917-4057", "Região"],
        ["Defesa Civil", "(98) 97022-6113", "Santo Amaro"],
      ],
      theme: 'grid',
      styles: { fontSize: 9 }
    });

    doc.addPage();
    currentY = 20;
    doc.setFontSize(14);
    doc.text("Declaração de Compromisso", 14, currentY);
    currentY += 10;
    doc.setFontSize(10);
    doc.text("Este documento P1 integra o Sistema de Gestão de Segurança da Lençóis Tour e deve estar disponível para consulta pública. A assinatura abaixo ratifica o compromisso da gerência com os princípios de segurança turística.", 14, currentY, { maxWidth: pageWidth - 28 });
    
    currentY += 50;
    doc.line(14, currentY, 80, currentY);
    doc.text("Assinatura do Responsável", 14, currentY + 5);
    doc.text("Lençóis Tour", 14, currentY + 10);
    
    doc.save(`SGS_P1_Relatorio_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const quickActions = [
    { label: "Registrar Incidente", icon: Activity, path: "/admin/sgs/incidentes", color: "bg-destructive/10 text-destructive hover:bg-destructive/20" },
    { label: "Novo Briefing", icon: Shield, path: "/admin/sgs/briefings", color: "bg-primary/10 text-primary hover:bg-primary/20" },
    { label: "Novo Checklist", icon: ClipboardCheck, path: "/admin/sgs/checklists", color: "bg-primary/10 text-primary hover:bg-primary/20" },
    { label: "Controle P5", icon: ClipboardList, path: "/admin/sgs/controles", color: "bg-secondary/10 text-secondary hover:bg-secondary/20" },
    { label: "Termo de Risco", icon: FileText, path: "/admin/sgs/termos", color: "bg-secondary/10 text-secondary hover:bg-secondary/20" },
    { label: "Novo Risco", icon: AlertTriangle, path: "/admin/sgs/riscos", color: "bg-secondary/10 text-secondary hover:bg-secondary/20" },
    { label: "Gerar PGSAT", icon: FileText, path: "/admin/sgs/pgsat", color: "bg-primary/10 text-primary hover:bg-primary/20" },
    { label: "Gerar Relatório P1", icon: FileText, onClick: () => generateP1Report(), color: "bg-accent/10 text-accent-foreground hover:bg-accent/20" },
  ];

  const statCards = [
    { label: "Riscos Ativos", value: stats.risks, icon: AlertTriangle, color: "text-secondary", path: "/admin/sgs/riscos", urgent: stats.risks > 0 },
    { label: "Incidentes Abertos", value: stats.incidents, icon: Activity, color: "text-destructive", path: "/admin/sgs/incidentes", urgent: stats.incidents > 0 },
    { label: "Ações Pendentes", value: stats.actions, icon: CheckCircle, color: "text-primary", path: "/admin/sgs/acoes", urgent: stats.actions > 0 },
    { label: "Frota / Alertas", value: fleetAlerts.length, icon: Truck, color: "text-primary", path: "/admin/sgs/veiculos", urgent: fleetAlerts.length > 0 },
    { label: "Veículos Ativos", value: stats.veiculos, icon: Car, color: "text-primary", path: "/admin/sgs/veiculos" },
    { label: "Condutores Ativos", value: stats.condutores, icon: UserCheck2, color: "text-primary", path: "/admin/sgs/condutores" },
    { label: "Termos Pendentes", value: stats.pendingTerms, icon: Shield, color: "text-destructive", path: "/admin/sgs/termos", urgent: stats.pendingTerms > 0 },
    { label: "Avaliação Segurança", value: `${stats.surveyAvg}/5`, icon: Star, color: "text-primary", path: "/admin/sgs/pesquisas" },
    { label: "Equipamentos (P5)", value: stats.equipment, icon: Wrench, color: "text-primary", path: "/admin/sgs/controles" },
    { label: "Procedimentos (POP)", value: stats.procedures, icon: ClipboardList, color: "text-primary", path: "/admin/sgs/controles" },
  ];

  return (
    <AdminLayout title="SGS - Dashboard de Segurança">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <Loader2 className="animate-spin text-primary" size={40} />
          <p className="text-muted-foreground animate-pulse font-black uppercase text-xs tracking-widest">Sincronizando Gestão de Segurança...</p>
        </div>
      ) : (
        <div className="space-y-6">
        {/* Quick Actions Bar */}
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4 ml-1">Central de Ações Rápidas (SGS)</p>
          <div className="flex flex-wrap gap-2">
            {quickActions.map(a => (
              <button
                key={a.label}
                onClick={a.onClick ? a.onClick : () => navigate(a.path!)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-tight transition-all active:scale-95 shadow-sm ${a.color}`}
              >
                <a.icon size={16} strokeWidth={2.5} />
                {a.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stats - Clickable */}
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {statCards.map((s) => (
            <button
              key={s.label}
              onClick={() => navigate(s.path)}
              className={`bg-card border rounded-3xl p-5 text-left transition-all hover:shadow-lg hover:border-primary/40 group relative overflow-hidden ${s.urgent ? "border-destructive/30 shadow-[0_0_15px_-5px_rgba(239,68,68,0.1)]" : "border-border"}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-xl bg-muted/50 ${s.color} group-hover:scale-110 transition-transform`}>
                  <s.icon size={18} strokeWidth={2.5} />
                </div>
                <ArrowRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all hidden sm:block" />
              </div>
              <p className="text-2xl font-black text-foreground font-display tracking-tight leading-none mb-1">{s.value}</p>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-tight opacity-70">{s.label}</p>
              
              {s.urgent && (
                <div className="absolute top-0 right-0 w-1 h-full bg-destructive/40" />
              )}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Fleet Alerts - NEW */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-black text-foreground text-sm flex items-center gap-2">
                <Truck size={18} className="text-primary" /> Alertas de Frota
              </h3>
              {fleetAlerts.length > 0 && <Badge variant="destructive" className="animate-pulse">{fleetAlerts.length}</Badge>}
            </div>
            {fleetAlerts.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle size={32} className="mx-auto text-emerald-500/20 mb-2" />
                <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Documentação em dia</p>
              </div>
            ) : (
              <div className="space-y-3">
                {fleetAlerts.map((a, i) => (
                  <button
                    key={i}
                    onClick={() => navigate(a.link)}
                    className="w-full text-left flex items-start gap-3 p-3 rounded-xl hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-all group"
                  >
                    <div className={`p-2 rounded-lg shrink-0 ${a.severity === 'alta' ? 'bg-destructive/10 text-destructive' : 'bg-amber-100 text-amber-700'}`}>
                      {a.type === 'veiculo' ? <Car size={14} /> : <UserCheck2 size={14} />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-black text-foreground leading-tight group-hover:text-primary transition-colors">{a.title}</p>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase mt-0.5">{a.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            <button 
              onClick={() => navigate('/admin/sgs/veiculos')}
              className="w-full mt-4 py-2 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 rounded-lg transition-colors border border-primary/10"
            >
              Gerenciar Frota
            </button>
          </div>

          {/* Recent Activity */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-foreground text-sm">Atividade Recente</h3>
              <Clock size={14} className="text-muted-foreground" />
            </div>
            {recentActivity.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle size={28} className="mx-auto text-primary/40 mb-2" />
                <p className="text-xs text-muted-foreground">Nenhuma atividade recente</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((a, i) => (
                  <button
                    key={i}
                    onClick={() => navigate(a.link)}
                    className="w-full text-left flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                      a.severity === "critica" || a.severity === "alta" ? "bg-destructive" : "bg-secondary"
                    }`} />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{a.title}</p>
                      <p className="text-[11px] text-muted-foreground line-clamp-2">{a.desc}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                        {new Date(a.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Risk Distribution */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-display font-bold text-foreground text-sm mb-4">Distribuição de Riscos</h3>
            {risksByLevel.length > 0 && risksByLevel.some(r => r.value > 0) ? (
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={risksByLevel} cx="50%" cy="50%" outerRadius={60} innerRadius={30} dataKey="value">
                    {risksByLevel.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <AlertTriangle size={28} className="text-muted-foreground/30 mb-2" />
                <p className="text-xs text-muted-foreground">Nenhum risco cadastrado</p>
              </div>
            )}
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {risksByLevel.map(r => (
                <div key={r.name} className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground uppercase">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: r.fill }} />
                  {r.name}
                </div>
              ))}
            </div>
          </div>

          {/* Incidents Timeline */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-display font-bold text-foreground text-sm mb-4">Tendência de Incidentes</h3>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={incidentsByMonth}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border)/0.5)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} />
                <YAxis axisLine={false} tickLine={false} fontSize={10} />
                <Tooltip />
                <Line type="monotone" dataKey="incidentes" stroke="hsl(var(--destructive))" strokeWidth={3} dot={{ r: 4, strokeWidth: 0, fill: "hsl(var(--destructive))" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risks by Stage - Full Width */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-display font-bold text-foreground text-sm mb-4">Riscos por Etapa do Passeio</h3>
          {risksByStage.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={risksByStage}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip />
                <Bar dataKey="riscos" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8">
              <Map size={28} className="mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-xs text-muted-foreground">Cadastre riscos para visualizar a distribuição por etapa</p>
            </div>
          )}
        </div>

        {/* P4 - Emergency + ISO - Collapsible sections */}
        <details className="bg-card border border-border rounded-2xl overflow-hidden group">
          <summary className="px-5 py-4 cursor-pointer flex items-center gap-3 hover:bg-muted/30 transition-colors">
            <Phone size={18} className="text-destructive" />
            <span className="font-display font-bold text-foreground text-sm flex-1">P4 — Plano de Resposta à Emergência</span>
            <ArrowRight size={14} className="text-muted-foreground transition-transform group-open:rotate-90" />
          </summary>
          <div className="px-5 pb-5 pt-2">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
              {[
                { inst: "Ambulância", tel: "(98) 98757-0033", dist: "16 km / 30 min", end: "Centro de Santo Amaro" },
                { inst: "Hospital Municipal", tel: "(98) 8917-4057", dist: "20 km / 40 min", end: "Olho d'Água, Santo Amaro-MA" },
                { inst: "Bombeiro Militar", tel: "(98) 98917-4057", dist: "10 km / 20 min", end: "Centro de Santo Amaro" },
                { inst: "Defesa Civil", tel: "(98) 97022-6113", dist: "10 km / 20 min", end: "Rua do Sol, Centro, Santo Amaro-MA" },
              ].map((c) => (
                <div key={c.inst} className="bg-destructive/5 border border-destructive/20 rounded-xl p-3">
                  <p className="font-bold text-foreground text-xs">{c.inst}</p>
                  <a href={`tel:${c.tel.replace(/\D/g, "")}`} className="text-primary font-mono text-sm mt-1 block hover:underline">{c.tel}</a>
                  <p className="text-[10px] text-muted-foreground mt-1">📍 {c.end} · ⏱️ {c.dist}</p>
                </div>
              ))}
            </div>
            <p className="font-semibold text-foreground text-xs mb-2">Procedimento para Acidentes (P4 VATTI):</p>
            <div className="grid sm:grid-cols-2 gap-1.5">
              {[
                "1. Avaliar o cenário da situação",
                "2. Verificar necessidade de primeiros socorros",
                "3. Realizar atendimento se capacitado",
                "4. Gestão de crise com o grupo presente",
                "5. Comunicar a sede e solicitar apoio",
                "6. Solicitar resgate se necessário",
                "7. Registrar o acidente no formulário (P5)",
              ].map((step) => (
                <div key={step} className="flex items-start gap-2 text-[11px] text-foreground bg-muted rounded-lg px-3 py-1.5">
                  <CheckCircle size={10} className="text-primary mt-0.5 flex-shrink-0" />
                  {step}
                </div>
              ))}
            </div>
          </div>
        </details>

        <details className="bg-card border border-border rounded-2xl overflow-hidden group">
          <summary className="px-5 py-4 cursor-pointer flex items-center gap-3 hover:bg-muted/30 transition-colors">
            <Shield size={18} className="text-primary" />
            <span className="font-display font-bold text-foreground text-sm flex-1">Conformidade — ISO 21101 / 21102 / 21103 + VATTI</span>
            <ArrowRight size={14} className="text-muted-foreground transition-transform group-open:rotate-90" />
          </summary>
          <div className="px-5 pb-5 pt-2">
            <div className="grid md:grid-cols-3 gap-3">
              {[
                { norm: "ISO 21101", desc: "Sistema de Gestão de Segurança", items: ["Matriz de riscos (P2)", "Tratamento de riscos (P3)", "Ações corretivas", "Auditorias internas"] },
                { norm: "ISO 21102", desc: "Competência dos Líderes", items: ["Certificações da equipe", "Treinamentos e reciclagens", "Primeiros socorros"] },
                { norm: "ISO 21103", desc: "Informações aos Participantes", items: ["Termo de risco (P6)", "Briefing de segurança", "Pesquisa pós-passeio", "Plano de emergência (P4)"] },
              ].map((n) => (
                <div key={n.norm} className="bg-muted rounded-xl p-3">
                  <p className="font-bold text-foreground text-xs">{n.norm}</p>
                  <p className="text-[10px] text-muted-foreground mb-2">{n.desc}</p>
                  <ul className="text-[11px] text-muted-foreground space-y-0.5">
                    {n.items.map((item) => (
                      <li key={item} className="flex items-center gap-1">
                        <CheckCircle size={10} className="text-primary" /> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </details>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminSGSDashboard;
