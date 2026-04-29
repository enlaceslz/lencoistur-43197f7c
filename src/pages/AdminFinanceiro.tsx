import { useState, useEffect, useMemo } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { motion, AnimatePresence } from "framer-motion";
import {
  DollarSign, TrendingUp, TrendingDown, CreditCard, Wallet, Receipt,
  Loader2, Download, Printer, LayoutDashboard, FileText
} from "lucide-react";
import FinanceiroStats from "@/components/financeiro/FinanceiroStats";
import FluxoCaixaTab from "@/components/financeiro/FluxoCaixaTab";
import ContasPagarTab from "@/components/financeiro/ContasPagarTab";
import ContasReceberTab from "@/components/financeiro/ContasReceberTab";
import DRETab from "@/components/financeiro/DRETab";
import NotasFiscaisTab from "@/components/financeiro/NotasFiscaisTab";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

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

const fmt = (v: number) => formatCurrency(v);
const fmtDate = (d: string) => {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("pt-BR"); } catch { return d; }
};

const AdminFinanceiro = () => {
  const [tab, setTab] = useState<Tab>("fluxo");
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [contasPagar, setContasPagar] = useState<any[]>([]);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [{ data: bkData }, { data: cpData }, { data: compData }] = await Promise.all([
        supabase.from("bookings").select("*, customers(name, email, phone)").order("created_at", { ascending: false }),
        supabase.from("contas_pagar").select("*"),
        supabase.from("sgs_empresa").select("*").limit(1).maybeSingle()
      ]);
      if (bkData) setBookings(bkData as any);
      if (cpData) setContasPagar(cpData);
      if (compData) setCompany(compData);
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
  const pagos = monthBookings.filter(b => b.payment_status === "pago");
  const ticketMedio = pagos.length > 0 ? Math.round(receitaPaga / pagos.length) : 0;

  const stats = [
    { label: "Receita Paga", value: fmt(receitaPaga), change: `${pagos.length} res.`, up: true, icon: DollarSign },
    { label: "Despesas do Mês", value: fmt(despesasMes), change: `${monthContasPagar.filter(c => c.status === "pago").length} contas`, up: false, icon: TrendingDown },
    { label: "Lucro Estimado", value: fmt(lucroMes), change: receitaPaga > 0 ? `${Math.round((lucroMes / receitaPaga) * 100)}% margem` : "0% margem", up: lucroMes > 0, icon: TrendingUp },
    { label: "Ticket Médio", value: fmt(ticketMedio), change: "mês atual", up: true, icon: LayoutDashboard },
  ];

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "fluxo", label: "Geral", icon: TrendingUp },
    { key: "pagar", label: "Pagar", icon: CreditCard },
    { key: "receber", label: "Receber", icon: Wallet },
    { key: "dre", label: "DRE", icon: Receipt },
    { key: "notas", label: "Docs", icon: FileText },
  ];

  const exportPDF = async () => {
    const doc = new jsPDF();
    const now = new Date();
    const dateStr = now.toLocaleDateString("pt-BR");
    const monthName = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"][selectedMonth];
    
    // Header styling
    const brandName = company?.nome_fantasia || "LENÇÓIS TOUR";
    const cnpj = company?.cnpj || "";
    const address = company?.endereco || "";
    const phone = company?.telefone || "";

    // Logo
    if (company?.logo_url) {
      try {
        const img = new Image();
        img.src = company.logo_url;
        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
        doc.addImage(img, 'PNG', 14, 10, 25, 25);
      } catch (e) {
        console.error("Error loading logo for PDF", e);
      }
    }

    // Company Info
    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.setFont("helvetica", "bold");
    doc.text(brandName, 45, 18);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`CNPJ: ${cnpj}`, 45, 23);
    doc.text(`${address}`, 45, 28);
    doc.text(`Contato: ${phone}`, 45, 33);

    // Title & Period
    doc.setFontSize(14);
    doc.setTextColor(33, 150, 243);
    doc.setFont("helvetica", "bold");
    doc.text("RELATÓRIO FINANCEIRO MENSAL", 14, 50);
    
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text(`Período: ${monthName} de ${selectedYear}`, 14, 56);
    doc.text(`Gerado em: ${dateStr}`, 150, 56);

    // Divider
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 60, 196, 60);

    // Summary Cards Section
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 65, 182, 30, 3, 3, "F");

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text("RESUMO DO PERÍODO", 20, 72);

    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("Receita Bruta:", 20, 80);
    doc.text(fmt(receitaPaga), 60, 80);

    doc.text("Despesas:", 20, 87);
    doc.text(fmt(despesasMes), 60, 87);

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(lucroMes >= 0 ? 22 : 220, lucroMes >= 0 ? 163 : 38, lucroMes >= 0 ? 74 : 38);
    doc.text("Resultado Líquido:", 110, 84);
    doc.text(fmt(lucroMes), 155, 84);

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
      startY: 100,
      head: [["Código", "Cliente", "Serviço", "Valor", "Status", "Data"]],
      body: tableData,
      theme: "grid",
      headStyles: { 
        fillColor: [33, 150, 243], 
        textColor: 255, 
        fontSize: 9, 
        fontStyle: 'bold',
        halign: 'center'
      },
      styles: { 
        fontSize: 8, 
        cellPadding: 3,
        textColor: 51,
        lineColor: [226, 232, 240]
      },
      columnStyles: {
        3: { halign: 'right' },
        4: { halign: 'center' },
        5: { halign: 'center' }
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      }
    });

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`Página ${i} de ${pageCount}`, 105, 285, { align: "center" });
      doc.text("Lençóis Tour - Gestão Profissional de Turismo", 14, 285);
    }

    doc.save(`Relatorio_Financeiro_${monthName}_${selectedYear}.pdf`);
  };

  if (loading) {
    return (
      <AdminLayout title="Financeiro">
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <Loader2 className="animate-spin text-primary" size={40} />
          <p className="text-muted-foreground animate-pulse">Carregando dados financeiros...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Painel Financeiro">
      <div className="space-y-8 pb-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-card p-6 rounded-2xl border border-border/50 shadow-sm">
          <div className="space-y-2">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Período de Análise</h2>
            <div className="flex items-center gap-3">
              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-muted/50 border-none rounded-lg px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-primary transition-all cursor-pointer"
              >
                {["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"].map((m, i) => (
                  <option key={i} value={i}>{m}</option>
                ))}
              </select>
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-muted/50 border-none rounded-lg px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-primary transition-all cursor-pointer"
              >
                {[2023, 2024, 2025, 2026].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="default" 
              onClick={exportPDF}
              className="rounded-xl border-primary/20 hover:border-primary/50 hover:bg-primary/5 text-primary transition-all"
            >
              <Printer size={18} className="mr-2" /> 
              Exportar Relatório
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <FinanceiroStats stats={stats} />

        {/* Navigation Tabs */}
        <div className="relative">
          <div className="flex items-center gap-1 bg-muted/30 p-1.5 rounded-2xl w-fit border border-border/40 backdrop-blur-sm overflow-x-auto max-w-full no-scrollbar">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 relative whitespace-nowrap",
                  tab === t.key 
                    ? "text-white shadow-lg" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                {tab === t.key && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-primary rounded-xl z-0"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <t.icon size={18} className={cn("relative z-10 transition-transform", tab === t.key && "scale-110")} />
                <span className="relative z-10">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {tab === "fluxo" && <FluxoCaixaTab bookings={bookings} contasPagar={contasPagar} />}
              {tab === "pagar" && <ContasPagarTab company={company} />}
              {tab === "receber" && <ContasReceberTab company={company} />}
              {tab === "dre" && <DRETab bookings={bookings} contasPagar={contasPagar} />}
              {tab === "notas" && <NotasFiscaisTab bookings={bookings} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminFinanceiro;
