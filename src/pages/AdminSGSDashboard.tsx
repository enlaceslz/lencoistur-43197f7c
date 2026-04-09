import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Shield, AlertTriangle, CheckCircle, Users, TrendingUp, Activity, Phone, Building2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

const AdminSGSDashboard = () => {
  const [stats, setStats] = useState({ risks: 0, incidents: 0, actions: 0, expiring: 0, surveyAvg: 0, briefings: 0, terms: 0 });
  const [risksByLevel, setRisksByLevel] = useState<any[]>([]);
  const [incidentsByMonth, setIncidentsByMonth] = useState<any[]>([]);
  const [risksByStage, setRisksByStage] = useState<any[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [risksRes, incidentsRes, actionsRes, staffRes, surveysRes, briefingsRes, termsRes] = await Promise.all([
      supabase.from("sgs_risks").select("*"),
      supabase.from("sgs_incidents").select("*"),
      supabase.from("sgs_corrective_actions").select("*").in("status", ["pendente", "em_andamento"]),
      supabase.from("sgs_staff_trainings").select("*").eq("status", "vencendo"),
      supabase.from("sgs_safety_surveys").select("felt_safe"),
      supabase.from("sgs_briefings").select("id"),
      supabase.from("sgs_risk_terms").select("id"),
    ]);

    const risks = risksRes.data || [];
    const incidents = incidentsRes.data || [];
    const actions = actionsRes.data || [];
    const surveys = surveysRes.data || [];

    const avgSafety = surveys.length > 0
      ? (surveys.reduce((sum: number, s: any) => sum + (s.felt_safe || 0), 0) / surveys.length).toFixed(1)
      : "0";

    setStats({
      risks: risks.filter((r: any) => r.status === "ativo").length,
      incidents: incidents.filter((i: any) => i.status !== "fechado").length,
      actions: actions.length,
      expiring: (staffRes.data || []).length,
      surveyAvg: Number(avgSafety),
      briefings: (briefingsRes.data || []).length,
      terms: (termsRes.data || []).length,
    });

    const acceptable = risks.filter((r: any) => r.risk_level < 6).length;
    const temporary = risks.filter((r: any) => r.risk_level >= 6 && r.risk_level < 12).length;
    const unacceptable = risks.filter((r: any) => r.risk_level >= 12).length;
    setRisksByLevel([
      { name: "Aceitável (<6)", value: acceptable, fill: "hsl(var(--primary))" },
      { name: "Temporário (6-11)", value: temporary, fill: "hsl(var(--secondary))" },
      { name: "Inaceitável (≥12)", value: unacceptable, fill: "hsl(var(--destructive))" },
    ]);

    const stageLabels: Record<string, string> = {
      venda_recepcao: "Venda", trajeto_ida: "Ida", passeio_dunas: "Dunas",
      travessia_rios: "Travessia", paradas: "Paradas", banho_lagoas: "Lagoas",
      passeio_barco: "Barco", trilhas: "Trilhas", trajeto_volta: "Volta",
    };
    const stageMap = new Map<string, number>();
    risks.forEach((r: any) => { stageMap.set(r.stage, (stageMap.get(r.stage) || 0) + 1); });
    setRisksByStage(Array.from(stageMap.entries()).map(([stage, count]) => ({ name: stageLabels[stage] || stage, riscos: count })));

    const months: Record<string, number> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months[`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`] = 0;
    }
    incidents.forEach((inc: any) => { const key = inc.date?.slice(0, 7); if (key && key in months) months[key]++; });
    setIncidentsByMonth(Object.entries(months).map(([month, count]) => ({ name: month.slice(5), incidentes: count })));
  };

  const statCards = [
    { label: "Riscos Ativos", value: stats.risks, icon: AlertTriangle, color: "text-secondary" },
    { label: "Incidentes Abertos", value: stats.incidents, icon: Activity, color: "text-destructive" },
    { label: "Ações Pendentes", value: stats.actions, icon: CheckCircle, color: "text-primary" },
    { label: "Briefings", value: stats.briefings, icon: Users, color: "text-primary" },
    { label: "Termos Assinados", value: stats.terms, icon: Shield, color: "text-primary" },
    { label: "Avaliação Segurança", value: `${stats.surveyAvg}/5`, icon: TrendingUp, color: "text-primary" },
  ];

  return (
    <AdminLayout title="SGS - Dashboard de Segurança">
      <div className="space-y-6">
        {/* P1 - Company info */}
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <Building2 size={20} className="text-primary" />
            <h3 className="font-display font-bold text-foreground">LENÇÓIS TOUR — Plano de Gestão da Segurança</h3>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs text-muted-foreground">
            <div><span className="font-semibold text-foreground">Responsável:</span> Lillavatti Sampaio</div>
            <div><span className="font-semibold text-foreground">Resp. Técnico:</span> Richard Soares</div>
            <div><span className="font-semibold text-foreground">Produto:</span> Passeios 4x4 Rota das Emoções</div>
            <div><span className="font-semibold text-foreground">Local:</span> Pça Nsa Sra Conceição, Santo Amaro-MA</div>
          </div>
          <p className="text-xs text-muted-foreground mt-3 italic">
            Comprometimento em cumprir a legislação de turismo, implementar e melhorar a gestão dos riscos das atividades,
            adotando medidas de controle e monitoramento de incidentes.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-display font-bold text-foreground mb-4">Distribuição de Riscos (P2)</h3>
            {risksByLevel.length > 0 && risksByLevel.some(r => r.value > 0) ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={risksByLevel} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {risksByLevel.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-16">Nenhum risco cadastrado</p>
            )}
          </div>

          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-display font-bold text-foreground mb-4">Evolução de Incidentes (P5)</h3>
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

        {/* P4 - Emergency contacts from VATTI */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Phone size={20} className="text-destructive" />
            <h3 className="font-display font-bold text-foreground">P4 — Plano de Resposta à Emergência</h3>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { inst: "Ambulância", tel: "(98) 98757-0033", dist: "16 km / 30 min", end: "Centro de Santo Amaro" },
              { inst: "Hospital Municipal", tel: "(98) 8917-4057", dist: "20 km / 40 min", end: "Olho d'Água, Santo Amaro-MA" },
              { inst: "Bombeiro Militar", tel: "(98) 98917-4057", dist: "10 km / 20 min", end: "Centro de Santo Amaro" },
              { inst: "Defesa Civil", tel: "(98) 97022-6113", dist: "10 km / 20 min", end: "Rua do Sol, Centro, Santo Amaro-MA" },
            ].map((c) => (
              <div key={c.inst} className="bg-destructive/5 border border-destructive/20 rounded-xl p-4">
                <p className="font-bold text-foreground text-sm">{c.inst}</p>
                <p className="text-primary font-mono text-sm mt-1">{c.tel}</p>
                <p className="text-xs text-muted-foreground mt-1">📍 {c.end}</p>
                <p className="text-xs text-muted-foreground">⏱️ {c.dist}</p>
              </div>
            ))}
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm mb-3">Procedimento Geral para Acidentes (P4 VATTI):</p>
            <div className="grid sm:grid-cols-2 gap-2">
              {[
                "1. Avaliar o cenário da situação",
                "2. A(s) vítima(s) precisam de primeiros socorros?",
                "3. O condutor está treinado para prestar atendimento?",
                "4. Se sim, realizar o atendimento de primeiros socorros",
                "5. Gestão de crise com o grupo presente",
                "6. Comunicar a sede da empresa e solicitar apoio",
                "7. A(s) vítima(s) precisam de resgate?",
                "8. Se sim, solicitar o resgate",
                "9. Comunicação com grupo para gestão de crise",
                "10. Solicitar apoio adicional se necessário",
                "11. Verificar necessidade de apoio pós-atendimento",
                "12. Registrar o acidente no formulário (P5)",
              ].map((step) => (
                <div key={step} className="flex items-start gap-2 text-xs text-foreground bg-muted rounded-lg px-3 py-2">
                  <CheckCircle size={12} className="text-primary mt-0.5 flex-shrink-0" />
                  {step}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ISO compliance info */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield size={24} className="text-primary" />
            <h3 className="font-display font-bold text-foreground">Conformidade com Normas ISO e VATTI</h3>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { norm: "ISO 21101", desc: "Sistema de Gestão de Segurança", items: ["Matriz de riscos (P2)", "Tratamento de riscos (P3)", "Ações corretivas", "Auditorias internas"] },
              { norm: "ISO 21102", desc: "Competência dos Líderes", items: ["Certificações da equipe", "Treinamentos e reciclagens", "Capacitação em primeiros socorros"] },
              { norm: "ISO 21103", desc: "Informações aos Participantes", items: ["Termo de risco (P6)", "Briefing de segurança", "Pesquisa pós-passeio", "Plano de emergência (P4)"] },
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
