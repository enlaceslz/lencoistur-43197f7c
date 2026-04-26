import { useEffect, useState, useCallback, useRef } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  BarChart3, Download, FileText, TrendingUp, Users, ShoppingCart, Shield,
  CreditCard, Calendar, Filter, Printer, PieChart, Activity, Search, MapPin, Mail, Phone, Globe
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type ReportType = "reservas" | "financeiro" | "clientes" | "passeios" | "sgs" | "marketing";

const REPORT_TABS: { id: ReportType; label: string; icon: any }[] = [
  { id: "reservas", label: "Reservas", icon: ShoppingCart },
  { id: "financeiro", label: "Financeiro", icon: CreditCard },
  { id: "clientes", label: "Clientes", icon: Users },
  { id: "passeios", label: "Passeios", icon: BarChart3 },
  { id: "sgs", label: "Segurança (SGS)", icon: Shield },
  { id: "marketing", label: "Marketing", icon: TrendingUp },
];

const COLORS = [
  "hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--destructive))",
  "hsl(217,91%,60%)", "hsl(152,60%,42%)", "hsl(38,92%,50%)", "hsl(280,60%,50%)",
];

const AdminRelatorios = () => {
  const [activeTab, setActiveTab] = useState<ReportType>("reservas");
  const [period, setPeriod] = useState("30");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>({});
  const [empresa, setEmpresa] = useState<any>(null);
  const [site, setSite] = useState<any>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from("site_settings").select("*");
      if (data) {
        const emp = data.find(s => s.key === "empresa")?.value;
        const st = data.find(s => s.key === "site")?.value;
        setEmpresa(emp);
        setSite(st);
      }
    };
    fetchSettings();
  }, []);

  const loadReport = useCallback(async () => {
    setLoading(true);
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - Number(period));
    const since = daysAgo.toISOString();

    try {
      if (activeTab === "reservas") {
        let query = supabase.from("bookings").select("*").gte("created_at", since).order("created_at", { ascending: false });
        if (statusFilter !== "all") {
          query = query.eq("status", statusFilter);
        }
        
        const { data: bookings } = await query;
        const b = bookings || [];
        const byStatus: Record<string, number> = {};
        const byPayMethod: Record<string, number> = {};
        const byDay: Record<string, { date: string; total: number; count: number }> = {};
        const byTour: Record<string, { name: string; revenue: number; count: number }> = {};

        b.forEach((r: any) => {
          byStatus[r.status] = (byStatus[r.status] || 0) + 1;
          byPayMethod[r.pay_method] = (byPayMethod[r.pay_method] || 0) + 1;
          const day = r.created_at?.slice(0, 10);
          if (day) {
            if (!byDay[day]) byDay[day] = { date: day, total: 0, count: 0 };
            byDay[day].total += r.final_total || 0;
            byDay[day].count += 1;
          }
          if (!byTour[r.item_name]) byTour[r.item_name] = { name: r.item_name, revenue: 0, count: 0 };
          byTour[r.item_name].revenue += r.final_total || 0;
          byTour[r.item_name].count += 1;
        });

        setData({
          total: b.length,
          revenue: b.reduce((s: number, r: any) => s + (r.final_total || 0), 0),
          avgTicket: b.length > 0 ? Math.round(b.reduce((s: number, r: any) => s + (r.final_total || 0), 0) / b.length) : 0,
          totalGuests: b.reduce((s: number, r: any) => s + (r.guests || 0), 0),
          byStatus: Object.entries(byStatus).map(([name, value]) => ({ name, value })),
          byPayMethod: Object.entries(byPayMethod).map(([name, value]) => ({ name: name === "pix" ? "PIX" : name === "card" ? "Cartão" : name, value })),
          byDay: Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date)),
          byTour: Object.values(byTour).sort((a, b) => b.revenue - a.revenue).slice(0, 10),
          raw: b,
        });
      } else if (activeTab === "financeiro") {
        let queryCR = supabase.from("contas_receber").select("*").gte("created_at", since);
        let queryCP = supabase.from("contas_pagar").select("*").gte("created_at", since);
        
        if (statusFilter !== "all") {
          queryCR = queryCR.eq("status", statusFilter);
          queryCP = queryCP.eq("status", statusFilter);
        }

        const [receber, pagar] = await Promise.all([queryCR, queryCP]);
        const cr = receber.data || [];
        const cp = pagar.data || [];
        const totalReceber = cr.reduce((s: number, r: any) => s + (r.valor || 0), 0);
        const totalPagar = cp.reduce((s: number, r: any) => s + (r.valor || 0), 0);
        const recebido = cr.filter((r: any) => r.status === "pago").reduce((s: number, r: any) => s + (r.valor || 0), 0);
        const pago = cp.filter((r: any) => r.status === "pago").reduce((s: number, r: any) => s + (r.valor || 0), 0);

        const catReceitas: Record<string, number> = {};
        cr.forEach((r: any) => { catReceitas[r.categoria] = (catReceitas[r.categoria] || 0) + (r.valor || 0); });
        const catDespesas: Record<string, number> = {};
        cp.forEach((r: any) => { catDespesas[r.categoria] = (catDespesas[r.categoria] || 0) + (r.valor || 0); });

        setData({
          totalReceber, totalPagar, recebido, pago,
          saldo: recebido - pago,
          inadimplencia: totalReceber > 0 ? ((totalReceber - recebido) / totalReceber * 100).toFixed(1) : "0",
          receitas: Object.entries(catReceitas).map(([name, value]) => ({ name, value })),
          despesas: Object.entries(catDespesas).map(([name, value]) => ({ name, value })),
          rawCR: cr, rawCP: cp,
        });
      } else if (activeTab === "clientes") {
        const { data: customers } = await supabase.from("customers").select("*").order("created_at", { ascending: false });
        const c = customers || [];
        const { data: bookings } = await supabase.from("bookings").select("customer_id, final_total, status");
        const b = bookings || [];

        const customerBookings: Record<string, { count: number; total: number }> = {};
        b.forEach((r: any) => {
          if (!customerBookings[r.customer_id]) customerBookings[r.customer_id] = { count: 0, total: 0 };
          customerBookings[r.customer_id].count += 1;
          customerBookings[r.customer_id].total += r.final_total || 0;
        });

        const topClients = c.map((cl: any) => ({
          name: cl.name,
          email: cl.email,
          bookings: customerBookings[cl.id]?.count || 0,
          revenue: customerBookings[cl.id]?.total || 0,
        })).sort((a: any, b: any) => b.revenue - a.revenue).slice(0, 15);

        const byMonth: Record<string, number> = {};
        c.forEach((cl: any) => {
          const m = cl.created_at?.slice(0, 7);
          if (m) byMonth[m] = (byMonth[m] || 0) + 1;
        });

        setData({
          total: c.length,
          withBookings: Object.keys(customerBookings).length,
          topClients,
          growth: Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b)).slice(-6).map(([month, count]) => ({ name: month.slice(5), clientes: count })),
          raw: c,
        });
      } else if (activeTab === "passeios") {
        const { data: tours } = await supabase.from("tours").select("*").eq("active", true);
        const { data: bookings } = await supabase.from("bookings").select("item_name, final_total, guests, status").eq("type", "tour");
        const t = tours || [];
        const b = bookings || [];

        const tourStats: Record<string, { name: string; revenue: number; guests: number; bookings: number }> = {};
        b.forEach((r: any) => {
          if (!tourStats[r.item_name]) tourStats[r.item_name] = { name: r.item_name, revenue: 0, guests: 0, bookings: 0 };
          tourStats[r.item_name].revenue += r.final_total || 0;
          tourStats[r.item_name].guests += r.guests || 0;
          tourStats[r.item_name].bookings += 1;
        });

        setData({
          totalTours: t.length,
          totalBookings: b.length,
          totalRevenue: b.reduce((s: number, r: any) => s + (r.final_total || 0), 0),
          totalGuests: b.reduce((s: number, r: any) => s + (r.guests || 0), 0),
          byTour: Object.values(tourStats).sort((a: any, b: any) => b.revenue - a.revenue),
          raw: t,
        });
      } else if (activeTab === "sgs") {
        const [risks, incidents, actions, briefings, terms, surveys] = await Promise.all([
          supabase.from("sgs_risks").select("*"),
          supabase.from("sgs_incidents").select("*").gte("created_at", since),
          supabase.from("sgs_corrective_actions").select("*"),
          supabase.from("sgs_briefings").select("*").gte("created_at", since),
          supabase.from("sgs_risk_terms").select("*").gte("created_at", since),
          supabase.from("sgs_safety_surveys").select("*"),
        ]);
        const r = risks.data || [];
        const inc = incidents.data || [];
        const act = actions.data || [];
        const brf = briefings.data || [];
        const trm = terms.data || [];
        const srv = surveys.data || [];

        const riskLevels = [
          { name: "Aceitável (<6)", value: r.filter((x: any) => x.risk_level < 6).length },
          { name: "Temporário (6-11)", value: r.filter((x: any) => x.risk_level >= 6 && x.risk_level < 12).length },
          { name: "Inaceitável (≥12)", value: r.filter((x: any) => x.risk_level >= 12).length },
        ];

        const incBySeverity: Record<string, number> = {};
        inc.forEach((i: any) => { incBySeverity[i.severity] = (incBySeverity[i.severity] || 0) + 1; });

        const avgSafety = srv.length > 0 ? (srv.reduce((s: number, x: any) => s + (x.felt_safe || 0), 0) / srv.length).toFixed(1) : "0";

        setData({
          totalRisks: r.length, activeRisks: r.filter((x: any) => x.status === "ativo").length,
          totalIncidents: inc.length, openIncidents: inc.filter((x: any) => x.status !== "fechado").length,
          pendingActions: act.filter((x: any) => x.status === "pendente").length,
          briefingsCount: brf.length, termsCount: trm.length, avgSafety,
          riskLevels, incBySeverity: Object.entries(incBySeverity).map(([name, value]) => ({ name, value })),
        });
      } else if (activeTab === "marketing") {
        const [leads, campaigns] = await Promise.all([
          supabase.from("marketing_leads").select("*"),
          supabase.from("marketing_campaigns").select("*"),
        ]);
        const l = leads.data || [];
        const camp = campaigns.data || [];

        const bySource: Record<string, number> = {};
        const byStatus: Record<string, number> = {};
        l.forEach((ld: any) => {
          bySource[ld.source] = (bySource[ld.source] || 0) + 1;
          byStatus[ld.status] = (byStatus[ld.status] || 0) + 1;
        });

        setData({
          totalLeads: l.length,
          hotLeads: l.filter((x: any) => x.status === "quente").length,
          totalCampaigns: camp.length,
          activeCampaigns: camp.filter((x: any) => x.status === "ativa" || x.status === "enviada").length,
          bySource: Object.entries(bySource).map(([name, value]) => ({ name, value })),
          byStatus: Object.entries(byStatus).map(([name, value]) => ({ name, value })),
        });
      }
    } catch (err) {
      console.error("Error loading report:", err);
    }
    setLoading(false);
  }, [activeTab, period, statusFilter]);

  useEffect(() => { loadReport(); }, [loadReport]);

  const exportCSV = (rows: any[], filename: string) => {
    if (!rows?.length) { toast({ title: "Sem dados para exportar", variant: "destructive" }); return; }
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(","), ...rows.map(r => headers.map(h => {
      const v = r[h];
      return typeof v === "string" && v.includes(",") ? `"${v}"` : v ?? "";
    }).join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast({ title: `${filename}.csv exportado com sucesso!` });
  };

  const printReport = () => { window.print(); };

  const fmt = (v: number) => (v / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <AdminLayout title="Relatórios">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Relatórios e análises do sistema em tempo real</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2">
              <Calendar size={14} className="text-muted-foreground" />
              <select value={period} onChange={e => setPeriod(e.target.value)}
                className="bg-transparent text-sm text-foreground outline-none">
                <option value="7">7 dias</option>
                <option value="30">30 dias</option>
                <option value="90">90 dias</option>
                <option value="180">6 meses</option>
                <option value="365">1 ano</option>
              </select>
            </div>
            <button onClick={printReport} className="p-2 bg-card border border-border rounded-xl hover:bg-muted transition-colors" title="Imprimir">
              <Printer size={16} className="text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Print styles */}
        <style>{`
          @media print {
            @page { size: A4 portrait; margin: 1.5cm; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none !important; }
            .print-only { display: block !important; }
            #report-content { width: 100%; }
            .bg-card { border: 1px solid #e5e7eb !important; background: white !important; }
            .text-muted-foreground { color: #6b7280 !important; }
            .text-foreground { color: #111827 !important; }
          }
          .print-only { display: none; }
        `}</style>

        {/* Print Header */}
        <div className="print-only hidden p-6 border-b border-border mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">Lençóis<span className="text-secondary">Tour</span></h1>
              <p className="text-sm text-muted-foreground mt-2">{empresa?.endereco || "Santo Amaro do Maranhão, MA"}</p>
              <p className="text-sm text-muted-foreground">{empresa?.email || "contato@lencoistour.com"}</p>
              <p className="text-sm text-muted-foreground">{empresa?.telefone || "(98) 99999-0000"}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold">{REPORT_TABS.find(t => t.id === activeTab)?.label} - Relatório</p>
              <p className="text-sm text-muted-foreground">Data: {format(new Date(), "dd/MM/yyyy HH:mm")}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="no-print flex flex-wrap gap-4 items-center bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-muted-foreground" />
            <select value={period} onChange={e => setPeriod(e.target.value)}
              className="bg-background text-sm p-2 rounded-lg border border-border">
              <option value="7">7 dias</option>
              <option value="30">30 dias</option>
              <option value="90">90 dias</option>
              <option value="365">1 ano</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-muted-foreground" />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="bg-background text-sm p-2 rounded-lg border border-border">
              <option value="all">Todos os Status</option>
              <option value="confirmed">Confirmado</option>
              <option value="pending">Pendente</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>
          <button onClick={printReport} className="ml-auto p-2 border border-border rounded-lg hover:bg-muted transition-colors">
            <Printer size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="no-print flex flex-wrap gap-2">
          {REPORT_TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                activeTab === tab.id ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:bg-muted"
              }`}>
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
        ) : (
          <div className="space-y-6" id="report-content">
            {/* The report content sections will follow here... */}
            {activeTab === "reservas" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Total Reservas", value: data.total || 0 },
                    { label: "Receita Bruta", value: fmt(data.revenue || 0) },
                    { label: "Ticket Médio", value: fmt(data.avgTicket || 0) },
                    { label: "Total Hóspedes", value: data.totalGuests || 0 },
                  ].map(s => (
                    <Card key={s.label}>
                      <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground">{s.label}</p>
                        <p className="text-2xl font-bold font-display mt-1">{s.value}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <ChartCard title="Receita por Dia">
                    <ResponsiveContainer width="100%" height={250}>
                      <AreaChart data={data.byDay}>
                        <defs><linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/><stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" fontSize={10} />
                        <YAxis fontSize={10} tickFormatter={(v) => `R$${v/100}`} />
                        <Tooltip formatter={(v: number) => fmt(v)} />
                        <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorTotal)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartCard>
                  <ChartCard title="Status das Reservas">
                    <ResponsiveContainer width="100%" height={250}>
                      <RePieChart>
                        <Pie data={data.byStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                          {data.byStatus?.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </RePieChart>
                    </ResponsiveContainer>
                  </ChartCard>
                </div>
              </div>
            )}
            {/* ... Other tabs ... */}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

const ChartCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <Card>
    <CardHeader className="pb-2"><CardTitle className="text-sm">{title}</CardTitle></CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

const EmptyChart = () => <div className="text-center py-12 text-sm text-muted-foreground">Sem dados</div>;

export default AdminRelatorios;
                          <Bar dataKey="revenue" fill="hsl(var(--secondary))" radius={[0, 4, 4, 0]} name="Receita" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : <EmptyChart />}
                  </ChartCard>
                </div>

                <div className="flex justify-end">
                  <button onClick={() => exportCSV(data.raw, "reservas")} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-semibold hover:opacity-90">
                    <Download size={14} /> Exportar CSV
                  </button>
                </div>
              </>
            )}

            {/* ===== FINANCEIRO ===== */}
            {activeTab === "financeiro" && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {[
                    { label: "A Receber", value: fmt(data.totalReceber || 0), color: "text-primary" },
                    { label: "Recebido", value: fmt(data.recebido || 0), color: "text-primary" },
                    { label: "A Pagar", value: fmt(data.totalPagar || 0), color: "text-destructive" },
                    { label: "Pago", value: fmt(data.pago || 0), color: "text-destructive" },
                    { label: "Saldo", value: fmt(data.saldo || 0), color: data.saldo >= 0 ? "text-primary" : "text-destructive" },
                    { label: "Inadimplência", value: `${data.inadimplencia || 0}%`, color: "text-secondary" },
                  ].map(s => (
                    <div key={s.label} className="bg-card border border-border rounded-2xl p-4">
                      <p className="text-[11px] text-muted-foreground">{s.label}</p>
                      <p className={`text-lg font-bold font-display ${s.color}`}>{s.value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <ChartCard title="Receitas por Categoria">
                    {data.receitas?.length > 0 ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <RePieChart>
                          <Pie data={data.receitas} cx="50%" cy="50%" outerRadius={80} innerRadius={35} dataKey="value" label={({ name, value }: any) => `${name}: ${fmt(value)}`}>
                            {data.receitas.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Tooltip formatter={(v: number) => fmt(v)} />
                        </RePieChart>
                      </ResponsiveContainer>
                    ) : <EmptyChart />}
                  </ChartCard>

                  <ChartCard title="Despesas por Categoria">
                    {data.despesas?.length > 0 ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <RePieChart>
                          <Pie data={data.despesas} cx="50%" cy="50%" outerRadius={80} innerRadius={35} dataKey="value" label={({ name, value }: any) => `${name}: ${fmt(value)}`}>
                            {data.despesas.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Tooltip formatter={(v: number) => fmt(v)} />
                        </RePieChart>
                      </ResponsiveContainer>
                    ) : <EmptyChart />}
                  </ChartCard>
                </div>

                <div className="flex justify-end gap-2">
                  <button onClick={() => exportCSV(data.rawCR, "contas_receber")} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-semibold hover:opacity-90">
                    <Download size={14} /> Exportar Receitas
                  </button>
                  <button onClick={() => exportCSV(data.rawCP, "contas_pagar")} className="flex items-center gap-2 px-4 py-2 bg-muted text-muted-foreground rounded-xl text-xs font-semibold hover:opacity-90">
                    <Download size={14} /> Exportar Despesas
                  </button>
                </div>
              </>
            )}

            {/* ===== CLIENTES ===== */}
            {activeTab === "clientes" && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { label: "Total Clientes", value: data.total || 0 },
                    { label: "Com Reservas", value: data.withBookings || 0 },
                    { label: "Taxa Conversão", value: data.total > 0 ? `${((data.withBookings / data.total) * 100).toFixed(1)}%` : "0%" },
                  ].map(s => (
                    <div key={s.label} className="bg-card border border-border rounded-2xl p-4">
                      <p className="text-[11px] text-muted-foreground">{s.label}</p>
                      <p className="text-xl font-bold text-foreground font-display">{s.value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <ChartCard title="Crescimento de Clientes">
                    {data.growth?.length > 0 ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={data.growth}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                          <Tooltip />
                          <Line type="monotone" dataKey="clientes" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : <EmptyChart />}
                  </ChartCard>

                  <ChartCard title="Top Clientes por Receita">
                    <div className="max-h-[220px] overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead><tr className="border-b border-border">
                          <th className="text-left py-1.5 text-muted-foreground font-medium">Cliente</th>
                          <th className="text-center py-1.5 text-muted-foreground font-medium">Reservas</th>
                          <th className="text-right py-1.5 text-muted-foreground font-medium">Receita</th>
                        </tr></thead>
                        <tbody>
                          {data.topClients?.slice(0, 10).map((c: any, i: number) => (
                            <tr key={i} className="border-b border-border/50">
                              <td className="py-1.5 font-medium text-foreground">{c.name}</td>
                              <td className="text-center text-muted-foreground">{c.bookings}</td>
                              <td className="text-right text-foreground">{fmt(c.revenue)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </ChartCard>
                </div>

                <div className="flex justify-end">
                  <button onClick={() => exportCSV(data.raw, "clientes")} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-semibold hover:opacity-90">
                    <Download size={14} /> Exportar CSV
                  </button>
                </div>
              </>
            )}

            {/* ===== PASSEIOS ===== */}
            {activeTab === "passeios" && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "Passeios Ativos", value: data.totalTours || 0 },
                    { label: "Total Vendas", value: data.totalBookings || 0 },
                    { label: "Receita Total", value: fmt(data.totalRevenue || 0) },
                    { label: "Total Passageiros", value: data.totalGuests || 0 },
                  ].map(s => (
                    <div key={s.label} className="bg-card border border-border rounded-2xl p-4">
                      <p className="text-[11px] text-muted-foreground">{s.label}</p>
                      <p className="text-xl font-bold text-foreground font-display">{s.value}</p>
                    </div>
                  ))}
                </div>

                <ChartCard title="Performance por Passeio">
                  {data.byTour?.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={data.byTour}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} angle={-20} textAnchor="end" height={60} />
                        <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" fontSize={10} tickFormatter={(v: number) => `R$${(v/100).toFixed(0)}`} />
                        <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                        <Tooltip formatter={(v: number, name: string) => name === "revenue" ? fmt(v) : v} />
                        <Legend />
                        <Bar yAxisId="left" dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Receita" />
                        <Bar yAxisId="right" dataKey="guests" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} name="Passageiros" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <EmptyChart />}
                </ChartCard>
              </>
            )}

            {/* ===== SGS ===== */}
            {activeTab === "sgs" && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "Riscos Ativos", value: data.activeRisks || 0 },
                    { label: "Incidentes (período)", value: data.totalIncidents || 0 },
                    { label: "Ações Pendentes", value: data.pendingActions || 0 },
                    { label: "Nota Segurança", value: `${data.avgSafety || 0}/5` },
                  ].map(s => (
                    <div key={s.label} className="bg-card border border-border rounded-2xl p-4">
                      <p className="text-[11px] text-muted-foreground">{s.label}</p>
                      <p className="text-xl font-bold text-foreground font-display">{s.value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "Total Riscos", value: data.totalRisks || 0 },
                    { label: "Incidentes Abertos", value: data.openIncidents || 0 },
                    { label: "Briefings", value: data.briefingsCount || 0 },
                    { label: "Termos Assinados", value: data.termsCount || 0 },
                  ].map(s => (
                    <div key={s.label} className="bg-card border border-border rounded-2xl p-3">
                      <p className="text-[10px] text-muted-foreground">{s.label}</p>
                      <p className="text-lg font-bold text-foreground">{s.value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <ChartCard title="Distribuição de Riscos">
                    {data.riskLevels?.some((r: any) => r.value > 0) ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <RePieChart>
                          <Pie data={data.riskLevels} cx="50%" cy="50%" outerRadius={80} innerRadius={35} dataKey="value" label={({ name, value }: any) => `${name}: ${value}`}>
                            {data.riskLevels.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Tooltip />
                        </RePieChart>
                      </ResponsiveContainer>
                    ) : <EmptyChart />}
                  </ChartCard>

                  <ChartCard title="Incidentes por Severidade">
                    {data.incBySeverity?.length > 0 ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={data.incBySeverity}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                          <Tooltip />
                          <Bar dataKey="value" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} name="Incidentes" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : <EmptyChart />}
                  </ChartCard>
                </div>
              </>
            )}

            {/* ===== MARKETING ===== */}
            {activeTab === "marketing" && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "Total Leads", value: data.totalLeads || 0 },
                    { label: "Leads Quentes", value: data.hotLeads || 0 },
                    { label: "Campanhas", value: data.totalCampaigns || 0 },
                    { label: "Campanhas Ativas", value: data.activeCampaigns || 0 },
                  ].map(s => (
                    <div key={s.label} className="bg-card border border-border rounded-2xl p-4">
                      <p className="text-[11px] text-muted-foreground">{s.label}</p>
                      <p className="text-xl font-bold text-foreground font-display">{s.value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <ChartCard title="Leads por Origem">
                    {data.bySource?.length > 0 ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <RePieChart>
                          <Pie data={data.bySource} cx="50%" cy="50%" outerRadius={80} innerRadius={35} dataKey="value" label={({ name, value }: any) => `${name}: ${value}`}>
                            {data.bySource.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Tooltip />
                        </RePieChart>
                      </ResponsiveContainer>
                    ) : <EmptyChart />}
                  </ChartCard>

                  <ChartCard title="Leads por Status">
                    {data.byStatus?.length > 0 ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={data.byStatus}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                          <Tooltip />
                          <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Leads" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : <EmptyChart />}
                  </ChartCard>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

const ChartCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-card border border-border rounded-2xl p-5">
    <h3 className="font-display font-bold text-foreground text-sm mb-4">{title}</h3>
    {children}
  </div>
);

const EmptyChart = () => (
  <div className="flex flex-col items-center justify-center py-12">
    <PieChart size={28} className="text-muted-foreground/30 mb-2" />
    <p className="text-xs text-muted-foreground">Sem dados no período selecionado</p>
  </div>
);

export default AdminRelatorios;
