import { useState, useEffect, useCallback, useRef } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  BarChart3, Download, TrendingUp, Users, ShoppingCart, Shield,
  CreditCard, Calendar, Filter, Printer, PieChart, Activity, MapPin, Mail, Phone, UserPlus, Save
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area
} from "recharts";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

type ReportType = "reservas" | "financeiro" | "clientes" | "passeios" | "sgs" | "marketing" | "parceiros" | "usuarios";

const REPORT_TABS: { id: ReportType; label: string; icon: any }[] = [
  { id: "reservas", label: "Reservas", icon: ShoppingCart },
  { id: "financeiro", label: "Financeiro", icon: CreditCard },
  { id: "clientes", label: "Clientes", icon: Users },
  { id: "passeios", label: "Passeios", icon: BarChart3 },
  { id: "sgs", label: "Segurança (SGS)", icon: Shield },
  { id: "marketing", label: "Marketing", icon: TrendingUp },
  { id: "parceiros", label: "Parceiros", icon: UserPlus },
  { id: "usuarios", label: "Acessos (Logs)", icon: Users },
];

const COLORS = [
  "hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--destructive))",
  "hsl(217,91%,60%)", "hsl(152,60%,42%)", "hsl(38,92%,50%)", "hsl(280,60%,50%)",
];

const fmt = (v: number) => `R$ ${(v / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const AdminRelatorios = () => {
  const [activeTab, setActiveTab] = useState<ReportType>("reservas");
  const [period, setPeriod] = useState("30");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>({});
  const [empresa, setEmpresa] = useState<any>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from("site_settings").select("*");
      if (data) {
        const emp = data.find(s => s.key === "empresa")?.value;
        setEmpresa(emp);
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
        if (statusFilter !== "all") query = query.eq("status", statusFilter);
        const { data: bookings } = await query;
        const b = bookings || [];
        const byStatus: Record<string, number> = {};
        const byDay: Record<string, { date: string; total: number }> = {};
        b.forEach((r: any) => {
          byStatus[r.status] = (byStatus[r.status] || 0) + 1;
          const day = r.created_at?.slice(0, 10);
          if (day) {
            if (!byDay[day]) byDay[day] = { date: day, total: 0 };
            byDay[day].total += r.final_total || 0;
          }
        });
        setData({
          total: b.length,
          revenue: b.reduce((s: number, r: any) => s + (r.final_total || 0), 0),
          avgTicket: b.length > 0 ? Math.round(b.reduce((s: number, r: any) => s + (r.final_total || 0), 0) / b.length) : 0,
          guests: b.reduce((s: number, r: any) => s + (r.guests || 0), 0),
          byStatus: Object.entries(byStatus).map(([name, value]) => ({ name, value })),
          byDay: Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date)),
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
        const recebido = cr.filter((r: any) => r.status === "pago").reduce((s: number, r: any) => s + (r.valor || 0), 0);
        const pago = cp.filter((r: any) => r.status === "pago").reduce((s: number, r: any) => s + (r.valor || 0), 0);
        const catReceitas: Record<string, number> = {};
        cr.forEach((r: any) => { catReceitas[r.categoria] = (catReceitas[r.categoria] || 0) + (r.valor || 0); });
        setData({
          totalReceber: cr.reduce((s: number, r: any) => s + (r.valor || 0), 0),
          totalPagar: cp.reduce((s: number, r: any) => s + (r.valor || 0), 0),
          recebido, pago, saldo: recebido - pago,
          receitas: Object.entries(catReceitas).map(([name, value]) => ({ name, value })),
        });
      } else if (activeTab === "clientes") {
        const { data: customers } = await supabase.from("customers").select("*").order("created_at", { ascending: false });
        const c = customers || [];
        const byMonth: Record<string, number> = {};
        c.forEach((cl: any) => {
          const m = cl.created_at?.slice(0, 7);
          if (m) byMonth[m] = (byMonth[m] || 0) + 1;
        });
        setData({
          total: c.length,
          growth: Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b)).slice(-6).map(([month, count]) => ({ name: month, value: count })),
          raw: c,
        });
      } else if (activeTab === "passeios") {
        const { data: bookings } = await supabase.from("bookings").select("item_name, final_total, guests").eq("type", "tour").gte("created_at", since);
        const b = bookings || [];
        const tourStats: Record<string, { name: string; revenue: number; guests: number }> = {};
        b.forEach((r: any) => {
          if (!tourStats[r.item_name]) tourStats[r.item_name] = { name: r.item_name, revenue: 0, guests: 0 };
          tourStats[r.item_name].revenue += r.final_total || 0;
          tourStats[r.item_name].guests += r.guests || 0;
        });
        setData({
          totalRevenue: b.reduce((s: number, r: any) => s + (r.final_total || 0), 0),
          totalGuests: b.reduce((s: number, r: any) => s + (r.guests || 0), 0),
          byTour: Object.values(tourStats).sort((a: any, b: any) => b.revenue - a.revenue),
        });
      } else if (activeTab === "sgs") {
        const [risks, incidents] = await Promise.all([
          supabase.from("sgs_risks").select("*"),
          supabase.from("sgs_incidents").select("*").gte("created_at", since),
        ]);
        setData({
          totalRisks: (risks.data || []).length,
          totalIncidents: (incidents.data || []).length,
          openIncidents: (incidents.data || []).filter((i: any) => i.status !== "fechado").length,
        });
      } else if (activeTab === "marketing") {
        const { data: leads } = await supabase.from("marketing_leads").select("*");
        const l = leads || [];
        const bySource: Record<string, number> = {};
        l.forEach((ld: any) => { bySource[ld.source] = (bySource[ld.source] || 0) + 1; });
        setData({
          totalLeads: l.length,
          hotLeads: l.filter((x: any) => x.status === "quente").length,
          bySource: Object.entries(bySource).map(([name, value]) => ({ name, value })),
        });
      } else if (activeTab === "parceiros") {
        const [partners, bookings] = await Promise.all([
          supabase.from("partners").select("*"),
          supabase.from("bookings").select("final_total, partner_id").not("partner_id", "is", null).gte("created_at", since)
        ]);
        const p = partners.data || [];
        const b = bookings.data || [];
        
        const byType: Record<string, number> = {};
        p.forEach((pt: any) => { byType[pt.type] = (byType[pt.type] || 0) + 1; });
        
        const partnerRevenue: Record<string, number> = {};
        b.forEach((res: any) => {
          partnerRevenue[res.partner_id] = (partnerRevenue[res.partner_id] || 0) + (res.final_total || 0);
        });

        setData({
          total: p.length,
          active: p.filter((x: any) => x.active).length,
          byType: Object.entries(byType).map(([name, value]) => ({ name, value })),
          topPartners: p.map(partner => ({
            name: partner.name,
            revenue: partnerRevenue[partner.id] || 0
          })).sort((a, b) => b.revenue - a.revenue).slice(0, 5)
        });
      } else if (activeTab === "usuarios") {
        const { data: users } = await supabase.from("user_management").select("*");
        const u = users || [];
        const byRole: Record<string, number> = {};
        u.forEach((us: any) => { byRole[us.role] = (byRole[us.role] || 0) + 1; });
        setData({
          total: u.length,
          active: u.filter((x: any) => x.status === "ativo").length,
          byRole: Object.entries(byRole).map(([name, value]) => ({ name, value })),
        });
      }
    } catch (err) {
      console.error("Error loading report:", err);
    }
    setLoading(false);
  }, [activeTab, period, statusFilter]);

  useEffect(() => { loadReport(); }, [loadReport]);

  const printReport = () => window.print();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-4 rounded-2xl border-none shadow-xl">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
            {label ? format(parseISO(label), "dd 'de' MMMM", { locale: ptBR }) : ''}
          </p>
          <p className="text-sm font-black text-primary">
            {fmt(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <AdminLayout title="Relatórios">
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 1cm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white !important; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .admin-layout-main { padding: 0 !important; margin: 0 !important; }
          .bg-card { border: 1px solid #e5e7eb !important; box-shadow: none !important; }
          .shadow-sm, .shadow-md, .shadow-lg { box-shadow: none !important; }
          canvas { max-width: 100% !important; height: auto !important; }
        }
        .print-only { display: none; }
      `}</style>

      <div className="space-y-6">
        {/* Professional Header for Print */}
        <div className="print-only p-8 border-b-2 border-primary/20 bg-muted/30 rounded-t-3xl mb-8">
          <div className="flex justify-between items-start">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                  <BarChart3 className="text-primary-foreground" size={24} />
                </div>
                <h1 className="font-display text-4xl font-bold tracking-tight">Lençóis<span className="text-secondary">Tour</span></h1>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground ml-1">
                <p className="flex items-center gap-2"><MapPin size={14} /> {empresa?.endereco || "Santo Amaro do Maranhão, MA"}</p>
                <p className="flex items-center gap-2"><Phone size={14} /> {empresa?.telefone || "(98) 99999-0000"}</p>
                <p className="flex items-center gap-2"><Mail size={14} /> {empresa?.email || "contato@lencoistour.com"}</p>
              </div>
            </div>
            <div className="text-right space-y-2">
              <div className="bg-primary/10 px-4 py-2 rounded-xl inline-block border border-primary/20">
                <p className="text-primary font-bold text-lg uppercase tracking-wider">{REPORT_TABS.find(t => t.id === activeTab)?.label}</p>
              </div>
              <p className="text-sm font-medium text-muted-foreground">Relatório Gerencial</p>
              <p className="text-xs text-muted-foreground/80">Gerado em {format(new Date(), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR })}</p>
              <p className="text-xs text-muted-foreground/80">Período: Últimos {period} dias</p>
            </div>
          </div>
        </div>

        <div className="no-print flex flex-col xl:flex-row xl:items-center justify-between gap-6 glass-card p-8 rounded-[2.5rem] animate-in-fade" style={{ animationDelay: '0.1s' }}>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-2">Análise de Performance</p>
            <h2 className="text-4xl font-black text-foreground tracking-tight leading-none">Relatórios Gerenciais</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-muted/50 border border-border/50 rounded-2xl px-4 h-12 shadow-inner group">
              <Calendar size={18} className="text-primary group-hover:scale-110 transition-transform" />
              <select value={period} onChange={e => setPeriod(e.target.value)} className="bg-transparent text-[11px] font-black uppercase tracking-widest outline-none cursor-pointer">
                <option value="7">Últimos 7 dias</option>
                <option value="30">Últimos 30 dias</option>
                <option value="90">90 dias</option>
                <option value="365">Anual</option>
              </select>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={printReport} className="flex items-center gap-3 bg-primary hover:bg-primary/90 text-primary-foreground px-8 h-12 rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-95">
                    <Printer size={18} strokeWidth={3} /> Imprimir
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Gerar PDF para impressão</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <div className="no-print flex gap-2 overflow-x-auto pb-4 no-scrollbar scroll-smooth mb-4">
          {REPORT_TABS.map(tab => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 h-11 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
                activeTab === tab.id 
                ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-105" 
                : "bg-muted/50 text-muted-foreground border-border/50 hover:bg-muted"
              }`}>
              <tab.icon size={16} strokeWidth={2.5} /> {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            <p className="text-muted-foreground font-medium">Processando dados...</p>
          </div>
        ) : (
          <div id="report-content" className="space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {activeTab === "reservas" && (
                <>
                  <KPICard label="Total de Reservas" value={data.total || 0} icon={ShoppingCart} color="text-primary" />
                  <KPICard label="Receita Bruta" value={fmt(data.revenue || 0)} icon={CreditCard} color="text-secondary" />
                  <KPICard label="Ticket Médio" value={fmt(data.avgTicket || 0)} icon={TrendingUp} color="text-blue-500" />
                  <KPICard label="Total Hóspedes" value={data.guests || 0} icon={Users} color="text-purple-500" />
                </>
              )}
              {activeTab === "financeiro" && (
                <>
                  <KPICard label="Recebido" value={fmt(data.recebido || 0)} icon={CreditCard} color="text-primary" />
                  <KPICard label="Pago" value={fmt(data.pago || 0)} icon={ShoppingCart} color="text-destructive" />
                  <KPICard label="Saldo Atual" value={fmt(data.saldo || 0)} icon={TrendingUp} color="text-secondary" />
                  <KPICard label="A Receber" value={fmt(data.totalReceber || 0)} icon={Activity} color="text-blue-500" />
                </>
              )}
              {activeTab === "sgs" && (
                <>
                  <KPICard label="Riscos Ativos" value={data.totalRisks || 0} icon={Shield} color="text-primary" />
                  <KPICard label="Incidentes" value={data.totalIncidents || 0} icon={Activity} color="text-destructive" />
                  <KPICard label="Abertos" value={data.openIncidents || 0} icon={Activity} color="text-secondary" />
                </>
              )}
              {activeTab === "marketing" && (
                <>
                  <KPICard label="Total Leads" value={data.totalLeads || 0} icon={Users} color="text-primary" />
                  <KPICard label="Leads Quentes" value={data.hotLeads || 0} icon={TrendingUp} color="text-secondary" />
                </>
              )}
              {activeTab === "clientes" && (
                <>
                  <KPICard label="Total Clientes" value={data.total || 0} icon={Users} color="text-primary" />
                </>
              )}
              {activeTab === "parceiros" && (
                <>
                  <KPICard label="Total Parceiros" value={data.total || 0} icon={UserPlus} color="text-primary" />
                  <KPICard label="Parceiros Ativos" value={data.active || 0} icon={Activity} color="text-secondary" />
                </>
              )}
              {activeTab === "usuarios" && (
                <>
                  <KPICard label="Total de Usuários" value={data.total || 0} icon={Users} color="text-primary" />
                  <KPICard label="Usuários Ativos" value={data.active || 0} icon={Activity} color="text-emerald-500" />
                </>
              )}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeTab === "reservas" && (
                <>
                  <ChartCard title="Evolução da Receita">
                    <ResponsiveContainer width="100%" height={280}>
                      <AreaChart data={data.byDay}>
                        <defs><linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/><stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="date" fontSize={10} tick={{fill: '#9ca3af', fontWeight: '900'}} axisLine={false} tickLine={false} tickFormatter={(v) => format(parseISO(v), 'dd MMM', { locale: ptBR })} />
                        <YAxis fontSize={10} tick={{fill: '#9ca3af', fontWeight: '900'}} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${v/100}`} />
                        <ChartTooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartCard>
                  <ChartCard title="Status das Reservas">
                    <ResponsiveContainer width="100%" height={280}>
                      <RePieChart>
                        <Pie data={data.byStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={8} stroke="none">
                          {data.byStatus?.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <ChartTooltip />
                        <Legend iconType="circle" wrapperStyle={{paddingTop: '20px'}} />
                      </RePieChart>
                    </ResponsiveContainer>
                  </ChartCard>
                </>
              )}
              {activeTab === "financeiro" && (
                <>
                  <ChartCard title="Distribuição de Receitas">
                    <ResponsiveContainer width="100%" height={280}>
                      <RePieChart>
                        <Pie data={data.receitas} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={8}>
                          {data.receitas?.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <ChartTooltip formatter={(v: number) => fmt(v)} />
                        <Legend iconType="circle" wrapperStyle={{paddingTop: '20px'}} />
                      </RePieChart>
                    </ResponsiveContainer>
                  </ChartCard>
                  <ChartCard title="Comparativo Financeiro">
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={[{ name: 'Fluxo', recebido: data.recebido, pago: data.pago }]}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                        <YAxis fontSize={10} axisLine={false} tickLine={false} tickFormatter={(v) => `R$ ${(v/100).toLocaleString('pt-BR')}`} />
                        <ChartTooltip formatter={(v: number) => fmt(v)} />
                        <Bar dataKey="recebido" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="pago" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>
                </>
              )}
              {activeTab === "passeios" && (
                <div className="md:col-span-2">
                  <ChartCard title="Performance por Passeio">
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={data.byTour}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                        <YAxis fontSize={10} axisLine={false} tickLine={false} tickFormatter={(v) => `R$ ${(v/100).toLocaleString('pt-BR')}`} />
                        <ChartTooltip formatter={(v: number) => fmt(v)} />
                        <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Receita" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>
                </div>
              )}
              {activeTab === "parceiros" && (
                <>
                  <div className="col-span-1">
                    <ChartCard title="Parceiros por Tipo">
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={data.byType}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                          <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                          <YAxis fontSize={10} axisLine={false} tickLine={false} />
                          <ChartTooltip />
                          <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Quantidade" />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartCard>
                  </div>
                  <div className="col-span-1">
                    <ChartCard title="Receita por Parceiro (Top 5)">
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={data.topPartners} layout="vertical" margin={{ left: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                          <XAxis type="number" fontSize={10} tickFormatter={(v) => `R$${v/100}`} />
                          <YAxis dataKey="name" type="category" fontSize={10} width={80} />
                          <ChartTooltip formatter={(v: any) => fmt(v)} />
                          <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartCard>
                  </div>
                </>
              )}
              {activeTab === "usuarios" && (
                <div className="md:col-span-2">
                  <ChartCard title="Distribuição de Hierarquia">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={data.byRole}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                        <YAxis fontSize={10} axisLine={false} tickLine={false} />
                        <ChartTooltip />
                        <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Quantidade" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>
                </div>
              )}
            </div>

            {/* Professional Footer for Print */}
            <div className="print-only pt-10 border-t border-border mt-10">
              <div className="flex justify-between items-center text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                <p>LençóisTour - ERP de Gestão Turística</p>
                <p>Página 1 de 1</p>
                <p>www.lencoistour.com</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

const KPICard = ({ label, value, icon: Icon, color }: any) => (
  <div className="glass-card rounded-[2.5rem] p-6 border-none shadow-sm group hover:scale-[1.02] transition-all relative overflow-hidden">
    <div className={`absolute -right-2 -top-2 w-16 h-16 ${color.replace('text', 'bg')} opacity-5 rounded-full blur-xl group-hover:opacity-10 transition-opacity`} />
    <div className="flex items-center justify-between mb-4">
      <div className={`w-10 h-10 rounded-xl ${color.replace('text', 'bg')} bg-opacity-10 flex items-center justify-center ${color}`}>
        <Icon size={20} strokeWidth={2.5} />
      </div>
      <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">KPI</div>
    </div>
    <p className="text-2xl font-black text-foreground tracking-tighter group-hover:translate-x-1 transition-transform">{value}</p>
    <p className="text-[10px] font-black text-muted-foreground mt-1 uppercase tracking-[0.2em]">{label}</p>
  </div>
);


const ChartCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <Card className="border-none shadow-sm overflow-hidden glass-card rounded-[2.5rem] group hover:shadow-xl hover:shadow-primary/5 transition-all duration-500">
    <CardHeader className="bg-muted/10 border-b border-border/20 py-6 px-8">
      <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3 text-muted-foreground group-hover:text-primary transition-colors">
        <Activity size={16} className="text-primary group-hover:scale-110 transition-transform" strokeWidth={3} /> {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="p-8 bg-transparent">{children}</CardContent>
  </Card>
);


export default AdminRelatorios;