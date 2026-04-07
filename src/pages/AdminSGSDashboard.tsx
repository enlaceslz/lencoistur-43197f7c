import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Shield, AlertTriangle, CheckCircle, Users, TrendingUp, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--destructive))", "hsl(var(--accent))"];

const AdminSGSDashboard = () => {
  const [stats, setStats] = useState({ risks: 0, incidents: 0, actions: 0, expiring: 0, surveyAvg: 0 });
  const [risksByLevel, setRisksByLevel] = useState<any[]>([]);
  const [incidentsByMonth, setIncidentsByMonth] = useState<any[]>([]);
  const [risksByStage, setRisksByStage] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [risksRes, incidentsRes, actionsRes, staffRes, surveysRes] = await Promise.all([
      supabase.from("sgs_risks").select("*"),
      supabase.from("sgs_incidents").select("*"),
      supabase.from("sgs_corrective_actions").select("*").in("status", ["pendente", "em_andamento"]),
      supabase.from("sgs_staff_trainings").select("*").eq("status", "vencendo"),
      supabase.from("sgs_safety_surveys").select("felt_safe"),
    ]);

    const risks = risksRes.data || [];
    const incidents = incidentsRes.data || [];
    const actions = actionsRes.data || [];
    const expiring = staffRes.data || [];
    const surveys = surveysRes.data || [];

    const avgSafety = surveys.length > 0
      ? (surveys.reduce((sum: number, s: any) => sum + (s.felt_safe || 0), 0) / surveys.length).toFixed(1)
      : "0";

    setStats({
      risks: risks.filter((r: any) => r.status === "ativo").length,
      incidents: incidents.filter((i: any) => i.status !== "fechado").length,
      actions: actions.length,
      expiring: expiring.length,
      surveyAvg: Number(avgSafety),
    });

    // Riscos por nível (DEVOLUTIVA VATI criteria)
    const acceptable = risks.filter((r: any) => r.risk_level < 6).length;
    const temporary = risks.filter((r: any) => r.risk_level >= 6 && r.risk_level < 12).length;
    const unacceptable = risks.filter((r: any) => r.risk_level >= 12).length;
    setRisksByLevel([
      { name: "Aceitável (<6)", value: acceptable, fill: "hsl(var(--primary))" },
      { name: "Temporário (6-11)", value: temporary, fill: "hsl(var(--secondary))" },
      { name: "Inaceitável (≥12)", value: unacceptable, fill: "hsl(var(--destructive))" },
    ]);

    // Riscos por etapa
    const stageLabels: Record<string, string> = {
      venda_recepcao: "Venda", trajeto_ida: "Trajeto Ida",
      passeio_dunas: "Dunas", banho_lagoas: "Lagoas", passeio_barco: "Barco",
      trilhas: "Trilhas", trajeto_volta: "Volta", retorno: "Retorno", pos_passeio: "Pós",
    };
    const stageMap = new Map<string, number>();
    risks.forEach((r: any) => {
      stageMap.set(r.stage, (stageMap.get(r.stage) || 0) + 1);
    });
    setRisksByStage(
      Array.from(stageMap.entries()).map(([stage, count]) => ({
        name: stageLabels[stage] || stage, riscos: count,
      }))
    );

    // Incidentes por mês (últimos 6 meses)
    const months: Record<string, number> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months[`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`] = 0;
    }
    incidents.forEach((inc: any) => {
      const key = inc.date?.slice(0, 7);
      if (key && key in months) months[key]++;
    });
    setIncidentsByMonth(
      Object.entries(months).map(([month, count]) => ({
        name: month.slice(5), incidentes: count,
      }))
    );
  };

  const statCards = [
    { label: "Riscos Ativos", value: stats.risks, icon: AlertTriangle, color: "text-secondary" },
    { label: "Incidentes Abertos", value: stats.incidents, icon: Activity, color: "text-destructive" },
    { label: "Ações Pendentes", value: stats.actions, icon: CheckCircle, color: "text-primary" },
    { label: "Treinamentos Vencendo", value: stats.expiring, icon: Users, color: "text-secondary" },
    { label: "Avaliação Segurança", value: `${stats.surveyAvg}/5`, icon: TrendingUp, color: "text-primary" },
  ];

  return (
    <AdminLayout title="SGS - Dashboard de Segurança">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {statCards.map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <s.icon size={18} className={s.color} />
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
              <p className="text-2xl font-bold text-foreground font-display">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Risk Distribution */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-display font-bold text-foreground mb-4">Distribuição de Riscos</h3>
            {risksByLevel.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={risksByLevel} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {risksByLevel.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-16">Nenhum risco cadastrado</p>
            )}
          </div>

          {/* Incidents Timeline */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-display font-bold text-foreground mb-4">Evolução de Incidentes</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={incidentsByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="incidentes" stroke="hsl(var(--destructive))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Risks by Stage */}
          <div className="bg-card border border-border rounded-2xl p-6 md:col-span-2">
            <h3 className="font-display font-bold text-foreground mb-4">Riscos por Etapa do Passeio</h3>
            {risksByStage.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={risksByStage}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="riscos" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-16">Nenhum risco cadastrado</p>
            )}
          </div>
        </div>

        {/* ISO compliance info */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield size={24} className="text-primary" />
            <h3 className="font-display font-bold text-foreground">Conformidade com Normas ISO</h3>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { norm: "ISO 21101", desc: "Sistema de Gestão de Segurança", items: ["Matriz de riscos", "Ações corretivas", "Auditorias"] },
              { norm: "ISO 21102", desc: "Competência dos Líderes", items: ["Certificações da equipe", "Treinamentos", "Reciclagens"] },
              { norm: "ISO 21103", desc: "Informações aos Participantes", items: ["Termo de risco", "Resumo", "Pesquisa pós-passeio"] },
            ].map((n) => (
              <div key={n.norm} className="bg-muted rounded-xl p-4">
                <p className="font-bold text-foreground text-sm">{n.norm}</p>
                <p className="text-xs text-muted-foreground mb-2">{n.desc}</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {n.items.map((item) => (
                    <li key={item} className="flex items-center gap-1">
                      <CheckCircle size={12} className="text-primary" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSGSDashboard;
