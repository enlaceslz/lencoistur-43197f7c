import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import {
  Shield, AlertTriangle, CheckCircle, Users, TrendingUp, Activity, Phone, Building2,
  Plus, ArrowRight, Clock, FileText, ClipboardCheck, Car, UserCheck2, Map, Truck, Star
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

const AdminSGSDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ risks: 0, incidents: 0, actions: 0, expiring: 0, surveyAvg: 0, briefings: 0, terms: 0, pendingTerms: 0, veiculos: 0, condutores: 0, checklists: 0 });
  const [risksByLevel, setRisksByLevel] = useState<any[]>([]);
  const [incidentsByMonth, setIncidentsByMonth] = useState<any[]>([]);
  const [risksByStage, setRisksByStage] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [risksRes, incidentsRes, actionsRes, staffRes, surveysRes, briefingsRes, termsRes, veiculosRes, condutoresRes, checklistsRes, bookingsRes] = await Promise.all([
      supabase.from("sgs_risks").select("*"),
      supabase.from("sgs_incidents").select("*").order("created_at", { ascending: false }),
      supabase.from("sgs_corrective_actions").select("*").in("status", ["pendente", "em_andamento"]),
      supabase.from("sgs_staff_trainings").select("*").eq("status", "vencendo"),
      supabase.from("sgs_safety_surveys").select("felt_safe"),
      supabase.from("sgs_briefings").select("id"),
      supabase.from("sgs_risk_terms").select("booking_id"),
      supabase.from("sgs_veiculos").select("id").eq("status", "ativo"),
      supabase.from("sgs_condutores").select("id").eq("status", "ativo"),
      supabase.from("sgs_checklists").select("id, created_at").order("created_at", { ascending: false }).limit(1),
      supabase.from("bookings").select("id").not("status", "eq", "cancelada"),
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
      checklists: checklistsRes.data?.length || 0,
    });

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
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months[`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`] = 0;
    }
    incidents.forEach((inc: any) => { const key = inc.date?.slice(0, 7); if (key && key in months) months[key]++; });
    setIncidentsByMonth(Object.entries(months).map(([month, count]) => ({ name: month.slice(5), incidentes: count })));
  };

  const quickActions = [
    { label: "Registrar Incidente", icon: Activity, path: "/admin/sgs/incidentes", color: "bg-destructive/10 text-destructive hover:bg-destructive/20" },
    { label: "Novo Briefing", icon: Shield, path: "/admin/sgs/briefings", color: "bg-primary/10 text-primary hover:bg-primary/20" },
    { label: "Novo Checklist", icon: ClipboardCheck, path: "/admin/sgs/checklists", color: "bg-primary/10 text-primary hover:bg-primary/20" },
    { label: "Termo de Risco", icon: FileText, path: "/admin/sgs/termos", color: "bg-secondary/10 text-secondary hover:bg-secondary/20" },
    { label: "Novo Risco", icon: AlertTriangle, path: "/admin/sgs/riscos", color: "bg-secondary/10 text-secondary hover:bg-secondary/20" },
    { label: "Gerar PGSAT", icon: FileText, path: "/admin/sgs/pgsat", color: "bg-primary/10 text-primary hover:bg-primary/20" },
    { label: "Gerar Relatório P1", icon: FileText, onClick: () => generateP1Report(), color: "bg-accent/10 text-accent-foreground hover:bg-accent/20" },
  ];

  const statCards = [
    { label: "Riscos Ativos", value: stats.risks, icon: AlertTriangle, color: "text-secondary", path: "/admin/sgs/riscos", urgent: stats.risks > 0 },
    { label: "Incidentes Abertos", value: stats.incidents, icon: Activity, color: "text-destructive", path: "/admin/sgs/incidentes", urgent: stats.incidents > 0 },
    { label: "Ações Pendentes", value: stats.actions, icon: CheckCircle, color: "text-primary", path: "/admin/sgs/acoes", urgent: stats.actions > 0 },
    { label: "Veículos Ativos", value: stats.veiculos, icon: Car, color: "text-primary", path: "/admin/sgs/veiculos" },
    { label: "Condutores Ativos", value: stats.condutores, icon: UserCheck2, color: "text-primary", path: "/admin/sgs/condutores" },
    { label: "Briefings", value: stats.briefings, icon: Shield, color: "text-primary", path: "/admin/sgs/briefings" },
    { label: "Termos Assinados", value: stats.terms, icon: FileText, color: "text-primary", path: "/admin/sgs/termos" },
    { label: "Termos Pendentes", value: stats.pendingTerms, icon: Shield, color: "text-destructive", path: "/admin/sgs/termos", urgent: stats.pendingTerms > 0 },
    { label: "Avaliação Segurança", value: `${stats.surveyAvg}/5`, icon: Star, color: "text-primary", path: "/admin/sgs/pesquisas" },
  ];

  return (
    <AdminLayout title="SGS - Dashboard de Segurança">
      <div className="space-y-6">
        {/* Quick Actions Bar */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Ações Rápidas</p>
          <div className="flex flex-wrap gap-2">
            {quickActions.map(a => (
              <button
                key={a.label}
                onClick={() => navigate(a.path)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${a.color}`}
              >
                <a.icon size={14} />
                {a.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stats - Clickable */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {statCards.map((s) => (
            <button
              key={s.label}
              onClick={() => navigate(s.path)}
              className={`bg-card border rounded-2xl p-4 text-left transition-all hover:shadow-md hover:border-primary/30 group ${s.urgent ? "border-destructive/30" : "border-border"}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <s.icon size={16} className={s.color} />
                  <span className="text-[11px] text-muted-foreground">{s.label}</span>
                </div>
                <ArrowRight size={12} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-xl font-bold text-foreground font-display">{s.value}</p>
            </button>
          ))}
        </div>

        {/* Recent Activity + Charts Row */}
        <div className="grid lg:grid-cols-3 gap-6">
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
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={risksByLevel} cx="50%" cy="50%" outerRadius={70} innerRadius={35} dataKey="value" label={({ name, value }) => `${value}`}>
                    {risksByLevel.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <AlertTriangle size={28} className="text-muted-foreground/30 mb-2" />
                <p className="text-xs text-muted-foreground">Nenhum risco cadastrado</p>
                <button onClick={() => navigate("/admin/sgs/riscos")} className="text-xs text-primary hover:underline mt-1">+ Cadastrar risco</button>
              </div>
            )}
            <div className="flex justify-center gap-4 mt-2">
              {risksByLevel.map(r => (
                <div key={r.name} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: r.fill }} />
                  {r.name}
                </div>
              ))}
            </div>
          </div>

          {/* Incidents Timeline */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-display font-bold text-foreground text-sm mb-4">Incidentes (6 meses)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={incidentsByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip />
                <Line type="monotone" dataKey="incidentes" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ r: 3 }} />
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
    </AdminLayout>
  );
};

export default AdminSGSDashboard;
