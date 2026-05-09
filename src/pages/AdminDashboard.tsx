import { useEffect, useState, useMemo } from "react";
import {
  DollarSign, TrendingUp, Users, Calendar,
  ArrowUpRight, ArrowDownRight, Loader2, ShieldAlert,
  PieChart as PieChartIcon, LayoutDashboard, Briefcase, Star, MapPin
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from "recharts";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const PIE_COLORS = [
  "hsl(174, 62%, 38%)", "hsl(35, 80%, 55%)",
  "hsl(195, 80%, 45%)", "hsl(20, 90%, 60%)",
  "hsl(270, 50%, 55%)", "hsl(140, 60%, 40%)",
];

const statusMap: Record<string, { label: string; className: string }> = {
  confirmada: { label: "Confirmada", className: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" },
  pendente: { label: "Pendente", className: "bg-amber-500/10 text-amber-600 border border-amber-500/20" },
  cancelada: { label: "Cancelada", className: "bg-rose-500/10 text-rose-600 border border-rose-500/20" },
  concluida: { label: "Concluída", className: "bg-primary/10 text-primary border border-primary/20" },
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

    const thisRevenue = thisMonthBookings.filter((b) => b.status !== "cancelada").reduce((s, b) => s + b.final_total, 0);

    const stats = [
      { label: "Reservas Hoje", value: String(bookings.filter((b) => b.created_at?.slice(0, 10) === todayStr).length), change: "Diário", up: true, icon: Calendar, path: "/admin/reservas" },
      { label: "Lucro Líquido (Mês)", value: fmt(thisRevenue - totalExpenses), change: "Mensal", up: (thisRevenue - totalExpenses) > 0, icon: DollarSign, path: "/admin/financeiro" },
      { label: "Colaboradores", value: String(collabCount), change: "Equipe", up: true, icon: Briefcase, path: "/admin/colaboradores" },
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
      <div className="space-y-8 pb-10 animate-in-fade">
        {/* Executive Header */}
        <div className="xl:col-span-4 glass-card rounded-[2.5rem] p-8 relative overflow-hidden group border border-white/40 shadow-xl shadow-primary/5">
          <div className="absolute right-0 top-0 w-96 h-96 bg-gradient-to-br from-primary/10 to-ocean/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:from-primary/20 transition-all duration-700" />
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Sistema Ativo</span>
                </div>
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Painel Executivo</span>
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
              <button onClick={() => navigate("/admin/reservas")} className="bg-primary hover:bg-primary/90 text-white px-8 h-14 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-3">
                <Calendar size={18} /> Nova Reserva
              </button>
              <button onClick={() => window.open('/', '_blank')} className="bg-white hover:bg-slate-50 text-foreground border border-slate-200 px-8 h-14 rounded-2xl text-xs font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-3">
                <LayoutDashboard size={18} /> Ver Site Público
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat: any, idx: number) => (
            <div 
              key={stat.label} 
              onClick={() => stat.path && navigate(stat.path)}
              className="glass-card rounded-[2rem] p-7 cursor-pointer hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300 relative overflow-hidden group border border-white/40"
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <div className="absolute -right-4 -top-4 w-28 h-28 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all" />
              <div className="flex items-center justify-between mb-8">
                <div className="w-14 h-14 rounded-2xl bg-primary/5 text-primary flex items-center justify-center border border-primary/10 shadow-sm">
                  <stat.icon size={26} strokeWidth={2.5} />
                </div>
              </div>
              <p className="text-3xl font-black text-foreground tracking-tighter">{stat.value}</p>
              <p className="text-[10px] font-black text-muted-foreground mt-1.5 uppercase tracking-[0.2em]">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Charts & Popularity */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-card rounded-[2.5rem] p-8 border border-white/40">
            <h3 className="text-xl font-black mb-8 text-foreground tracking-tight">Performance Financeira</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="cR" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(174, 62%, 38%)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="hsl(174, 62%, 38%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 800}} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={v => `R$${(v/100000).toFixed(0)}k`} tick={{fontSize: 10, fontWeight: 800}} />
                  <Tooltip contentStyle={{borderRadius: '1rem', border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.1)'}} />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(174, 62%, 38%)" fill="url(#cR)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-card rounded-[2.5rem] p-8 border border-white/40">
            <h3 className="text-xl font-black mb-8 text-foreground tracking-tight">Destaques</h3>
            <div className="space-y-4">
              {tourPopularity.slice(0, 5).map((t, i) => (
                <div key={t.name} className="flex items-center gap-4">
                  <span className="text-[10px] font-black text-muted-foreground w-6">0{i+1}</span>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-foreground">{t.name}</p>
                    <div className="w-full bg-muted/30 h-1.5 mt-1 rounded-full overflow-hidden">
                      <div className="bg-primary h-full rounded-full" style={{ width: `${t.value}%` }} />
                    </div>
                  </div>
                  <span className="text-xs font-black text-primary">{t.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
