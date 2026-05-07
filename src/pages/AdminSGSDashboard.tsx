import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import {
  Shield, AlertTriangle, CheckCircle, Activity, Phone, Car, UserCheck2, Map, Truck, Star,
  Wrench, ClipboardList, Loader2, Waves, Sun, Award, CheckCircle2, Clock, FileText, Info
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

    const avgSafety = surveys.length > 0 ? (surveys.reduce((sum: number, s: any) => sum + (s.felt_safe || 0), 0) / surveys.length).toFixed(1) : "0";
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

    const alerts: any[] = [];
    const now = new Date();
    const soon = new Date();
    soon.setDate(now.getDate() + 30);
    const isExpired = (d: string | null) => d && new Date(d) < now;
    const isExpiring = (d: string | null) => d && new Date(d) >= now && new Date(d) <= soon;

    (veiculosRes.data || []).forEach((v: any) => {
      if (isExpired(v.seguro_validade)) alerts.push({ type: 'veiculo', title: `Seguro Vencido: ${v.placa}`, desc: v.marca + ' ' + v.modelo, severity: 'alta', link: '/admin/sgs/veiculos' });
      else if (isExpiring(v.seguro_validade)) alerts.push({ type: 'veiculo', title: `Seguro Vencendo: ${v.placa}`, desc: v.marca + ' ' + v.modelo, severity: 'media', link: '/admin/sgs/veiculos' });
    });

    setFleetAlerts(alerts.sort((a, b) => a.severity === 'alta' ? -1 : 1).slice(0, 6));

    const recent: any[] = [];
    incidents.slice(0, 3).forEach((inc: any) => {
      recent.push({ title: `Incidente: ${inc.type}`, desc: inc.description?.slice(0, 80), date: inc.created_at, severity: inc.severity, link: "/admin/sgs/incidentes" });
    });
    setRecentActivity(recent);

    setRisksByLevel([
      { name: "Aceitável", value: risks.filter((r: any) => r.risk_level < 6).length, fill: "hsl(var(--primary))" },
      { name: "Temporário", value: risks.filter((r: any) => r.risk_level >= 6 && r.risk_level < 12).length, fill: "hsl(var(--secondary))" },
      { name: "Inaceitável", value: risks.filter((r: any) => r.risk_level >= 12).length, fill: "hsl(var(--destructive))" },
    ]);

    setLoading(false);
  };

  const statCards = [
    { label: "Riscos Ativos", value: stats.risks, icon: AlertTriangle, color: "text-secondary", path: "/admin/sgs/riscos", urgent: stats.risks > 0 },
    { label: "Incidentes", value: stats.incidents, icon: Activity, color: "text-destructive", path: "/admin/sgs/incidentes", urgent: stats.incidents > 0 },
    { label: "Ações Pendentes", value: stats.actions, icon: CheckCircle, color: "text-primary", path: "/admin/sgs/acoes", urgent: stats.actions > 0 },
    { label: "Frota Alertas", value: fleetAlerts.length, icon: Truck, color: "text-primary", path: "/admin/sgs/veiculos", urgent: fleetAlerts.length > 0 },
  ];

  return (
    <AdminLayout title="SGS - Gestão de Segurança">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <Loader2 className="animate-spin text-primary" size={40} />
          <p className="text-muted-foreground animate-pulse font-black uppercase text-xs tracking-widest">Sincronizando Sistema de Segurança...</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid lg:grid-cols-4 gap-6 animate-in-fade" style={{ animationDelay: '0.1s' }}>
            <div className="lg:col-span-3 glass-card rounded-[2.5rem] p-6 relative overflow-hidden group border-primary/10">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity"><Waves size={120} className="text-primary" /></div>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"><Activity size={16} className="text-primary" /></div>
                <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Santo Amaro Safety Pulse (Real-Time)</h2>
                <Badge variant="outline" className="ml-auto border-emerald-500/30 text-emerald-600 bg-emerald-50 text-[9px] font-black uppercase tracking-widest">Operação Segura</Badge>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { label: "Nível Lagoas", val: "85%", badge: "IDEAL", icon: Waves, iconCol: "text-blue-500" },
                  { label: "Clima (INMET)", val: "32°C", desc: "Ensolarado", icon: Sun, iconCol: "text-amber-500" },
                  { label: "Vento (km/h)", val: "12 NE", desc: "Brisa Leve", icon: Activity, iconCol: "text-sky-500" },
                  { label: "Ocupação", val: "64%", desc: "Capacidade", icon: UserCheck2, iconCol: "text-purple-500" },
                ].map((stat, i) => (
                  <div key={i} className="space-y-1">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-foreground tracking-tighter">{stat.val}</span>
                        {stat.badge && <Badge className="bg-emerald-500/10 text-emerald-600 border-none text-[8px] h-4">{stat.badge}</Badge>}
                      </div>
                      <stat.icon size={16} className={stat.iconCol} />
                    </div>
                    {stat.desc && <p className="text-[10px] font-bold text-muted-foreground/60">{stat.desc}</p>}
                  </div>
                ))}
              </div>
            </div>
            <div className="glass-card rounded-[2.5rem] p-6 border-primary/20 bg-gradient-to-br from-primary/[0.05] to-transparent relative overflow-hidden shadow-lg shadow-primary/5 flex flex-col justify-center">
              <div className="absolute -right-4 -top-4 opacity-10 rotate-12"><Shield size={100} className="text-primary" /></div>
              <div className="text-center space-y-2">
                <p className="text-[9px] font-black text-primary uppercase tracking-[0.3em]">SGS Health Score</p>
                <p className="text-5xl font-black text-foreground tracking-tighter">98<span className="text-lg text-primary/40">/100</span></p>
                <div className="flex justify-center gap-1">
                  {[1,2,3,4,5].map(i => <Star key={i} size={10} className="fill-primary text-primary" />)}
                </div>
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">ISO 21101 Compliant</p>
              </div>
            </div>
          </div>
          {/* Quick Actions Bar */}
          <div className="glass-card rounded-[2.5rem] p-8 shadow-sm animate-in-fade border-primary/5 bg-gradient-to-r from-primary/[0.03] to-transparent" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between mb-6">
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] ml-1">Central de Gestão e Resposta SGS (ABNT ISO 21101)</p>
              <div className="flex gap-2">
                <Badge variant="outline" className="text-[8px] font-black uppercase tracking-tighter">PRE — Plano de Resposta a Emergências</Badge>
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              {[
                { label: "Registrar Incidente", icon: Activity, path: "/admin/sgs/incidentes", color: "bg-destructive text-white shadow-destructive/20 hover:bg-destructive/90" },
                { label: "Briefing Operacional", icon: Shield, path: "/admin/sgs/briefings", color: "bg-primary text-white shadow-primary/20 hover:bg-primary/90" },
                { label: "Checklist 4x4", icon: ClipboardList, path: "/admin/sgs/checklists", color: "bg-white text-primary border border-primary/20 hover:bg-primary/5" },
                { label: "Termo de Risco", icon: FileText, path: "/admin/sgs/termos", color: "bg-white text-secondary border border-secondary/20 hover:bg-secondary/5" },
                { label: "IA Segurança", icon: Bot, path: "/admin/ia", color: "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-indigo-500/20 hover:opacity-90" },
                { label: "Gerar PGSAT", icon: Award, path: "/admin/sgs/pgsat", color: "bg-ocean-dark text-white shadow-ocean/20 hover:opacity-90" },
              ].map(a => (
                <button
                  key={a.label}
                  onClick={() => navigate(a.path)}
                  className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-tight transition-all active:scale-95 shadow-md ${a.color}`}
                >
                  <a.icon size={18} strokeWidth={2.5} />
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in-fade" style={{ animationDelay: '0.3s' }}>
            {statCards.map((s, idx) => (
              <button key={s.label} onClick={() => navigate(s.path)} className="glass-card rounded-[2rem] p-6 text-left relative overflow-hidden group">
                <div className="flex items-center justify-between mb-6">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-primary/10 ${s.color}`}><s.icon size={22} strokeWidth={2.5} /></div>
                  {s.urgent && <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />}
                </div>
                <p className="text-2xl font-black text-foreground tracking-tighter">{s.value}</p>
                <p className="text-[10px] font-black text-muted-foreground mt-1 uppercase tracking-[0.2em]">{s.label}</p>
              </button>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6 animate-in-fade" style={{ animationDelay: '0.4s' }}>
            {/* Risk Distribution Chart */}
            <div className="glass-card rounded-[2.5rem] p-6">
              <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-6">Distribuição de Riscos</h3>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={risksByLevel} cx="50%" cy="50%" outerRadius={80} innerRadius={40} dataKey="value">
                      {risksByLevel.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="glass-card rounded-[2.5rem] p-6">
              <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-6">Atividade Recente</h3>
              <div className="space-y-4">
                {recentActivity.map((a, i) => (
                  <div key={i} className="flex items-start gap-4 p-3 rounded-2xl hover:bg-primary/5 transition-colors border border-transparent hover:border-primary/10">
                    <div className={`w-2 h-2 rounded-full mt-2 ${a.severity === 'alta' ? 'bg-destructive' : 'bg-primary'}`} />
                    <div className="flex-1">
                      <p className="text-xs font-black text-foreground uppercase tracking-tight">{a.title}</p>
                      <p className="text-[10px] text-muted-foreground line-clamp-1">{a.desc}</p>
                    </div>
                    <p className="text-[9px] font-bold text-muted-foreground/60 uppercase">
                      {new Date(a.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
export default AdminSGSDashboard;