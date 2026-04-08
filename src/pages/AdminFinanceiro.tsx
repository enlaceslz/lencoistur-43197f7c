import { useState, useEffect, useMemo } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import {
  DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  CreditCard, Wallet, Receipt, Loader2
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend
} from "recharts";

type Tab = "fluxo" | "pagar" | "receber" | "dre";

interface BookingRow {
  id: string;
  booking_code: string;
  item_name: string;
  final_total: number;
  total: number;
  discount: number;
  status: string;
  payment_status: string;
  pay_method: string;
  created_at: string;
  date: string | null;
  customers: { name: string; email: string } | null;
}

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR")}`;

const statusColors: Record<string, string> = {
  pendente: "bg-secondary/10 text-secondary",
  pago: "bg-primary/10 text-primary",
  atrasado: "bg-destructive/10 text-destructive",
  confirmada: "bg-primary/10 text-primary",
  cancelada: "bg-destructive/10 text-destructive",
};

const AdminFinanceiro = () => {
  const [tab, setTab] = useState<Tab>("fluxo");
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("bookings")
        .select("*, customers(name, email)")
        .order("created_at", { ascending: false });
      if (data) setBookings(data as any);
      setLoading(false);
    };
    fetch();
  }, []);

  const currentYear = new Date().getFullYear();

  // Monthly aggregation
  const monthlyData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: MONTH_LABELS[i],
      entradas: 0,
      saidas: 0,
      lucro: 0,
    }));

    bookings.forEach((b) => {
      if (b.status === "cancelada") return;
      const d = new Date(b.created_at);
      if (d.getFullYear() !== currentYear) return;
      const m = d.getMonth();
      months[m].entradas += b.final_total;
    });

    // Estimate costs at 50% of revenue
    months.forEach((m) => {
      m.saidas = Math.round(m.entradas * 0.5);
      m.lucro = m.entradas - m.saidas;
    });

    return months.filter((m) => m.entradas > 0 || m.saidas > 0);
  }, [bookings, currentYear]);

  // Current month stats
  const currentMonth = new Date().getMonth();
  const monthBookings = useMemo(
    () =>
      bookings.filter((b) => {
        const d = new Date(b.created_at);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear && b.status !== "cancelada";
      }),
    [bookings, currentMonth, currentYear]
  );

  const receitaMes = monthBookings.reduce((s, b) => s + b.final_total, 0);
  const despesasMes = Math.round(receitaMes * 0.5);
  const lucroMes = receitaMes - despesasMes;
  const margem = receitaMes > 0 ? Math.round((lucroMes / receitaMes) * 100) : 0;

  // Accounts receivable: pending payment bookings
  const contasReceber = useMemo(
    () => bookings.filter((b) => b.payment_status === "pendente" && b.status !== "cancelada"),
    [bookings]
  );

  // Accounts payable: confirmed bookings (estimated commissions at 20%)
  const contasPagar = useMemo(
    () =>
      bookings
        .filter((b) => b.status === "confirmada" || b.status === "concluida")
        .map((b) => ({
          ...b,
          comissao: Math.round(b.final_total * 0.2),
        })),
    [bookings]
  );

  const totalReceber = contasReceber.reduce((s, b) => s + b.final_total, 0);
  const totalPagar = contasPagar.reduce((s, b) => s + b.comissao, 0);

  // DRE
  const receitaBruta = monthBookings.reduce((s, b) => s + b.total, 0);
  const descontos = monthBookings.reduce((s, b) => s + b.discount, 0);
  const receitaLiquida = receitaBruta - descontos;
  const custosOp = Math.round(receitaLiquida * 0.35);
  const despesasOp = Math.round(receitaLiquida * 0.3);
  const lucroOp = receitaLiquida - custosOp - despesasOp;

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "fluxo", label: "Fluxo de Caixa", icon: TrendingUp },
    { key: "pagar", label: "Contas a Pagar", icon: CreditCard },
    { key: "receber", label: "Contas a Receber", icon: Wallet },
    { key: "dre", label: "DRE", icon: Receipt },
  ];

  const stats = [
    { label: "Receita (Mês)", value: fmt(receitaMes), change: `${monthBookings.length} res.`, up: true, icon: DollarSign },
    { label: "Despesas (Mês)", value: fmt(despesasMes), change: "Est. 50%", up: false, icon: TrendingDown },
    { label: "Lucro Líquido", value: fmt(lucroMes), change: `${margem}%`, up: lucroMes > 0, icon: TrendingUp },
    { label: "Margem", value: `${margem}%`, change: "", up: margem > 0, icon: Receipt },
  ];

  if (loading) {
    return (
      <AdminLayout title="Financeiro">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Financeiro">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-ocean-light flex items-center justify-center">
                  <s.icon size={20} className="text-primary" />
                </div>
                {s.change && (
                  <span className={`flex items-center gap-1 text-xs font-semibold ${s.up ? "text-primary" : "text-destructive"}`}>
                    {s.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {s.change}
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${
                tab === t.key ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Fluxo de Caixa */}
        {tab === "fluxo" && (
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-display text-lg font-bold text-foreground mb-4">Fluxo de Caixa Mensal ({currentYear})</h3>
            {monthlyData.length === 0 ? (
              <p className="text-muted-foreground text-center py-10">Nenhuma reserva encontrada para este ano.</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `R$${v / 1000}k`} />
                    <Tooltip formatter={(value: number) => [fmt(value), ""]} />
                    <Legend />
                    <Bar dataKey="entradas" name="Entradas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="saidas" name="Saídas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-6">
                  <h4 className="font-display font-bold text-foreground mb-3">Evolução do Lucro</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `R$${v / 1000}k`} />
                      <Tooltip formatter={(value: number) => [fmt(value), ""]} />
                      <Line type="monotone" dataKey="lucro" name="Lucro" stroke="hsl(var(--accent-foreground))" strokeWidth={3} dot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </div>
        )}

        {/* Contas a Pagar */}
        {tab === "pagar" && (
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-foreground">Contas a Pagar (Comissões est.)</h3>
              <p className="text-sm text-muted-foreground">
                Total estimado: <span className="font-bold text-destructive">{fmt(totalPagar)}</span>
              </p>
            </div>
            {contasPagar.length === 0 ? (
              <p className="text-muted-foreground text-center py-10">Nenhuma conta a pagar.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="text-left py-3 font-medium">Reserva</th>
                      <th className="text-left py-3 font-medium">Passeio</th>
                      <th className="text-left py-3 font-medium">Status</th>
                      <th className="text-right py-3 font-medium">Comissão Est.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contasPagar.slice(0, 20).map((a) => (
                      <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                        <td className="py-3 font-semibold text-foreground">{a.booking_code}</td>
                        <td className="py-3 text-muted-foreground">{a.item_name}</td>
                        <td className="py-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${statusColors[a.status] || ""}`}>{a.status}</span>
                        </td>
                        <td className="py-3 text-right font-semibold text-foreground">{fmt(a.comissao)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Contas a Receber */}
        {tab === "receber" && (
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-foreground">Contas a Receber</h3>
              <p className="text-sm text-muted-foreground">
                Total pendente: <span className="font-bold text-primary">{fmt(totalReceber)}</span>
              </p>
            </div>
            {contasReceber.length === 0 ? (
              <p className="text-muted-foreground text-center py-10">Nenhuma conta a receber.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="text-left py-3 font-medium">Cliente</th>
                      <th className="text-left py-3 font-medium">Passeio</th>
                      <th className="text-left py-3 font-medium">Código</th>
                      <th className="text-right py-3 font-medium">Valor</th>
                      <th className="text-right py-3 font-medium">Pagamento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contasReceber.slice(0, 20).map((a) => (
                      <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                        <td className="py-3 font-semibold text-foreground">{a.customers?.name || "—"}</td>
                        <td className="py-3 text-muted-foreground">{a.item_name}</td>
                        <td className="py-3 text-muted-foreground">{a.booking_code}</td>
                        <td className="py-3 text-right font-semibold text-foreground">{fmt(a.final_total)}</td>
                        <td className="py-3 text-right">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${statusColors[a.payment_status] || ""}`}>
                            {a.payment_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* DRE */}
        {tab === "dre" && (
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-display text-lg font-bold text-foreground mb-6">
              DRE - Demonstração do Resultado ({MONTH_LABELS[currentMonth]} {currentYear})
            </h3>
            <div className="max-w-2xl space-y-1">
              <div className="flex justify-between py-3 border-b border-border">
                <span className="font-semibold text-foreground">Receita Bruta</span>
                <span className="font-bold text-foreground">{fmt(receitaBruta)}</span>
              </div>
              <div className="flex justify-between py-2 pl-4 text-sm">
                <span className="text-destructive">(-) Descontos concedidos</span>
                <span className="text-destructive">- {fmt(descontos)}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-border bg-muted/50 px-3 rounded-lg">
                <span className="font-semibold text-foreground">= Receita Líquida</span>
                <span className="font-bold text-foreground">{fmt(receitaLiquida)}</span>
              </div>

              <div className="pt-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider py-2">Custos Operacionais (est. 35%)</p>
                <div className="flex justify-between py-2 pl-4 text-sm">
                  <span className="text-muted-foreground">(-) Comissões, combustível, seguros</span>
                  <span className="text-destructive">- {fmt(custosOp)}</span>
                </div>
              </div>

              <div className="flex justify-between py-3 border-b border-border bg-muted/50 px-3 rounded-lg">
                <span className="font-semibold text-foreground">= Lucro Bruto</span>
                <span className="font-bold text-foreground">{fmt(receitaLiquida - custosOp)}</span>
              </div>

              <div className="pt-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider py-2">Despesas Operacionais (est. 30%)</p>
                <div className="flex justify-between py-2 pl-4 text-sm">
                  <span className="text-muted-foreground">(-) Marketing, salários, tecnologia</span>
                  <span className="text-destructive">- {fmt(despesasOp)}</span>
                </div>
              </div>

              <div className="flex justify-between py-4 border-t-2 border-primary bg-ocean-light px-3 rounded-lg mt-2">
                <span className="font-display text-lg font-bold text-foreground">= Lucro Operacional</span>
                <span className="font-display text-lg font-bold text-primary">{fmt(lucroOp)}</span>
              </div>

              <div className="text-right pt-2">
                <span className="text-xs text-muted-foreground">Margem operacional: </span>
                <span className="text-sm font-bold text-primary">
                  {receitaBruta > 0 ? Math.round((lucroOp / receitaBruta) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminFinanceiro;
