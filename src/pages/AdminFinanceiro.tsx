import { useState, useEffect, useMemo } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { motion, AnimatePresence } from "framer-motion";
import {
  DollarSign, TrendingUp, TrendingDown, CreditCard, Wallet, Receipt,
  Loader2, Download, Printer, LayoutDashboard, FileText, Search
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
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | "pago" | "pendente">("todos");
  const [typeFilter, setTypeFilter] = useState<"todos" | "entrada" | "saida">("todos");

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

  const filteredTransactions = useMemo(() => {
    const all = [
      ...monthBookings.map(b => ({
        date: b.created_at,
        desc: `[ENTRADA] ${b.item_name} - ${b.customers?.name || "N/A"}`,
        method: (b.pay_method || "N/A").toUpperCase(),
        value: b.final_total,
        status: b.payment_status === "pago" ? "PAGO" : "PENDENTE",
        type: 'entrada' as const
      })),
      ...monthContasPagar.map(c => ({
        date: c.vencimento,
        desc: `[SAÍDA] ${c.descricao} - ${c.fornecedor || "N/A"}`,
        method: "TRANSFERÊNCIA",
        value: -c.valor,
        status: c.status === "pago" ? "PAGO" : "PENDENTE",
        type: 'saida' as const
      }))
    ];

    return all.filter(t => {
      const q = searchTerm.toLowerCase();
      const matchesSearch = !q || 
        t.desc.toLowerCase().includes(q) || 
        t.method.toLowerCase().includes(q) || 
        t.status.toLowerCase().includes(q);
      
      const matchesStatus = statusFilter === "todos" || t.status.toLowerCase() === statusFilter;
      const matchesType = typeFilter === "todos" || t.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [monthBookings, monthContasPagar, searchTerm, statusFilter, typeFilter]);

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

    // Header Background
    doc.setFillColor(33, 150, 243);
    doc.rect(0, 0, 210, 40, "F");

    // Logo (if exists)
    if (company?.logo_url) {
      try {
        const img = new Image();
        img.src = company.logo_url;
        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
        doc.addImage(img, 'PNG', 14, 8, 24, 24);
      } catch (e) {
        console.error("Error loading logo for PDF", e);
      }
    }

    // Company Info in Header
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text(brandName.toUpperCase(), 45, 18);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`CNPJ: ${cnpj} | Contato: ${phone}`, 45, 25);
    doc.text(`${address}`, 45, 30);

    // Title & Period
    doc.setFontSize(16);
    doc.setTextColor(33, 150, 243);
    doc.setFont("helvetica", "bold");
    doc.text("RELATÓRIO FINANCEIRO CONSOLIDADO", 14, 55);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.setFont("helvetica", "normal");
    doc.text(`Competência: ${monthName} de ${selectedYear}`, 14, 62);
    doc.text(`Data de Emissão: ${dateStr}`, 150, 62);

    // Summary Box
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(14, 70, 182, 35, 3, 3, "F");

    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.setFont("helvetica", "bold");
    doc.text("RESUMO EXECUTIVO", 20, 78);

    doc.setFont("helvetica", "normal");
    doc.text("Total de Receitas Pagas:", 20, 85);
    doc.setTextColor(22, 163, 74); // Emerald
    doc.text(fmt(receitaPaga), 75, 85);

    doc.setTextColor(71, 85, 105);
    doc.text("Total de Despesas Pagas:", 20, 92);
    doc.setTextColor(220, 38, 38); // Rose
    doc.text(fmt(despesasMes), 75, 92);

    doc.setTextColor(71, 85, 105);
    doc.setFont("helvetica", "bold");
    doc.text("RESULTADO LÍQUIDO:", 115, 88);
    doc.setFontSize(14);
    doc.setTextColor(lucroMes >= 0 ? 33 : 220, lucroMes >= 0 ? 150 : 38, lucroMes >= 0 ? 243 : 38);
    doc.text(fmt(lucroMes), 155, 88);

    // Main Table - Unified view of transactions
    const tableData = filteredTransactions.map(t => [
      fmtDate(t.date),
      t.desc,
      t.method,
      t.value < 0 ? `(${fmt(Math.abs(t.value))})` : fmt(t.value),
      t.status
    ]);

    autoTable(doc, {
      startY: 115,
      head: [["Data", "Descrição / Origem", "Meio", "Valor", "Status"]],
      body: tableData,
      theme: "striped",
      headStyles: { 
        fillColor: [33, 150, 243], 
        textColor: 255, 
        fontSize: 10,
        fontStyle: 'bold'
      },
      styles: { 
        fontSize: 8,
        cellPadding: 4,
        textColor: 50
      },
      columnStyles: {
        3: { halign: 'right', fontStyle: 'bold' },
        4: { halign: 'center' }
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 3) {
          const val = String(data.cell.text[0] || "");
          if (val.includes('(')) {
            data.cell.styles.textColor = [220, 38, 38];
          } else {
            data.cell.styles.textColor = [22, 163, 74];
          }
        }
      }
    });

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Lençóis Tour - Sistema de Gestão Financeira | Página ${i} de ${pageCount}`, 105, 285, { align: "center" });
    }

    doc.save(`Financeiro_Consolidado_${monthName}_${selectedYear}.pdf`);
  };

  const exportCSV = () => {
    const headers = ["Data", "Descrição", "Método", "Valor", "Status", "Tipo"];
    const rows = filteredTransactions.map(t => [
      fmtDate(t.date),
      t.desc.replace(/,/g, " "),
      t.method,
      t.value.toString(),
      t.status,
      t.type
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Financeiro_${selectedMonth + 1}_${selectedYear}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input 
                placeholder="Pesquisar nas exportações..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 bg-muted/30 border-none rounded-xl"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="default" 
              onClick={exportCSV}
              className="rounded-xl border-primary/20 hover:border-primary/50 hover:bg-primary/5 text-primary transition-all"
            >
              <Download size={18} className="mr-2" /> 
              Excel / CSV
            </Button>
            <Button 
              variant="default" 
              size="default" 
              onClick={exportPDF}
              className="rounded-xl shadow-md transition-all"
            >
              <Printer size={18} className="mr-2" /> 
              Relatório PDF
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
              {tab === "fluxo" && (
                <div className="space-y-8">
                  <FluxoCaixaTab bookings={bookings} contasPagar={contasPagar} selectedMonth={selectedMonth} selectedYear={selectedYear} />
                  
                  <Card className="border-none shadow-sm bg-card overflow-hidden">
                    <CardHeader className="p-6 border-b border-border/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <CardTitle className="text-lg font-bold">Detalhamento das Transações</CardTitle>
                        <p className="text-sm text-muted-foreground">Listagem consolidada do período selecionado</p>
                      </div>
                      <div className="md:hidden">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                          <Input 
                            placeholder="Pesquisar..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 h-10 bg-muted/30 border-none rounded-xl"
                          />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border bg-muted/30">
                            <th className="text-left px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider text-[11px]">Data</th>
                            <th className="text-left px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider text-[11px]">Descrição / Origem</th>
                            <th className="text-left px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider text-[11px]">Meio</th>
                            <th className="text-right px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider text-[11px]">Valor</th>
                            <th className="text-center px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider text-[11px]">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                          {[
                            ...monthBookings.map(b => ({
                              date: b.created_at,
                              desc: `[ENTRADA] ${b.item_name} - ${b.customers?.name || "N/A"}`,
                              method: (b.pay_method || "N/A").toUpperCase(),
                              value: b.final_total,
                              status: b.payment_status === "pago" ? "PAGO" : "PENDENTE",
                              type: 'in'
                            })),
                            ...monthContasPagar.map(c => ({
                              date: c.vencimento,
                              desc: `[SAÍDA] ${c.descricao} - ${c.fornecedor || "N/A"}`,
                              method: "TRANSFERÊNCIA",
                              value: -c.valor,
                              status: c.status === "pago" ? "PAGO" : "PENDENTE",
                              type: 'out'
                            }))
                          ].filter(t => {
                            if (!searchTerm) return true;
                            const q = searchTerm.toLowerCase();
                            return t.desc.toLowerCase().includes(q) || t.method.toLowerCase().includes(q) || t.status.toLowerCase().includes(q);
                          }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((t, i) => (
                            <tr key={i} className="hover:bg-muted/30 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">{fmtDate(t.date)}</td>
                              <td className="px-6 py-4 font-medium">{t.desc}</td>
                              <td className="px-6 py-4 text-xs font-mono text-muted-foreground">{t.method}</td>
                              <td className={cn("px-6 py-4 text-right font-bold", t.type === 'in' ? "text-emerald-600" : "text-rose-600")}>
                                {t.type === 'in' ? "" : "-"} {fmt(Math.abs(t.value))}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className={cn(
                                  "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                                  t.status === "PAGO" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40" : "bg-amber-100 text-amber-700 dark:bg-amber-900/40"
                                )}>
                                  {t.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </CardContent>
                  </Card>
                </div>
              )}
              {tab === "pagar" && <ContasPagarTab company={company} />}
              {tab === "receber" && <ContasReceberTab company={company} />}
              {tab === "dre" && <DRETab bookings={bookings} contasPagar={contasPagar} selectedMonth={selectedMonth} selectedYear={selectedYear} company={company} />}
              {tab === "notas" && <NotasFiscaisTab bookings={bookings} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminFinanceiro;