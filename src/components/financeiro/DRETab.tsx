import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { motion } from "framer-motion";
import { 
  TrendingUp, TrendingDown, DollarSign, PieChart, 
  ArrowUpRight, ArrowDownRight, Info, Target, LayoutDashboard, Printer, ShieldCheck, Zap
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

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
  contasReceber = [],
  selectedMonth,
  selectedYear,
  company
}: { 
  bookings: BookingRow[], 
  contasPagar?: any[],
  contasReceber?: any[],
  selectedMonth?: number, 
  selectedYear?: number,
  company?: any
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

  const monthContasReceber = useMemo(
    () => contasReceber.filter(c => {
      const d = new Date(c.vencimento + "T12:00:00");
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }),
    [contasReceber, currentMonth, currentYear]
  );

  const receitaBruta = monthBookings.reduce((s, b) => s + b.total, 0);
  const descontosMes = monthBookings.reduce((s, b) => s + b.discount, 0);
  const outrasReceitas = monthContasReceber.filter(c => !c.booking_id && c.status === "recebido").reduce((s, c) => s + c.valor, 0);
  const receitaLiquida = (receitaBruta - descontosMes) + outrasReceitas;
  
  const custosOp = monthContasPagar.filter(c => ["operacional", "combustivel", "manutencao"].includes(c.categoria)).reduce((s, c) => s + c.valor, 0);
  const despesasAdmin = monthContasPagar.filter(c => ["administrativo", "pessoal"].includes(c.categoria)).reduce((s, c) => s + c.valor, 0);
  const despesasMkt = monthContasPagar.filter(c => c.categoria === "marketing").reduce((s, c) => s + c.valor, 0);
  const despesasTech = monthContasPagar.filter(c => c.categoria === "tecnologia").reduce((s, c) => s + c.valor, 0);
  const outrasDespesas = monthContasPagar.filter(c => c.categoria === "outros").reduce((s, c) => s + c.valor, 0);

  const totalDespesasOp = despesasAdmin + despesasMkt + despesasTech + outrasDespesas;
  const lucroBruto = receitaLiquida - custosOp;
  const lucroOp = lucroBruto - totalDespesasOp;
  const margemOp = receitaBruta > 0 ? (lucroOp / receitaBruta) * 100 : 0;

  const exportDRE = async () => {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");
    const doc = new jsPDF();
    const monthName = MONTH_LABELS[currentMonth];
    
    doc.setFillColor(15, 23, 42); 
    doc.rect(0, 0, 210, 45, "F");

    if (company?.logo_url) {
      try {
        const img = new Image();
        img.src = company.logo_url;
        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
        doc.addImage(img, 'PNG', 15, 10, 25, 25);
      } catch (e) {}
    }

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text(company?.nome_fantasia?.toUpperCase() || "DEMONSTRATIVO FINANCEIRO", 45, 22);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Análise de Performance Operacional | ${monthName} de ${currentYear}`, 45, 30);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("DEMONSTRATIVO DE RESULTADO DO EXERCÍCIO (DRE)", 14, 60);

    autoTable(doc, {
      startY: 70,
      head: [["Descrição", "Valor Atual (R$)", "% S/ Receita"]],
      body: [
        ["(+) RECEITA BRUTA OPERACIONAL", fmt(receitaBruta), "100.0%"],
        ["(-) Descontos e Abatimentos", `(${fmt(descontosMes)})`, `${receitaBruta > 0 ? ((descontosMes/receitaBruta)*100).toFixed(1) : 0}%`],
        ["(=) RECEITA LÍQUIDA", fmt(receitaLiquida), `${receitaBruta > 0 ? ((receitaLiquida/receitaBruta)*100).toFixed(1) : 0}%`],
        ["(-) Custos Operacionais (Diretos)", `(${fmt(custosOp)})`, `${receitaBruta > 0 ? ((custosOp/receitaBruta)*100).toFixed(1) : 0}%`],
        ["(=) LUCRO BRUTO (Margem de Contribuição)", fmt(lucroBruto), `${receitaBruta > 0 ? ((lucroBruto/receitaBruta)*100).toFixed(1) : 0}%`],
        ["(-) Despesas Administrativas", `(${fmt(despesasAdmin)})`, `${receitaBruta > 0 ? ((despesasAdmin/receitaBruta)*100).toFixed(1) : 0}%`],
        ["(-) Despesas de Marketing", `(${fmt(despesasMkt)})`, `${receitaBruta > 0 ? ((despesasMkt/receitaBruta)*100).toFixed(1) : 0}%`],
        ["(-) Tecnologia e Inovação", `(${fmt(despesasTech)})`, `${receitaBruta > 0 ? ((despesasTech/receitaBruta)*100).toFixed(1) : 0}%`],
        ["(-) Outras Despesas", `(${fmt(outrasDespesas)})`, `${receitaBruta > 0 ? ((outrasDespesas/receitaBruta)*100).toFixed(1) : 0}%`],
        ["(=) RESULTADO OPERACIONAL LÍQUIDO", fmt(lucroOp), `${margemOp.toFixed(1)}%`],
      ],
      theme: "grid",
      headStyles: { fillColor: [15, 23, 42], fontSize: 11, cellPadding: 6 },
      styles: { fontSize: 10, cellPadding: 5 },
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'center' } },
      didParseCell: (data) => {
        if ([2, 4, 9].includes(data.row.index)) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [241, 245, 249];
        }
      }
    });

    doc.save(`DRE_Estrategico_${monthName}_${currentYear}.pdf`);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 glass-card p-8 rounded-[2.5rem] border border-white/20">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Visão Estratégica</p>
          </div>
          <h2 className="text-3xl font-black text-foreground tracking-tight">Análise de Lucratividade</h2>
          <p className="text-sm text-muted-foreground">Comparativo detalhado entre receitas e custos operacionais.</p>
        </div>
        <Button onClick={exportDRE} variant="default" className="rounded-2xl gap-3 h-14 px-8 shadow-xl shadow-primary/20 font-black uppercase text-xs tracking-widest transition-all hover:scale-105 active:scale-95">
          <Printer size={18} /> Exportar DRE Premium
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2"
        >
          <Card className="border-none shadow-2xl bg-card overflow-hidden rounded-[2.5rem]">
            <CardHeader className="bg-muted/30 p-8 border-b border-border/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    <LayoutDashboard size={24} strokeWidth={2.5} />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-black tracking-tight">Demonstrativo Detalhado</CardTitle>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Competência: {MONTH_LABELS[currentMonth]} {currentYear}</p>
                  </div>
                </div>
                <div className="text-right p-4 rounded-2xl bg-white/40 dark:bg-black/20 border border-white/50 backdrop-blur-sm">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Margem Líquida</p>
                  <p className={`text-3xl font-black tracking-tighter ${margemOp >= 20 ? "text-emerald-500" : margemOp > 0 ? "text-amber-500" : "text-rose-500"}`}>
                    {margemOp.toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/30">
              {/* Receitas Section */}
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-center group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:rotate-12 transition-transform">
                      <TrendingUp size={20} />
                    </div>
                    <div>
                      <span className="font-black text-foreground text-sm uppercase tracking-tight">Receita Bruta Operacional</span>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">{monthBookings.length} Vendas Registradas</p>
                    </div>
                  </div>
                  <span className="text-2xl font-black text-foreground tracking-tighter">{fmt(receitaBruta)}</span>
                </div>
                <div className="flex justify-between items-center pl-14 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  <span>(-) Abatimentos e Cancelamentos</span>
                  <span className="text-rose-500">-{fmt(descontosMes)}</span>
                </div>
                <div className="flex justify-between items-center p-5 rounded-2xl bg-primary/5 border border-primary/20 shadow-inner">
                  <span className="font-black text-primary flex items-center gap-3 text-xs uppercase tracking-[0.15em]">
                    <ShieldCheck size={18} />
                    Receita Operacional Líquida
                  </span>
                  <span className="text-2xl font-black text-primary tracking-tighter">{fmt(receitaLiquida)}</span>
                </div>
              </div>

              {/* Custos Operacionais Section */}
              <div className="p-8 space-y-5 bg-muted/10">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-3 mb-2">
                  <Target size={14} className="text-rose-500" /> Custos de Venda (CPV)
                </h4>
                <div className="flex justify-between items-center pl-2 text-xs font-bold">
                  <span className="text-muted-foreground uppercase tracking-tight">(-) Custos Operacionais Diretos</span>
                  <span className="text-rose-500">-{fmt(custosOp)}</span>
                </div>
                <div className="flex justify-between items-center p-4 rounded-2xl bg-muted/50 border border-border/40">
                  <span className="font-black text-foreground uppercase tracking-widest text-[10px]">Resultado Bruto</span>
                  <span className="text-xl font-black text-foreground tracking-tight">{fmt(lucroBruto)}</span>
                </div>
              </div>

              {/* Despesas Administrativas Section */}
              <div className="p-8 space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-3 mb-2">
                  <PieChart size={14} className="text-amber-500" /> Despesas de Suporte
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: "Admin & Pessoal", val: despesasAdmin, color: "bg-amber-500" },
                    { label: "Marketing", val: despesasMkt, color: "bg-blue-500" },
                    { label: "Tecnologia", val: despesasTech, color: "bg-purple-500" },
                    { label: "Outros", val: outrasDespesas, color: "bg-slate-400" }
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between items-center p-3 rounded-xl hover:bg-muted/40 transition-colors border border-transparent hover:border-border/30">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${item.color} shadow-sm`} />
                        <span className="text-[11px] font-black text-muted-foreground uppercase tracking-tight">{item.label}</span>
                      </div>
                      <span className="text-xs font-black text-rose-500">-{fmt(item.val)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resultado Final Section */}
              <div className={`p-10 bg-gradient-to-br ${lucroOp >= 0 ? "from-emerald-500/10 to-primary/10" : "from-rose-500/10 to-amber-500/10"} relative overflow-hidden`}>
                <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none -mb-10 -mr-10">
                  <Zap size={200} />
                </div>
                <div className="flex justify-between items-end relative z-10">
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Resultado Líquido Final</span>
                    <h3 className={`text-4xl font-black tracking-tighter ${lucroOp >= 0 ? "text-primary" : "text-rose-600"}`}>
                      {fmt(lucroOp)}
                    </h3>
                  </div>
                  <div className="p-6 rounded-[2rem] bg-white/60 dark:bg-black/30 backdrop-blur-md shadow-xl border border-white/50 flex flex-col items-center gap-2">
                    {lucroOp >= 0 ? (
                      <>
                        <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center">
                          <ArrowUpRight size={28} strokeWidth={2.5} />
                        </div>
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Superavit</span>
                      </>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-600 flex items-center justify-center">
                          <ArrowDownRight size={28} strokeWidth={2.5} />
                        </div>
                        <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Deficit</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="space-y-8">
        <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ delay: 0.1 }}
        >
          <Card className="border-none shadow-2xl bg-card h-full rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-8 bg-muted/20">
              <CardTitle className="text-xl font-black tracking-tight">Saúde e KPIs</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                  <span className="text-muted-foreground">Margem Operacional</span>
                  <span className="text-primary">{margemOp.toFixed(1)}%</span>
                </div>
                <Progress value={Math.max(0, margemOp)} className="h-2.5 rounded-full bg-muted shadow-inner" />
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold italic">
                  <Info size={12} className="text-primary" />
                  <span>Meta do setor: &gt; 18%</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                  <span className="text-muted-foreground">Peso das Despesas Fixas</span>
                  <span className="text-rose-500">{receitaBruta > 0 ? ((totalDespesasOp / receitaBruta) * 100).toFixed(1) : 0}%</span>
                </div>
                <Progress value={receitaBruta > 0 ? (totalDespesasOp / receitaBruta) * 100 : 0} className="h-2.5 rounded-full bg-muted shadow-inner" />
              </div>

              <div className="p-6 rounded-[2rem] bg-primary/5 border border-primary/10 space-y-4 relative group overflow-hidden">
                <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
                  <Zap size={40} className="text-primary" />
                </div>
                <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Insight Estratégico</h5>
                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                  {lucroOp > 0 
                    ? `Operação altamente rentável! Com um lucro de ${fmt(lucroOp)}, sugerimos reinvestir 10% em marketing para escalar o volume de vendas.`
                    : "Ponto de atenção crítico! As despesas superaram a receita líquida. Recomendamos reduzir custos fixos administrativos imediatamente."}
                </p>
              </div>

              <Button variant="outline" className="w-full rounded-2xl h-12 border-primary/20 text-primary font-black uppercase text-[10px] tracking-widest hover:bg-primary hover:text-white transition-all">
                Simular Próximo Mês
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  </div>
  );
}
