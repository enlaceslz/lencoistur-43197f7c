import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Loader2, Pencil, Trash2, Calendar, Tag, User, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

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
  try { return new Date(d + "T00:00:00").toLocaleDateString("pt-BR"); } catch { return d; }
};

const statusConfig: Record<string, { class: string, icon: any }> = {
  pendente: { class: "bg-amber-100 text-amber-700 border-amber-200", icon: AlertCircle },
  pago: { class: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  vencido: { class: "bg-rose-100 text-rose-700 border-rose-200", icon: AlertCircle },
};

const categorias = ["operacional", "combustivel", "manutencao", "pessoal", "marketing", "tecnologia", "administrativo", "outros"];

interface Conta {
  id: string;
  descricao: string;
  valor: number;
  vencimento: string;
  status: string;
  categoria: string;
  fornecedor: string | null;
  observacoes: string | null;
  pago_em: string | null;
}

const emptyForm = { descricao: "", valor: 0, vencimento: "", categoria: "operacional", fornecedor: "", observacoes: "", status: "pendente" };

export default function ContasPagarTab() {
  const [contas, setContas] = useState<Conta[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Conta | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("contas_pagar").select("*").order("vencimento", { ascending: true });
    if (data) setContas(data as any);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const totalPendente = contas.filter(c => c.status === "pendente").reduce((s, c) => s + c.valor, 0);

  const openNew = () => { setEditing(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (c: Conta) => {
    setEditing(c);
    setForm({ descricao: c.descricao, valor: c.valor, vencimento: c.vencimento, categoria: c.categoria, fornecedor: c.fornecedor || "", observacoes: c.observacoes || "", status: c.status });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.descricao.trim() || !form.vencimento || form.valor <= 0) { toast.error("Preencha os campos obrigatórios."); return; }
    setSaving(true);
    const payload = {
      descricao: form.descricao.trim(),
      valor: form.valor,
      vencimento: form.vencimento,
      categoria: form.categoria,
      fornecedor: form.fornecedor || null,
      observacoes: form.observacoes || null,
      status: form.status,
      pago_em: form.status === "pago" ? new Date().toISOString().slice(0, 10) : null,
    };
    if (editing) {
      const { error } = await supabase.from("contas_pagar").update(payload).eq("id", editing.id);
      if (error) toast.error("Erro ao atualizar."); else toast.success("Conta atualizada!");
    } else {
      const { error } = await supabase.from("contas_pagar").insert(payload);
      if (error) toast.error("Erro ao criar."); else toast.success("Conta criada!");
    }
    setSaving(false); setOpen(false); load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta conta?")) return;
    await supabase.from("contas_pagar").delete().eq("id", id);
    toast.success("Conta excluída."); load();
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={32} /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-foreground">Contas a Pagar</h3>
          <p className="text-sm text-muted-foreground">Gerencie suas despesas e compromissos</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="bg-rose-50 dark:bg-rose-950/20 px-4 py-2 rounded-xl border border-rose-100 dark:border-rose-900/30">
            <p className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 tracking-wider">Total Pendente</p>
            <p className="text-lg font-bold text-rose-700 dark:text-rose-300">{fmt(totalPendente)}</p>
          </div>
          <Button onClick={openNew} className="rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
            <Plus size={18} className="mr-2" /> Novo Registro
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider text-[11px]">Descrição</th>
                  <th className="text-left px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider text-[11px]">Categoria / Fornecedor</th>
                  <th className="text-left px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider text-[11px]">Vencimento</th>
                  <th className="text-left px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider text-[11px]">Status</th>
                  <th className="text-right px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider text-[11px]">Valor</th>
                  <th className="text-right px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider text-[11px]">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                <AnimatePresence>
                  {contas.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-20 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-2 opacity-50">
                          <Tag size={40} />
                          <p>Nenhuma conta registrada.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    contas.map((c, idx) => {
                      const status = statusConfig[c.status] || statusConfig.pendente;
                      const StatusIcon = status.icon;
                      
                      return (
                        <motion.tr 
                          key={c.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="group hover:bg-primary/5 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-foreground group-hover:text-primary transition-colors">{c.descricao}</span>
                              <span className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1 italic">
                                {c.observacoes || "Sem observações"}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              <span className="flex items-center gap-1.5 text-xs font-semibold bg-muted px-2 py-0.5 rounded-full w-fit capitalize">
                                <Tag size={10} className="text-primary" />
                                {c.categoria}
                              </span>
                              <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <User size={10} />
                                {c.fornecedor || "Não informado"}
                              </span>
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
        <DialogContent className="max-w-lg rounded-2xl border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                {editing ? <Pencil size={20} /> : <Plus size={20} />}
              </div>
              {editing ? "Editar" : "Nova"} Conta a Pagar
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Descrição Principal *</Label>
              <Input 
                value={form.descricao} 
                onChange={e => setForm({ ...form, descricao: e.target.value })}
                className="rounded-xl border-muted-foreground/20 focus:ring-primary h-11"
                placeholder="Ex: Aluguel da Loja, Manutenção Van..."
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
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Status do Pagamento</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger className="rounded-xl border-muted-foreground/20 h-11 font-semibold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="pago">Confirmar Pagamento</SelectItem>
                    <SelectItem value="vencido">Vencido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Fornecedor / Empresa</Label>
              <Input 
                value={form.fornecedor} 
                onChange={e => setForm({ ...form, fornecedor: e.target.value })}
                className="rounded-xl border-muted-foreground/20 h-11"
                placeholder="Ex: Posto Lençóis, Oficina do João..."
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Notas Adicionais</Label>
              <Input 
                value={form.observacoes} 
                onChange={e => setForm({ ...form, observacoes: e.target.value })}
                className="rounded-xl border-muted-foreground/20 h-11"
                placeholder="Detalhes relevantes..."
              />
            </div>

            <Button 
              className="w-full h-12 rounded-xl text-base font-bold shadow-lg shadow-primary/20" 
              onClick={handleSave} 
              disabled={saving}
            >
              {saving ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
              {editing ? "Atualizar Registro" : "Cadastrar Conta"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
