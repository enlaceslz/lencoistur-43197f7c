import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Loader2, Pencil, Trash2, Link2, Calendar, User, Tag, CheckCircle2, AlertCircle, Printer } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
}

interface CustomerOption { id: string; name: string; email: string; }
interface BookingOption { id: string; booking_code: string; item_name: string; final_total: number; customer_name: string; }

const emptyForm = { descricao: "", valor: 0, vencimento: "", categoria: "reserva", cliente: "", observacoes: "", status: "pendente", booking_id: "", customer_id: "" };

export default function ContasReceberTab({ company }: { company?: any }) {
  const [contas, setContas] = useState<Conta[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Conta | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
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
    });
    setOpen(true);
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
      const matchesSearch = c.descricao.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           (c.cliente?.toLowerCase() || "").includes(searchTerm.toLowerCase());
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
                            <div className="flex justify-end gap-1.5">
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
        <DialogContent className="max-w-xl rounded-2xl border-none shadow-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                {editing ? <Pencil size={20} /> : <Plus size={20} />}
              </div>
              {editing ? "Editar" : "Nova"} Conta a Receber
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-4 pb-2">
            
            <div className="bg-muted/30 p-4 rounded-2xl space-y-4 border border-border/50">
              <h4 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <Link2 size={14} /> Vínculos do CRM
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Vincular Reserva</Label>
                  <select
                    value={form.booking_id}
                    onChange={(e) => handleBookingSelect(e.target.value)}
                    className="w-full bg-background border border-muted-foreground/20 rounded-xl px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary outline-none h-11 transition-all"
                  >
                    <option value="">— Sem reserva —</option>
                    {bookings.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.booking_code} - {b.item_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Selecionar Cliente</Label>
                  <select
                    value={form.customer_id}
                    onChange={(e) => handleCustomerSelect(e.target.value)}
                    className="w-full bg-background border border-muted-foreground/20 rounded-xl px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary outline-none h-11 transition-all"
                  >
                    <option value="">— Sem cliente —</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Descrição Principal *</Label>
              <Input 
                value={form.descricao} 
                onChange={e => setForm({ ...form, descricao: e.target.value })}
                className="rounded-xl border-muted-foreground/20 focus:ring-primary h-11"
                placeholder="Ex: Pagamento Passeio X, Comissão..."
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Valor Estimado *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">R$</span>
                  <Input 
                    value={maskCurrency(String(form.valor))} 
                    onChange={e => setForm({ ...form, valor: parseCurrency(e.target.value) })}
                    className="pl-10 rounded-xl border-muted-foreground/20 h-11 font-bold text-lg"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Vencimento *</Label>
                <Input 
                  type="date" 
                  value={form.vencimento} 
                  onChange={e => setForm({ ...form, vencimento: e.target.value })}
                  className="rounded-xl border-muted-foreground/20 h-11"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Categoria</Label>
                <Select value={form.categoria} onValueChange={v => setForm({ ...form, categoria: v })}>
                  <SelectTrigger className="rounded-xl border-muted-foreground/20 h-11 capitalize">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {categorias.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Status do Recebimento</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger className="rounded-xl border-muted-foreground/20 h-11 font-semibold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="recebido">Confirmar Recebimento</SelectItem>
                    <SelectItem value="vencido">Vencido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nome do Cliente (Manual)</Label>
              <Input 
                value={form.cliente} 
                onChange={e => setForm({ ...form, cliente: e.target.value })}
                className="rounded-xl border-muted-foreground/20 h-11"
                placeholder="Caso não queira selecionar do CRM..."
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Observações</Label>
              <Input 
                value={form.observacoes} 
                onChange={e => setForm({ ...form, observacoes: e.target.value })}
                className="rounded-xl border-muted-foreground/20 h-11"
                placeholder="Informações extras sobre este recebimento"
              />
            </div>

            <Button 
              className="w-full h-12 rounded-xl text-base font-bold shadow-lg shadow-primary/20 bg-emerald-600 hover:bg-emerald-700" 
              onClick={handleSave} 
              disabled={saving}
            >
              {saving ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
              {editing ? "Salvar Alterações" : "Cadastrar Recebimento"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}