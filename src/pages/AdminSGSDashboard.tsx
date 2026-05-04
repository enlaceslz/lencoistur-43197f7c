import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import {
  Shield, AlertTriangle, CheckCircle, Activity, Phone, Car, UserCheck2, Map, Truck, Star,
  Wrench, ClipboardList, Loader2, Waves, Sun, Award, CheckCircle2, Clock
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
          <div className="grid lg:grid-cols-3 gap-6 animate-in-fade" style={{ animationDelay: '0.1s' }}>
            <div className="lg:col-span-2 glass-card rounded-[2.5rem] p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity"><Waves size={120} className="text-primary" /></div>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"><Activity size={16} className="text-primary" /></div>
                <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Santo Amaro Safety Pulse</h2>
                <Badge variant="outline" className="ml-auto border-emerald-500/30 text-emerald-600 bg-emerald-50 text-[9px] font-black uppercase tracking-widest">Operação Normal</Badge>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Nível Lagoas</p>
                  <span className="text-2xl font-black text-foreground tracking-tighter">85%</span>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Clima</p>
                  <div className="flex items-center gap-2"><Sun className="text-amber-500" size={20} /><span className="text-sm font-black text-foreground">Ensolarado</span></div>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Maré (Atins)</p>
                  <div className="flex items-center gap-2"><Waves className="text-primary" size={20} /><span className="text-sm font-black text-foreground">14:30</span></div>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Risco</p>
                  <div className="flex items-center gap-2"><Shield className="text-emerald-500" size={20} /><span className="text-sm font-black text-emerald-600">BAIXO</span></div>
                </div>
              </div>
            </div>
            <div className="glass-card rounded-[2.5rem] p-6 border-primary/10 bg-gradient-to-br from-primary/[0.02] to-transparent">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Compliance & Normas</h2>
                <Award size={20} className="text-primary/40" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-white/50 border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center"><CheckCircle2 size={16} className="text-emerald-600" /></div>
                    <div><p className="text-[11px] font-black text-foreground uppercase">CADASTUR</p></div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-2xl bg-white/50 border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center"><CheckCircle2 size={16} className="text-emerald-600" /></div>
                    <div><p className="text-[11px] font-black text-foreground uppercase">ICMBio</p></div>
                  </div>
                </div>
              </div>
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
        </div>
      )}
    </AdminLayout>
  );
};
export default AdminSGSDashboard;