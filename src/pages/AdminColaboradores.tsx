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
  Users, Search, Plus, Edit, Trash2, Loader2, Phone, Mail, User, Wallet, Calendar, CheckCircle2, XCircle, Banknote, Landmark, Clock, FileText, History, LayoutGrid, List, Settings2, Trash, Camera, Upload, ExternalLink, Download
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { maskCPF, maskPhone, maskCEP, maskCurrency, parseCurrencyToNumber } from "@/lib/masks";
import { formatCurrency, validateCPF } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Collaborator {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  document: string;
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
  avatar_url: string | null;
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
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedCollab, setSelectedCollab] = useState<Collaborator | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [typeForm, setTypeForm] = useState({ name: "", description: "", color: "#3b82f6" });

  const [form, setForm] = useState({
    name: "", email: "", phone: "", document: "",
    pix_key: "", pix_type: "cpf", status: "active",
    payment_type: "daily" as 'commission' | 'daily' | 'monthly' | 'per_tour', 
    payment_value: "0", observation: "",
    type: "Outro", birth_date: "", zip_code: "", address: "",
    cnh: "", cadastur: "", avatar_url: ""
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
      .select("*, bookings(booking_code, item_name)")
      .eq("collaborator_id", collabId)
      .order("created_at", { ascending: false });
    if (error) toast.error("Erro ao carregar histórico");
    else setPayments(data as any[]);
  };

  const openNew = () => {
    setSelectedCollab(null);
    setForm({
      name: "", email: "", phone: "", document: "",
      pix_key: "", pix_type: "cpf", status: "active",
      payment_type: "daily", payment_value: "R$ 0,00", observation: "",
      type: "Outro", birth_date: "", zip_code: "", address: "",
      cnh: "", cadastur: "", avatar_url: ""
    });
    setDialogOpen(true);
  };

  const openEdit = (c: Collaborator) => {
    setSelectedCollab(c);
    setForm({
      name: c.name, email: c.email || "", phone: c.phone || "", document: c.document || "",
      pix_key: c.pix_key || "", pix_type: c.pix_type || "cpf", status: c.status,
      payment_type: c.payment_type, 
      payment_value: c.payment_type === 'commission' ? String(c.payment_value) : maskCurrency(String(c.payment_value)), 
      observation: c.observation || "",
      type: c.type || "Outro", 
      birth_date: c.birth_date || "", 
      zip_code: c.zip_code || "", 
      address: c.address || "",
      cnh: c.cnh || "", 
      cadastur: c.cadastur || "",
      avatar_url: c.avatar_url || ""
    });
    setDialogOpen(true);
  };

  const openDetails = (c: Collaborator) => {
    setSelectedCollab(c);
    setDetailsDialogOpen(true);
  };

  const openHistory = (c: Collaborator) => {
    setSelectedCollab(c);
    fetchPayments(c.id);
    setHistoryDialogOpen(true);
  };

  const openNewPayment = (c: Collaborator) => {
    setSelectedCollab(c);
    setPaymentForm({
      amount: maskCurrency(String(c.payment_value)),
      description: `Pagamento ${c.payment_type === 'daily' ? 'Diária' : c.payment_type === 'monthly' ? 'Mensal' : 'Serviço'}`,
      due_date: format(new Date(), "yyyy-MM-dd")
    });
    setPaymentDialogOpen(true);
  };

  const handleCepSearch = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setForm(prev => ({
            ...prev,
            address: `${data.logradouro}${data.bairro ? `, ${data.bairro}` : ""}${data.localidade ? ` - ${data.localidade}/${data.uf}` : ""}`
          }));
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
      }
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const filePath = `${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setForm(prev => ({ ...prev, avatar_url: publicUrl }));
      toast.success("Foto carregada com sucesso!");
    } catch (error: any) {
      toast.error("Erro no upload: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name) { toast.error("Nome é obrigatório"); return; }
    if (!form.document) { toast.error("CPF é obrigatório"); return; }
    if (!validateCPF(form.document)) { toast.error("CPF inválido"); return; }
    
    setSaving(true);
    const paymentValue = form.payment_type === 'commission' 
      ? Number(form.payment_value.replace(",", ".")) 
      : parseCurrencyToNumber(form.payment_value);

    const payload = {
      ...form,
      payment_value: paymentValue,
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
    const amount = parseCurrencyToNumber(paymentForm.amount);
    const payload = {
      collaborator_id: selectedCollab.id,
      amount: amount,
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
        valor: parseCurrencyToNumber(paymentForm.amount),
        vencimento: paymentForm.due_date,
        categoria: "Mão de Obra",
        status: "pendente",
        collaborator_id: selectedCollab.id
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
    (c.document || "").includes(search) ||
    (c.type || "").toLowerCase().includes(search.toLowerCase())
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
            <span className="font-semibold text-foreground">{collaborators.length}</span> colaboradores cadastrados · <span className="font-semibold text-green-600">{collaborators.filter(c => c.status === 'active').length}</span> ativos
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-full h-9 border-slate-200" onClick={() => {
            const header = "Nome,Email,Telefone,Documento,Tipo,Status,Remuneração\n";
            const rows = filtered.map(c => `"${c.name}","${c.email || ''}","${c.phone || ''}","${c.document}","${c.type}","${c.status}","${getPaymentTypeLabel(c.payment_type)}: ${formatCurrency(c.payment_value)}"`).join("\n");
            const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `colaboradores_${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
          }}>
            <Download size={16} className="mr-1.5" /> Exportar CSV
          </Button>
          <Button variant="outline" size="sm" className="rounded-full h-9 border-slate-200" onClick={() => setTypesDialogOpen(true)}>
            <Settings2 size={16} className="mr-1.5" /> Gerenciar Tipos
          </Button>
          <Button onClick={openNew} size="sm" className="rounded-full h-9 px-5 bg-primary hover:bg-primary/90 shadow-md transition-all">
            <Plus size={16} className="mr-1.5" /> Novo Colaborador
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
        <Button 
          variant={!search ? "default" : "outline"} 
          size="sm" 
          onClick={() => setSearch("")} 
          className={`rounded-full px-6 h-10 shadow-sm transition-all duration-300 ${!search ? "bg-primary text-primary-foreground scale-105" : "hover:bg-primary/5 hover:border-primary/30"}`}
        >
          Todos
        </Button>
        {collabTypes.map((t) => (
          <Button 
            key={t.id} 
            variant={search === t.name ? "default" : "outline"} 
            size="sm" 
            onClick={() => setSearch(t.name)}
            className={`rounded-full px-6 h-10 shadow-sm transition-all duration-300 ${search === t.name ? "scale-105" : "hover:bg-primary/5 hover:border-primary/30"}`}
            style={search === t.name ? { backgroundColor: t.color, borderColor: t.color } : {}}
          >
            <Users size={14} className="mr-2 opacity-70" />
            {t.name}
            <span className="ml-2 bg-black/10 px-2 py-0.5 rounded-full text-[10px]">
              {collaborators.filter(c => c.type === t.name).length}
            </span>
          </Button>
        ))}
      </div>

      <Card className="mb-8 border-none shadow-lg bg-white/80 backdrop-blur-md overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />
        <CardContent className="p-6 flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="relative flex-1 w-full group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
            <Input 
              placeholder="Buscar por nome, e-mail ou documento..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="pl-12 h-12 bg-white border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all rounded-2xl shadow-sm" 
            />
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="h-10 w-px bg-slate-200 hidden md:block" />
            
            <div className="flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-2xl shadow-inner w-full md:w-auto justify-center">
              <Button 
                variant={viewMode === 'cards' ? 'secondary' : 'ghost'} 
                size="sm" 
                onClick={() => setViewMode('cards')}
                className={`h-9 px-4 rounded-xl transition-all duration-300 ${viewMode === 'cards' ? 'bg-white text-primary shadow-sm font-bold' : 'text-slate-500'}`}
              >
                <LayoutGrid size={16} className="mr-2" />
                Cards
              </Button>
              <Button 
                variant={viewMode === 'table' ? 'secondary' : 'ghost'} 
                size="sm" 
                onClick={() => setViewMode('table')}
                className={`h-9 px-4 rounded-xl transition-all duration-300 ${viewMode === 'table' ? 'bg-white text-primary shadow-sm font-bold' : 'text-slate-500'}`}
              >
                <List size={16} className="mr-2" />
                Lista
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(c => (
            <Card key={c.id} className="overflow-hidden border-none shadow-md hover:shadow-2xl transition-all duration-500 group relative bg-white flex flex-col h-full rounded-3xl">
              <div className="absolute top-0 left-0 w-full h-2 bg-slate-100 group-hover:bg-primary/20 transition-colors" />
              
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-6">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-3xl overflow-hidden bg-slate-50 border-2 border-slate-100 flex items-center justify-center font-bold text-2xl shadow-inner group-hover:scale-105 transition-transform duration-500 group-hover:border-primary/20">
                      {c.avatar_url ? (
                        <img src={c.avatar_url} alt={c.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-primary/40 group-hover:text-primary transition-colors">{c.name.substring(0, 2).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="absolute -bottom-2 -right-2">
                      <Badge variant={c.status === 'active' ? 'default' : 'secondary'} className={`rounded-full w-6 h-6 p-0 flex items-center justify-center border-2 border-white shadow-sm ${c.status === 'active' ? 'bg-green-500' : 'bg-slate-300'}`}>
                        {c.status === 'active' ? <CheckCircle2 size={12} className="text-white" /> : <XCircle size={12} className="text-white" />}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-slate-100 text-slate-600 border-none rounded-full group-hover:bg-primary group-hover:text-white transition-all duration-300">
                      {c.type || "Outro"}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-mono bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">{c.document}</span>
                  </div>
                </div>

                <h3 className="font-black text-xl text-slate-800 truncate cursor-pointer hover:text-primary transition-colors mb-4 group-hover:translate-x-1 duration-300" onClick={() => openDetails(c)}>
                  {c.name}
                </h3>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-slate-600 group/item">
                    <div className="p-2 rounded-xl bg-slate-50 text-slate-400 group-hover/item:bg-primary/10 group-hover/item:text-primary transition-colors">
                      <Phone size={14} />
                    </div>
                    <span className="text-sm font-semibold">{c.phone || "—"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600 group/item">
                    <div className="p-2 rounded-xl bg-slate-50 text-slate-400 group-hover/item:bg-primary/10 group-hover/item:text-primary transition-colors">
                      <Mail size={14} />
                    </div>
                    <span className="text-sm font-semibold truncate max-w-[180px]">{c.email || "—"}</span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 p-4 rounded-2xl border border-slate-100 group-hover:border-primary/10 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider">{getPaymentTypeLabel(c.payment_type)}</span>
                    <Wallet size={12} className="text-slate-300 group-hover:text-primary/40" />
                  </div>
                  <p className="text-lg font-black text-slate-700 group-hover:text-primary transition-colors leading-none">
                    {c.payment_type === 'commission' ? `${c.payment_value}%` : formatCurrency(c.payment_value)}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-50/50 flex items-center justify-between border-t border-slate-100 rounded-b-3xl">
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl hover:bg-emerald-50 hover:text-emerald-600 transition-all text-slate-400" onClick={() => openNewPayment(c)} title="Lançar Pagamento">
                    <Banknote size={18} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl hover:bg-blue-50 hover:text-blue-600 transition-all text-slate-400" onClick={() => openHistory(c)} title="Histórico">
                    <History size={18} />
                  </Button>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl hover:bg-slate-200 transition-all text-slate-400 hover:text-slate-900" onClick={() => openEdit(c)} title="Editar">
                    <Edit size={18} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl hover:bg-red-50 hover:text-red-600 transition-all text-slate-400" onClick={() => setDeleteId(c.id)} title="Excluir">
                    <Trash2 size={18} />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full py-32 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200 shadow-sm">
              <div className="inline-flex p-6 rounded-full bg-slate-50 mb-4">
                <Users size={48} className="text-slate-200" />
              </div>
              <p className="text-lg font-bold text-slate-400">Nenhum colaborador encontrado.</p>
              <Button variant="link" onClick={() => setSearch("")} className="mt-2 text-primary">Limpar filtros</Button>
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
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                            {c.avatar_url ? (
                              <img src={c.avatar_url} alt={c.name} className="w-full h-full object-cover" />
                            ) : (
                              c.name.substring(0, 2).toUpperCase()
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-sm cursor-pointer hover:text-blue-600 transition-colors flex items-center gap-1" onClick={() => openDetails(c)}>
                              {c.name}
                              <FileText size={12} className="text-slate-400" />
                            </p>
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
            <div className="md:col-span-2 flex flex-col items-center justify-center space-y-4 mb-4 pb-4 border-b">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-slate-100 border-2 border-slate-200 flex items-center justify-center">
                  {form.avatar_url ? (
                    <img src={form.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User size={64} className="text-slate-300" />
                  )}
                </div>
                <label className="absolute bottom-0 right-0 p-2 bg-blue-600 rounded-full text-white cursor-pointer hover:bg-blue-700 transition-colors shadow-lg group-hover:scale-110 transition-transform">
                  <Camera size={18} />
                  <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} />
                </label>
                {uploading && (
                  <div className="absolute inset-0 bg-white/60 rounded-full flex items-center justify-center">
                    <Loader2 className="animate-spin text-blue-600" size={32} />
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Clique na câmera para enviar uma foto</p>
            </div>
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
                onChange={(e) => {
                  const masked = maskCEP(e.target.value);
                  setForm({...form, zip_code: masked});
                  if (masked.length === 9) handleCepSearch(masked);
                }} 
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
              <Input 
                value={form.payment_value} 
                onChange={(e) => {
                  const val = e.target.value;
                  if (form.payment_type === 'commission') {
                    setForm({...form, payment_value: val.replace(/[^0-9,.]/g, '')});
                  } else {
                    setForm({...form, payment_value: maskCurrency(val)});
                  }
                }} 
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Chave PIX</Label>
              <Select value={form.pix_type} onValueChange={(v: any) => setForm({...form, pix_type: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cpf">CPF</SelectItem>
                  <SelectItem value="cnpj">CNPJ</SelectItem>
                  <SelectItem value="email">E-mail</SelectItem>
                  <SelectItem value="phone">Telefone</SelectItem>
                  <SelectItem value="random">Chave Aleatória</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Chave PIX</Label>
              <Input 
                value={form.pix_key} 
                onChange={(e) => {
                  let val = e.target.value;
                  if (form.pix_type === 'cpf') val = maskCPF(val);
                  else if (form.pix_type === 'phone') val = maskPhone(val);
                  setForm({...form, pix_key: val});
                }} 
                placeholder={form.pix_type === 'cpf' ? "000.000.000-00" : form.pix_type === 'phone' ? "(00) 00000-0000" : "Digite a chave"}
              />
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
                  <TableHead>Referência</TableHead>
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
                  payments.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-xs">{format(new Date(p.due_date), "dd/MM/yyyy")}</TableCell>
                      <TableCell className="text-xs">
                        <div className="flex flex-col">
                          <span>{p.description}</span>
                          {p.bookings?.booking_code && (
                            <span className="text-[10px] text-primary font-mono font-bold flex items-center gap-1 mt-0.5">
                              <ExternalLink size={10} /> {p.bookings.booking_code}
                            </span>
                          )}
                        </div>
                      </TableCell>
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
              <Input 
                value={paymentForm.amount} 
                onChange={(e) => setPaymentForm({...paymentForm, amount: maskCurrency(e.target.value)})} 
              />
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

      {/* Manage Types Dialog */}
      <Dialog open={typesDialogOpen} onOpenChange={setTypesDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Gerenciar Tipos de Colaborador</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <div className="flex-1 space-y-2">
                <Label>Novo Tipo</Label>
                <Input 
                  placeholder="Ex: Guia, Motorista..." 
                  value={typeForm.name} 
                  onChange={(e) => setTypeForm({...typeForm, name: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label>Cor</Label>
                <Input 
                  type="color" 
                  className="w-12 h-10 p-1" 
                  value={typeForm.color} 
                  onChange={(e) => setTypeForm({...typeForm, color: e.target.value})} 
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleSaveType} disabled={saving} size="icon">
                  {saving ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                </Button>
              </div>
            </div>

            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableBody>
                  {collabTypes.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }} />
                        <span className="font-medium">{t.name}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => deleteType(t.id)}>
                          <Trash size={14} className="text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {collabTypes.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center py-4 text-muted-foreground text-xs">
                        Nenhum tipo cadastrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Collaborator Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Colaborador</DialogTitle>
          </DialogHeader>
          {selectedCollab && (
            <div className="space-y-6 py-4">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-slate-100 border-2 border-slate-200">
                  {selectedCollab.avatar_url ? (
                    <img src={selectedCollab.avatar_url} alt={selectedCollab.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 font-bold text-4xl">
                      {selectedCollab.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-2xl font-bold text-slate-900">{selectedCollab.name}</h2>
                  <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-2">
                    <Badge className={selectedCollab.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}>
                      {selectedCollab.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Badge>
                    <Badge variant="secondary">{selectedCollab.type || "Outro"}</Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 pt-4 border-t">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Documento (CPF)</p>
                  <p className="text-sm font-medium">{selectedCollab.document}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Data de Nascimento</p>
                  <p className="text-sm font-medium">{selectedCollab.birth_date ? format(new Date(selectedCollab.birth_date), "dd/MM/yyyy") : "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Telefone</p>
                  <p className="text-sm font-medium">{selectedCollab.phone || "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">E-mail</p>
                  <p className="text-sm font-medium">{selectedCollab.email || "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Endereço</p>
                  <p className="text-sm font-medium">{selectedCollab.address || "—"} {selectedCollab.zip_code ? `(${selectedCollab.zip_code})` : ""}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Remuneração</p>
                  <p className="text-sm font-medium">{getPaymentTypeLabel(selectedCollab.payment_type)}: {selectedCollab.payment_type === 'commission' ? `${selectedCollab.payment_value}%` : formatCurrency(selectedCollab.payment_value)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">PIX ({selectedCollab.pix_type})</p>
                  <p className="text-sm font-medium">{selectedCollab.pix_key || "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">CNH / CADASTUR</p>
                  <p className="text-sm font-medium">{selectedCollab.cnh || "—"} / {selectedCollab.cadastur || "—"}</p>
                </div>
                {selectedCollab.observation && (
                  <div className="md:col-span-2 space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-semibold">Observações</p>
                    <p className="text-sm font-medium">{selectedCollab.observation}</p>
                  </div>
                )}
                {selectedCollab && (
                  <div className="md:col-span-2 pt-4 border-t">
                    <p className="text-xs text-muted-foreground uppercase font-semibold mb-3">Últimos Lançamentos</p>
                    <div className="max-h-[200px] overflow-y-auto rounded-md border">
                      <Table>
                        <TableBody>
                          {payments.slice(0, 5).map((p) => (
                            <TableRow key={p.id}>
                              <TableCell className="py-2 text-[10px]">{format(new Date(p.due_date), "dd/MM/yy")}</TableCell>
                              <TableCell className="py-2 text-[10px] truncate max-w-[150px]">{p.description}</TableCell>
                              <TableCell className="py-2 text-[10px] font-bold text-right">{formatCurrency(p.amount)}</TableCell>
                              <TableCell className="py-2 text-right">
                                <Badge variant="outline" className={`text-[8px] h-4 px-1 ${p.status === 'paid' ? 'border-green-500 text-green-600' : 'border-amber-500 text-amber-600'}`}>
                                  {p.status === 'paid' ? 'Pago' : 'Pend'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                          {payments.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-4 text-xs text-muted-foreground">Nenhum lançamento.</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>Fechar</Button>
            <Button onClick={() => { setDetailsDialogOpen(false); openEdit(selectedCollab!); }} className="bg-blue-600">Editar</Button>
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
