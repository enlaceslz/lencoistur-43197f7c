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
  Users, Search, Plus, Edit, Trash2, Loader2, Phone, Mail, User, Wallet, Calendar, CheckCircle2, XCircle, Banknote, Landmark, Clock, FileText, History, LayoutGrid, List, Settings2, Trash
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { maskCPF, maskPhone, maskCEP } from "@/lib/masks";
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

interface CollabType {
  id: string;
  name: string;
  description: string | null;
  color: string;
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
  const [collabTypes, setCollabTypes] = useState<CollabType[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [typesDialogOpen, setTypesDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedCollab, setSelectedCollab] = useState<Collaborator | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [typeForm, setTypeForm] = useState({ name: "", description: "", color: "#3b82f6" });

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
    fetchCollabTypes();
  }, []);

  const fetchCollabTypes = async () => {
    const { data, error } = await supabase.from("collaborator_types").select("*").order("name");
    if (!error) setCollabTypes(data as CollabType[]);
  };

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

  const handleSaveType = async () => {
    if (!typeForm.name) return;
    setSaving(true);
    const { error } = await supabase.from("collaborator_types").insert(typeForm);
    if (error) toast.error("Erro ao salvar tipo");
    else {
      toast.success("Tipo cadastrado!");
      setTypeForm({ name: "", description: "", color: "#3b82f6" });
      fetchCollabTypes();
    }
    setSaving(false);
  };

  const deleteType = async (id: string) => {
    const { error } = await supabase.from("collaborator_types").delete().eq("id", id);
    if (error) toast.error("Erro ao remover tipo");
    else {
      toast.success("Tipo removido!");
      fetchCollabTypes();
    }
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
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setTypesDialogOpen(true)} className="border-slate-200">
            <Settings2 size={16} className="mr-2" /> Tipos
          </Button>
          <Button onClick={openNew} className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20">
            <Plus size={16} className="mr-2" /> Novo Colaborador
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input 
              placeholder="Buscar por nome, e-mail ou documento..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="pl-10" 
            />
          </div>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <Button 
              variant={viewMode === 'cards' ? 'secondary' : 'ghost'} 
              size="sm" 
              onClick={() => setViewMode('cards')}
              className={viewMode === 'cards' ? 'bg-white shadow-sm' : ''}
            >
              <LayoutGrid size={16} className="mr-2" /> Cards
            </Button>
            <Button 
              variant={viewMode === 'table' ? 'secondary' : 'ghost'} 
              size="sm" 
              onClick={() => setViewMode('table')}
              className={viewMode === 'table' ? 'bg-white shadow-sm' : ''}
            >
              <List size={16} className="mr-2" /> Tabela
            </Button>
          </div>
        </CardContent>
      </Card>

      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => (
            <Card key={c.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
                      {c.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{c.name}</h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px] h-4">
                          {c.type || "Outro"}
                        </Badge>
                        <span className="text-xs text-slate-500">{c.document}</span>
                      </div>
                    </div>
                  </div>
                  <Badge className={c.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}>
                    {c.status === 'active' ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone size={14} className="text-slate-400" /> {c.phone || "Não informado"}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Mail size={14} className="text-slate-400" /> {c.email || "Não informado"}
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium text-blue-700">
                    <Wallet size={14} className="text-blue-400" /> {getPaymentTypeLabel(c.payment_type)}: {c.payment_type === 'commission' ? `${c.payment_value}%` : formatCurrency(c.payment_value)}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openNewPayment(c)} title="Lançar Pagamento">
                      <Banknote size={18} className="text-emerald-600" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openHistory(c)} title="Histórico">
                      <History size={18} className="text-blue-600" />
                    </Button>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(c)} title="Editar">
                      <Edit size={18} className="text-slate-600" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(c.id)} title="Excluir">
                      <Trash2 size={18} className="text-red-500" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full py-20 text-center text-slate-500 bg-slate-50 rounded-xl border-2 border-dashed">
              Nenhum colaborador encontrado.
            </div>
          )}
        </div>
      ) : (
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
      )}

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
                  {collabTypes.map(t => (
                    <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
                  ))}
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
              <Input 
                value={form.zip_code} 
                onChange={(e) => setForm({...form, zip_code: maskCEP(e.target.value)})} 
                placeholder="00000-000"
              />
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
