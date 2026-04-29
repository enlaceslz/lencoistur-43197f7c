import { useState, useEffect, useMemo } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  DollarSign, TrendingUp, TrendingDown, CreditCard, Wallet, Receipt,
  Loader2, Download, FileText, Printer
} from "lucide-react";
import FinanceiroStats from "@/components/financeiro/FinanceiroStats";
import FluxoCaixaTab from "@/components/financeiro/FluxoCaixaTab";
import ContasPagarTab from "@/components/financeiro/ContasPagarTab";
import ContasReceberTab from "@/components/financeiro/ContasReceberTab";
import DRETab from "@/components/financeiro/DRETab";
import NotasFiscaisTab from "@/components/financeiro/NotasFiscaisTab";
import { formatCurrency } from "@/lib/utils";

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
  customers: { name: string; email: string; phone?: string } | null;
  invoice_number?: string | null;
  invoice_issued?: boolean;
  receipt_issued?: boolean;
  invoice_url?: string | null;
  voucher_url?: string | null;
}

const fmt = (v: number) => formatCurrency(v / 100);
const fmtDate = (d: string) => {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("pt-BR"); } catch { return d; }
};

const AdminFinanceiro = () => {

  const [tab, setTab] = useState<Tab>("fluxo");
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [contasPagar, setContasPagar] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [{ data: bkData }, { data: cpData }] = await Promise.all([
        supabase.from("bookings").select("*, customers(name, email, phone)").order("created_at", { ascending: false }),
        supabase.from("contas_pagar").select("*")
      ]);
      if (bkData) setBookings(bkData as any);
      if (cpData) setContasPagar(cpData);
      setLoading(false);
    };
    load();
  }, []);

  const validBookings = useMemo(() => bookings.filter(b => b.status !== "cancelada"), [bookings]);

  const monthBookings = useMemo(
    () => validBookings.filter((b) => {
      const d = new Date(b.created_at);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    }),
    [validBookings, selectedMonth, selectedYear]
  );

  const monthContasPagar = useMemo(
    () => contasPagar.filter(c => {
      const d = new Date(c.vencimento + "T12:00:00");
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    }),
    [contasPagar, selectedMonth, selectedYear]
  );

  const receitaPaga = monthBookings.filter(b => b.payment_status === "pago").reduce((s, b) => s + b.final_total, 0);
  const despesasMes = monthContasPagar.filter(c => c.status === "pago").reduce((s, c) => s + c.valor, 0);
  const lucroMes = receitaPaga - despesasMes;
  const descontosMes = monthBookings.reduce((s, b) => s + b.discount, 0);
  const receitaBruta = monthBookings.reduce((s, b) => s + b.total, 0);
  const pagos = monthBookings.filter(b => b.payment_status === "pago");
  const ticketMedio = pagos.length > 0 ? Math.round(receitaPaga / pagos.length) : 0;
  const contasReceberBookings = validBookings.filter(b => b.payment_status === "pendente");
  const totalReceber = contasReceberBookings.reduce((s, b) => s + b.final_total, 0);

  const stats = [
    { label: "Receita Paga (Mês)", value: fmt(receitaPaga), change: `${pagos.length} res.`, up: true, icon: DollarSign },
    { label: "Despesas (Mês)", value: fmt(despesasMes), change: `${monthContasPagar.filter(c => c.status === "pago").length} contas`, up: false, icon: TrendingDown },
    { label: "Lucro Estimado", value: fmt(lucroMes), change: despesasMes > 0 ? `${Math.round((lucroMes / receitaPaga) * 100)}% margem` : "", up: lucroMes > 0, icon: TrendingUp },
    { label: "Ticket Médio", value: fmt(ticketMedio), change: "", up: true, icon: TrendingUp },
  ];

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "fluxo", label: "Fluxo de Caixa", icon: TrendingUp },
    { key: "pagar", label: "Contas a Pagar", icon: CreditCard },
    { key: "receber", label: "Contas a Receber", icon: Wallet },
    { key: "dre", label: "DRE", icon: Receipt },
    { key: "notas", label: "Notas e Recibos", icon: FileText },
  ];

  const exportPDF = () => {
    const doc = new jsPDF();
    const now = new Date();
    const dateStr = now.toLocaleDateString("pt-BR");
    
    // Header
    doc.setFontSize(18);
    doc.setTextColor(33, 150, 243);
    doc.text("Relatório Financeiro - Lençóis Tour", 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Data de geração: ${dateStr}`, 14, 28);
    doc.text(`Período: ${["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"][selectedMonth]} / ${selectedYear}`, 14, 33);

    // Summary Stats
    doc.setDrawColor(220);
    doc.line(14, 38, 196, 38);
    
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("Resumo do Mês:", 14, 45);
    
    doc.setFontSize(10);
    doc.text(`Receita Paga: ${fmt(receitaPaga)}`, 14, 52);
    doc.text(`Despesas: ${fmt(despesasMes)}`, 14, 57);
    doc.text(`Lucro Estimado: ${fmt(lucroMes)}`, 14, 62);
    doc.text(`Ticket Médio: ${fmt(ticketMedio)}`, 14, 67);

    // Table
    const tableData = monthBookings.map(b => [
      b.booking_code,
      b.customers?.name || "N/A",
      b.item_name,
      fmt(b.final_total),
      b.payment_status === "pago" ? "Pago" : "Pendente",
      fmtDate(b.created_at)
    ]);

    autoTable(doc, {
      startY: 75,
      head: [["Código", "Cliente", "Passeio", "Valor", "Status", "Data"]],
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: [33, 150, 243] },
      styles: { fontSize: 8 },
    });

    doc.save(`financeiro_${selectedYear}_${selectedMonth + 1}.pdf`);
  };

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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-background border border-border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"].map((m, i) => (
                <option key={i} value={i}>{m}</option>
              ))}
            </select>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-background border border-border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {[2023, 2024, 2025].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportCSV}><Download size={14} className="mr-1" /> CSV</Button>
            <Button variant="outline" size="sm" onClick={exportPDF}><Printer size={14} className="mr-1" /> Imprimir PDF</Button>
          </div>
        </div>

        <FinanceiroStats stats={stats} />

        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-border">
          {tabs.map((t) => (
            <Button key={t.key} variant={tab === t.key ? "default" : "ghost"} size="sm" onClick={() => setTab(t.key)} className="shrink-0">
              <t.icon size={16} className="mr-1" />{t.label}
            </Button>
          ))}
        </div>

        {tab === "fluxo" && <FluxoCaixaTab bookings={bookings} contasPagar={contasPagar} />}
        {tab === "pagar" && <ContasPagarTab />}
        {tab === "receber" && <ContasReceberTab />}
        {tab === "dre" && <DRETab bookings={bookings} contasPagar={contasPagar} />}
        {tab === "notas" && <NotasFiscaisTab bookings={bookings} />}
      </div>
    </AdminLayout>
  );
};

export default AdminFinanceiro;
