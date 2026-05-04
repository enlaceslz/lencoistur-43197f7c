import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart as PieChartIcon, TrendingUp, Wallet, ArrowRight } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, PieChart, Pie, Cell, AreaChart, Area
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { motion } from "framer-motion";

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const fmt = (v: number) => formatCurrency(v);
const PIE_COLORS = [
  "hsl(var(--primary))", 
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#8b5cf6", // Violet
  "#ec4899"  // Pink
];

interface BookingRow {
  final_total: number;
  discount: number;
  status: string;
  payment_status: string;
  pay_method: string;
  created_at: string;
}

export default function FluxoCaixaTab({ 
  bookings, 
  contasPagar = [], 
  selectedMonth, 
  selectedYear 
}: { 
  bookings: BookingRow[], 
  contasPagar?: any[], 
  selectedMonth?: number, 
  selectedYear?: number 
}) {
  const currentYear = selectedYear ?? new Date().getFullYear();
  const currentMonth = selectedMonth ?? new Date().getMonth();
  const validBookings = useMemo(() => bookings.filter(b => b.status !== "cancelada"), [bookings]);

  const monthlyData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => ({ 
      month: MONTH_LABELS[i], 
      entradas: 0, 
      despesas: 0,
      descontos: 0, 
      receitaLiquida: 0 
    }));

    validBookings.forEach((b) => {
      const d = new Date(b.created_at);
      if (d.getFullYear() !== currentYear) return;
      const m = d.getMonth();
      if (b.payment_status === "pago") months[m].entradas += b.final_total;
      months[m].descontos += b.discount;
    });

    contasPagar.forEach((c) => {
      const d = new Date(c.vencimento + "T12:00:00");
      if (d.getFullYear() !== currentYear) return;
      const m = d.getMonth();
      if (c.status === "pago") months[m].despesas += c.valor;
    });

    months.forEach((m) => { 
      m.receitaLiquida = m.entradas - m.despesas; 
    });
    return months;
  }, [validBookings, contasPagar, currentYear]);

  const monthlyFiltered = useMemo(() => {
    const data = monthlyData.filter(m => m.entradas > 0 || m.descontos > 0 || m.despesas > 0);
    return data.length > 0 ? data : monthlyData.slice(0, currentMonth + 1);
  }, [monthlyData, currentMonth]);

  const monthBookings = useMemo(
    () => validBookings.filter((b) => { 
      const d = new Date(b.created_at); 
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear; 
    }),
    [validBookings, currentMonth, currentYear]
  );

  const revenueByMethod = useMemo(() => {
    const map: Record<string, number> = {};
    monthBookings.filter(b => b.payment_status === "pago").forEach(b => {
      const method = b.pay_method === "pix" ? "PIX" : b.pay_method === "cartao" ? "Cartão" : b.pay_method === "dinheiro" ? "Dinheiro" : b.pay_method;
      map[method] = (map[method] || 0) + b.final_total;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [monthBookings]);

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-2"
        >
          <div className="lg:col-span-2 glass-card rounded-[2.5rem] p-8 admin-card-hover overflow-hidden">
            <div className="flex flex-row items-center justify-between mb-8">
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-3">
                  <TrendingUp className="text-primary" size={24} strokeWidth={2.5} />
                  Desempenho Mensal
                </h3>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest ml-1">Receitas vs Despesas em {currentYear}</p>
              </div>
            </div>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={monthlyFiltered} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorEntradas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
                    </linearGradient>
                    <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border)/0.5)" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fontWeight: 500 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }} 
                    tickFormatter={(v) => `R$${(v / 100).toFixed(0)}`}
                    dx={-10}
                  />
                  <Tooltip 
                    cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [fmt(value), ""]} 
                  />
                  <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px' }} />
                  <Bar dataKey="entradas" name="Receitas" fill="url(#colorEntradas)" radius={[6, 6, 0, 0]} barSize={32} />
                  <Bar dataKey="despesas" name="Despesas" fill="url(#colorDespesas)" radius={[6, 6, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-none shadow-sm bg-card h-full">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <PieChartIcon className="text-primary" size={20} />
                Métodos de Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {revenueByMethod.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-2">
                  <Wallet className="text-muted-foreground/30" size={48} />
                  <p className="text-muted-foreground text-sm">Sem movimentações este mês</p>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="h-[220px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie 
                          data={revenueByMethod} 
                          cx="50%" 
                          cy="50%" 
                          innerRadius={65} 
                          outerRadius={90} 
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {revenueByMethod.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="none" />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => [fmt(value), ""]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Total</span>
                      <span className="text-xl font-bold">{fmt(revenueByMethod.reduce((acc, curr) => acc + curr.value, 0))}</span>
                    </div>
                  </div>
                  
                  <div className="grid gap-3">
                    {revenueByMethod.map((m, i) => (
                      <div key={m.name} className="group flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50">
                        <div className="flex items-center gap-3">
                          <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                          <span className="text-sm font-medium">{m.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold">{fmt(m.value)}</span>
                          <ArrowRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-none shadow-sm bg-card overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Projeção de Fluxo de Caixa</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={monthlyFiltered} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorLiquida" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border)/0.5)" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12 }} 
                  tickFormatter={(v) => `R$${(v / 100).toFixed(0)}`}
                />
                <Tooltip 
                   contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                   formatter={(value: number) => [fmt(value), ""]} 
                />
                <Area 
                  type="monotone" 
                  dataKey="receitaLiquida" 
                  name="Receita Líquida" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorLiquida)" 
                  dot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 2, stroke: "white" }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
