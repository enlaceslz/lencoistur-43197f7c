import { useEffect, useState, useCallback } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  BarChart3, TrendingUp, Users, ShoppingCart, Shield,
  CreditCard, Printer, PieChart, Activity, FileText
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell, AreaChart, Area
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";

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
          byStatus: Object.entries(byStatus).map(([name, value]) => ({ name, value })),
          byDay: Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date)),
          raw: b,
        });
      } else if (activeTab === "financeiro") {
        const { data: pagar } = await supabase.from("contas_pagar").select("*").gte("vencimento", since);
        const { data: receber } = await supabase.from("contas_receber").select("*").gte("vencimento", since);
        
        setData({
          pagar: pagar?.reduce((s, c) => s + c.valor, 0) || 0,
          receber: receber?.reduce((s, c) => s + c.valor, 0) || 0,
        });
      } else {
        setData({ total: 0, revenue: 0, byStatus: [], byDay: [] });
      }
    } catch (err) {
      console.error("Error loading report:", err);
      toast({ title: "Erro ao carregar relatório", variant: "destructive" });
    }
    setLoading(false);
  }, [activeTab, period, statusFilter]);

  useEffect(() => { loadReport(); }, [loadReport]);

  const fmt = (v: number) => (v / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const printReport = () => window.print();

  return (
    <AdminLayout title="Relatórios">
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 1.5cm; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: white !important; }
        }
        .print-only { display: none; }
      `}</style>

      <div className="space-y-6">
        {/* Header (Visible only on print) */}
        <div className="print-only p-6 border-b border-border mb-6">
          <h1 className="font-display text-3xl font-bold">{empresa?.nome || "LençóisTour"}</h1>
          <p className="text-sm text-muted-foreground">{empresa?.endereco || "Santo Amaro do Maranhão, MA"}</p>
          <h2 className="text-xl font-semibold mt-4">Relatório de {REPORT_TABS.find(t => t.id === activeTab)?.label}</h2>
          <p className="text-sm text-muted-foreground">Período: {period} dias | Data: {format(new Date(), "dd/MM/yyyy HH:mm")}</p>
        </div>

        {/* Filters and Controls */}
        <div className="no-print flex gap-4 bg-card p-4 rounded-xl border border-border items-center">
          <select value={period} onChange={e => setPeriod(e.target.value)} className="p-2 bg-background border rounded-lg text-sm">
            <option value="7">7 dias</option>
            <option value="30">30 dias</option>
            <option value="365">1 ano</option>
          </select>
          <button onClick={printReport} className="ml-auto flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold">
            <Printer size={16} /> Imprimir Relatório
          </button>
        </div>

        {/* Tabs */}
        <div className="no-print flex gap-2 overflow-x-auto pb-2">
          {REPORT_TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 ${activeTab === tab.id ? "bg-primary text-primary-foreground" : "bg-card border"}`}>
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-10">Carregando dados...</div>
        ) : (
          <div id="report-content" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total</p><p className="text-2xl font-bold">{data.total || 0}</p></CardContent></Card>
              <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Receita</p><p className="text-2xl font-bold">{fmt(data.revenue || 0)}</p></CardContent></Card>
              <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Ticket Médio</p><p className="text-2xl font-bold">{fmt(data.avgTicket || 0)}</p></CardContent></Card>
            </div>

            {data.byDay && data.byDay.length > 0 && (
              <Card className="p-6">
                <h3 className="font-bold mb-4">Evolução de Receita</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.byDay}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminRelatorios;
