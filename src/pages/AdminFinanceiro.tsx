import { useState, useEffect, useMemo } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  DollarSign, TrendingUp, TrendingDown, CreditCard, Wallet, Receipt,
  Loader2, Download, FileText
} from "lucide-react";
import FinanceiroStats from "@/components/financeiro/FinanceiroStats";
import FluxoCaixaTab from "@/components/financeiro/FluxoCaixaTab";
import ContasPagarTab from "@/components/financeiro/ContasPagarTab";
import ContasReceberTab from "@/components/financeiro/ContasReceberTab";
import DRETab from "@/components/financeiro/DRETab";
import NotasFiscaisTab from "@/components/financeiro/NotasFiscaisTab";

type Tab = "fluxo" | "pagar" | "receber" | "dre" | "notas";

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

const fmt = (v: number) => `R$ ${(v / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
const fmtDate = (d: string) => {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("pt-BR"); } catch { return d; }
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

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const validBookings = useMemo(() => bookings.filter(b => b.status !== "cancelada"), [bookings]);

  const monthBookings = useMemo(
    () => validBookings.filter((b) => {
      const d = new Date(b.created_at);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }),
    [validBookings, currentMonth, currentYear]
  );

  const receitaPaga = monthBookings.filter(b => b.payment_status === "pago").reduce((s, b) => s + b.final_total, 0);
  const descontosMes = monthBookings.reduce((s, b) => s + b.discount, 0);
  const receitaBruta = monthBookings.reduce((s, b) => s + b.total, 0);
  const pagos = monthBookings.filter(b => b.payment_status === "pago");
  const ticketMedio = pagos.length > 0 ? Math.round(receitaPaga / pagos.length) : 0;
  const contasReceberBookings = validBookings.filter(b => b.payment_status === "pendente");
  const totalReceber = contasReceberBookings.reduce((s, b) => s + b.final_total, 0);

  const stats = [
    { label: "Receita Paga (Mês)", value: fmt(receitaPaga), change: `${pagos.length} res.`, up: true, icon: DollarSign },
    { label: "A Receber (Reservas)", value: fmt(totalReceber), change: `${contasReceberBookings.length} pend.`, up: false, icon: Wallet },
    { label: "Ticket Médio", value: fmt(ticketMedio), change: "", up: true, icon: TrendingUp },
    { label: "Descontos (Mês)", value: fmt(descontosMes), change: receitaBruta > 0 ? `${Math.round(descontosMes / receitaBruta * 100)}%` : "", up: false, icon: TrendingDown },
  ];

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "fluxo", label: "Fluxo de Caixa", icon: TrendingUp },
    { key: "pagar", label: "Contas a Pagar", icon: CreditCard },
    { key: "receber", label: "Contas a Receber", icon: Wallet },
    { key: "dre", label: "DRE", icon: Receipt },
    { key: "notas", label: "Notas e Recibos", icon: FileText },
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
        <FinanceiroStats stats={stats} />

        <div className="flex items-center gap-2 overflow-x-auto">
          {tabs.map((t) => (
            <Button key={t.key} variant={tab === t.key ? "default" : "outline"} size="sm" onClick={() => setTab(t.key)} className="shrink-0">
              <t.icon size={16} className="mr-1" />{t.label}
            </Button>
          ))}
          <div className="ml-auto">
            <Button variant="outline" size="sm" onClick={exportCSV}><Download size={14} className="mr-1" /> CSV</Button>
          </div>
        </div>

        {tab === "fluxo" && <FluxoCaixaTab bookings={bookings} />}
        {tab === "pagar" && <ContasPagarTab />}
        {tab === "receber" && <ContasReceberTab />}
        {tab === "dre" && <DRETab bookings={bookings} />}
      </div>
    </AdminLayout>
  );
};

export default AdminFinanceiro;
