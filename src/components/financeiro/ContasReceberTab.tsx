import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Loader2, Pencil, Trash2, Link2 } from "lucide-react";
import { toast } from "sonner";

const fmt = (v: number) => `R$ ${(v / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

const maskCurrency = (v: string) => {
  const n = v.replace(/\D/g, "");
  return (Number(n) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
};

const parseCurrency = (v: string) => {
  return Number(v.replace(/\D/g, ""));
};

const fmtDate = (d: string | null) => {
  if (!d) return "—";
  try { return new Date(d + "T00:00:00").toLocaleDateString("pt-BR"); } catch { return d; }
};

const statusBadge: Record<string, string> = {
  pendente: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  recebido: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  vencido: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
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

export default function ContasReceberTab() {
  const [contas, setContas] = useState<Conta[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Conta | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [bookings, setBookings] = useState<BookingOption[]>([]);

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
      valor: String(c.valor / 100),
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
    setForm(f => ({ ...f, booking_id: bookingId }));
    if (bookingId) {
      const bk = bookings.find(b => b.id === bookingId);
      if (bk) {
        setForm(f => ({
          ...f,
          booking_id: bookingId,
          descricao: f.descricao || `Reserva ${bk.booking_code} - ${bk.item_name}`,
          valor: f.valor || String(bk.final_total / 100),
          cliente: bk.customer_name || f.cliente,
        }));
      }
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
    if (!form.descricao.trim() || !form.vencimento || !form.valor) { toast.error("Preencha os campos obrigatórios."); return; }
    setSaving(true);
    const payload = {
      descricao: form.descricao.trim(),
      valor: Math.round(parseFloat(form.valor) * 100),
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

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta conta?")) return;
    await supabase.from("contas_receber").delete().eq("id", id);
    toast.success("Conta excluída."); load();
  };

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" size={28} /></div>;

  return (
    <>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-foreground">Contas a Receber</h3>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 text-base px-4 py-1">
                Pendente: {fmt(totalPendente)}
              </Badge>
              <Button size="sm" onClick={openNew}><Plus size={14} className="mr-1" /> Nova Conta</Button>
            </div>
          </div>
          {contas.length === 0 ? (
            <p className="text-muted-foreground text-center py-10">Nenhuma conta a receber cadastrada.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left py-3 font-medium">Descrição</th>
                    <th className="text-left py-3 font-medium">Categoria</th>
                    <th className="text-left py-3 font-medium">Cliente</th>
                    <th className="text-left py-3 font-medium">Reserva</th>
                    <th className="text-left py-3 font-medium">Vencimento</th>
                    <th className="text-left py-3 font-medium">Status</th>
                    <th className="text-right py-3 font-medium">Valor</th>
                    <th className="text-right py-3 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {contas.map((c) => {
                    const linkedBooking = c.booking_id ? bookings.find(b => b.id === c.booking_id) : null;
                    return (
                      <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                        <td className="py-3 text-foreground font-medium">{c.descricao}</td>
                        <td className="py-3 text-muted-foreground capitalize">{c.categoria}</td>
                        <td className="py-3 text-muted-foreground">{c.cliente || "—"}</td>
                        <td className="py-3 text-muted-foreground">
                          {linkedBooking ? (
                            <span className="flex items-center gap-1 text-xs">
                              <Link2 size={12} className="text-primary" />
                              <span className="font-mono">{linkedBooking.booking_code}</span>
                            </span>
                          ) : "—"}
                        </td>
                        <td className="py-3 text-muted-foreground">{fmtDate(c.vencimento)}</td>
                        <td className="py-3"><Badge variant="secondary" className={statusBadge[c.status] || ""}>{c.status}</Badge></td>
                        <td className="py-3 text-right font-semibold text-foreground">{fmt(c.valor)}</td>
                        <td className="py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" onClick={() => openEdit(c)}><Pencil size={14} /></Button>
                            <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(c.id)}><Trash2 size={14} /></Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Editar" : "Nova"} Conta a Receber</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {/* Link to booking */}
            <div>
              <Label>Vincular à Reserva</Label>
              <select
                value={form.booking_id}
                onChange={(e) => handleBookingSelect(e.target.value)}
                className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground"
              >
                <option value="">— Nenhuma reserva —</option>
                {bookings.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.booking_code} - {b.item_name} ({b.customer_name}) {fmt(b.final_total)}
                  </option>
                ))}
              </select>
            </div>

            {/* Link to customer */}
            <div>
              <Label>Cliente (CRM)</Label>
              <select
                value={form.customer_id}
                onChange={(e) => handleCustomerSelect(e.target.value)}
                className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground"
              >
                <option value="">— Selecionar cliente —</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                ))}
              </select>
              <Input className="mt-2" value={form.cliente} onChange={e => setForm({ ...form, cliente: e.target.value })} placeholder="Ou digitar nome manualmente" />
            </div>

            <div><Label>Descrição *</Label><Input value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Valor (R$) *</Label><Input type="number" step="0.01" min="0" value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} /></div>
              <div><Label>Vencimento *</Label><Input type="date" value={form.vencimento} onChange={e => setForm({ ...form, vencimento: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Categoria</Label>
                <Select value={form.categoria} onValueChange={v => setForm({ ...form, categoria: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{categorias.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="recebido">Recebido</SelectItem>
                    <SelectItem value="vencido">Vencido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Observações</Label><Input value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} /></div>
            <Button className="w-full" onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="animate-spin mr-2" size={14} />} Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}