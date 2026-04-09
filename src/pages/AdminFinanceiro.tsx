import { useState, useEffect, useMemo } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import {
  DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  CreditCard, Wallet, Receipt, Loader2, Download, PieChart as PieChartIcon,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, PieChart, Pie, Cell,
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
const fmt = (v: number) => `R$ ${(v / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
const fmtDate = (d: string) => {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("pt-BR"); } catch { return d; }
};

const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--destructive))", "#f59e0b", "#8b5cf6", "#06b6d4"];

const statusBadge: Record<string, string> = {
  pendente: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  pago: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  confirmada: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  cancelada: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  concluida: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
};

const AdminFinanceiro = () => {
  const [tab, setTab] = useState<Tab>("fluxo");
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("bookings")
        .select("*, customers(name, email)")
        .order("created_at", { ascending: false });
      if (data) setBookings(data as any);
      setLoading(false);
    };
    load();
  }, []);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  // All non-cancelled bookings
  const validBookings = useMemo(() => bookings.filter(b => b.status !== "cancelada"), [bookings]);

  // Monthly aggregation
  const monthlyData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: MONTH_LABELS[i],
      entradas: 0,
      descontos: 0,
      receitaLiquida: 0,
    }));

    validBookings.forEach((b) => {
      const d = new Date(b.created_at);
      if (d.getFullYear() !== currentYear) return;
      const m = d.getMonth();
      if (b.payment_status === "pago") {
        months[m].entradas += b.final_total;
      }
      months[m].descontos += b.discount;
    });

    months.forEach((m) => {
      m.receitaLiquida = m.entradas;
    });

    return months;
  }, [validBookings, currentYear]);

  const monthlyFiltered = useMemo(() => monthlyData.filter(m => m.entradas > 0 || m.descontos > 0), [monthlyData]);

  // Current month bookings
  const monthBookings = useMemo(
    () => validBookings.filter((b) => {
      const d = new Date(b.created_at);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }),
    [validBookings, currentMonth, currentYear]
  );

  // Revenue by payment method
  const revenueByMethod = useMemo(() => {
    const map: Record<string, number> = {};
    monthBookings.filter(b => b.payment_status === "pago").forEach(b => {
      const method = b.pay_method === "pix" ? "PIX" : b.pay_method === "cartao" ? "Cartão" : b.pay_method === "dinheiro" ? "Dinheiro" : b.pay_method;
      map[method] = (map[method] || 0) + b.final_total;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [monthBookings]);

  // Stats
  const receitaPaga = monthBookings.filter(b => b.payment_status === "pago").reduce((s, b) => s + b.final_total, 0);
  const descontosMes = monthBookings.reduce((s, b) => s + b.discount, 0);
  const ticketMedio = monthBookings.length > 0 ? Math.round(receitaPaga / monthBookings.filter(b => b.payment_status === "pago").length || 1) : 0;

  // Accounts receivable: pending payment
  const contasReceber = useMemo(
    () => validBookings.filter(b => b.payment_status === "pendente"),
    [validBookings]
  );
  const totalReceber = contasReceber.reduce((s, b) => s + b.final_total, 0);

  // Accounts payable: estimated commissions (20% of paid confirmed/completed)
  const contasPagar = useMemo(
    () => validBookings
      .filter(b => (b.status === "confirmada" || b.status === "concluida") && b.payment_status === "pago")
      .map(b => ({ ...b, comissao: Math.round(b.final_total * 0.2) })),
    [validBookings]
  );
  const totalPagar = contasPagar.reduce((s, b) => s + b.comissao, 0);

  // DRE
  const receitaBruta = monthBookings.reduce((s, b) => s + b.total, 0);
  const receitaLiquida = receitaBruta - descontosMes;
  const custosOp = Math.round(receitaLiquida * 0.35);
  const lucroBruto = receitaLiquida - custosOp;
  const despesasAdmin = Math.round(receitaLiquida * 0.15);
  const despesasMkt = Math.round(receitaLiquida * 0.10);
  const despesasTech = Math.round(receitaLiquida * 0.05);
  const totalDespesas = despesasAdmin + despesasMkt + despesasTech;
  const lucroOp = lucroBruto - totalDespesas;

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "fluxo", label: "Fluxo de Caixa", icon: TrendingUp },
    { key: "pagar", label: `Contas a Pagar (${contasPagar.length})`, icon: CreditCard },
    { key: "receber", label: `Contas a Receber (${contasReceber.length})`, icon: Wallet },
    { key: "dre", label: "DRE", icon: Receipt },
  ];

  const stats = [
    { label: "Receita Paga (Mês)", value: fmt(receitaPaga), change: `${monthBookings.filter(b => b.payment_status === "pago").length} res.`, up: true, icon: DollarSign },
    { label: "A Receber", value: fmt(totalReceber), change: `${contasReceber.length} pend.`, up: false, icon: Wallet },
    { label: "Ticket Médio", value: fmt(ticketMedio), change: "", up: true, icon: TrendingUp },
    { label: "Descontos (Mês)", value: fmt(descontosMes), change: receitaBruta > 0 ? `${Math.round(descontosMes / receitaBruta * 100)}%` : "", up: false, icon: TrendingDown },
  ];

  const exportCSV = () => {
    const header = "Código,Cliente,Passeio,Total,Desconto,Final,Pagamento,Status,Método,Data\n";
    const rows = validBookings.map(b =>
      `"${b.booking_code}","${b.customers?.name || ""}","${b.item_name}",${(b.total / 100).toFixed(2)},${(b.discount / 100).toFixed(2)},${(b.final_total / 100).toFixed(2)},"${b.payment_status}","${b.status}","${b.pay_method}","${fmtDate(b.created_at)}"`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `financeiro_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
            <Card key={s.label}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 rounded-xl bg-muted text-primary"><s.icon size={20} /></div>
                  {s.change && (
                    <span className={`flex items-center gap-1 text-xs font-semibold ${s.up ? "text-green-600" : "text-amber-600"}`}>
                      {s.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      {s.change}
                    </span>
                  )}
                </div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs + Export */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {tabs.map((t) => (
            <Button
              key={t.key}
              variant={tab === t.key ? "default" : "outline"}
              size="sm"
              onClick={() => setTab(t.key)}
              className="shrink-0"
            >
              <t.icon size={16} className="mr-1" />
              {t.label}
            </Button>
          ))}
          <div className="ml-auto">
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download size={14} className="mr-1" /> CSV
            </Button>
          </div>
        </div>

        {/* Fluxo de Caixa */}
        {tab === "fluxo" && (
          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardContent className="p-6">
                <h3 className="font-bold text-foreground mb-4">Receita Mensal ({currentYear})</h3>
                {monthlyFiltered.length === 0 ? (
                  <p className="text-muted-foreground text-center py-10">Nenhuma receita registrada este ano.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={monthlyFiltered}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `R$${(v / 100).toFixed(0)}`} />
                      <Tooltip formatter={(value: number) => [fmt(value), ""]} />
                      <Legend />
                      <Bar dataKey="entradas" name="Receita Paga" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="descontos" name="Descontos" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                  <PieChartIcon size={16} /> Receita por Método
                </h3>
                {revenueByMethod.length === 0 ? (
                  <p className="text-muted-foreground text-center py-10 text-sm">Sem dados este mês.</p>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={revenueByMethod} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                          {revenueByMethod.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => [fmt(value), ""]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 mt-4">
                      {revenueByMethod.map((m, i) => (
                        <div key={m.name} className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                            {m.name}
                          </span>
                          <span className="font-medium text-foreground">{fmt(m.value)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Evolução anual */}
            {monthlyFiltered.length > 1 && (
              <Card className="lg:col-span-3">
                <CardContent className="p-6">
                  <h3 className="font-bold text-foreground mb-4">Evolução da Receita</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={monthlyFiltered}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `R$${(v / 100).toFixed(0)}`} />
                      <Tooltip formatter={(value: number) => [fmt(value), ""]} />
                      <Line type="monotone" dataKey="receitaLiquida" name="Receita Líquida" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Contas a Pagar */}
        {tab === "pagar" && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-foreground">Contas a Pagar (Comissões est. 20%)</h3>
                <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 text-base px-4 py-1">
                  {fmt(totalPagar)}
                </Badge>
              </div>
              {contasPagar.length === 0 ? (
                <p className="text-muted-foreground text-center py-10">Nenhuma conta a pagar.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="text-left py-3 font-medium">Código</th>
                        <th className="text-left py-3 font-medium">Passeio</th>
                        <th className="text-left py-3 font-medium">Cliente</th>
                        <th className="text-left py-3 font-medium">Status</th>
                        <th className="text-right py-3 font-medium">Valor Reserva</th>
                        <th className="text-right py-3 font-medium">Comissão Est.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contasPagar.slice(0, 30).map((a) => (
                        <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                          <td className="py-3 font-mono text-sm text-foreground">{a.booking_code}</td>
                          <td className="py-3 text-muted-foreground max-w-[200px] truncate">{a.item_name}</td>
                          <td className="py-3 text-foreground">{a.customers?.name || "—"}</td>
                          <td className="py-3">
                            <Badge variant="secondary" className={statusBadge[a.status] || ""}>{a.status}</Badge>
                          </td>
                          <td className="py-3 text-right text-muted-foreground">{fmt(a.final_total)}</td>
                          <td className="py-3 text-right font-semibold text-foreground">{fmt(a.comissao)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Contas a Receber */}
        {tab === "receber" && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-foreground">Contas a Receber</h3>
                <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 text-base px-4 py-1">
                  {fmt(totalReceber)}
                </Badge>
              </div>
              {contasReceber.length === 0 ? (
                <p className="text-muted-foreground text-center py-10">Nenhuma conta pendente. 🎉</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="text-left py-3 font-medium">Código</th>
                        <th className="text-left py-3 font-medium">Cliente</th>
                        <th className="text-left py-3 font-medium">Passeio</th>
                        <th className="text-left py-3 font-medium">Método</th>
                        <th className="text-left py-3 font-medium">Data</th>
                        <th className="text-right py-3 font-medium">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contasReceber.slice(0, 30).map((a) => (
                        <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                          <td className="py-3 font-mono text-sm text-foreground">{a.booking_code}</td>
                          <td className="py-3 text-foreground">{a.customers?.name || "—"}</td>
                          <td className="py-3 text-muted-foreground max-w-[200px] truncate">{a.item_name}</td>
                          <td className="py-3">
                            <Badge variant="outline">{a.pay_method === "pix" ? "PIX" : a.pay_method}</Badge>
                          </td>
                          <td className="py-3 text-muted-foreground">{fmtDate(a.created_at)}</td>
                          <td className="py-3 text-right font-semibold text-foreground">{fmt(a.final_total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* DRE */}
        {tab === "dre" && (
          <Card>
            <CardContent className="p-6">
              <h3 className="font-bold text-foreground mb-6">
                DRE — {MONTH_LABELS[currentMonth]} {currentYear}
              </h3>
              <div className="max-w-2xl space-y-1">
                {/* Receita Bruta */}
                <div className="flex justify-between py-3 border-b border-border">
                  <span className="font-semibold text-foreground">Receita Bruta ({monthBookings.length} reservas)</span>
                  <span className="font-bold text-foreground">{fmt(receitaBruta)}</span>
                </div>
                <div className="flex justify-between py-2 pl-4 text-sm">
                  <span className="text-destructive">(-) Descontos PIX concedidos</span>
                  <span className="text-destructive">- {fmt(descontosMes)}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-border bg-muted/50 px-3 rounded-lg">
                  <span className="font-semibold text-foreground">= Receita Líquida</span>
                  <span className="font-bold text-foreground">{fmt(receitaLiquida)}</span>
                </div>

                {/* Custos Operacionais */}
                <div className="pt-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider py-2">Custos Operacionais (est. 35%)</p>
                  <div className="flex justify-between py-2 pl-4 text-sm text-muted-foreground">
                    <span>(-) Combustível, seguros, guias, manutenção</span>
                    <span className="text-destructive">- {fmt(custosOp)}</span>
                  </div>
                </div>
                <div className="flex justify-between py-3 border-b border-border bg-muted/50 px-3 rounded-lg">
                  <span className="font-semibold text-foreground">= Lucro Bruto</span>
                  <span className="font-bold text-foreground">{fmt(lucroBruto)}</span>
                </div>

                {/* Despesas */}
                <div className="pt-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider py-2">Despesas Operacionais</p>
                  <div className="flex justify-between py-2 pl-4 text-sm text-muted-foreground">
                    <span>(-) Administrativo (est. 15%)</span>
                    <span className="text-destructive">- {fmt(despesasAdmin)}</span>
                  </div>
                  <div className="flex justify-between py-2 pl-4 text-sm text-muted-foreground">
                    <span>(-) Marketing (est. 10%)</span>
                    <span className="text-destructive">- {fmt(despesasMkt)}</span>
                  </div>
                  <div className="flex justify-between py-2 pl-4 text-sm text-muted-foreground">
                    <span>(-) Tecnologia (est. 5%)</span>
                    <span className="text-destructive">- {fmt(despesasTech)}</span>
                  </div>
                </div>

                {/* Lucro Operacional */}
                <div className={`flex justify-between py-4 border-t-2 px-3 rounded-lg mt-2 ${lucroOp >= 0 ? "border-primary bg-primary/5" : "border-destructive bg-destructive/5"}`}>
                  <span className="text-lg font-bold text-foreground">= Lucro Operacional</span>
                  <span className={`text-lg font-bold ${lucroOp >= 0 ? "text-primary" : "text-destructive"}`}>{fmt(lucroOp)}</span>
                </div>

                <div className="flex justify-between text-sm pt-2 px-3">
                  <span className="text-muted-foreground">Margem operacional:</span>
                  <span className="font-bold text-primary">
                    {receitaBruta > 0 ? Math.round((lucroOp / receitaBruta) * 100) : 0}%
                  </span>
                </div>

                <p className="text-xs text-muted-foreground mt-4 italic">
                  * Custos e despesas são estimativas. Para valores reais, configure as categorias de despesas no módulo financeiro.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminFinanceiro;
