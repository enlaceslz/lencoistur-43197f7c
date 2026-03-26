import {
  DollarSign, TrendingUp, Users, Calendar,
  ArrowUpRight, ArrowDownRight
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from "recharts";
import AdminLayout from "@/components/AdminLayout";

const revenueData = [
  { month: "Jan", revenue: 28500, bookings: 42 },
  { month: "Fev", revenue: 35200, bookings: 56 },
  { month: "Mar", revenue: 42800, bookings: 68 },
  { month: "Abr", revenue: 38100, bookings: 61 },
  { month: "Mai", revenue: 52300, bookings: 84 },
  { month: "Jun", revenue: 61200, bookings: 98 },
  { month: "Jul", revenue: 78400, bookings: 126 },
];

const tourPopularity = [
  { name: "Lagoa Azul", value: 35, color: "hsl(174, 62%, 38%)" },
  { name: "Lagoa Bonita", value: 25, color: "hsl(35, 80%, 55%)" },
  { name: "Atins & Caburé", value: 22, color: "hsl(195, 80%, 45%)" },
  { name: "Santo Amaro", value: 18, color: "hsl(20, 90%, 60%)" },
];

const recentBookings = [
  { id: "B-001", client: "Maria Silva", tour: "Lagoa Azul", date: "26/03/2026", guests: 3, total: 540, status: "confirmed" },
  { id: "B-002", client: "John Smith", tour: "Santo Amaro", date: "27/03/2026", guests: 2, total: 760, status: "pending" },
  { id: "B-003", client: "Ana Costa", tour: "Atins & Caburé", date: "26/03/2026", guests: 4, total: 880, status: "confirmed" },
  { id: "B-004", client: "Pedro Santos", tour: "Lagoa Bonita", date: "28/03/2026", guests: 2, total: 320, status: "confirmed" },
  { id: "B-005", client: "Sophie Martin", tour: "Lagoa Azul", date: "26/03/2026", guests: 1, total: 180, status: "cancelled" },
  { id: "B-006", client: "Carlos Mendes", tour: "Santo Amaro", date: "29/03/2026", guests: 2, total: 760, status: "pending" },
];

const statusMap: Record<string, { label: string; className: string }> = {
  confirmed: { label: "Confirmada", className: "bg-primary/10 text-primary" },
  pending: { label: "Pendente", className: "bg-secondary/10 text-secondary" },
  cancelled: { label: "Cancelada", className: "bg-destructive/10 text-destructive" },
};

const AdminDashboard = () => {
  const stats = [
    { label: "Reservas Hoje", value: "12", change: "+18%", up: true, icon: Calendar },
    { label: "Faturamento (Mês)", value: "R$ 78.400", change: "+23%", up: true, icon: DollarSign },
    { label: "Clientes Ativos", value: "342", change: "+8%", up: true, icon: Users },
    { label: "Taxa de Conversão", value: "4.2%", change: "-0.3%", up: false, icon: TrendingUp },
  ];

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-ocean-light flex items-center justify-center">
                  <stat.icon size={20} className="text-primary" />
                </div>
                <span className={`flex items-center gap-1 text-xs font-semibold ${stat.up ? "text-primary" : "text-destructive"}`}>
                  {stat.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {stat.change}
                </span>
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
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
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(40, 15%, 88%)" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(220, 10%, 45%)" }} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(220, 10%, 45%)" }} tickFormatter={(v) => `R$${v / 1000}k`} />
                <Tooltip formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, "Faturamento"]} />
                <Area type="monotone" dataKey="revenue" stroke="hsl(174, 62%, 38%)" fill="url(#colorRevenue)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-display text-lg font-bold text-foreground mb-4">Passeios Mais Vendidos</h3>
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
          </div>
        </div>

        {/* Bookings */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-display text-lg font-bold text-foreground mb-4">Reservas por Mês</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(40, 15%, 88%)" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(220, 10%, 45%)" }} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(220, 10%, 45%)" }} />
                <Tooltip />
                <Bar dataKey="bookings" fill="hsl(35, 80%, 55%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-foreground">Reservas Recentes</h3>
              <button className="text-primary text-sm font-semibold hover:underline">Ver todas</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left py-3 font-medium">ID</th>
                    <th className="text-left py-3 font-medium">Cliente</th>
                    <th className="text-left py-3 font-medium">Passeio</th>
                    <th className="text-left py-3 font-medium">Data</th>
                    <th className="text-right py-3 font-medium">Total</th>
                    <th className="text-right py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.map((b) => {
                    const s = statusMap[b.status];
                    return (
                      <tr key={b.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="py-3 font-mono text-xs text-muted-foreground">{b.id}</td>
                        <td className="py-3 font-semibold text-foreground">{b.client}</td>
                        <td className="py-3 text-muted-foreground">{b.tour}</td>
                        <td className="py-3 text-muted-foreground">{b.date}</td>
                        <td className="py-3 text-right font-semibold text-foreground">R$ {b.total}</td>
                        <td className="py-3 text-right">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${s.className}`}>{s.label}</span>
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
