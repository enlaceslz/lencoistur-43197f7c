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
        supabase.from("bookings").select("*, customers(name, email)").order("created_at", { ascending: false }),
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
    <AdminLayout title="Dashboard">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat: any) => (
            <div 
              key={stat.label} 
              onClick={() => stat.path && navigate(stat.path)}
              className={`bg-card border border-border rounded-2xl p-5 cursor-pointer hover:shadow-md hover:border-primary/50 transition-all ${stat.isSgs && stat.value !== "0" ? "ring-2 ring-destructive/50" : ""}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.isSgs && stat.value !== "0" ? "bg-destructive/10" : "bg-primary/10"}`}>
                  <stat.icon size={20} className={stat.isSgs && stat.value !== "0" ? "text-destructive" : "text-primary"} />
                </div>
                {stat.change && (
                  <span className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-tight ${stat.up ? "text-primary" : "text-destructive"}`}>
                    {!stat.isSgs && stat.change.includes('%') && (stat.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />)}
                    {stat.change}
                  </span>
                )}
              </div>
              <p className="text-2xl font-black text-foreground">{stat.value}</p>
              <p className="text-xs font-medium text-muted-foreground mt-1 uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6">
            <h3 className="font-display text-lg font-bold text-foreground mb-4">Faturamento Mensal</h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(174, 62%, 38%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(174, 62%, 38%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(35, 80%, 55%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(35, 80%, 55%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `R$${(v / 100).toFixed(0)}`} />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    fmt(value), 
                    name === "revenue" ? "Faturamento" : name === "profit" ? "Lucro" : "Despesas"
                  ]} 
                />
                <Area type="monotone" dataKey="revenue" stroke="hsl(174, 62%, 38%)" fill="url(#colorRevenue)" strokeWidth={2} />
                <Area type="monotone" dataKey="profit" stroke="hsl(35, 80%, 55%)" fill="url(#colorProfit)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-display text-lg font-bold text-foreground mb-4">Passeios Mais Vendidos</h3>
            {tourPopularity.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={tourPopularity} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={4}>
                      {tourPopularity.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [`${value}%`, ""]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-2">
                  {tourPopularity.map((t) => (
                    <div key={t.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }} />
                        <span className="text-muted-foreground">{t.name}</span>
                      </div>
                      <span className="font-semibold text-foreground">{t.value}%</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-16">Nenhuma reserva registrada</p>
            )}
          </div>
        </div>

        {/* Bookings */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-display text-lg font-bold text-foreground mb-4">Reservas por Mês</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip />
                <Bar dataKey="bookings" fill="hsl(35, 80%, 55%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-foreground">Reservas Recentes</h3>
              <button onClick={() => navigate("/admin/reservas")} className="text-primary text-sm font-semibold hover:underline">Ver todas</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground bg-muted/30">
                    <th className="text-left py-3 px-4 font-bold uppercase text-[10px] tracking-widest">Código</th>
                    <th className="text-left py-3 px-2 font-bold uppercase text-[10px] tracking-widest">Cliente</th>
                    <th className="text-left py-3 px-2 font-bold uppercase text-[10px] tracking-widest">Passeio</th>
                    <th className="text-left py-3 px-2 font-bold uppercase text-[10px] tracking-widest text-center">Data</th>
                    <th className="text-right py-3 px-2 font-bold uppercase text-[10px] tracking-widest">Valor</th>
                    <th className="text-right py-3 px-4 font-bold uppercase text-[10px] tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.length === 0 ? (
                    <tr><td colSpan={6} className="py-12 text-center text-muted-foreground font-medium italic">Nenhuma reserva recente encontrada</td></tr>
                  ) : recentBookings.map((b) => {
                    const s = statusMap[b.status] || { label: b.status, className: "bg-muted text-muted-foreground" };
                    return (
                      <tr 
                        key={b.id} 
                        onClick={() => navigate("/admin/reservas")}
                        className="border-b border-border/50 last:border-0 hover:bg-primary/5 transition-colors cursor-pointer group"
                      >
                        <td className="py-4 px-4 font-mono text-[10px] text-primary font-bold">
                          <span className="bg-primary/5 px-2 py-1 rounded">{b.id}</span>
                        </td>
                        <td className="py-4 px-2">
                          <p className="font-bold text-foreground group-hover:text-primary transition-colors">{b.client}</p>
                        </td>
                        <td className="py-4 px-2 text-muted-foreground text-xs font-medium">{b.tour}</td>
                        <td className="py-4 px-2 text-muted-foreground text-xs text-center font-semibold">
                          {b.date ? new Date(b.date + "T12:00:00").toLocaleDateString("pt-BR") : "—"}
                        </td>
                        <td className="py-4 px-2 text-right font-black text-foreground">{fmt(b.total)}</td>
                        <td className="py-4 px-4 text-right">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter border ${s.className}`}>
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
