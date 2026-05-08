import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Loader2, Pencil, Trash2, Link2, Calendar, User, Tag, CheckCircle2, AlertCircle, Printer, Search, FileText, Upload, X, ExternalLink, DollarSign, Save, XCircle } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { NumericFormat } from "react-number-format";

const fmt = (v: number) => formatCurrency(v);

const maskCurrency = (v: string) => {
  const n = v.replace(/\D/g, "");
  return (Number(n) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
};

const parseCurrency = (v: string) => {
  return Number(v.replace(/\D/g, ""));
};

const fmtDate = (d: string | null) => {
  if (!d) return "—";
  try { return new Date(d + "T12:00:00").toLocaleDateString("pt-BR"); } catch { return d; }
};

const statusConfig: Record<string, { class: string, icon: any }> = {
  pendente: { class: "bg-amber-100 text-amber-700 border-amber-200", icon: AlertCircle },
  recebido: { class: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  vencido: { class: "bg-rose-100 text-rose-700 border-rose-200", icon: AlertCircle },
};

const categorias = ["reserva", "servico", "comissao", "outros"];

interface Conta {
  id: string;
  descricao: string;
  valor: number;
  vencimento: string;
  status: string;
  categoria: string;
  cliente: string | null;
  observacoes: string | null;
  recebido_em: string | null;
  booking_id: string | null;
  anexo_url: string | null;
  partner_id?: string | null;
  partners?: { name: string } | null;
}

interface CustomerOption { id: string; name: string; email: string; }
interface BookingOption { id: string; booking_code: string; item_name: string; final_total: number; customer_name: string; }
interface PartnerOption { id: string; name: string; }

const emptyForm = { 
  descricao: "", 
  valor: 0, 
  vencimento: new Date().toISOString().slice(0, 10), 
  categoria: "reserva", 
  cliente: "", 
  observacoes: "", 
  status: "pendente", 
  booking_id: "", 
  customer_id: "",
  partner_id: "",
  anexo_url: ""
};

export default function ContasReceberTab({ company }: { company?: any }) {
  const [contas, setContas] = useState<Conta[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Conta | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [bookings, setBookings] = useState<BookingOption[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [categoryFilter, setCategoryFilter] = useState<string>("todos");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("contas_receber").select("*").order("vencimento", { ascending: true });
    if (data) setContas(data as any);
    setLoading(false);
  };

  const loadRelations = async () => {
    const [{ data: cust }, { data: bk }] = await Promise.all([
      supabase.from("customers").select("id, name, email").order("name"),
      supabase.from("bookings").select("id, booking_code, item_name, final_total, customers(name)").order("created_at", { ascending: false }),
    ]);
    if (cust) setCustomers(cust);
    if (bk) setBookings(bk.map((b: any) => ({
      id: b.id,
      booking_code: b.booking_code,
      item_name: b.item_name,
      final_total: b.final_total,
      customer_name: b.customers?.name || "",
    })));
  };

  useEffect(() => { load(); loadRelations(); }, []);

  const totalPendente = contas.filter(c => c.status === "pendente").reduce((s, c) => s + c.valor, 0);

  const openNew = () => { setEditing(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (c: Conta) => {
    setEditing(c);
    setForm({
      descricao: c.descricao,
      valor: c.valor,
      vencimento: c.vencimento,
      categoria: c.categoria,
      cliente: c.cliente || "",
      observacoes: c.observacoes || "",
      status: c.status,
      booking_id: c.booking_id || "",
      customer_id: "",
      anexo_url: c.anexo_url || "",
    });
    setOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `receber/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('financeiro')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('financeiro')
        .getPublicUrl(filePath);

      setForm({ ...form, anexo_url: publicUrl });
      toast.success("Comprovante enviado!");
    } catch (error: any) {
      toast.error("Erro no upload: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleBookingSelect = (bookingId: string) => {
    if (bookingId) {
      const bk = bookings.find(b => b.id === bookingId);
      if (bk) {
        setForm(f => ({
          ...f,
          booking_id: bookingId,
          descricao: f.descricao || `Reserva ${bk.booking_code} - ${bk.item_name}`,
          valor: f.valor || bk.final_total,
          cliente: bk.customer_name || f.cliente,
        }));
      }
    } else {
      setForm(f => ({ ...f, booking_id: "" }));
    }
  };

  const handleCustomerSelect = (customerId: string) => {
    setForm(f => ({ ...f, customer_id: customerId }));
    if (customerId) {
      const cust = customers.find(c => c.id === customerId);
      if (cust) {
        setForm(f => ({ ...f, cliente: cust.name }));
      }
    }
  };

  const handleSave = async () => {
    if (!form.descricao.trim() || !form.vencimento || form.valor <= 0) { toast.error("Preencha os campos obrigatórios."); return; }
    setSaving(true);
    const payload = {
      descricao: form.descricao.trim(),
      valor: form.valor,
      vencimento: form.vencimento,
      categoria: form.categoria,
      cliente: form.cliente || null,
      observacoes: form.observacoes || null,
      status: form.status,
      recebido_em: form.status === "recebido" ? new Date().toISOString().slice(0, 10) : null,
      booking_id: form.booking_id || null,
      anexo_url: form.anexo_url || null,
    };
    if (editing) {
      const { error } = await supabase.from("contas_receber").update(payload).eq("id", editing.id);
      if (error) toast.error("Erro ao atualizar."); else toast.success("Conta atualizada!");
    } else {
      const { error } = await supabase.from("contas_receber").insert(payload);
      if (error) toast.error("Erro ao criar."); else toast.success("Conta criada!");
    }
    setSaving(false); setOpen(false); load();
  };

  const filteredContas = useMemo(() => {
    return contas.filter(c => {
      const q = searchTerm.toLowerCase();
      const matchesSearch = c.descricao.toLowerCase().includes(q) || 
                           (c.cliente?.toLowerCase() || "").includes(q) ||
                           (c.observacoes?.toLowerCase() || "").includes(q);
      const matchesStatus = statusFilter === "todos" || c.status === statusFilter;
      const matchesCategory = categoryFilter === "todos" || c.categoria === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [contas, searchTerm, statusFilter, categoryFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta conta?")) return;
    await supabase.from("contas_receber").delete().eq("id", id);
    toast.success("Conta excluída."); load();
  };

  const exportPDF = async () => {
    const doc = new jsPDF();
    const brandName = company?.nome_fantasia || "LENÇÓIS TOUR";
    const now = new Date();

    if (company?.logo_url) {
      try {
        const img = new Image();
        img.src = company.logo_url;
        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
        doc.addImage(img, 'PNG', 14, 10, 20, 20);
      } catch (e) {}
    }

    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.text(brandName, 40, 18);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(`Relatório de Contas a Receber`, 40, 23);
    doc.text(`Gerado em: ${now.toLocaleDateString("pt-BR")}`, 40, 28);

    const tableData = filteredContas.map(c => [
      c.descricao,
      c.cliente || "Consumidor Final",
      c.categoria,
      fmtDate(c.vencimento),
      c.status.toUpperCase(),
      fmt(c.valor)
    ]);

    autoTable(doc, {
      startY: 40,
      head: [["Descrição", "Cliente", "Categoria", "Vencimento", "Status", "Valor"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [16, 185, 129] }, // Emerald-500 for Receber
      styles: { fontSize: 8 },
      columnStyles: { 5: { halign: 'right' } }
    });

    doc.save("Relatorio_Contas_Receber.pdf");
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={32} /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-foreground">Contas a Receber</h3>
          <p className="text-sm text-muted-foreground">Monitore suas entradas e faturamento</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button variant="outline" onClick={exportPDF} className="rounded-xl border-emerald-200 text-emerald-600 hover:bg-emerald-50">
            <Printer size={18} className="mr-2" /> Exportar
          </Button>
          <div className="bg-emerald-50 dark:bg-emerald-950/20 px-4 py-2 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
            <p className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">Total a Receber</p>
            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{fmt(totalPendente)}</p>
          </div>
          <Button onClick={openNew} className="rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
            <Plus size={18} className="mr-2" /> Nova Entrada
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm mb-4">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              <Search size={16} />
            </span>
            <Input 
              placeholder="Buscar por descrição, cliente ou observações..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="pl-10 h-10 rounded-xl"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto no-scrollbar pb-1 md:pb-0">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px] h-10 rounded-xl">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos Status</SelectItem>
                <SelectItem value="pendente">Pendentes</SelectItem>
                <SelectItem value="recebido">Recebidos</SelectItem>
                <SelectItem value="vencido">Vencidos</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[140px] h-10 rounded-xl">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas Categorias</SelectItem>
                {categorias.map(cat => (
                  <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider text-[11px]">Descrição / Cliente</th>
                  <th className="text-left px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider text-[11px]">Categoria / Reserva</th>
                  <th className="text-left px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider text-[11px]">Vencimento</th>
                  <th className="text-left px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider text-[11px]">Status</th>
                  <th className="text-right px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider text-[11px]">Valor</th>
                  <th className="text-right px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider text-[11px]">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                <AnimatePresence mode="popLayout">
                  {contas.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-20 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-2 opacity-50">
                          <Tag size={40} />
                          <p>Nenhuma entrada registrada.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredContas.map((c, idx) => {
                      const status = statusConfig[c.status] || statusConfig.pendente;
                      const StatusIcon = status.icon;
                      const linkedBooking = c.booking_id ? bookings.find(b => b.id === c.booking_id) : null;
                      
                      return (
                        <motion.tr 
                          key={c.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ delay: idx * 0.05 }}
                          className="group hover:bg-primary/5 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-foreground group-hover:text-primary transition-colors">{c.descricao}</span>
                              <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <User size={10} className="text-primary/60" />
                                {c.cliente || "Consumidor Final"}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              <span className="flex items-center gap-1.5 text-xs font-semibold bg-muted px-2 py-0.5 rounded-full w-fit capitalize">
                                <Tag size={10} className="text-primary" />
                                {c.categoria}
                              </span>
                              {linkedBooking && (
                                <span className="text-[10px] text-primary font-mono bg-primary/10 px-1.5 py-0.5 rounded flex items-center gap-1 w-fit mt-1">
                                  <Link2 size={10} />
                                  {linkedBooking.booking_code}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="flex items-center gap-2 text-muted-foreground font-medium">
                              <Calendar size={14} className="text-primary/60" />
                              {fmtDate(c.vencimento)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant="outline" className={`${status.class} border rounded-lg px-2.5 py-1 gap-1.5 font-bold uppercase text-[10px]`}>
                              <StatusIcon size={12} />
                              {c.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-base font-black text-foreground">{fmt(c.valor)}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end items-center gap-1.5">
                              {c.anexo_url && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 rounded-lg text-primary hover:bg-primary/10"
                                  onClick={() => window.open(c.anexo_url!, '_blank')}
                                  title="Ver Comprovante"
                                >
                                  <FileText size={14} />
                                </Button>
                              )}
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                onClick={() => openEdit(c)}
                                className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
                              >
                                <Pencil size={14} />
                              </Button>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10 transition-colors" 
                                onClick={() => handleDelete(c.id)}
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl rounded-3xl overflow-hidden bg-[#F8FAFC]">
          <div className="bg-white border-b border-slate-100 p-4 md:p-6 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                <CheckCircle2 size={20} className="md:w-6 md:h-6" />
              </div>
              <div>
                <DialogTitle className="text-lg md:text-xl font-black text-slate-900 leading-none mb-1">
                  {editing ? "Editar Entrada" : "Nova Conta a Receber"}
                </DialogTitle>
                <p className="text-[11px] md:text-sm text-slate-500 font-medium">Registre seus recebimentos e faturamento</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="rounded-full hover:bg-slate-100 transition-colors">
              <XCircle size={20} className="text-slate-400" />
            </Button>
          </div>

          <div className="p-4 md:p-8 space-y-6 md:space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="md:col-span-2 space-y-2 bg-primary/5 p-4 rounded-2xl border border-primary/10 mb-2">
                <Label className="text-[10px] font-black uppercase text-primary tracking-widest ml-1">Vincular a uma Reserva (Opcional)</Label>
                <Select value={form.booking_id} onValueChange={handleBookingSelect}>
                  <SelectTrigger className="h-11 rounded-xl font-bold bg-white border-primary/20">
                    <SelectValue placeholder="Selecione uma reserva ativa..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="none" className="font-bold text-muted-foreground italic">— Nenhuma reserva —</SelectItem>
                    {bookings.map(b => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.booking_code} - {b.item_name} ({b.customer_name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Descrição do Recebimento *</Label>
                <Input value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} placeholder="Ex: Pagamento Passeio Atins" className="h-12 rounded-xl font-bold" />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Valor Esperado (R$) *</Label>
                <NumericFormat
                  value={form.valor / 100}
                  onValueChange={(values) => setForm({ ...form, valor: Math.round(Number(values.floatValue) * 100) })}
                  thousandSeparator="."
                  decimalSeparator=","
                  prefix="R$ "
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 h-12 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Previsão / Vencimento *</Label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <Input type="date" value={form.vencimento} onChange={e => setForm({ ...form, vencimento: e.target.value })} className="pl-11 h-12 rounded-xl font-bold" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Categoria de Receita</Label>
                <Select value={form.categoria} onValueChange={v => setForm({ ...form, categoria: v })}>
                  <SelectTrigger className="h-12 rounded-xl font-bold bg-white">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {categorias.map(cat => (
                      <SelectItem key={cat} value={cat} className="capitalize font-medium">{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Cliente / Titular</Label>
                <div className="flex flex-col gap-2">
                  <Select value={form.customer_id} onValueChange={handleCustomerSelect}>
                    <SelectTrigger className="h-12 rounded-xl font-bold bg-white">
                      <SelectValue placeholder="Vincular cliente..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {customers.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!form.customer_id && (
                    <Input value={form.cliente} onChange={e => setForm({ ...form, cliente: e.target.value })} placeholder="Nome manual..." className="h-10 rounded-xl" />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Status de Recebimento</Label>
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant={form.status === "pendente" ? "default" : "outline"} 
                    onClick={() => setForm({ ...form, status: "pendente" })}
                    className={cn("flex-1 h-11 rounded-xl font-bold", form.status === "pendente" && "bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-500/20")}
                  >
                    Pendente
                  </Button>
                  <Button 
                    type="button" 
                    variant={form.status === "recebido" ? "default" : "outline"} 
                    onClick={() => setForm({ ...form, status: "recebido" })}
                    className={cn("flex-1 h-11 rounded-xl font-bold", form.status === "recebido" && "bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20")}
                  >
                    Já Recebido
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Anexo / Comprovante</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input 
                      className="h-12 rounded-xl font-medium pr-10" 
                      placeholder="URL do anexo" 
                      value={form.anexo_url} 
                      onChange={e => setForm({...form, anexo_url: e.target.value})} 
                    />
                    {form.anexo_url && (
                      <a href={form.anexo_url} target="_blank" className="absolute right-3 top-1/2 -translate-y-1/2 text-primary hover:scale-110 transition-transform">
                        <ExternalLink size={16} />
                      </a>
                    )}
                  </div>
                  <Button type="button" variant="outline" className="h-12 w-12 rounded-xl p-0 relative overflow-hidden shrink-0">
                    <input type="file" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                    {uploading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
                  </Button>
                </div>
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Observações do Recebimento</Label>
                <textarea 
                  value={form.observacoes} 
                  onChange={e => setForm({ ...form, observacoes: e.target.value })} 
                  placeholder="Detalhes sobre a negociação ou forma de recebimento..."
                  className="w-full min-h-[100px] rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                />
              </div>
            </div>
          </div>

          <div className="bg-white border-t border-slate-100 p-4 md:p-6 flex gap-4 sticky bottom-0">
            <Button variant="ghost" onClick={() => setOpen(false)} className="flex-1 h-12 rounded-xl font-black uppercase text-[10px] tracking-widest">
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="flex-[2] h-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 shadow-xl shadow-emerald-500/20 font-black uppercase text-[10px] tracking-widest text-white transition-all">
              {saving ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save size={18} className="mr-2" />}
              {editing ? "Salvar Alterações" : "Confirmar Lançamento"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}