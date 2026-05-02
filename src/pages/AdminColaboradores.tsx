import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Users, Search, Plus, Edit, Trash2, Loader2, Phone, Mail, User, Wallet, Calendar, CheckCircle2, XCircle, Banknote, Landmark, Clock, FileText, History
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { maskCPF, maskPhone } from "@/lib/masks";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Collaborator {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  document: string; // Changed to required
  pix_key: string | null;
  pix_type: string | null;
  status: 'active' | 'inactive';
  payment_type: 'commission' | 'daily' | 'monthly' | 'per_tour';
  payment_value: number;
  observation: string | null;
  type: string;
  birth_date: string | null;
  zip_code: string | null;
  address: string | null;
  cnh: string | null;
  cadastur: string | null;
  created_at: string;
}

interface Payment {
  id: string;
  collaborator_id: string;
  booking_id: string | null;
  amount: number;
  description: string | null;
  status: 'pending' | 'paid' | 'cancelled';
  due_date: string;
  paid_at: string | null;
  created_at: string;
}

const AdminColaboradores = () => {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedCollab, setSelectedCollab] = useState<Collaborator | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "", email: "", phone: "", document: "",
    pix_key: "", pix_type: "cpf", status: "active",
    payment_type: "daily", payment_value: "0", observation: "",
    type: "Outro", birth_date: "", zip_code: "", address: "",
    cnh: "", cadastur: ""
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: "0", description: "", due_date: format(new Date(), "yyyy-MM-dd")
  });

  useEffect(() => {
    fetchCollaborators();
  }, []);

  const fetchCollaborators = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("collaborators").select("*").order("name");
    if (error) toast.error("Erro ao carregar colaboradores");
    else setCollaborators(data as Collaborator[]);
    setLoading(false);
  };

  const fetchPayments = async (collabId: string) => {
    const { data, error } = await supabase
      .from("collaborator_payments")
      .select("*")
      .eq("collaborator_id", collabId)
      .order("created_at", { ascending: false });
    if (error) toast.error("Erro ao carregar histórico");
    else setPayments(data as Payment[]);
  };

  const openNew = () => {
    setSelectedCollab(null);
    setForm({
      name: "", email: "", phone: "", document: "",
      pix_key: "", pix_type: "cpf", status: "active",
      payment_type: "daily", payment_value: "0", observation: "",
      type: "Outro", birth_date: "", zip_code: "", address: "",
      cnh: "", cadastur: ""
    });
    setDialogOpen(true);
  };

  const openEdit = (c: Collaborator) => {
    setSelectedCollab(c);
    setForm({
      name: c.name, email: c.email || "", phone: c.phone || "", document: c.document || "",
      pix_key: c.pix_key || "", pix_type: c.pix_type || "cpf", status: c.status,
      payment_type: c.payment_type, payment_value: String(c.payment_value), observation: c.observation || "",
      type: c.type || "Outro", 
      birth_date: c.birth_date || "", 
      zip_code: c.zip_code || "", 
      address: c.address || "",
      cnh: c.cnh || "", 
      cadastur: c.cadastur || ""
    });
    setDialogOpen(true);
  };

  const openHistory = (c: Collaborator) => {
    setSelectedCollab(c);
    fetchPayments(c.id);
    setHistoryDialogOpen(true);
  };

  const openNewPayment = (c: Collaborator) => {
    setSelectedCollab(c);
    setPaymentForm({
      amount: String(c.payment_value),
      description: `Pagamento ${c.payment_type === 'daily' ? 'Diária' : c.payment_type === 'monthly' ? 'Mensal' : 'Serviço'}`,
      due_date: format(new Date(), "yyyy-MM-dd")
    });
    setPaymentDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name) { toast.error("Nome é obrigatório"); return; }
    if (!form.document) { toast.error("CPF é obrigatório"); return; }
    setSaving(true);
    const payload = {
      ...form,
      payment_value: Number(form.payment_value),
      birth_date: form.birth_date || null
    };

    const { error } = selectedCollab 
      ? await supabase.from("collaborators").update(payload).eq("id", selectedCollab.id)
      : await supabase.from("collaborators").insert(payload);

    if (error) toast.error("Erro ao salvar colaborador");
    else {
      toast.success(selectedCollab ? "Atualizado com sucesso" : "Cadastrado com sucesso");
      setDialogOpen(false);
      fetchCollaborators();
    }
    setSaving(false);
  };

  const handleSavePayment = async () => {
    if (!selectedCollab) return;
    setSaving(true);
    const payload = {
      collaborator_id: selectedCollab.id,
      amount: Number(paymentForm.amount),
      description: paymentForm.description,
      due_date: paymentForm.due_date,
      status: 'pending'
    };

    // First, insert into collaborator_payments
    const { data: payData, error: payError } = await supabase.from("collaborator_payments").insert(payload).select().single();

    if (payError) {
      toast.error("Erro ao lançar pagamento");
    } else {
      // Then, launch into financial (contas_pagar)
      const { error: finError } = await supabase.from("contas_pagar").insert({
        descricao: `Colaborador: ${selectedCollab.name} - ${paymentForm.description}`,
        valor: Number(paymentForm.amount),
        vencimento: paymentForm.due_date,
        categoria: "Mão de Obra",
        status: "pendente"
      });

      if (finError) toast.error("Erro ao integrar com financeiro");
      else {
        toast.success("Pagamento lançado e integrado ao financeiro!");
        setPaymentDialogOpen(false);
      }
    }
    setSaving(false);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("collaborators").delete().eq("id", deleteId);
    if (error) toast.error("Erro ao remover");
    else { toast.success("Removido com sucesso"); fetchCollaborators(); }
    setDeleteId(null);
  };

  const filtered = collaborators.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.email || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.document || "").includes(search)
  );

  const getPaymentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      commission: "Comissão %",
      daily: "Diária R$",
      monthly: "Mensal R$",
      per_tour: "Por Passeio R$"
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <AdminLayout title="Colaboradores">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-blue-600" size={32} />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Colaboradores">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-sm text-muted-foreground">
            Gerencie sua equipe, pagamentos e integrações financeiras.
          </p>
        </div>
        <Button onClick={openNew} className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20">
          <Plus size={16} className="mr-2" /> Novo Colaborador
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input 
              placeholder="Buscar por nome, e-mail ou documento..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="pl-10" 
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Colaborador</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Remuneração</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    Nenhum colaborador encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                          {c.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-sm">{c.name}</p>
                          <div className="flex gap-2">
                            <Badge variant="outline" className="text-[9px] h-4 px-1 leading-none bg-slate-50">
                              {c.type || "Outro"}
                            </Badge>
                            <p className="text-[10px] text-muted-foreground">{c.document || "S/ Documento"}</p>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-xs">
                          <Phone size={10} className="text-muted-foreground" /> {c.phone || "—"}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs">
                          <Mail size={10} className="text-muted-foreground" /> {c.email || "—"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium">{getPaymentTypeLabel(c.payment_type)}</p>
                        <p className="text-xs text-blue-600 font-bold">
                          {c.payment_type === 'commission' ? `${c.payment_value}%` : formatCurrency(c.payment_value)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={c.status === 'active' ? 'default' : 'secondary'} className={c.status === 'active' ? 'bg-green-100 text-green-700' : ''}>
                        {c.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" title="Lançar Pagamento" onClick={() => openNewPayment(c)}>
                          <Banknote size={16} className="text-emerald-600" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Histórico" onClick={() => openHistory(c)}>
                          <History size={16} className="text-blue-600" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Editar" onClick={() => openEdit(c)}>
                          <Edit size={16} className="text-slate-600" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Excluir" onClick={() => setDeleteId(c.id)}>
                          <Trash2 size={16} className="text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Collaborator Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedCollab ? "Editar Colaborador" : "Novo Colaborador"}</DialogTitle>
          </DialogHeader>
          <div className="grid md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Nome Completo</Label>
              <Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>CPF (Obrigatório)</Label>
              <Input value={form.document} onChange={(e) => setForm({...form, document: maskCPF(e.target.value)})} />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Colaborador</Label>
              <Select value={form.type} onValueChange={(v: any) => setForm({...form, type: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Guia">Guia</SelectItem>
                  <SelectItem value="Motorista">Motorista</SelectItem>
                  <SelectItem value="Vendedor">Vendedor</SelectItem>
                  <SelectItem value="Freelancer">Freelancer</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data de Nascimento</Label>
              <Input type="date" value={form.birth_date} onChange={(e) => setForm({...form, birth_date: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input value={form.phone} onChange={(e) => setForm({...form, phone: maskPhone(e.target.value)})} />
            </div>
            <div className="space-y-2">
              <Label>CEP</Label>
              <Input value={form.zip_code} onChange={(e) => setForm({...form, zip_code: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Endereço Completo</Label>
              <Input value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>CNH</Label>
              <Input value={form.cnh} onChange={(e) => setForm({...form, cnh: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>CADASTUR</Label>
              <Input value={form.cadastur} onChange={(e) => setForm({...form, cadastur: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Remuneração</Label>
              <Select value={form.payment_type} onValueChange={(v: any) => setForm({...form, payment_type: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="commission">Comissão %</SelectItem>
                  <SelectItem value="daily">Diária R$</SelectItem>
                  <SelectItem value="monthly">Mensal R$</SelectItem>
                  <SelectItem value="per_tour">Por Passeio R$</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Valor Base (R$ ou %)</Label>
              <Input type="number" value={form.payment_value} onChange={(e) => setForm({...form, payment_value: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Chave PIX</Label>
              <Input value={form.pix_key} onChange={(e) => setForm({...form, pix_key: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v: any) => setForm({...form, status: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label>Observações</Label>
              <Textarea value={form.observation} onChange={(e) => setForm({...form, observation: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
              {saving ? <Loader2 className="animate-spin mr-2" size={16} /> : <CheckCircle2 size={16} className="mr-2" />}
              {selectedCollab ? "Salvar Alterações" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Histórico de Pagamentos: {selectedCollab?.name}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-muted-foreground text-xs">
                      Nenhum histórico encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-xs">{format(new Date(p.due_date), "dd/MM/yyyy")}</TableCell>
                      <TableCell className="text-xs">{p.description}</TableCell>
                      <TableCell className="text-xs font-bold">{formatCurrency(p.amount)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={p.status === 'paid' ? 'border-green-500 text-green-600' : 'border-amber-500 text-amber-600'}>
                          {p.status === 'paid' ? 'Pago' : 'Pendente'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* Launch Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lançar Pagamento para {selectedCollab?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Valor do Pagamento</Label>
              <Input type="number" value={paymentForm.amount} onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Descrição / Referência</Label>
              <Input value={paymentForm.description} onChange={(e) => setPaymentForm({...paymentForm, description: e.target.value})} placeholder="Ex: Diária 02/05" />
            </div>
            <div className="space-y-2">
              <Label>Data de Vencimento</Label>
              <Input type="date" value={paymentForm.due_date} onChange={(e) => setPaymentForm({...paymentForm, due_date: e.target.value})} />
            </div>
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
              <p className="text-xs text-blue-700 font-medium flex items-center gap-2">
                <Landmark size={14} /> Este lançamento será enviado automaticamente para o módulo Financeiro (Contas a Pagar).
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSavePayment} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {saving ? <Loader2 className="animate-spin mr-2" size={16} /> : <Banknote size={16} className="mr-2" />}
              Lançar no Financeiro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Colaborador?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso removerá o colaborador e todo o seu histórico.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminColaboradores;
