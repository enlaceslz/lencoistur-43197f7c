import { useMemo } from "react";
import { PieChart as PieChartIcon, TrendingUp, Wallet, Zap, ArrowUpRight, DollarSign, ArrowDownRight } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, PieChart, Pie, Cell, AreaChart, Area
} from "recharts";
import { formatCurrency } from "@/lib/utils";

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
    <div className="space-y-8">
      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {[
          { label: "Receita (Mês)", value: monthlyData[currentMonth].entradas, icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-50" },
          { label: "Saídas (Mês)", value: monthlyData[currentMonth].despesas, icon: ArrowDownRight, color: "text-rose-500", bg: "bg-rose-50" },
          { label: "Resultado Líquido", value: monthlyData[currentMonth].receitaLiquida, icon: Wallet, color: "text-blue-500", bg: "bg-blue-50" },
          { label: "Descontos", value: monthlyData[currentMonth].descontos, icon: Zap, color: "text-amber-500", bg: "bg-amber-50" },
        ].map((item, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${item.bg} ${item.color}`}>
                <item.icon size={20} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{item.label}</span>
            </div>
            <p className="text-2xl font-black text-slate-900">{fmt(item.value)}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg p-8 border border-slate-200 overflow-hidden h-full">
            <div className="flex flex-row items-center justify-between mb-8">
              <div className="space-y-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <p className="text-[10px] font-bold text-primary uppercase tracking-wider">Fluxo Operacional</p>
                </div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                  <TrendingUp className="text-primary" size={20} />
                  Performance Comparativa
                </h3>
              </div>
              <div className="flex gap-4">
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Receita Total</p>
                  <p className="text-lg font-bold text-slate-900">{fmt(monthlyFiltered.reduce((acc, m) => acc + m.entradas, 0))}</p>
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
                    cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                    contentStyle={{ 
                      borderRadius: '4px', 
                      border: '1px solid #e2e8f0', 
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                      padding: '12px',
                      backgroundColor: '#ffffff'
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
        </div>

        <div>
          <div className="bg-white rounded-lg p-8 border border-slate-200 h-full">
            <div className="space-y-1 mb-8">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Mix de Conversão</p>
              </div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                <PieChartIcon className="text-primary" size={20} />
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
                        contentStyle={{ borderRadius: '4px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '12px', backgroundColor: '#ffffff' }}
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
                    <div key={m.name} className="group flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
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
        </div>
      </div>

      <div>
        <div className="bg-white rounded-lg p-8 border border-slate-200 overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Visão Prospectiva</p>
              </div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                <Zap className="text-primary" size={20} />
                Trajetória de Liquidez
              </h3>
            </div>
            <div className="flex gap-6">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Melhor Mês</p>
                <div className="flex items-center gap-2">
                  <ArrowUpRight className="text-emerald-500" size={14} />
                  <span className="text-xs font-bold text-slate-900">
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
                  borderRadius: '4px', 
                  border: '1px solid #e2e8f0', 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  backgroundColor: '#ffffff',
                  padding: '12px'
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
      </div>
    </div>
  );
}
