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
  Users, Search, Plus, Edit, Trash2, Loader2, Phone, Mail, User, Wallet, Calendar, CheckCircle2, XCircle, Banknote, Landmark, Clock, FileText, History, LayoutGrid, List, Settings2, Trash, Camera, Upload, ExternalLink, Download, FileDown
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { maskCPF, maskPhone, maskCEP, maskCurrency, parseCurrencyToNumber } from "@/lib/masks";
import { formatCurrency, validateCPF } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

  const generatePDF = () => {
    try {
      const doc = new jsPDF();
      const dateStr = format(new Date(), "dd/MM/yyyy HH:mm");
      
      // Header
      doc.setFontSize(20);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text("Relatório de Colaboradores", 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text(`Lençóis Tour - Gerado em ${dateStr}`, 14, 30);
      doc.text(`Filtro atual: ${search || 'Todos'}`, 14, 35);
      
      const tableData = filtered.map(c => [
        c.name,
        c.type || "Outro",
        c.phone || "—",
        c.document || "—",
        c.status === 'active' ? 'Ativo' : 'Inativo',
        `${getPaymentTypeLabel(c.payment_type)}: ${c.payment_type === 'commission' ? `${c.payment_value}%` : formatCurrency(c.payment_value)}`
      ]);

      autoTable(doc, {
        startY: 45,
        head: [['Nome', 'Categoria', 'Telefone', 'Documento', 'Status', 'Remuneração']],
        body: tableData,
        theme: 'striped',
        headStyles: {
          fillColor: [37, 99, 235], // blue-600
          textColor: 255,
          fontSize: 10,
          fontStyle: 'bold',
          halign: 'left'
        },
        bodyStyles: {
          fontSize: 9,
          textColor: 51,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252], // slate-50
        },
        margin: { top: 45 },
        didDrawPage: (data) => {
          // Footer
          const pageCount = doc.getNumberOfPages();
          doc.setFontSize(8);
          doc.setTextColor(148, 163, 184); // slate-400
          doc.text(
            `Página ${data.pageNumber} de ${pageCount}`,
            data.settings.margin.left,
            doc.internal.pageSize.height - 10
          );
        }
      });

      doc.save(`colaboradores_${format(new Date(), "dd-MM-yyyy")}.pdf`);
      toast.success("PDF gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar PDF");
    }
  };

  const getPaymentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      commission: "Comissão",
      daily: "Diária",
      monthly: "Mensal",
      per_tour: "Por Passeio"
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
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 mb-10 glass-card p-8 rounded-[2.5rem] animate-in-fade" style={{ animationDelay: '0.1s' }}>
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-2">Equipe Interna e Operacional</p>
          <h1 className="text-4xl font-black text-foreground tracking-tight leading-none">Colaboradores</h1>
          <div className="flex items-center gap-3 mt-4">
            <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
              <Users size={12} /> {collaborators.length} Especialistas
            </div>
            <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
              <CheckCircle2 size={12} /> {collaborators.filter(c => c.status === 'active').length} Ativos
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[320px] group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-primary transition-colors" size={20} />
            <input 
              placeholder="Pesquisar colaborador por nome ou cargo..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="w-full pl-14 h-14 rounded-2xl border border-border/40 focus:ring-4 focus:ring-primary/10 bg-muted/20 transition-all font-medium text-sm outline-none placeholder:text-muted-foreground/40" 
            />
          </div>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="rounded-xl h-12 w-12 border-slate-200 bg-white hover:bg-slate-50 transition-all shadow-sm" 
                    onClick={generatePDF}
                  >
                    <FileDown size={20} className="text-rose-500" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Relatório PDF</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <Button variant="outline" size="sm" className="rounded-2xl h-12 px-5 border-slate-200 bg-white hover:bg-slate-50 transition-all font-bold text-slate-600 shadow-sm hidden sm:flex" onClick={() => setTypesDialogOpen(true)}>
              <Settings2 size={18} className="mr-2" /> Categorias
            </Button>
            
            <Button onClick={openNew} size="lg" className="rounded-2xl h-12 px-8 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all font-black text-white active:scale-95">
              <Plus size={20} className="mr-2" strokeWidth={3} /> Novo
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-10 overflow-x-auto pb-4 no-scrollbar scroll-smooth animate-in-fade" style={{ animationDelay: '0.15s' }}>
        <button
          onClick={() => setSearch("")} 
          className={`text-[10px] font-black uppercase tracking-widest px-8 h-12 rounded-2xl transition-all whitespace-nowrap shadow-lg shadow-primary/5 ${
            !search
              ? "bg-primary text-primary-foreground shadow-primary/20 scale-105"
              : "glass-card text-muted-foreground hover:bg-muted/80"
          }`}
        >
          Todos Especialistas
        </button>
        {collabTypes.map((t) => {
          const isActive = search === t.name;
          const count = collaborators.filter(c => c.type === t.name).length;
          return (
            <button 
              key={t.id} 
              onClick={() => setSearch(t.name)}
              className={`flex items-center gap-3 px-8 h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap shadow-lg shadow-primary/5 ${
                isActive 
                  ? "bg-primary text-primary-foreground shadow-primary/20 scale-105" 
                  : "glass-card text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <Users size={16} strokeWidth={2.5} className={isActive ? "text-white" : "text-primary/40"} />
              {t.name}
              <span className={`ml-2 px-2.5 py-0.5 rounded-lg text-[9px] ${isActive ? "bg-white/20 text-white" : "bg-primary/10 text-primary"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mb-10 glass-card rounded-[2.5rem] p-8 shadow-sm animate-in-fade" style={{ animationDelay: '0.2s' }}>
        <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="relative flex-1 w-full group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-primary transition-colors" size={20} />
            <input 
              placeholder="Pesquisar por nome, e-mail ou documento..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="w-full pl-14 h-14 rounded-2xl border border-border/40 focus:ring-4 focus:ring-primary/10 bg-muted/20 transition-all font-medium text-sm outline-none placeholder:text-muted-foreground/40" 
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
        </div>
      </div>

      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(c => (
            <div key={c.id} className="overflow-hidden border-none glass-card admin-card-hover group relative flex flex-col h-full rounded-[2.5rem] animate-in-fade">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-primary/5 group-hover:bg-primary/20 transition-colors" />
              
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
            </div>
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
        <div className="glass-card rounded-[2.5rem] overflow-hidden border-none shadow-sm animate-in-fade" style={{ animationDelay: '0.3s' }}>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/20">
                  <TableHead className="font-black text-slate-400 uppercase tracking-widest text-[10px] py-6 pl-8">Especialista</TableHead>
                  <TableHead className="font-black text-slate-400 uppercase tracking-widest text-[10px] py-6">Contato</TableHead>
                  <TableHead className="font-black text-slate-400 uppercase tracking-widest text-[10px] py-6">Remuneração</TableHead>
                  <TableHead className="font-black text-slate-400 uppercase tracking-widest text-[10px] py-6">Status</TableHead>
                  <TableHead className="font-black text-slate-400 uppercase tracking-widest text-[10px] py-6 pr-8 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-20 text-slate-400 font-medium">
                      Nenhum colaborador encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((c) => (
                    <TableRow key={c.id} className="group hover:bg-slate-50/50 transition-colors border-slate-100">
                      <TableCell className="py-4 pl-8">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-100 text-slate-400 flex items-center justify-center font-bold text-sm shadow-inner group-hover:scale-110 transition-transform duration-300">
                            {c.avatar_url ? (
                              <img src={c.avatar_url} alt={c.name} className="w-full h-full object-cover" />
                            ) : (
                              c.name.substring(0, 2).toUpperCase()
                            )}
                          </div>
                          <div>
                            <p className="font-black text-slate-700 group-hover:text-primary transition-colors cursor-pointer" onClick={() => openDetails(c)}>
                              {c.name}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge variant="secondary" className="text-[9px] h-4 px-1.5 font-bold uppercase tracking-tighter bg-slate-100 text-slate-500 border-none group-hover:bg-primary group-hover:text-white transition-colors">
                                {c.type || "Outro"}
                              </Badge>
                              <p className="text-[10px] font-mono text-slate-400">{c.document || "S/ Documento"}</p>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                            <Phone size={12} className="text-slate-300" /> {c.phone || "—"}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400">
                            <Mail size={12} className="text-slate-300" /> {c.email || "—"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 inline-block group-hover:border-primary/20 transition-colors">
                          <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">{getPaymentTypeLabel(c.payment_type)}</p>
                          <p className="text-sm font-black text-slate-700 leading-none">
                            {c.payment_type === 'commission' ? `${c.payment_value}%` : formatCurrency(c.payment_value)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge variant={c.status === 'active' ? 'default' : 'secondary'} className={`rounded-full px-3 py-0.5 text-[10px] font-black uppercase tracking-widest ${c.status === 'active' ? 'bg-green-500 text-white shadow-sm' : 'bg-slate-200 text-slate-500'}`}>
                          {c.status === 'active' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 pr-8 text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 transition-all text-slate-400" title="Lançar Pagamento" onClick={() => openNewPayment(c)}>
                            <Banknote size={16} />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all text-slate-400" title="Histórico" onClick={() => openHistory(c)}>
                            <History size={16} />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-slate-200 transition-all text-slate-400 hover:text-slate-900" title="Editar" onClick={() => openEdit(c)}>
                            <Edit size={16} />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all text-slate-400" title="Excluir" onClick={() => setDeleteId(c.id)}>
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Collaborator Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-3xl w-[95vw] max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl rounded-3xl overflow-hidden bg-[#F8FAFC]">
          <div className="bg-white border-b border-slate-100 p-4 md:p-6 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <Users size={20} className="md:w-6 md:h-6" />
              </div>
              <div>
                <DialogTitle className="text-lg md:text-xl font-black text-slate-900 leading-none mb-1">
                  {selectedCollab ? "Editar Colaborador" : "Novo Colaborador"}
                </DialogTitle>
                <p className="text-[11px] md:text-sm text-slate-500 font-medium">Dados profissionais e financeiros do especialista</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setDialogOpen(false)} className="rounded-full hover:bg-slate-100 transition-colors">
              <XCircle size={20} className="text-slate-400" />
            </Button>
          </div>

          <div className="p-4 md:p-8 space-y-6 md:space-y-8">
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
          </div>
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

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-lg w-[95vw] max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl rounded-3xl overflow-hidden bg-[#F8FAFC]">
          <div className="bg-white border-b border-slate-100 p-4 md:p-6 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                <Banknote size={20} className="md:w-6 md:h-6" />
              </div>
              <div>
                <DialogTitle className="text-lg md:text-xl font-black text-slate-900 leading-none mb-1">
                  Lançar Pagamento
                </DialogTitle>
                <p className="text-[11px] md:text-sm text-slate-500 font-medium">Lançamento direto para o contas a pagar</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setPaymentDialogOpen(false)} className="rounded-full hover:bg-slate-100 transition-colors">
              <XCircle size={20} className="text-slate-400" />
            </Button>
          </div>
          <div className="p-4 md:p-8 space-y-6">
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
          <div className="bg-white border-t border-slate-100 p-4 md:p-6 flex gap-3 sticky bottom-0">
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)} className="flex-1 h-12 rounded-xl font-bold">Cancelar</Button>
            <Button onClick={handleSavePayment} disabled={saving} className="flex-[2] h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 transition-all font-black">
              {saving ? <Loader2 className="animate-spin mr-2" size={16} /> : <Banknote size={16} className="mr-2" />}
              Lançar no Financeiro
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manage Types Dialog */}
      <Dialog open={typesDialogOpen} onOpenChange={setTypesDialogOpen}>
        <DialogContent className="sm:max-w-md w-[95vw] max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl rounded-3xl overflow-hidden bg-[#F8FAFC]">
          <div className="bg-white border-b border-slate-100 p-4 md:p-6 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                <Settings2 size={20} className="md:w-6 md:h-6" />
              </div>
              <div>
                <DialogTitle className="text-lg md:text-xl font-black text-slate-900 leading-none mb-1">
                  Categorias
                </DialogTitle>
                <p className="text-[11px] md:text-sm text-slate-500 font-medium">Tipos de especialidade</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setTypesDialogOpen(false)} className="rounded-full hover:bg-slate-100 transition-colors">
              <XCircle size={20} className="text-slate-400" />
            </Button>
          </div>

          <div className="p-4 md:p-8 space-y-6">
          
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
        <DialogContent className="sm:max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl rounded-3xl overflow-hidden bg-[#F8FAFC]">
          <div className="bg-white border-b border-slate-100 p-4 md:p-6 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <User size={20} className="md:w-6 md:h-6" />
              </div>
              <div>
                <DialogTitle className="text-lg md:text-xl font-black text-slate-900 leading-none mb-1">
                  Detalhes do Colaborador
                </DialogTitle>
                <p className="text-[11px] md:text-sm text-slate-500 font-medium">Perfil e informações profissionais</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setDetailsDialogOpen(false)} className="rounded-full hover:bg-slate-100 transition-colors">
              <XCircle size={20} className="text-slate-400" />
            </Button>
          </div>
          {selectedCollab && (
            <div className="p-4 md:p-8 space-y-6 md:space-y-8">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="w-32 h-32 rounded-3xl overflow-hidden bg-slate-100 border-2 border-slate-200 shadow-inner">
                  {selectedCollab.avatar_url ? (
                    <img src={selectedCollab.avatar_url} alt={selectedCollab.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 font-bold text-4xl">
                      {selectedCollab.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">{selectedCollab.name}</h2>
                  <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-3">
                    <Badge className={selectedCollab.status === 'active' ? 'rounded-full px-4 py-1 font-black text-[10px] uppercase tracking-widest border-none shadow-sm bg-green-500 text-white' : 'rounded-full px-4 py-1 font-black text-[10px] uppercase tracking-widest border-none shadow-sm bg-slate-200 text-slate-500'}>
                      {selectedCollab.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Badge>
                    <Badge variant="secondary" className="rounded-full px-4 py-1 font-black text-[10px] uppercase tracking-widest bg-blue-50 text-blue-600 border-none shadow-sm">{selectedCollab.type || "Outro"}</Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 pt-6 border-t border-slate-100">
                <div className="space-y-1.5">
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest ml-1">Documento (CPF)</p>
                  <p className="text-sm font-bold text-slate-700 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">{selectedCollab.document}</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest ml-1">Data de Nascimento</p>
                  <p className="text-sm font-bold text-slate-700 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">{selectedCollab.birth_date ? format(new Date(selectedCollab.birth_date), "dd/MM/yyyy") : "—"}</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest ml-1">Telefone</p>
                  <p className="text-sm font-bold text-slate-700 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">{selectedCollab.phone || "—"}</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest ml-1">E-mail</p>
                  <p className="text-sm font-bold text-slate-700 bg-white p-3 rounded-xl border border-slate-100 shadow-sm truncate">{selectedCollab.email || "—"}</p>
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest ml-1">Endereço</p>
                  <p className="text-sm font-bold text-slate-700 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">{selectedCollab.address || "—"} {selectedCollab.zip_code ? `(${selectedCollab.zip_code})` : ""}</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest ml-1">Remuneração</p>
                  <p className="text-sm font-bold text-primary bg-primary/5 p-3 rounded-xl border border-primary/10 shadow-sm">{getPaymentTypeLabel(selectedCollab.payment_type)}: {selectedCollab.payment_type === 'commission' ? `${selectedCollab.payment_value}%` : formatCurrency(selectedCollab.payment_value)}</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest ml-1">PIX ({selectedCollab.pix_type})</p>
                  <p className="text-sm font-bold text-slate-700 bg-white p-3 rounded-xl border border-slate-100 shadow-sm truncate">{selectedCollab.pix_key || "—"}</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest ml-1">CNH / CADASTUR</p>
                  <p className="text-sm font-bold text-slate-700 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">{selectedCollab.cnh || "—"} / {selectedCollab.cadastur || "—"}</p>
                </div>
                {selectedCollab.observation && (
                  <div className="md:col-span-2 space-y-1.5">
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest ml-1">Observações</p>
                    <p className="text-sm font-medium text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">{selectedCollab.observation}</p>
                  </div>
                )}
                
                <div className="md:col-span-2 pt-6 border-t border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest ml-1 mb-4">Últimos Lançamentos</p>
                  <div className="max-h-[250px] overflow-y-auto rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
                    <Table>
                      <TableBody>
                        {payments.slice(0, 5).map((p) => (
                          <TableRow key={p.id} className="hover:bg-slate-50 transition-colors">
                            <TableCell className="py-3 text-[11px] font-bold text-slate-500 pl-4">{format(new Date(p.due_date), "dd/MM/yy")}</TableCell>
                            <TableCell className="py-3 text-[11px] font-bold text-slate-700 truncate max-w-[150px]">{p.description}</TableCell>
                            <TableCell className="py-3 text-[11px] font-black text-slate-900 text-right">{formatCurrency(p.amount)}</TableCell>
                            <TableCell className="py-3 text-right pr-4">
                              <Badge variant="outline" className={p.status === 'paid' ? 'text-[9px] font-black uppercase tracking-tighter border-none h-5 bg-green-50 text-green-600' : 'text-[9px] font-black uppercase tracking-tighter border-none h-5 bg-amber-50 text-amber-600'}>
                                {p.status === 'paid' ? 'Pago' : 'Pend'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                        {payments.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-xs font-bold text-slate-300 uppercase tracking-widest">Nenhum lançamento registrado.</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
              
              <div className="bg-white border-t border-slate-100 p-4 md:p-6 flex gap-3 sticky bottom-0">
                <Button variant="outline" onClick={() => setDetailsDialogOpen(false)} className="flex-1 h-12 rounded-xl font-bold">Fechar</Button>
                <Button onClick={() => { setDetailsDialogOpen(false); openEdit(selectedCollab!); }} className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all font-black text-white">Editar Perfil</Button>
              </div>
            </div>
          )}
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
