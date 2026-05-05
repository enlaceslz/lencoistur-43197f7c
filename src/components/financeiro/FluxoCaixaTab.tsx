import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart as PieChartIcon, TrendingUp, Wallet, ArrowRight, Zap, Target, ArrowUpRight } from "lucide-react";
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
          <div className="glass-card rounded-[2.5rem] p-8 admin-card-hover overflow-hidden h-full border border-white/20">
            <div className="flex flex-row items-center justify-between mb-8">
              <div className="space-y-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Fluxo Operacional</p>
                </div>
                <h3 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-3">
                  <TrendingUp className="text-primary" size={24} strokeWidth={2.5} />
                  Performance Comparativa
                </h3>
              </div>
              <div className="flex gap-4">
                <div className="text-right">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Receita Total</p>
                  <p className="text-lg font-black text-foreground">{fmt(monthlyFiltered.reduce((acc, m) => acc + m.entradas, 0))}</p>
                </div>
              </div>
            </div>
            <div>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={monthlyFiltered} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorEntradas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    </linearGradient>
                    <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.3}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="hsl(var(--border)/0.3)" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 800, fill: "hsl(var(--muted-foreground))" }} 
                    dy={15}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 600 }} 
                    tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                    dx={-10}
                  />
                  <Tooltip 
                    cursor={{ fill: 'hsl(var(--muted)/0.2)', radius: 8 }}
                    contentStyle={{ 
                      borderRadius: '1.5rem', 
                      border: 'none', 
                      boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
                      padding: '16px',
                      backdropBlur: '10px',
                      backgroundColor: 'rgba(255,255,255,0.9)'
                    }}
                    formatter={(value: number) => [fmt(value), ""]} 
                  />
                  <Legend 
                    verticalAlign="top" 
                    align="right" 
                    iconType="circle" 
                    wrapperStyle={{ paddingBottom: '30px', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }} 
                  />
                  <Bar dataKey="entradas" name="Entradas" fill="url(#colorEntradas)" radius={[8, 8, 0, 0]} barSize={28} />
                  <Bar dataKey="despesas" name="Saídas" fill="url(#colorDespesas)" radius={[8, 8, 0, 0]} barSize={28} />
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
          <div className="glass-card rounded-[2.5rem] p-8 admin-card-hover h-full border border-white/20">
            <div className="space-y-1 mb-8">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">Mix de Conversão</p>
              </div>
              <h3 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-3">
                <PieChartIcon className="text-primary" size={24} strokeWidth={2.5} />
                Canais Pagos
              </h3>
            </div>
            
            {revenueByMethod.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-30">
                <Wallet size={48} />
                <p className="text-[10px] font-black uppercase tracking-widest">Aguardando dados...</p>
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
                        innerRadius={70} 
                        outerRadius={95} 
                        paddingAngle={8}
                        dataKey="value"
                        cornerRadius={10}
                      >
                        {revenueByMethod.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', fontSize: '12px' }}
                        formatter={(value: number) => [fmt(value), "Volume"]} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[9px] text-muted-foreground uppercase font-black tracking-[0.2em] mb-1">Vendas</span>
                    <span className="text-xl font-black text-foreground">{fmt(revenueByMethod.reduce((acc, curr) => acc + curr.value, 0))}</span>
                  </div>
                </div>
                
                <div className="grid gap-2">
                  {revenueByMethod.map((m, i) => (
                    <div key={m.name} className="group flex items-center justify-between p-3.5 rounded-2xl hover:bg-muted/40 transition-all border border-transparent hover:border-border/30">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full shadow-lg" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="text-xs font-black text-muted-foreground uppercase tracking-tight">{m.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-foreground">{fmt(m.value)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="glass-card rounded-[2.5rem] p-8 admin-card-hover overflow-hidden border border-white/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">Visão Prospectiva</p>
              </div>
              <h3 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-3">
                <Zap className="text-primary" size={24} strokeWidth={2.5} />
                Trajetória de Liquidez
              </h3>
            </div>
            <div className="flex gap-6">
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Melhor Mês</p>
                <div className="flex items-center gap-2">
                  <ArrowUpRight className="text-emerald-500" size={16} />
                  <span className="text-sm font-black text-foreground">
                    {monthlyFiltered.sort((a,b) => b.receitaLiquida - a.receitaLiquida)[0]?.month || '-'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyFiltered} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorLiquida" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="hsl(var(--border)/0.2)" />
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: '900', fill: "hsl(var(--muted-foreground))" }}
                dy={15}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: '700' }} 
                tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                 contentStyle={{ 
                  borderRadius: '1.5rem', 
                  border: 'none', 
                  boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
                  backdropBlur: '10px',
                  backgroundColor: 'rgba(255,255,255,0.9)'
                }}
                 formatter={(value: number) => [fmt(value), "Resultado Líquido"]} 
              />
              <Area 
                type="monotone" 
                dataKey="receitaLiquida" 
                name="Resultado" 
                stroke="hsl(var(--primary))" 
                strokeWidth={5} 
                fillOpacity={1} 
                fill="url(#colorLiquida)" 
                dot={{ r: 6, fill: "white", strokeWidth: 3, stroke: "hsl(var(--primary))" }}
                activeDot={{ r: 8, strokeWidth: 0, fill: "hsl(var(--primary))" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}
