import { useEffect, useState, useMemo } from "react";
import {
  DollarSign, TrendingUp, Calendar,
  Loader2, ShieldAlert,
  LayoutDashboard,
  CheckCircle2, Clock, XCircle, ArrowRight
} from "lucide-react";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const PIE_COLORS = [
  "hsl(174, 62%, 38%)", "hsl(35, 80%, 55%)",
  "hsl(195, 80%, 45%)", "hsl(20, 90%, 60%)",
  "hsl(270, 50%, 55%)", "hsl(140, 60%, 40%)",
];

const statusMap: Record<string, { label: string; className: string; icon: any }> = {
  confirmada: { label: "Confirmada", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: CheckCircle2 },
  pendente: { label: "Pendente", className: "bg-amber-500/10 text-amber-600 border-amber-500/20", icon: Clock },
  cancelada: { label: "Cancelada", className: "bg-rose-500/10 text-rose-600 border-rose-500/20", icon: XCircle },
  concluida: { label: "Concluída", className: "bg-primary/10 text-primary border-primary/20", icon: CheckCircle2 },
};

const fmt = (v: number) => formatCurrency(v);

interface BookingRow {
  id: string;
  booking_code: string;
  item_name: string;
  final_total: number;
  status: string;
  payment_status: string;
  guests: number;
  date: string | null;
  created_at: string;
  customers: { name: string; email: string } | null;
}

const AdminDashboard = () => {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [customerCount, setCustomerCount] = useState(0);
  const [collabCount, setCollabCount] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [sgsStats, setSgsStats] = useState({ activeRisks: 0, criticalRisks: 0, pendingActions: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const load = async () => {
      try {
        const [bRes, cRes, rRes, aRes, collabRes, cpRes] = await Promise.all([
          supabase.from("bookings").select("*, customers!bookings_customer_id_fkey(name, email)").order("created_at", { ascending: false }),
          supabase.from("customers").select("id", { count: "exact", head: true }),
          supabase.from("sgs_risks").select("risk_level"),
          supabase.from("sgs_corrective_actions").select("id").eq("status", "pendente"),
          supabase.from("collaborators").select("id", { count: "exact", head: true }),
          supabase.from("contas_pagar").select("valor, status, vencimento")
        ]);
        setBookings((bRes.data as any[]) || []);
        setCustomerCount(cRes.count || 0);
        setCollabCount(collabRes.count || 0);
        setExpenses((cpRes.data as any[]) || []);

        const expensesData = (cpRes.data as any[]) || [];
        const monthStart = new Date(currentYear, currentMonth, 1).toISOString();
        const thisMonthExpenses = expensesData
          .filter(e => e.vencimento >= monthStart && e.status === 'pago')
          .reduce((sum, e) => sum + Number(e.valor), 0);
        setTotalExpenses(thisMonthExpenses);
        
        const risks = (rRes.data as any[]) || [];
        setSgsStats({
          activeRisks: risks.length,
          criticalRisks: risks.filter(r => r.risk_level >= 12).length,
          pendingActions: aRes.data?.length || 0
        });
      } catch (err) {
        console.error("Erro ao carregar dashboard:", err);
      }
      setLoading(false);
    };
    load();
  }, []);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const todayStr = now.toISOString().slice(0, 10);

  const { stats, revenueData, tourPopularity, recentBookings } = useMemo(() => {
    const thisMonthBookings = bookings.filter((b) => {
      const d = new Date(b.created_at);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const thisRevenue = thisMonthBookings.filter((b) => b.status !== "cancelada").reduce((s, b) => s + b.final_total, 0);

    const stats = [
      { label: "Reservas Hoje", value: String(bookings.filter((b) => b.created_at?.slice(0, 10) === todayStr).length), change: "Diário", up: true, icon: Calendar, path: "/admin/reservas" },
      { label: "Ticket Médio", value: fmt(thisMonthBookings.length > 0 ? thisRevenue / thisMonthBookings.length : 0), change: "Este Mês", up: true, icon: TrendingUp, path: "/admin/financeiro" },
      { label: "Receita (Mês)", value: fmt(thisRevenue), change: "Bruto", up: true, icon: DollarSign, path: "/admin/financeiro" },
      { label: "Conformidade SGS", value: String(sgsStats.criticalRisks === 0 ? "100%" : "Alerta"), change: `${sgsStats.pendingActions} pendências`, up: sgsStats.criticalRisks === 0, icon: ShieldAlert, isSgs: true, path: "/admin/sgs" },

    ];

    const monthlyMap = new Map<string, { revenue: number; bookings: number; expenses: number; profit: number }>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
      monthlyMap.set(key, { revenue: 0, bookings: 0, expenses: 0, profit: 0 });
    }
    bookings.forEach((b) => {
      if (b.status === "cancelada") return;
      const d = new Date(b.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
      const entry = monthlyMap.get(key);
      if (entry) { entry.revenue += b.final_total; entry.bookings += 1; }
    });
    
    expenses.forEach((e) => {
      if (e.status !== "pago") return;
      const d = new Date(e.vencimento);
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
      const entry = monthlyMap.get(key);
      if (entry) entry.expenses += Number(e.valor);
    });

    const revenueData = Array.from(monthlyMap.entries()).map(([key, val]) => ({
      month: MONTH_LABELS[parseInt(key.split("-")[1])],
      revenue: val.revenue,
      bookings: val.bookings,
      expenses: val.expenses,
      profit: val.revenue - val.expenses
    }));

    const tourMap = new Map<string, number>();
    bookings.filter((b) => b.status !== "cancelada").forEach((b) => tourMap.set(b.item_name, (tourMap.get(b.item_name) || 0) + 1));
    const totalTourBookings = Array.from(tourMap.values()).reduce((s, v) => s + v, 0) || 1;
    const tourPopularity = Array.from(tourMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count], i) => ({ name, value: Math.round((count / totalTourBookings) * 100), color: PIE_COLORS[i % PIE_COLORS.length] }));

    const recentBookings = bookings.slice(0, 8).map((b) => ({
      id: b.booking_code,
      client: b.customers?.name || "—",
      tour: b.item_name,
      date: b.date || b.created_at?.slice(0, 10) || "—",
      guests: b.guests,
      total: b.final_total,
      status: b.status,
    }));

    return { stats, revenueData, tourPopularity, recentBookings };
  }, [bookings, expenses, totalExpenses, customerCount, collabCount, sgsStats, currentMonth, currentYear, todayStr]);

  if (loading) {
    return (
      <AdminLayout title="Dashboard">
        <div className="flex items-center justify-center py-32">
          <Loader2 className="animate-spin text-primary" size={36} />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Centro de Operações">
      <div className="space-y-8 pb-10">
        <div className="grid xl:grid-cols-4 gap-6">
          <div className="xl:col-span-3 bg-white rounded-lg p-10 relative overflow-hidden group border border-border shadow-sm">
            <div className="absolute right-0 top-0 w-[500px] h-[500px] bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl transition-none" />
            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Sistema Ativo</span>
                  </div>
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Painel Executivo</span>
                </div>
                <div>
                  <h2 className="text-4xl md:text-5xl font-black text-foreground tracking-tighter leading-tight">
                    Olá, <span className="text-gradient-primary">Gestor</span>
                  </h2>
                  <p className="text-sm text-muted-foreground max-w-xl leading-relaxed font-medium mt-3">
                    A Lençóis Tour opera hoje com <span className="text-primary font-black uppercase tracking-widest text-[10px] bg-primary/10 px-2 py-0.5 rounded-md border border-primary/10">Conformidade Total</span>. 
                    Temos {bookings.filter(b => b.status === 'pendente').length} novas reservas e {sgsStats.pendingActions} ações SGS pendentes.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => navigate("/admin/reservas")} className="bg-primary hover:bg-primary/90 text-white px-8 h-14 rounded-lg text-xs font-black uppercase tracking-widest shadow-sm transition-none flex items-center gap-3">
                  <Calendar size={18} /> Nova Reserva
                </button>
                <button onClick={() => window.open('/', '_blank')} className="bg-white hover:bg-slate-50 text-foreground border border-slate-200 px-8 h-14 rounded-lg text-xs font-black uppercase tracking-widest transition-none flex items-center gap-3">
                  <LayoutDashboard size={18} /> Ver Site
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-border shadow-sm flex flex-col justify-center items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20">
              <ShieldAlert size={32} />
            </div>
            <div>
              <p className="text-sm font-black text-foreground uppercase tracking-widest">Segurança (SGS)</p>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Conformidade ISO 21101</p>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div className="bg-amber-500 h-full w-[85%]" />
            </div>
            <p className="text-[11px] font-bold text-amber-600 uppercase tracking-widest">85% em Conformidade</p>
          </div>
        </div>


        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat: any, idx: number) => (
            <div 
              key={stat.label} 
              onClick={() => stat.path && navigate(stat.path)}
              className="bg-white rounded-lg p-7 cursor-pointer hover:border-primary/50 transition-none relative overflow-hidden group border border-border shadow-sm"
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <div className="absolute -right-4 -top-4 w-28 h-28 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all" />
              <div className="flex items-center justify-between mb-8">
                <div className="w-14 h-14 rounded-lg bg-primary/5 text-primary flex items-center justify-center border border-primary/10 shadow-sm">
                  <stat.icon size={26} strokeWidth={2.5} />
                </div>
              </div>
              <p className="text-4xl font-black text-foreground tracking-tight">{stat.value}</p>
              <div className="flex items-center justify-between mt-2">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                <span className="text-[9px] font-black bg-primary/5 text-primary px-2 py-0.5 rounded uppercase tracking-tighter">
                  {stat.change}
                </span>
              </div>

            </div>
          ))}
        </div>

        {/* Charts & Lists */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Chart Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg p-8 border border-border shadow-sm overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black text-foreground tracking-tight">Performance Financeira</h3>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Últimos 7 Meses</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/5 border border-primary/10">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">Receita</span>
                  </div>
                </div>
              </div>
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(174, 62%, 38%)" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="hsl(174, 62%, 38%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fontSize: 10, fontWeight: 800, fill: 'hsl(var(--muted-foreground))'}} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} 
                      tick={{fontSize: 10, fontWeight: 800, fill: 'hsl(var(--muted-foreground))'}} 
                    />
                    <Tooltip 
                      contentStyle={{
                        borderRadius: '0.5rem', 
                        border: '1px solid hsl(var(--border))', 
                        boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)',
                        fontSize: '11px',
                        fontWeight: 700
                      }}
                      formatter={(value: number) => [fmt(value), 'Receita']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="hsl(174, 62%, 38%)" 
                      fill="url(#colorRevenue)" 
                      strokeWidth={4}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Bookings Table Style (Split Layout inspired by CRM) */}
            <div className="bg-white rounded-lg p-8 border border-border shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black text-foreground tracking-tight">Reservas Recentes</h3>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Últimas 8 operações</p>
                </div>
                <button 
                  onClick={() => navigate("/admin/reservas")}
                  className="p-2.5 rounded-lg bg-primary/5 text-primary hover:bg-primary/10 transition-none"
                >
                  <ArrowRight size={20} />
                </button>
              </div>

              <div className="overflow-x-auto -mx-2">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/40">
                      <th className="text-[10px] font-black text-muted-foreground uppercase tracking-widest text-left px-4 py-4">Cliente / ID</th>
                      <th className="text-[10px] font-black text-muted-foreground uppercase tracking-widest text-left px-4 py-4">Passeio</th>
                      <th className="text-[10px] font-black text-muted-foreground uppercase tracking-widest text-center px-4 py-4">Status</th>
                      <th className="text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right px-4 py-4">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentBookings.map((b) => (
                      <tr 
                        key={b.id} 
                        className="group hover:bg-primary/[0.02] transition-colors cursor-pointer"
                        onClick={() => navigate("/admin/reservas")}
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center text-primary font-black text-xs border border-primary/10">
                              {b.client.charAt(0)}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-foreground leading-tight">{b.client}</p>
                              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-tighter mt-0.5">#{b.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-xs font-semibold text-foreground leading-tight">{b.tour}</p>
                          <p className="text-[9px] font-medium text-muted-foreground mt-0.5">{b.date}</p>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex justify-center">
                            <Badge className={cn("text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-lg border", statusMap[b.status]?.className)}>
                              {statusMap[b.status]?.label}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <p className="text-xs font-black text-foreground">{fmt(b.total)}</p>
                          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">{b.guests} pax</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-6">
            <div className="glass-card rounded-[2.5rem] p-8 border border-white/40 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-foreground tracking-tight">Ranking Popular</h3>
              </div>
              <div className="space-y-6">
                {tourPopularity.slice(0, 6).map((t, i) => (
                  <div key={t.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-muted-foreground bg-muted/30 w-6 h-6 rounded-md flex items-center justify-center">0{i+1}</span>
                        <p className="text-xs font-bold text-foreground leading-tight">{t.name}</p>
                      </div>
                      <span className="text-xs font-black text-primary">{t.value}%</span>
                    </div>
                    <div className="w-full bg-muted/30 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-primary h-full rounded-full transition-all duration-1000" 
                        style={{ width: `${t.value}%`, backgroundColor: t.color }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card rounded-[2.5rem] p-8 border border-white/40 shadow-sm bg-gradient-to-br from-primary/5 to-transparent">
              <h3 className="text-xl font-black text-foreground tracking-tight mb-6">Atividade do Sistema</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/40 border border-white/60">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center mt-0.5">
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">SGS Atualizado</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Nenhum risco crítico detectado nas últimas 24h.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/40 border border-white/60">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center mt-0.5">
                    <TrendingUp size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">Crescimento de LTV</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Ticket médio aumentou 12% este mês.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
