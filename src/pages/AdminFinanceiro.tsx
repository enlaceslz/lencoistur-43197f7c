import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import {
  DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  CreditCard, Wallet, Receipt, ChevronDown
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend
} from "recharts";

const cashFlowData = [
  { month: "Jan", entradas: 28500, saidas: 18200, lucro: 10300 },
  { month: "Fev", entradas: 35200, saidas: 21500, lucro: 13700 },
  { month: "Mar", entradas: 42800, saidas: 25100, lucro: 17700 },
  { month: "Abr", entradas: 38100, saidas: 22800, lucro: 15300 },
  { month: "Mai", entradas: 52300, saidas: 28900, lucro: 23400 },
  { month: "Jun", entradas: 61200, saidas: 33600, lucro: 27600 },
  { month: "Jul", entradas: 78400, saidas: 39200, lucro: 39200 },
];

const accountsPayable = [
  { id: "AP-001", vendor: "Guia José Silva", description: "Comissão - Lagoa Azul (Mar)", amount: 2400, due: "2026-04-05", status: "pendente" },
  { id: "AP-002", vendor: "Posto Shell", description: "Combustível - Frota 4x4", amount: 3800, due: "2026-04-01", status: "pendente" },
  { id: "AP-003", vendor: "Seguradora ABC", description: "Seguro turístico mensal", amount: 1200, due: "2026-04-10", status: "pendente" },
  { id: "AP-004", vendor: "Motorista Carlos", description: "Comissão translados (Mar)", amount: 1800, due: "2026-03-30", status: "atrasado" },
  { id: "AP-005", vendor: "Rio Preguiças Tour", description: "Comissão parceiro (Mar)", amount: 4200, due: "2026-04-15", status: "pendente" },
];

const accountsReceivable = [
  { id: "AR-001", client: "Agência Sol & Mar", description: "Pacote grupo - 12 pax", amount: 5400, due: "2026-04-02", status: "pendente" },
  { id: "AR-002", client: "Hotel Pousada Lençóis", description: "Comissão indicações (Mar)", amount: 1800, due: "2026-04-05", status: "pendente" },
  { id: "AR-003", client: "Maria Silva", description: "Reserva Santo Amaro x2", amount: 760, due: "2026-03-28", status: "atrasado" },
  { id: "AR-004", client: "Empresa XYZ Turismo", description: "Grupo corporativo 20 pax", amount: 8600, due: "2026-04-20", status: "pendente" },
];

const dreData = {
  receita_bruta: 78400,
  deducoes: 3920,
  receita_liquida: 74480,
  custos: [
    { label: "Comissão guias", value: 12500 },
    { label: "Combustível/transporte", value: 8200 },
    { label: "Seguro turístico", value: 2400 },
    { label: "Manutenção veículos", value: 3100 },
  ],
  despesas: [
    { label: "Marketing digital", value: 4500 },
    { label: "Aluguel escritório", value: 2800 },
    { label: "Salários equipe", value: 15000 },
    { label: "Tecnologia/software", value: 1200 },
  ],
};

const totalCustos = dreData.custos.reduce((s, c) => s + c.value, 0);
const totalDespesas = dreData.despesas.reduce((s, d) => s + d.value, 0);
const lucroOperacional = dreData.receita_liquida - totalCustos - totalDespesas;

const statusColors: Record<string, string> = {
  pendente: "bg-secondary/10 text-secondary",
  pago: "bg-primary/10 text-primary",
  atrasado: "bg-destructive/10 text-destructive",
  recebido: "bg-primary/10 text-primary",
};

type Tab = "fluxo" | "pagar" | "receber" | "dre";

const AdminFinanceiro = () => {
  const [tab, setTab] = useState<Tab>("fluxo");

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "fluxo", label: "Fluxo de Caixa", icon: TrendingUp },
    { key: "pagar", label: "Contas a Pagar", icon: CreditCard },
    { key: "receber", label: "Contas a Receber", icon: Wallet },
    { key: "dre", label: "DRE", icon: Receipt },
  ];

  const stats = [
    { label: "Receita (Mês)", value: "R$ 78.400", change: "+23%", up: true, icon: DollarSign },
    { label: "Despesas (Mês)", value: "R$ 39.200", change: "+12%", up: false, icon: TrendingDown },
    { label: "Lucro Líquido", value: `R$ ${lucroOperacional.toLocaleString("pt-BR")}`, change: "+35%", up: true, icon: TrendingUp },
    { label: "Margem", value: `${Math.round((lucroOperacional / dreData.receita_bruta) * 100)}%`, change: "+4%", up: true, icon: Receipt },
  ];

  const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR")}`;

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
                <span className={`flex items-center gap-1 text-xs font-semibold ${s.up ? "text-primary" : "text-destructive"}`}>
                  {s.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {s.change}
                </span>
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

        {/* Tab Content */}
        {tab === "fluxo" && (
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-display text-lg font-bold text-foreground mb-4">Fluxo de Caixa Mensal</h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={cashFlowData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(40, 15%, 88%)" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(220, 10%, 45%)" }} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(220, 10%, 45%)" }} tickFormatter={(v) => `R$${v / 1000}k`} />
                <Tooltip formatter={(value: number) => [fmt(value), ""]} />
                <Legend />
                <Bar dataKey="entradas" name="Entradas" fill="hsl(174, 62%, 38%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="saidas" name="Saídas" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-6">
              <h4 className="font-display font-bold text-foreground mb-3">Evolução do Lucro</h4>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={cashFlowData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(40, 15%, 88%)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(220, 10%, 45%)" }} />
                  <YAxis tick={{ fontSize: 12, fill: "hsl(220, 10%, 45%)" }} tickFormatter={(v) => `R$${v / 1000}k`} />
                  <Tooltip formatter={(value: number) => [fmt(value), ""]} />
                  <Line type="monotone" dataKey="lucro" name="Lucro" stroke="hsl(35, 80%, 55%)" strokeWidth={3} dot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === "pagar" && (
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-foreground">Contas a Pagar</h3>
              <p className="text-sm text-muted-foreground">
                Total pendente: <span className="font-bold text-destructive">{fmt(accountsPayable.reduce((s, a) => s + a.amount, 0))}</span>
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left py-3 font-medium">Fornecedor</th>
                    <th className="text-left py-3 font-medium">Descrição</th>
                    <th className="text-left py-3 font-medium">Vencimento</th>
                    <th className="text-right py-3 font-medium">Valor</th>
                    <th className="text-right py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {accountsPayable.map((a) => (
                    <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                      <td className="py-3 font-semibold text-foreground">{a.vendor}</td>
                      <td className="py-3 text-muted-foreground">{a.description}</td>
                      <td className="py-3 text-muted-foreground">{new Date(a.due).toLocaleDateString("pt-BR")}</td>
                      <td className="py-3 text-right font-semibold text-foreground">{fmt(a.amount)}</td>
                      <td className="py-3 text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${statusColors[a.status]}`}>{a.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "receber" && (
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-foreground">Contas a Receber</h3>
              <p className="text-sm text-muted-foreground">
                Total pendente: <span className="font-bold text-primary">{fmt(accountsReceivable.reduce((s, a) => s + a.amount, 0))}</span>
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left py-3 font-medium">Cliente</th>
                    <th className="text-left py-3 font-medium">Descrição</th>
                    <th className="text-left py-3 font-medium">Vencimento</th>
                    <th className="text-right py-3 font-medium">Valor</th>
                    <th className="text-right py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {accountsReceivable.map((a) => (
                    <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                      <td className="py-3 font-semibold text-foreground">{a.client}</td>
                      <td className="py-3 text-muted-foreground">{a.description}</td>
                      <td className="py-3 text-muted-foreground">{new Date(a.due).toLocaleDateString("pt-BR")}</td>
                      <td className="py-3 text-right font-semibold text-foreground">{fmt(a.amount)}</td>
                      <td className="py-3 text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${statusColors[a.status]}`}>{a.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "dre" && (
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-display text-lg font-bold text-foreground mb-6">DRE - Demonstração do Resultado (Julho 2026)</h3>
            <div className="max-w-2xl space-y-1">
              <div className="flex justify-between py-3 border-b border-border">
                <span className="font-semibold text-foreground">Receita Bruta</span>
                <span className="font-bold text-foreground">{fmt(dreData.receita_bruta)}</span>
              </div>
              <div className="flex justify-between py-2 pl-4 text-sm">
                <span className="text-destructive">(-) Deduções / Impostos</span>
                <span className="text-destructive">- {fmt(dreData.deducoes)}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-border bg-muted/50 px-3 rounded-lg">
                <span className="font-semibold text-foreground">= Receita Líquida</span>
                <span className="font-bold text-foreground">{fmt(dreData.receita_liquida)}</span>
              </div>

              <div className="pt-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider py-2">Custos Operacionais</p>
                {dreData.custos.map((c) => (
                  <div key={c.label} className="flex justify-between py-2 pl-4 text-sm">
                    <span className="text-muted-foreground">(-) {c.label}</span>
                    <span className="text-destructive">- {fmt(c.value)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between py-3 border-b border-border bg-muted/50 px-3 rounded-lg">
                <span className="font-semibold text-foreground">= Lucro Bruto</span>
                <span className="font-bold text-foreground">{fmt(dreData.receita_liquida - totalCustos)}</span>
              </div>

              <div className="pt-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider py-2">Despesas Operacionais</p>
                {dreData.despesas.map((d) => (
                  <div key={d.label} className="flex justify-between py-2 pl-4 text-sm">
                    <span className="text-muted-foreground">(-) {d.label}</span>
                    <span className="text-destructive">- {fmt(d.value)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between py-4 border-t-2 border-primary bg-ocean-light px-3 rounded-lg mt-2">
                <span className="font-display text-lg font-bold text-foreground">= Lucro Operacional</span>
                <span className="font-display text-lg font-bold text-primary">{fmt(lucroOperacional)}</span>
              </div>

              <div className="text-right pt-2">
                <span className="text-xs text-muted-foreground">Margem operacional: </span>
                <span className="text-sm font-bold text-primary">{Math.round((lucroOperacional / dreData.receita_bruta) * 100)}%</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminFinanceiro;
