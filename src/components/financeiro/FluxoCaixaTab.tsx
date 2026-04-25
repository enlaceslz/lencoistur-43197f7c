import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PieChart as PieChartIcon } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, PieChart, Pie, Cell,
} from "recharts";

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const fmt = (v: number) => `R$ ${(v / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--destructive))", "#f59e0b", "#8b5cf6", "#06b6d4"];

interface BookingRow {
  final_total: number;
  discount: number;
  status: string;
  payment_status: string;
  pay_method: string;
  created_at: string;
}

export default function FluxoCaixaTab({ bookings, contasPagar = [] }: { bookings: BookingRow[], contasPagar?: any[] }) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
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

  const monthlyFiltered = useMemo(() => monthlyData.filter(m => m.entradas > 0 || m.descontos > 0 || m.despesas > 0), [monthlyData]);

  const monthBookings = useMemo(
    () => validBookings.filter((b) => { const d = new Date(b.created_at); return d.getMonth() === currentMonth && d.getFullYear() === currentYear; }),
    [validBookings, currentMonth, currentYear]
  );

  const revenueByMethod = useMemo(() => {
    const map: Record<string, number> = {};
    monthBookings.filter(b => b.payment_status === "pago").forEach(b => {
      const method = b.pay_method === "pix" ? "PIX" : b.pay_method === "cartao" ? "Cartão" : b.pay_method === "dinheiro" ? "Dinheiro" : b.pay_method;
      map[method] = (map[method] || 0) + b.final_total;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [monthBookings]);

  return (
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
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2"><PieChartIcon size={16} /> Receita por Método</h3>
          {revenueByMethod.length === 0 ? (
            <p className="text-muted-foreground text-center py-10 text-sm">Sem dados este mês.</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={revenueByMethod} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {revenueByMethod.map((_, i) => (<Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [fmt(value), ""]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-4">
                {revenueByMethod.map((m, i) => (
                  <div key={m.name} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />{m.name}</span>
                    <span className="font-medium text-foreground">{fmt(m.value)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

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
  );
}
