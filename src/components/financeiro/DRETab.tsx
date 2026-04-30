import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { motion } from "framer-motion";
import { 
  TrendingUp, TrendingDown, DollarSign, PieChart, 
  ArrowUpRight, ArrowDownRight, Info, Target, LayoutDashboard
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

const MONTH_LABELS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const fmt = (v: number) => formatCurrency(v);

interface BookingRow {
  total: number;
  discount: number;
  status: string;
  created_at: string;
}

export default function DRETab({ 
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

  const monthBookings = useMemo(
    () => bookings.filter(b => b.status !== "cancelada").filter((b) => {
      const d = new Date(b.created_at);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }),
    [bookings, currentMonth, currentYear]
  );

  const monthContasPagar = useMemo(
    () => contasPagar.filter(c => {
      const d = new Date(c.vencimento + "T12:00:00");
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }),
    [contasPagar, currentMonth, currentYear]
  );

  const receitaBruta = monthBookings.reduce((s, b) => s + b.total, 0);
  const descontosMes = monthBookings.reduce((s, b) => s + b.discount, 0);
  const receitaLiquida = receitaBruta - descontosMes;
  
  const custosOp = monthContasPagar.filter(c => c.categoria === "operacional" || c.categoria === "combustivel" || c.categoria === "manutencao").reduce((s, c) => s + c.valor, 0);
  const despesasAdmin = monthContasPagar.filter(c => c.categoria === "administrativo" || c.categoria === "pessoal").reduce((s, c) => s + c.valor, 0);
  const despesasMkt = monthContasPagar.filter(c => c.categoria === "marketing").reduce((s, c) => s + c.valor, 0);
  const despesasTech = monthContasPagar.filter(c => c.categoria === "tecnologia").reduce((s, c) => s + c.valor, 0);
  const outrasDespesas = monthContasPagar.filter(c => c.categoria === "outros").reduce((s, c) => s + c.valor, 0);

  const totalDespesasOp = despesasAdmin + despesasMkt + despesasTech + outrasDespesas;
  const lucroBruto = receitaLiquida - custosOp;
  const lucroOp = lucroBruto - totalDespesasOp;
  const margemOp = receitaBruta > 0 ? (lucroOp / receitaBruta) * 100 : 0;

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="lg:col-span-2"
      >
        <Card className="border-none shadow-sm bg-card overflow-hidden">
          <CardHeader className="bg-muted/30 pb-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <LayoutDashboard className="text-primary" size={20} />
                  Demonstrativo de Resultado (DRE)
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Análise detalhada de lucratividade — {MONTH_LABELS[currentMonth]} {currentYear}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Margem Operacional</p>
                <p className={`text-2xl font-black ${margemOp >= 20 ? "text-emerald-500" : margemOp > 0 ? "text-amber-500" : "text-rose-500"}`}>
                  {margemOp.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {/* Receitas */}
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20">
                      <TrendingUp size={18} />
                    </div>
                    <span className="font-bold text-foreground">Receita Bruta ({monthBookings.length} reservas)</span>
                  </div>
                  <span className="text-lg font-black text-foreground">{fmt(receitaBruta)}</span>
                </div>
                <div className="flex justify-between items-center pl-11 text-sm text-muted-foreground italic">
                  <span>(-) Descontos e Abatimentos</span>
                  <span className="text-rose-500 font-semibold">- {fmt(descontosMes)}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-primary/5 border border-primary/10">
                  <span className="font-bold text-primary flex items-center gap-2">
                    <DollarSign size={16} />
                    RECEITA LÍQUIDA
                  </span>
                  <span className="text-xl font-black text-primary">{fmt(receitaLiquida)}</span>
                </div>
              </div>

              {/* Custos Operacionais */}
              <div className="p-6 space-y-4 bg-muted/10">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Target size={14} /> Custos das Atividades
                </h4>
                <div className="flex justify-between items-center pl-1 text-sm">
                  <span className="text-muted-foreground">(-) Custos Operacionais (Combustível, Manutenção, Guias)</span>
                  <span className="text-rose-500 font-bold">- {fmt(custosOp)}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-muted border border-border">
                  <span className="font-bold text-foreground uppercase tracking-tight text-xs">LUCRO BRUTO</span>
                  <span className="text-lg font-black text-foreground">{fmt(lucroBruto)}</span>
                </div>
              </div>

              {/* Despesas Administrativas */}
              <div className="p-6 space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <PieChart size={14} /> Despesas Fixas e Variáveis
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Administrativo e Pessoal
                    </span>
                    <span className="font-semibold text-rose-500">- {fmt(despesasAdmin)}</span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      Marketing e Vendas
                    </span>
                    <span className="font-semibold text-rose-500">- {fmt(despesasMkt)}</span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                      Tecnologia e Software
                    </span>
                    <span className="font-semibold text-rose-500">- {fmt(despesasTech)}</span>
                  </div>
                </div>
              </div>

              {/* Resultado Final */}
              <div className={`p-6 bg-gradient-to-r ${lucroOp >= 0 ? "from-emerald-500/10 to-primary/10" : "from-rose-500/10 to-amber-500/10"}`}>
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Resultado Líquido</span>
                    <h3 className={`text-3xl font-black ${lucroOp >= 0 ? "text-primary" : "text-rose-600"}`}>
                      {fmt(lucroOp)}
                    </h3>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/50 dark:bg-black/20 backdrop-blur shadow-sm border border-white/50">
                    {lucroOp >= 0 ? (
                      <div className="flex flex-col items-center gap-1">
                        <ArrowUpRight className="text-emerald-500" size={24} />
                        <span className="text-[10px] font-bold text-emerald-600 uppercase">Superavit</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <ArrowDownRight className="text-rose-500" size={24} />
                        <span className="text-[10px] font-bold text-rose-600 uppercase">Deficit</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <p className="mt-4 text-[11px] text-muted-foreground flex items-center gap-2 italic">
          <Info size={14} className="text-primary" />
          Os valores de custos e despesas são baseados nos registros reais da aba "Contas a Pagar".
        </p>
      </motion.div>

      <div className="space-y-6">
        <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ delay: 0.1 }}
        >
          <Card className="border-none shadow-sm bg-card h-full">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Saúde Financeira</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase">
                  <span>Margem Operacional</span>
                  <span className="text-primary">{margemOp.toFixed(0)}%</span>
                </div>
                <Progress value={Math.max(0, margemOp)} className="h-2 rounded-full" />
                <p className="text-[10px] text-muted-foreground">O ideal para o setor de turismo é manter acima de 15%.</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase">
                  <span>Peso das Despesas Fixas</span>
                  <span className="text-rose-500">{receitaBruta > 0 ? ((totalDespesasOp / receitaBruta) * 100).toFixed(0) : 0}%</span>
                </div>
                <Progress value={receitaBruta > 0 ? (totalDespesasOp / receitaBruta) * 100 : 0} className="h-2 rounded-full bg-muted shadow-inner" />
              </div>

              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-3">
                <h5 className="text-xs font-black uppercase text-primary">Insight do Mês</h5>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {lucroOp > 0 
                    ? `Parabéns! Sua operação está saudável com um lucro de ${fmt(lucroOp)}. Continue otimizando os custos operacionais para aumentar sua margem.`
                    : "Atenção! As despesas superaram as receitas este mês. Revise seus custos fixos e tente aumentar o ticket médio das reservas."}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
