import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const fmt = (v: number) => `R$ ${(v / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

interface BookingRow {
  total: number;
  discount: number;
  status: string;
  created_at: string;
}

export default function DRETab({ bookings }: { bookings: BookingRow[] }) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const monthBookings = useMemo(
    () => bookings.filter(b => b.status !== "cancelada").filter((b) => {
      const d = new Date(b.created_at);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }),
    [bookings, currentMonth, currentYear]
  );

  const receitaBruta = monthBookings.reduce((s, b) => s + b.total, 0);
  const descontosMes = monthBookings.reduce((s, b) => s + b.discount, 0);
  const receitaLiquida = receitaBruta - descontosMes;
  const custosOp = Math.round(receitaLiquida * 0.35);
  const lucroBruto = receitaLiquida - custosOp;
  const despesasAdmin = Math.round(receitaLiquida * 0.15);
  const despesasMkt = Math.round(receitaLiquida * 0.10);
  const despesasTech = Math.round(receitaLiquida * 0.05);
  const lucroOp = lucroBruto - (despesasAdmin + despesasMkt + despesasTech);

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="font-bold text-foreground mb-6">DRE — {MONTH_LABELS[currentMonth]} {currentYear}</h3>
        <div className="max-w-2xl space-y-1">
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
          <div className="pt-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider py-2">Despesas Operacionais</p>
            <div className="flex justify-between py-2 pl-4 text-sm text-muted-foreground">
              <span>(-) Administrativo (est. 15%)</span><span className="text-destructive">- {fmt(despesasAdmin)}</span>
            </div>
            <div className="flex justify-between py-2 pl-4 text-sm text-muted-foreground">
              <span>(-) Marketing (est. 10%)</span><span className="text-destructive">- {fmt(despesasMkt)}</span>
            </div>
            <div className="flex justify-between py-2 pl-4 text-sm text-muted-foreground">
              <span>(-) Tecnologia (est. 5%)</span><span className="text-destructive">- {fmt(despesasTech)}</span>
            </div>
          </div>
          <div className={`flex justify-between py-4 border-t-2 px-3 rounded-lg mt-2 ${lucroOp >= 0 ? "border-primary bg-primary/5" : "border-destructive bg-destructive/5"}`}>
            <span className="text-lg font-bold text-foreground">= Lucro Operacional</span>
            <span className={`text-lg font-bold ${lucroOp >= 0 ? "text-primary" : "text-destructive"}`}>{fmt(lucroOp)}</span>
          </div>
          <div className="flex justify-between text-sm pt-2 px-3">
            <span className="text-muted-foreground">Margem operacional:</span>
            <span className="font-bold text-primary">{receitaBruta > 0 ? Math.round((lucroOp / receitaBruta) * 100) : 0}%</span>
          </div>
          <p className="text-xs text-muted-foreground mt-4 italic">* Custos e despesas são estimativas. Para valores reais, cadastre nas abas Contas a Pagar/Receber.</p>
        </div>
      </CardContent>
    </Card>
  );
}
