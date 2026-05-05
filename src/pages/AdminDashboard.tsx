import { useEffect, useState, useMemo } from "react";
import {
  DollarSign, TrendingUp, Users, Calendar,
  ArrowUpRight, ArrowDownRight, Loader2, ShieldAlert,
  PieChart as PieChartIcon, LayoutDashboard, Briefcase
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from "recharts";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const PIE_COLORS = [
  "hsl(174, 62%, 38%)", "hsl(35, 80%, 55%)",
  "hsl(195, 80%, 45%)", "hsl(20, 90%, 60%)",
  "hsl(270, 50%, 55%)", "hsl(140, 60%, 40%)",
];

const statusMap: Record<string, { label: string; className: string }> = {
  confirmada: { label: "Confirmada", className: "bg-primary/10 text-primary" },
  pendente: { label: "Pendente", className: "bg-secondary/10 text-secondary" },
  cancelada: { label: "Cancelada", className: "bg-destructive/10 text-destructive" },
  concluida: { label: "Concluída", className: "bg-primary/10 text-primary" },
};

const fmt = (v: number) => `R$ ${(v / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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
      const [bRes, cRes, rRes, aRes, collabRes, cpRes] = await Promise.all([
        supabase.from("bookings").select("*, customers!fk_bookings_customer(name, email)").order("created_at", { ascending: false }),
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

    const lastMonthBookings = bookings.filter((b) => {
      const d = new Date(b.created_at);
      const lm = currentMonth === 0 ? 11 : currentMonth - 1;
      const ly = currentMonth === 0 ? currentYear - 1 : currentYear;
      return d.getMonth() === lm && d.getFullYear() === ly;
    });

    const todayBookings = bookings.filter((b) => b.created_at?.slice(0, 10) === todayStr || b.date === todayStr);

    const thisRevenue = thisMonthBookings.filter((b) => b.status !== "cancelada").reduce((s, b) => s + b.final_total, 0);
    const lastRevenue = lastMonthBookings.filter((b) => b.status !== "cancelada").reduce((s, b) => s + b.final_total, 0);
    const revChange = lastRevenue > 0 ? (((thisRevenue - lastRevenue) / lastRevenue) * 100).toFixed(0) : "0";

    const thisCount = thisMonthBookings.length;
    const lastCount = lastMonthBookings.length;
    const countChange = lastCount > 0 ? (((thisCount - lastCount) / lastCount) * 100).toFixed(0) : "0";

    const stats = [
      { label: "Reservas Hoje", value: String(todayBookings.length), change: `${todayBookings.length}`, up: todayBookings.length > 0, icon: Calendar, path: "/admin/reservas" },
      { label: "Lucro Líquido (Mês)", value: fmt(thisRevenue - totalExpenses), change: `Faturamento: ${fmt(thisRevenue)}`, up: (thisRevenue - totalExpenses) > 0, icon: DollarSign, path: "/admin/financeiro" },
      { label: "Colaboradores", value: String(collabCount), change: "Equipe Ativa", up: true, icon: Briefcase, path: "/admin/colaboradores" },
      { label: "Conformidade SGS", value: String(sgsStats.criticalRisks === 0 ? "100%" : "Risco"), change: `${sgsStats.pendingActions} alertas`, up: sgsStats.criticalRisks === 0, icon: ShieldAlert, isSgs: true, path: "/admin/sgs" },
    ];

    // Revenue by month (last 7 months)
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
      if (entry) {
        entry.revenue += b.final_total;
        entry.bookings += 1;
      }
    });
    
    expenses.forEach((e) => {
      if (e.status !== "pago") return;
      const d = new Date(e.vencimento);
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
      const entry = monthlyMap.get(key);
      if (entry) {
        entry.expenses += Number(e.valor);
      }
    });

    const revenueData = Array.from(monthlyMap.entries()).map(([key, val]) => ({
      month: MONTH_LABELS[parseInt(key.split("-")[1])],
      revenue: val.revenue,
      bookings: val.bookings,
      expenses: val.expenses,
      profit: val.revenue - val.expenses
    }));

    // Tour popularity
    const tourMap = new Map<string, number>();
    bookings.filter((b) => b.status !== "cancelada").forEach((b) => {
      tourMap.set(b.item_name, (tourMap.get(b.item_name) || 0) + 1);
    });
    const totalTourBookings = Array.from(tourMap.values()).reduce((s, v) => s + v, 0) || 1;
    const tourPopularity = Array.from(tourMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count], i) => ({
        name,
        value: Math.round((count / totalTourBookings) * 100),
        color: PIE_COLORS[i % PIE_COLORS.length],
      }));

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
        
        {/* Quick Actions & High-Level Pulse */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 animate-in-fade" style={{ animationDelay: '0.05s' }}>
          <div className="xl:col-span-3 glass-card rounded-[2.5rem] p-8 relative overflow-hidden group border border-white/20">
            <div className="absolute right-0 top-0 w-80 h-80 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-primary/10 transition-colors" />
            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Painel Executivo</p>
                </div>
                <h2 className="text-4xl font-black text-foreground tracking-tighter">Bom dia, Gestor</h2>
                <p className="text-sm text-muted-foreground max-w-lg leading-relaxed">
                  Sua agência está operando com <span className="text-primary font-bold">{sgsStats.criticalRisks === 0 ? '100% de conformidade' : 'alertas ativos'}</span> no SGS. 
                  Temos {bookings.filter(b => b.status === 'pendente').length} reservas aguardando confirmação.
                </p>
              </div>
              <div className="flex gap-4">
                <button onClick={() => navigate("/admin/reservas")} className="bg-primary hover:bg-primary/90 text-white px-8 h-14 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 transition-all active:scale-95 flex items-center gap-3">
                  <Calendar size={18} strokeWidth={2.5} /> Nova Reserva
                </button>
                <button onClick={() => navigate("/admin/sgs")} className="bg-white/50 dark:bg-black/20 hover:bg-white/80 dark:hover:bg-black/40 text-foreground border border-white/50 px-6 h-14 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg transition-all active:scale-95 flex items-center gap-3">
                  <ShieldAlert size={18} /> SGS
                </button>
              </div>
            </div>
          </div>
          <div className="glass-card rounded-[2.5rem] p-8 flex flex-col justify-center items-center text-center group border border-white/20">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">Meta de Vendas</p>
            <div className="relative w-24 h-24 mb-4">
               <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle className="text-muted/20 stroke-current" strokeWidth="10" cx="50" cy="50" r="40" fill="transparent"></circle>
                  <circle className="text-primary stroke-current" strokeWidth="10" strokeLinecap="round" cx="50" cy="50" r="40" fill="transparent" strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - 0.75)}></circle>
               </svg>
               <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-black">75%</span>
               </div>
            </div>
            <p className="text-xs font-bold text-foreground">R$ 45.2k / R$ 60k</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat: any, idx: number) => (
            <div 
              key={stat.label} 
              onClick={() => stat.path && navigate(stat.path)}
              className={`glass-card admin-card-hover rounded-[2rem] p-6 cursor-pointer relative overflow-hidden group animate-in-fade border border-white/20`}
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
              
              <div className="flex items-center justify-between mb-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-lg ${stat.isSgs && stat.value !== "0" ? "bg-destructive/10 text-destructive shadow-destructive/10" : "bg-primary/5 text-primary shadow-primary/5 border border-primary/10"}`}>
                  <stat.icon size={26} strokeWidth={2.5} />
                </div>
                {stat.change && (
                  <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${stat.up ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/10" : "bg-rose-500/10 text-rose-600 border border-rose-500/10"}`}>
                    {stat.change}
                  </div>
                )}
              </div>
              
              <div className="relative">
                <p className="text-3xl font-black text-foreground tracking-tighter group-hover:translate-x-1 transition-transform">{stat.value}</p>
                <p className="text-[10px] font-black text-muted-foreground mt-1 uppercase tracking-[0.2em]">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-card rounded-[2.5rem] p-8 admin-card-hover animate-in-fade" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="font-display text-2xl font-black text-foreground tracking-tight">Faturamento e Lucro</h3>
                <p className="text-xs font-medium text-muted-foreground mt-1 uppercase tracking-widest">Performance financeira dos últimos 7 meses</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span className="text-[10px] font-black uppercase tracking-tighter">Faturamento</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-secondary" />
                  <span className="text-[10px] font-black uppercase tracking-tighter">Lucro</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(174, 62%, 38%)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(174, 62%, 38%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(35, 80%, 55%)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(35, 80%, 55%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.4} />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontWeight: 'bold' }} 
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontWeight: 'bold' }} 
                  tickFormatter={(v) => `R$${(v / 100).toFixed(0)}`}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontSize: '12px' }}
                  formatter={(value: number, name: string) => [
                    fmt(value), 
                    name === "revenue" ? "Faturamento" : "Lucro"
                  ]} 
                />
                <Area type="monotone" dataKey="revenue" stroke="hsl(174, 62%, 38%)" fill="url(#colorRevenue)" strokeWidth={4} />
                <Area type="monotone" dataKey="profit" stroke="hsl(35, 80%, 55%)" fill="url(#colorProfit)" strokeWidth={4} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card rounded-[2.5rem] p-8 admin-card-hover animate-in-fade" style={{ animationDelay: '0.5s' }}>
            <h3 className="font-display text-2xl font-black text-foreground tracking-tight mb-8">Tour Popularity</h3>
            {tourPopularity.length > 0 ? (
              <div className="flex flex-col h-full">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={tourPopularity} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={8} cornerRadius={4}>
                      {tourPopularity.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontSize: '12px' }}
                      formatter={(value: number) => [`${value}%`, "Demanda"]} 
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-1 gap-3 mt-6">
                  {tourPopularity.map((t) => (
                    <div key={t.name} className="flex items-center justify-between p-2 rounded-xl hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: t.color }} />
                        <span className="text-[11px] font-bold text-muted-foreground truncate max-w-[120px]">{t.name}</span>
                      </div>
                      <span className="text-xs font-black text-foreground">{t.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 opacity-30">
                <PieChartIcon size={48} />
                <p className="text-[10px] font-black uppercase tracking-widest mt-4">Sem dados</p>
              </div>
            )}
          </div>
        </div>

        {/* Bookings */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="glass-card rounded-[2.5rem] p-8 admin-card-hover animate-in-fade" style={{ animationDelay: '0.6s' }}>
            <h3 className="font-display text-2xl font-black text-foreground tracking-tight mb-8">Volumetria</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.4} />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontWeight: 'bold' }} 
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontWeight: 'bold' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontSize: '12px' }}
                />
                <Bar dataKey="bookings" fill="hsl(35, 80%, 55%)" radius={[8, 8, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="lg:col-span-2 glass-card rounded-[2.5rem] p-8 admin-card-hover animate-in-fade" style={{ animationDelay: '0.7s' }}>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="font-display text-2xl font-black text-foreground tracking-tight">Reservas Recentes</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-primary mt-1">Últimas movimentações</p>
              </div>
              <button 
                onClick={() => navigate("/admin/reservas")} 
                className="px-6 py-2 rounded-xl bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-lg shadow-primary/5"
              >
                Ver todas
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-muted-foreground">
                    <th className="text-left pb-4 font-black uppercase text-[10px] tracking-widest opacity-40">Código</th>
                    <th className="text-left pb-4 font-black uppercase text-[10px] tracking-widest opacity-40">Cliente</th>
                    <th className="text-left pb-4 font-black uppercase text-[10px] tracking-widest opacity-40">Passeio</th>
                    <th className="text-left pb-4 font-black uppercase text-[10px] tracking-widest opacity-40 text-center">Data</th>
                    <th className="text-right pb-4 font-black uppercase text-[10px] tracking-widest opacity-40">Total</th>
                    <th className="text-right pb-4 font-black uppercase text-[10px] tracking-widest opacity-40">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {recentBookings.length === 0 ? (
                    <tr><td colSpan={6} className="py-20 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground/30">Vazio</td></tr>
                  ) : recentBookings.map((b, bIdx) => {
                    const s = statusMap[b.status] || { label: b.status, className: "bg-muted text-muted-foreground" };
                    return (
                      <tr 
                        key={b.id} 
                        onClick={() => navigate("/admin/reservas")}
                        className="group hover:bg-primary/[0.02] transition-colors cursor-pointer"
                      >
                        <td className="py-5">
                          <span className="bg-primary/5 text-primary text-[9px] font-black px-2 py-1 rounded-lg border border-primary/10">{b.id}</span>
                        </td>
                        <td className="py-5">
                          <p className="font-black text-sm text-foreground group-hover:text-primary transition-colors">{b.client}</p>
                        </td>
                        <td className="py-5 text-xs font-medium text-muted-foreground">{b.tour}</td>
                        <td className="py-5 text-[11px] text-center font-black text-muted-foreground/60">
                          {b.date ? new Date(b.date + "T12:00:00").toLocaleDateString("pt-BR") : "—"}
                        </td>
                        <td className="py-5 text-right font-black text-foreground">{fmt(b.total)}</td>
                        <td className="py-5 text-right">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-current shadow-sm ${s.className}`}>
                            {s.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
