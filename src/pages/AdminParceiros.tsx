import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Building2, Compass, Car, Users, Search, Plus, Edit, Trash2, Loader2, MapPin, Settings2, Eye, Phone, Mail, User, Percent, FileText, Calendar, CheckCircle2, XCircle, Banknote, Landmark, Clock, FileDown, Copy, DollarSign, ShoppingBag
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { maskCPF, maskCNPJ, maskPhone, maskCpfCnpj } from "@/lib/masks";
import { Separator } from "@/components/ui/separator";
import { ptBR } from "date-fns/locale";
import { formatDate } from "@/lib/utils";
import { NumericFormat } from "react-number-format";
import type { Partner, PartnerType } from "@/features/parceiros/types";
import { iconMap, getIcon, getGradient, isCnpj } from "@/features/parceiros/utils";
import { usePartnersData } from "@/features/parceiros/usePartnersData";


const AdminParceiros = () => {
  const { partners, partnerTypes, company, loading, isError, refreshPartners, refreshTypes } = usePartnersData();

  // Local UI state only — data lives in react-query cache now.
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [typesDialogOpen, setTypesDialogOpen] = useState(false);
  const [editPartner, setEditPartner] = useState<Partner | null>(null);
  const [editType, setEditType] = useState<PartnerType | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteTypeId, setDeleteTypeId] = useState<string | null>(null);
  const [cnpjLoading, setCnpjLoading] = useState(false);
  const [viewPartner, setViewPartner] = useState<Partner | null>(null);
  const [receivableDialogOpen, setReceivableDialogOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [partnerBookings, setPartnerBookings] = useState<any[]>([]);
  const [partnerReceivables, setPartnerReceivables] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [loadingReceivables, setLoadingReceivables] = useState(false);

  useEffect(() => {
    if (isError) console.error("Erro ao carregar dados de parceiros");
  }, [isError]);

  const [form, setForm] = useState({
    name: "", type: "hotel", contact_name: "", phone: "", email: "",
    commission_rate: "10", cpf_cnpj: "", address: "", cnh: "", cnh_validade: "", cadastur: "",
    remuneration_type: "comissao_percent", remuneration_value: "10",
    bank_name: "", bank_agency: "", bank_account: "", bank_pix_key: "",
    credit_limit: "500000", tags: ""

  });

  const [receivableForm, setReceivableForm] = useState({
    valor: "0", descricao: "", vencimento: new Date().toISOString().slice(0, 10), categoria: "comissao"
  });

  const [typeForm, setTypeForm] = useState({
    name: "", label: "", icon: "Building2", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
  });

  const fetchPartnerBookings = async (partnerId: string) => {
    setLoadingBookings(true);
    const { data, error } = await supabase
      .from("bookings")
      .select("*, customers(name)")
      .eq("partner_id", partnerId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (!error && data) {
      setPartnerBookings(data);
    }
    setLoadingBookings(false);
  };

  const fetchPartnerReceivables = async (partnerId: string) => {
    setLoadingReceivables(true);
    const { data, error } = await supabase
      .from("contas_receber")
      .select("*")
      .eq("partner_id", partnerId)
      .order("vencimento", { ascending: false })
      .limit(10);

    if (!error && data) {
      setPartnerReceivables(data);
    }
    setLoadingReceivables(false);
  };

  // Backwards-compatible aliases so existing handlers keep working after the
  // data layer moved to usePartnersData / react-query.
  const fetchPartners = refreshPartners;
  const fetchTypes = refreshTypes;


  const openNew = () => {
    setEditPartner(null);
    setForm({ 
      name: "", type: partnerTypes[0]?.name || "hotel", contact_name: "", phone: "", 
      email: "", commission_rate: "10", cpf_cnpj: "", address: "", 
      cnh: "", cnh_validade: "", cadastur: "",
      remuneration_type: "comissao_percent", remuneration_value: "0",
      bank_name: "", bank_agency: "", bank_account: "", bank_pix_key: "",
      credit_limit: "0", tags: ""
    });
    setDialogOpen(true);
  };

  const openEdit = (p: Partner) => {
    setEditPartner(p);
    setForm({
      name: p.name, type: p.type,
      contact_name: p.contact_name || "", phone: p.phone || "",
      email: p.email || "", commission_rate: String(p.commission_rate || 0),
      cpf_cnpj: p.cpf_cnpj || "", address: p.address || "",
      cnh: p.cnh || "", cnh_validade: p.cnh_validade || "", cadastur: p.cadastur || "",
      remuneration_type: p.remuneration_type || "comissao_percent",
      remuneration_value: String(p.remuneration_value || 0),
      bank_name: p.bank_name || "", bank_agency: p.bank_agency || "",
      bank_account: p.bank_account || "", bank_pix_key: p.bank_pix_key || "",
      credit_limit: String(p.credit_limit || 0),
      tags: p.tags ? p.tags.join(", ") : ""
    });
    setDialogOpen(true);
  };

  const openNewType = () => {
    setEditType(null);
    setTypeForm({ name: "", label: "", icon: "Building2", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" });
  };

  const openEditType = (t: PartnerType) => {
    setEditType(t);
    setTypeForm({ name: t.name, label: t.label, icon: t.icon, color: t.color });
  };

  const handleSaveType = async () => {
    if (!typeForm.name || !typeForm.label) { toast.error("Nome e Rótulo são obrigatórios."); return; }
    setSaving(true);
    const payload = { ...typeForm, name: typeForm.name.toLowerCase().replace(/\s+/g, "_") };
    
    if (editType) {
      const { error } = await supabase.from("partner_types").update(payload).eq("id", editType.id);
      if (error) toast.error("Erro ao atualizar tipo."); else { toast.success("Tipo atualizado!"); fetchTypes(); setEditType(null); }
    } else {
      const { error } = await supabase.from("partner_types").insert(payload);
      if (error) toast.error("Erro ao cadastrar tipo."); else { toast.success("Tipo cadastrado!"); fetchTypes(); }
    }
    setSaving(false);
  };

  const confirmDeleteType = async (id: string) => {
    const { error } = await supabase.from("partner_types").delete().eq("id", id);
    if (error) toast.error("Erro ao remover tipo. Verifique se existem parceiros vinculados."); 
    else { toast.success("Tipo removido."); fetchTypes(); }
  };

  const lookupCnpj = async (cnpj: string) => {
    const digits = cnpj.replace(/\D/g, "");
    if (digits.length !== 14) return;
    setCnpjLoading(true);
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`);
      if (!res.ok) throw new Error("CNPJ não encontrado");
      const data = await res.json();
      const addr = [
        data.descricao_tipo_de_logradouro,
        data.logradouro,
        data.numero,
        data.complemento,
        data.bairro,
        `${data.municipio}/${data.uf}`,
        data.cep ? `CEP ${data.cep}` : "",
      ].filter(Boolean).join(", ");

      setForm((prev) => ({
        ...prev,
        name: prev.name || data.razao_social || "",
        address: addr,
        email: prev.email || data.email || "",
        phone: prev.phone || data.ddd_telefone_1 || "",
      }));
      toast.success("Dados do CNPJ carregados!");
    } catch {
      toast.error("CNPJ não encontrado na base da Receita Federal.");
    }
    setCnpjLoading(false);
  };

  const handleCpfCnpjChange = (value: string) => {
    const formatted = maskCpfCnpj(value);
    setForm((prev) => ({ ...prev, cpf_cnpj: formatted }));
    if (isCnpj(formatted)) {
      const digits = formatted.replace(/\D/g, "");
      if (digits.length === 14) {
        lookupCnpj(digits);
      }
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Nome é obrigatório."); return; }
    setSaving(true);
    const payload = {
      name: form.name.trim(), type: form.type,
      contact_name: form.contact_name.trim() || null, phone: form.phone.trim() || null,
      email: form.email.trim() || null, commission_rate: Number(form.commission_rate) || 0,
      cpf_cnpj: form.cpf_cnpj.trim() || null, address: form.address.trim() || null,
      cnh: form.type === "motorista" || form.type === "fretista" ? (form.cnh.trim() || null) : null,
      cnh_validade: (form.type === "motorista" || form.type === "fretista") && form.cnh_validade ? form.cnh_validade : null,
      cadastur: form.type === "guia" || form.type === "agencia" ? (form.cadastur.trim() || null) : null,
      remuneration_type: form.remuneration_type,
      remuneration_value: Number(form.remuneration_value) || 0,
      bank_name: form.bank_name.trim() || null,
      bank_agency: form.bank_agency.trim() || null,
      bank_account: form.bank_account.trim() || null,
      bank_pix_key: form.bank_pix_key.trim() || null,
      credit_limit: Number(form.credit_limit) || 0,
      tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : null,
    };

    try {
      let res;
      if (editPartner) {
        res = await supabase.from("partners").update(payload).eq("id", editPartner.id);
      } else {
        res = await supabase.from("partners").insert(payload);
      }
      
      if (res.error) throw res.error;

      // Sincronização com SGS — Condutores quando o parceiro for motorista ou guia
      if (form.type === "motorista" || form.type === "guia" || form.type === "fretista") {
        const condutorPayload = {
          nome: form.name.trim(),
          cpf: form.cpf_cnpj.trim() || null,
          telefone: form.phone.trim() || null,
          email: form.email.trim() || null,
          cnh_numero: (form.type === "guia" ? form.cadastur?.trim() : form.cnh?.trim()) || null,
          cnh_validade: form.cnh_validade || null,
          status: "ativo",
          observacoes: `Sincronizado automaticamente do módulo Parceiros (${form.type})`
        };

        // If it's a guide, ensure we have the correct document type in the observation or specific field if available
        if (form.type === "guia") {
          condutorPayload.observacoes += ` - Cadastur: ${form.cadastur}`;
        }

        const filter = form.cpf_cnpj 
          ? `nome.eq.${form.name.trim()},cpf.eq.${form.cpf_cnpj.trim()}`
          : `nome.eq.${form.name.trim()}`;

        const { data: existing } = await supabase
          .from("sgs_condutores")
          .select("id")
          .or(filter)
          .maybeSingle();

        if (existing) {
          await supabase.from("sgs_condutores").update(condutorPayload).eq("id", existing.id);
        } else {
          await supabase.from("sgs_condutores").insert(condutorPayload);
        }
      }


      toast.success(editPartner ? "Parceiro atualizado!" : "Parceiro cadastrado!");
      setDialogOpen(false);
      fetchPartners();
    } catch (error: any) {
      toast.error(`Erro: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveReceivable = async () => {
    if (!selectedPartner) return;
    setSaving(true);
    try {
      const cleanValor = String(receivableForm.valor).replace(/\D/g, "");
      const valorNumerico = Number(cleanValor);
      
      const { error } = await supabase.from("contas_receber").insert({
        descricao: `Parceiro: ${selectedPartner.name} - ${receivableForm.descricao}`,
        valor: valorNumerico,
        vencimento: receivableForm.vencimento,
        categoria: receivableForm.categoria,
        status: "pendente",
        partner_id: selectedPartner.id,
        cliente: selectedPartner.name
      });

      if (error) throw error;
      toast.success("Recebimento lançado no financeiro!");
      setReceivableDialogOpen(false);
    } catch (error: any) {
      toast.error("Erro ao lançar recebimento: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const openReceivable = (p: Partner) => {
    setSelectedPartner(p);
    let defaultVal = "0";
    if (p.remuneration_type !== "comissao_percent" && p.remuneration_value) {
      defaultVal = String(p.remuneration_value * 100);
    }
    setReceivableForm({
      valor: defaultVal,
      descricao: `Faturamento / Comissão`,
      vencimento: new Date().toISOString().slice(0, 10),
      categoria: "comissao"
    });
    setReceivableDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("partners").delete().eq("id", deleteId);
    if (error) toast.error("Erro ao remover."); else { toast.success("Parceiro removido."); fetchPartners(); }
    setDeleteId(null);
  };

  const toggleActive = async (p: Partner) => {
    const { error } = await supabase.from("partners").update({ active: !p.active }).eq("id", p.id);
    if (error) toast.error("Erro ao alterar status.");
    else { toast.success(p.active ? "Parceiro desativado." : "Parceiro ativado."); fetchPartners(); }
  };

  const exportPDF = async () => {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");
    const doc = new jsPDF();
    const now = new Date();
    const dateStr = now.toLocaleDateString("pt-BR");
    
    // Header background
    doc.setFillColor(33, 150, 243);
    doc.rect(0, 0, 210, 40, "F");

    // Company Logo
    if (company?.logo_url) {
      try {
        const img = new Image();
        img.src = company.logo_url;
        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
        doc.addImage(img, 'PNG', 14, 8, 24, 24);
      } catch (e) {}
    }

    // Company Info
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text(company?.nome_fantasia?.toUpperCase() || "RELATÓRIO DE PARCEIROS", 45, 18);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`CNPJ: ${company?.cnpj || "—"} | Contato: ${company?.telefone || "—"}`, 45, 25);
    doc.text(`${company?.endereco || "—"}`, 45, 30);

    // Title
    doc.setFontSize(16);
    doc.setTextColor(33, 150, 243);
    doc.setFont("helvetica", "bold");
    doc.text("RELAÇÃO DE PARCEIROS E FORNECEDORES", 14, 55);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.setFont("helvetica", "normal");
    doc.text(`Total de parceiros: ${partners.length} (${activeCount} ativos)`, 14, 62);
    doc.text(`Gerado em: ${dateStr}`, 150, 62);

    // Table
    const tableData = filtered.map(p => {
      let remStr = "";
      if (p.remuneration_type === "comissao_percent") remStr = `${p.remuneration_value || 0}%`;
      else if (p.remuneration_type === "valor_por_passeio") remStr = `R$ ${p.remuneration_value || 0}/pass.`;
      else if (p.remuneration_type === "valor_mensal") remStr = `R$ ${p.remuneration_value || 0}/mês`;
      else remStr = `${p.commission_rate || 0}%`;

      return [
        p.name,
        partnerTypes.find(t => t.name === p.type)?.label || p.type,
        p.cpf_cnpj || "N/A",
        p.contact_name || "N/A",
        remStr,
        p.active ? "Ativo" : "Inativo"
      ];
    });

    autoTable(doc, {
      startY: 70,
      head: [["Nome", "Tipo", "CPF/CNPJ", "Contato", "Remuneração", "Status"]],
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
        cellPadding: 4
      },
      columnStyles: {
        4: { halign: 'center' },
        5: { halign: 'center' }
      }
    });

    doc.save(`Relatorio_Parceiros_${now.toISOString().slice(0, 10)}.pdf`);
  };

  const filtered = partners.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = p.name.toLowerCase().includes(q) || (p.contact_name || "").toLowerCase().includes(q) || (p.email || "").toLowerCase().includes(q) || (p.cpf_cnpj || "").includes(q);
    const matchType = typeFilter === "todos" || p.type === typeFilter;
    return matchSearch && matchType;
  });

  const activeCount = partners.filter((p) => p.active).length;

  if (loading) {
    return (
      <AdminLayout title="Parceiros">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Parceiros">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: "Parceiros", value: partners.length, icon: Building2, color: "from-blue-500 to-indigo-600", desc: "Total cadastrado" },
          { label: "Ativos", value: activeCount, icon: CheckCircle2, color: "from-emerald-500 to-teal-600", desc: "Operando" },
          { label: "Tipos", value: partnerTypes.length, icon: Settings2, color: "from-amber-500 to-orange-600", desc: "Categorias" },
          { label: "Crédito Total", value: `R$ ${partners.reduce((a, b) => a + (b.credit_limit || 0), 0).toLocaleString("pt-BR")}`, icon: Banknote, color: "from-purple-500 to-pink-600", desc: "Limite global" },
        ].map((stat, i) => (
          <div key={i} className="group relative overflow-hidden rounded-lg p-6 border border-border bg-white shadow-sm">
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} transition-transform duration-500 group-hover:scale-105`} />
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center text-primary shadow-sm">
                  <stat.icon size={22} strokeWidth={2.5} />
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-white/60">{stat.desc}</div>
              </div>
              <p className="text-2xl font-black text-white tracking-tighter group-hover:translate-x-1 transition-transform">{stat.value}</p>
              <p className="text-[10px] font-black text-white/80 mt-1 uppercase tracking-[0.2em]">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col xl:flex-row gap-4 items-center justify-between mb-8 p-4 sm:p-6 bg-white border border-border rounded-lg shadow-sm">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-primary transition-colors" size={18} />
          <Input 
            placeholder="Pesquisar parceiro por nome, contato ou documento..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="pl-12 h-12 rounded-lg border-border focus:ring-0 focus:border-primary bg-slate-50 text-sm font-medium" 
          />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button variant="outline" size="sm" className="rounded-xl h-12 px-5 border-slate-200 bg-white hover:bg-slate-50 transition-all font-bold text-slate-600 shadow-sm" onClick={() => setTypesDialogOpen(true)}>
            <Settings2 size={18} className="mr-2" /> Gerenciar Tipos
          </Button>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="rounded-xl h-12 w-12 border-slate-200 bg-white hover:bg-slate-50 transition-all shadow-sm" 
                  onClick={exportPDF}
                >
                  <FileDown size={20} className="text-rose-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Relatório PDF</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <button 
            onClick={openNew}
            className="flex-1 md:flex-none bg-primary hover:bg-primary/90 text-primary-foreground h-12 px-8 rounded-lg text-sm font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-sm active:scale-95"
          >
            <Plus size={20} strokeWidth={3} /> Novo Parceiro
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-10 overflow-x-auto pb-4 no-scrollbar scroll-smooth">
        <button
          onClick={() => setTypeFilter("todos")} 
          className={`text-[10px] font-black uppercase tracking-widest px-8 h-12 rounded-2xl transition-all whitespace-nowrap shadow-lg ${
            typeFilter === "todos"
              ? "bg-primary text-primary-foreground shadow-primary/30 scale-105"
              : "bg-white dark:bg-slate-900 text-muted-foreground hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 shadow-slate-200/50"
          }`}
        >
          Todos Parceiros
        </button>
        {partnerTypes.map((t) => {
          const isActive = typeFilter === t.name;
          const count = partners.filter((p) => p.type === t.name).length;
          const Icon = getIcon(t.icon);
          const colorClass = getGradient(t.color || "");
          
          return (
            <button 
              key={t.id} 
              onClick={() => setTypeFilter(t.name)}
              className={`flex items-center gap-3 px-8 h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap shadow-lg ${
                isActive 
                  ? `bg-gradient-to-br ${colorClass} text-white shadow-primary/30 scale-105` 
                  : "bg-white dark:bg-slate-900 text-muted-foreground hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 shadow-slate-200/50"
              }`}
            >
              <Icon size={16} strokeWidth={2.5} className={isActive ? "text-white" : "text-primary/40"} />
              {t.label}
              <span className={`ml-2 px-2.5 py-0.5 rounded-lg text-[9px] ${isActive ? "bg-white/20 text-white" : "bg-primary/10 text-primary"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>
      <div className="animate-in-fade" style={{ animationDelay: '0.3s' }}>
        {filtered.length === 0 ? (
          <Card className="border-none shadow-sm overflow-hidden glass-card rounded-[2.5rem] py-20 text-center text-muted-foreground bg-muted/10">
            <Users className="mx-auto mb-4 opacity-20" size={64} />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Vazio</p>
            <p className="text-xs font-medium text-muted-foreground/60 mt-2">Nenhum parceiro encontrado com os filtros atuais.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
            {filtered.map((p) => {
              const type = partnerTypes.find(t => t.name === p.type) || partnerTypes[0];
              const Icon = getIcon(type?.icon || "Building2");
              const colorClass = getGradient(type?.color || "");
              
              return (
                <div 
                  key={p.id} 
                  className={`group relative flex flex-col overflow-hidden rounded-[2.5rem] bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-none transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl ${!p.active ? "opacity-60 grayscale" : ""}`}
                  onClick={() => { setViewPartner(p); fetchPartnerBookings(p.id); fetchPartnerReceivables(p.id); }}
                >
                  {/* Banner Colorido */}
                  <div className={`h-24 w-full bg-gradient-to-br ${colorClass} relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-20 transition-opacity" />
                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/20 rounded-full blur-2xl transition-transform duration-700 group-hover:scale-150" />
                    <div className="absolute top-4 right-4 z-10">
                      <Badge
                        variant="secondary"
                        className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full cursor-pointer transition-all border-none backdrop-blur-md active:scale-95 shadow-lg ${p.active
                          ? "bg-white/90 text-emerald-600"
                          : "bg-white/90 text-rose-600"
                        }`}
                        onClick={(e) => { e.stopPropagation(); toggleActive(p); }}
                      >
                        {p.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                  </div>

                  {/* Conteúdo */}
                  <div className="relative flex flex-1 flex-col p-6 pt-0">
                    <div className="relative -mt-8 mb-4 flex items-center justify-between">
                      <div className={`w-16 h-16 rounded-[1.5rem] bg-white dark:bg-slate-800 flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${colorClass} flex items-center justify-center text-white shadow-lg shadow-primary/20`}>
                          <Icon size={24} strokeWidth={2.5} />
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h3 className="font-black text-xl text-foreground tracking-tight line-clamp-1 group-hover:text-primary transition-colors leading-tight">{p.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-primary/20 text-primary/70 bg-primary/5 rounded-md py-0.5">
                          {type?.label}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6 flex-1">
                      {p.cpf_cnpj && (
                        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                          <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                            <FileText size={14} className="text-primary/60" />
                          </div>
                          <span className="text-xs font-mono font-medium tracking-tighter">{p.cpf_cnpj}</span>
                        </div>
                      )}
                      {p.phone && (
                        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                          <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                            <Phone size={14} className="text-primary/60" />
                          </div>
                          <span className="text-xs font-bold">{p.phone}</span>
                        </div>
                      )}
                      {p.address && (
                        <div className="flex items-start gap-3 text-slate-500 dark:text-slate-400">
                          <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0">
                            <MapPin size={14} className="text-primary/60" />
                          </div>
                          <span className="text-[11px] leading-snug font-medium line-clamp-2">{p.address}</span>
                        </div>
                      )}
                      
                      {(p.type === "motorista" || p.type === "fretista") && p.cnh && (
                        <div className="flex items-center gap-3 bg-amber-500/5 text-amber-700 dark:text-amber-400 px-3 py-2 rounded-2xl border border-amber-200/30">
                          <Car size={16} />
                          <span className="text-[10px] font-black uppercase tracking-tight">CNH: {p.cnh}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-5 border-t border-slate-100 dark:border-slate-800">
                      <div className="bg-primary/5 px-4 py-2 rounded-2xl border border-primary/10">
                        <p className="text-[8px] font-black text-primary/50 uppercase tracking-[0.2em] mb-0.5">Remuneração</p>
                        <p className="text-sm font-black text-primary flex items-baseline gap-1">
                          {p.remuneration_type === "comissao_percent" && `${p.remuneration_value || 0}%`}
                          {p.remuneration_type === "valor_por_passeio" && `R$ ${p.remuneration_value || 0}`}
                          {p.remuneration_type === "valor_mensal" && `R$ ${p.remuneration_value || 0}`}
                          {!p.remuneration_type && `${p.commission_rate || 0}%`}
                          <span className="text-[9px] opacity-60 font-black">
                            {p.remuneration_type === "valor_por_passeio" ? "/pass" : p.remuneration_type === "valor_mensal" ? "/mês" : ""}
                          </span>
                        </p>
                      </div>

                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-10 w-10 rounded-2xl hover:bg-emerald-500 hover:text-white transition-all duration-300 shadow-sm text-emerald-600" 
                                onClick={() => openReceivable(p)}
                              >
                                <DollarSign size={18} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Lançar Recebimento</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl hover:bg-primary hover:text-white transition-all duration-300 shadow-sm" onClick={() => { setViewPartner(p); fetchPartnerBookings(p.id); fetchPartnerReceivables(p.id); }}>
                                <Eye size={18} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Ver detalhes</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl hover:bg-blue-500 hover:text-white transition-all duration-300 shadow-sm" onClick={() => openEdit(p)}>
                                <Edit size={18} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Editar</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl hover:bg-rose-500 hover:text-white transition-all duration-300 shadow-sm text-rose-500" onClick={() => setDeleteId(p.id)}>
                                <Trash2 size={18} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Excluir</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl rounded-3xl overflow-hidden bg-[#F8FAFC]">
          <div className="bg-white border-b border-slate-100 p-4 md:p-6 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                {editPartner ? <Edit size={20} className="md:w-6 md:h-6" /> : <Plus size={20} className="md:w-6 md:h-6" />}
              </div>
              <div>
                <DialogTitle className="text-lg md:text-xl font-black text-slate-900 leading-none mb-1">
                  {editPartner ? "Editar Parceiro" : "Novo Parceiro"}
                </DialogTitle>
                <p className="text-[11px] md:text-sm text-slate-500 font-medium">Gestão de fornecedores e prestadores de serviço</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setDialogOpen(false)} className="rounded-full hover:bg-slate-100 transition-colors">
              <XCircle size={20} className="text-slate-400" />
            </Button>
          </div>


          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="flex flex-col h-[calc(90vh-80px)]">
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-8">
              <div className="space-y-4">
            <div>
              <Label className="mb-1.5 block">CPF / CNPJ</Label>
              <div className="relative">
                <Input
                  value={form.cpf_cnpj}
                  onChange={(e) => handleCpfCnpjChange(e.target.value)}
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  maxLength={18}
                />
                {cnpjLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-primary" size={16} />}
              </div>
            </div>
            <div>
              <Label className="mb-1.5 block">Nome / Razão Social *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label className="mb-1.5 block">Tipo *</Label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm text-foreground outline-none">
                {partnerTypes.map((t) => (
                  <option key={t.id} value={t.name}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="mb-1.5 block flex items-center gap-1"><MapPin size={14} /> Endereço</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Rua, número, bairro, cidade/UF" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-1.5 block">Nome do contato</Label>
                <Input value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} />
              </div>
              <div>
                <Label className="mb-1.5 block">Telefone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: maskPhone(e.target.value) })} maxLength={15} />
              </div>
            </div>
            <div>
              <Label className="mb-1.5 block">Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="p-4 md:p-6 border border-blue-100 dark:border-blue-900 rounded-[2rem] bg-blue-50/30 dark:bg-blue-900/10 space-y-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                  <Landmark size={18} />
                </div>
                <h3 className="font-black text-blue-900 uppercase tracking-wider text-xs">Regra de Remuneração</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-[10px] font-black uppercase text-blue-400 tracking-widest mb-1.5 block ml-1">Modalidade</Label>
                  <select 
                    value={form.remuneration_type} 
                    onChange={(e) => setForm({ ...form, remuneration_type: e.target.value })}
                    className="w-full h-11 bg-white border border-blue-100 rounded-xl px-4 py-2 text-sm font-bold text-blue-900 outline-none focus:ring-2 focus:ring-blue-200 transition-all shadow-sm"
                  >
                    <option value="comissao_percent">Comissão %</option>
                    <option value="valor_por_passeio">Por Passeio R$</option>
                    <option value="valor_mensal">Mensal R$</option>
                  </select>
                </div>
                <div>
                  <Label className="text-[10px] font-black uppercase text-blue-400 tracking-widest mb-1.5 block ml-1">
                    {form.remuneration_type === "comissao_percent" ? "Porcentagem (%)" : "Valor Base (R$)"}
                  </Label>
                  {form.remuneration_type === "comissao_percent" ? (
                    <div className="relative">
                      <Input 
                        type="number" 
                        min="0" 
                        max="100"
                        value={form.remuneration_value} 
                        onChange={(e) => setForm({ ...form, remuneration_value: e.target.value })} 
                        className="h-11 px-4 rounded-xl border-blue-100 bg-white focus:ring-2 focus:ring-blue-200 transition-all font-black text-blue-900 shadow-sm"
                      />
                      <Percent className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-300" size={16} />
                    </div>
                  ) : (
                    <NumericFormat
                      value={form.remuneration_value}
                      onValueChange={(values) => setForm({ ...form, remuneration_value: String(values.floatValue || 0) })}
                      thousandSeparator="."
                      decimalSeparator=","
                      prefix="R$ "
                      decimalScale={2}
                      fixedDecimalScale
                      className="flex h-11 w-full px-4 rounded-xl border border-blue-100 bg-white focus:ring-2 focus:ring-blue-200 transition-all font-black text-blue-900 shadow-sm outline-none"
                    />
                  )}
                </div>
              </div>
            </div>

            {(form.type === "motorista" || form.type === "fretista" || form.type === "guia") && (
              <div className="space-y-4 p-4 border border-amber-200 dark:border-amber-800 rounded-xl bg-amber-50/50 dark:bg-amber-900/10">
                <p className="text-sm font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                  {form.type === "guia" ? <Compass size={14} /> : <Car size={14} />} 
                  Dados de Habilitação / Profissional
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-1.5 block text-xs font-bold uppercase text-amber-600">
                      {form.type === "guia" ? "Nº Cadastur / Registro" : "Nº da CNH"}
                    </Label>
                    <Input 
                      value={form.type === "guia" ? form.cadastur : form.cnh} 
                      onChange={(e) => setForm({ ...form, [form.type === "guia" ? "cadastur" : "cnh"]: e.target.value })} 
                      placeholder={form.type === "guia" ? "Registro profissional" : "00000000000"} 
                      maxLength={30} 
                    />
                  </div>
                  <div>
                    <Label className="mb-1.5 block text-xs font-bold uppercase text-amber-600">Validade</Label>
                    <Input 
                      type="date" 
                      value={form.cnh_validade} 
                      onChange={(e) => setForm({ ...form, cnh_validade: e.target.value })} 
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4 p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/10">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-400 flex items-center gap-1"><Banknote size={14} /> Dados Bancários e Financeiros</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="mb-1.5 block text-xs">Banco</Label>
                  <Input value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} placeholder="Ex: NuBank, Bradesco" />
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs">Chave PIX</Label>
                  <Input value={form.bank_pix_key} onChange={(e) => setForm({ ...form, bank_pix_key: e.target.value })} placeholder="Email, CPF ou Celular" />
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs">Agência</Label>
                  <Input value={form.bank_agency} onChange={(e) => setForm({ ...form, bank_agency: e.target.value })} placeholder="0001" />
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs">Conta</Label>
                  <Input value={form.bank_account} onChange={(e) => setForm({ ...form, bank_account: e.target.value })} placeholder="12345-6" />
                </div>
                <div className="col-span-2">
                  <Label className="mb-1.5 block text-xs">Limite de Crédito (R$)</Label>
                  <Input type="number" value={form.credit_limit} onChange={(e) => setForm({ ...form, credit_limit: e.target.value })} />
                </div>
              </div>
            </div>

            <div className="pb-8">
              <Label className="mb-1.5 block flex items-center gap-1"><Percent size={14} /> Tags (Separadas por vírgula)</Label>
              <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="Premium, VIP, Recorrente..." />
            </div>
          </div>
        </div>

          <div className="bg-white border-t border-slate-100 p-4 md:p-6 flex gap-3 sticky bottom-0 z-10">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="flex-1 h-12 rounded-xl font-bold">Cancelar</Button>
            <Button type="submit" disabled={saving} className="flex-[2] h-12 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all font-black text-white">
              {saving ? <Loader2 className="animate-spin mr-2" size={16} /> : <CheckCircle2 size={16} className="mr-2" />}
              {editPartner ? "Salvar Alterações" : "Cadastrar Parceiro"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>

      {/* Types Management Dialog */}
      <Dialog open={typesDialogOpen} onOpenChange={setTypesDialogOpen}>
        <DialogContent className="sm:max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl rounded-3xl overflow-hidden bg-[#F8FAFC]">
          <div className="bg-white border-b border-slate-100 p-4 md:p-6 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                <Settings2 size={20} className="md:w-6 md:h-6" />
              </div>
              <div>
                <DialogTitle className="text-lg md:text-xl font-black text-slate-900 leading-none mb-1">
                  Categorias de Parceiros
                </DialogTitle>
                <p className="text-[11px] md:text-sm text-slate-500 font-medium">Gerencie os tipos de fornecedores</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setTypesDialogOpen(false)} className="rounded-full hover:bg-slate-100 transition-colors">
              <XCircle size={20} className="text-slate-400" />
            </Button>
          </div>
          <div className="p-4 md:p-8 space-y-6 md:space-y-8">
          
          <div className="grid md:grid-cols-2 gap-6 mt-4">
            <div className="space-y-4 border-r pr-6">
              <h4 className="font-semibold text-sm">{editType ? "Editar Tipo" : "Novo Tipo"}</h4>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Rótulo (Ex: Restaurante)</Label>
                  <Input value={typeForm.label} onChange={(e) => setTypeForm({ ...typeForm, label: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Identificador único (Ex: restaurante)</Label>
                  <Input value={typeForm.name} onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })} placeholder="sem espaços ou acentos" />
                </div>
                <div>
                  <Label className="text-xs">Ícone</Label>
                  <select value={typeForm.icon} onChange={(e) => setTypeForm({ ...typeForm, icon: e.target.value })}
                    className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm outline-none">
                    {Object.keys(iconMap).map(icon => <option key={icon} value={icon}>{icon}</option>)}
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1" onClick={handleSaveType} disabled={saving}>
                    {saving && <Loader2 className="animate-spin mr-1.5" size={14} />}
                    {editType ? "Salvar" : "Adicionar"}
                  </Button>
                  {editType && <Button size="sm" variant="ghost" onClick={() => setEditType(null)}>Cancelar</Button>}
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">Tipos Existentes</h4>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {partnerTypes.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-2 rounded-lg border bg-muted/30 group">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded ${t.color}`}>{(() => { const Icon = getIcon(t.icon); return <Icon size={14} />; })()}</div>
                      <span className="text-sm font-medium">{t.label}</span>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditType(t)}><Edit size={12} /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => confirmDeleteType(t.id)}><Trash2 size={12} /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este parceiro? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* View Partner Details Dialog */}
      <Dialog open={!!viewPartner} onOpenChange={(open) => !open && setViewPartner(null)}>
        <DialogContent className="sm:max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl rounded-3xl overflow-hidden bg-[#F8FAFC]">
          <div className="bg-white border-b border-slate-100 p-4 md:p-6 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-3 md:gap-4">
              <div className={viewPartner?.type && partnerTypes.find(t => t.name === viewPartner?.type)?.color ? `w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center ${partnerTypes.find(t => t.name === viewPartner?.type)?.color}` : "w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center bg-primary/10 text-primary"}>
                {(() => {
                  const Icon = getIcon(partnerTypes.find(t => t.name === viewPartner?.type)?.icon || "Building2");
                  return <Icon size={20} className="md:w-6 md:h-6" />;
                })()}
              </div>
              <div>
                <DialogTitle className="text-lg md:text-xl font-black text-slate-900 leading-none mb-1">
                  {viewPartner?.name}
                </DialogTitle>
                <p className="text-[11px] md:text-sm text-slate-500 font-medium line-clamp-1">
                  {partnerTypes.find(t => t.name === viewPartner?.type)?.label || viewPartner?.type} • {viewPartner?.active ? "Ativo" : "Inativo"}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setViewPartner(null)} className="rounded-full hover:bg-slate-100 transition-colors">
              <XCircle size={20} className="text-slate-400" />
            </Button>
          </div>
          <div className="p-4 md:p-8 space-y-6 md:space-y-8">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
            <div className="space-y-6">
              <section>
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <User size={14} /> Informações Básicas
                </h4>
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">CPF / CNPJ</Label>
                    <p className="font-medium font-mono">{viewPartner?.cpf_cnpj || "Não informado"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Nome do Contato</Label>
                    <p className="font-medium">{viewPartner?.contact_name || "Não informado"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Remuneração</Label>
                    <div className="flex items-center gap-2 text-primary font-bold text-lg">
                      {viewPartner?.remuneration_type === "comissao_percent" && (
                        <>
                          <Percent size={18} />
                          {viewPartner?.remuneration_value || 0}%
                        </>
                      )}
                      {viewPartner?.remuneration_type === "valor_por_passeio" && (
                        <>
                          <Banknote size={18} />
                          R$ {viewPartner?.remuneration_value || 0} <span className="text-xs font-normal text-muted-foreground ml-1">por passeio</span>
                        </>
                      )}
                      {viewPartner?.remuneration_type === "valor_mensal" && (
                        <>
                          <Clock size={18} />
                          R$ {viewPartner?.remuneration_value || 0} <span className="text-xs font-normal text-muted-foreground ml-1">por mês</span>
                        </>
                      )}
                      {!viewPartner?.remuneration_type && (
                        <>
                          <Percent size={18} />
                          {viewPartner?.commission_rate || 0}%
                        </>
                      )}
                    </div>
                  </div>
                  {viewPartner?.credit_limit !== null && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Limite de Crédito</Label>
                      <p className="font-bold text-emerald-600">R$ {viewPartner?.credit_limit || 0}</p>
                    </div>
                  )}
                  {viewPartner && (
                    <div className="pt-4 mt-4 border-t border-border">
                      <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Links de Venda Direta</Label>
                      <div className="space-y-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full justify-start gap-2 h-10 rounded-xl text-xs font-bold border-primary/20 hover:bg-primary/5 text-primary"
                          onClick={() => {
                            const url = `${window.location.origin}/passeios?partner_id=${viewPartner.id}`;
                            navigator.clipboard.writeText(url);
                            toast.success("Link do Catálogo copiado!");
                          }}
                        >
                          <Copy size={14} /> Catálogo de Passeios
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full justify-start gap-2 h-10 rounded-xl text-xs font-bold border-amber-200 hover:bg-amber-50 text-amber-600"
                          onClick={() => {
                            const url = `${window.location.origin}/pacotes?partner_id=${viewPartner.id}`;
                            navigator.clipboard.writeText(url);
                            toast.success("Link de Pacotes copiado!");
                          }}
                        >
                          <Copy size={14} /> Pacotes & Campanhas
                        </Button>
                      </div>
                    </div>
                  )}
                  {viewPartner?.tags && viewPartner.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-4">
                      {viewPartner.tags.map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-[9px] h-5 bg-primary/5 text-primary border-primary/20">{tag}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              {viewPartner?.address && (
                <section>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                    <MapPin size={14} /> Localização
                  </h4>
                  <p className="text-sm leading-relaxed">{viewPartner.address}</p>
                </section>
              )}
            </div>

            <div className="space-y-6">
              <section>
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Phone size={14} /> Contato
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                    <div className="p-2 rounded-full bg-primary/10 text-primary"><Phone size={14} /></div>
                    <span className="text-sm font-medium">{viewPartner?.phone || "Sem telefone"}</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                    <div className="p-2 rounded-full bg-primary/10 text-primary"><Mail size={14} /></div>
                    <span className="text-sm font-medium truncate">{viewPartner?.email || "Sem e-mail"}</span>
                  </div>
                </div>
              </section>

              <section>
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Landmark size={14} /> Dados Bancários
                </h4>
                <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Banco</span>
                    <span className="text-sm font-semibold">{viewPartner?.bank_name || "—"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Agência</span>
                    <span className="text-sm font-semibold">{viewPartner?.bank_agency || "—"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Conta</span>
                    <span className="text-sm font-semibold">{viewPartner?.bank_account || "—"}</span>
                  </div>
                  <Separator />
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Chave PIX</span>
                    <span className="text-sm font-mono font-bold text-primary bg-primary/5 p-2 rounded block text-center truncate">{viewPartner?.bank_pix_key || "—"}</span>
                  </div>
                </div>
              </section>

              {(viewPartner?.type === "motorista" || viewPartner?.type === "guia") && (
                <section>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                    <FileText size={14} /> Documentação
                  </h4>
                  <div className="p-4 rounded-xl border border-dashed border-border bg-muted/20">
                    {viewPartner.type === "motorista" ? (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">CNH</span>
                          <span className="text-sm font-bold">{viewPartner.cnh || "Não cadastrada"}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">Validade</span>
                          <span className="text-sm font-bold flex items-center gap-2 text-amber-600">
                            <Calendar size={14} />
                            {viewPartner.cnh_validade ? formatDate(new Date(viewPartner.cnh_validade + "T12:00:00"), "dd/MM/yyyy") : "N/A"}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">CADASTUR</span>
                          <span className="text-sm font-bold">{viewPartner.cadastur || "Não cadastrado"}</span>
                        </div>
                        {viewPartner.cnh_validade && (
                          <>
                            <Separator />
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-muted-foreground">Validade</span>
                              <span className="text-sm font-bold flex items-center gap-2 text-amber-600">
                                <Calendar size={14} />
                                {formatDate(new Date(viewPartner.cnh_validade + "T12:00:00"), "dd/MM/yyyy")}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </section>
              )}
            </div>
            </div>
          </div>
          
          <div className="px-4 md:px-8 pb-8">
            <section className="mt-8 pt-8 border-t border-slate-100">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <ShoppingBag size={18} className="text-primary" /> Últimas Reservas Relacionadas
                </h4>
                <Badge variant="outline" className="text-[10px] font-bold">Mostrando as últimas 10</Badge>
              </div>
              
              {loadingBookings ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="animate-spin text-primary/40" size={24} />
                </div>
              ) : partnerBookings.length === 0 ? (
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-8 text-center border border-dashed border-slate-200">
                  <ShoppingBag className="mx-auto mb-3 text-slate-300" size={32} />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nenhuma reserva encontrada</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {partnerBookings.map((booking) => (
                    <div key={booking.id} className="group flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 hover:border-primary/20 hover:shadow-md transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                          <ShoppingBag size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900 uppercase leading-none mb-1">{booking.item_name}</p>
                          <p className="text-[10px] font-bold text-slate-400">
                            {booking.customers?.name || "Cliente Final"} • {formatDate(new Date(booking.date), "dd/MM/yyyy")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-primary">R$ {(booking.final_total / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        <Badge variant="outline" className={`text-[8px] font-black uppercase px-2 py-0 border-none ${
                          booking.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600' : 
                          booking.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-600'
                        }`}>
                          {booking.status === 'confirmed' ? 'Confirmada' : 
                           booking.status === 'pending' ? 'Pendente' : booking.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="mt-8 pt-8 border-t border-slate-100">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <DollarSign size={18} className="text-emerald-600" /> Histórico Financeiro
                </h4>
                <Badge variant="outline" className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border-emerald-100">Últimos Lançamentos</Badge>
              </div>
              
              {loadingReceivables ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="animate-spin text-emerald-400" size={24} />
                </div>
              ) : partnerReceivables.length === 0 ? (
                <div className="bg-emerald-50/30 rounded-2xl p-8 text-center border border-dashed border-emerald-100">
                  <DollarSign className="mx-auto mb-3 text-emerald-200" size={32} />
                  <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Nenhum lançamento encontrado</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {partnerReceivables.map((receivable) => (
                    <div key={receivable.id} className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${receivable.status === 'pago' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                          <DollarSign size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900 uppercase leading-none mb-1 line-clamp-1">{receivable.descricao}</p>
                          <p className="text-[10px] font-bold text-slate-400">
                            Venc: {formatDate(new Date(receivable.vencimento + "T12:00:00"), "dd/MM/yyyy")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-emerald-600">R$ {(receivable.valor / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        <Badge variant="outline" className={`text-[8px] font-black uppercase px-2 py-0 border-none ${
                          receivable.status === 'pago' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                          {receivable.status === 'pago' ? 'Recebido' : 'Pendente'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="bg-white border-t border-slate-100 p-4 md:p-6 flex gap-3 sticky bottom-0">
            <Button variant="outline" onClick={() => {
              if (viewPartner) {
                openEdit(viewPartner);
                setViewPartner(null);
              }
            }} className="flex-1 h-12 rounded-xl font-bold">
              <Edit size={16} className="mr-2" /> Editar
            </Button>
            <Button 
              variant={viewPartner?.active ? "destructive" : "default"} 
              className="flex-1 h-12 rounded-xl font-bold"
              onClick={() => {
                if (viewPartner) {
                  toggleActive(viewPartner);
                  setViewPartner(null);
                }
              }}
            >
              {viewPartner?.active ? <XCircle size={16} className="mr-2" /> : <CheckCircle2 size={16} className="mr-2" />}
              {viewPartner?.active ? "Desativar" : "Ativar"}
            </Button>
            <Button variant="secondary" onClick={() => setViewPartner(null)} className="h-12 rounded-xl font-bold px-8">Fechar</Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Receivabled Dialog */}
      <Dialog open={receivableDialogOpen} onOpenChange={setReceivableDialogOpen}>
        <DialogContent className="sm:max-w-md w-[95vw] rounded-3xl border-none shadow-2xl p-0 overflow-hidden bg-[#F8FAFC]">
          <div className="bg-white border-b border-slate-100 p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                <DollarSign size={24} strokeWidth={2.5} />
              </div>
              <div>
                <DialogTitle className="text-xl font-black text-slate-900 leading-none mb-1">
                  Lançar Recebimento
                </DialogTitle>
                <p className="text-sm text-slate-500 font-medium">{selectedPartner?.name}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setReceivableDialogOpen(false)} className="rounded-full">
              <XCircle size={20} className="text-slate-400" />
            </Button>
          </div>

          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Valor a Receber (R$) *</Label>
              <NumericFormat
                value={Number(receivableForm.valor) / 100}
                onValueChange={(values) => setReceivableForm({ ...receivableForm, valor: String(Math.round(Number(values.floatValue) * 100)) })}
                thousandSeparator="."
                decimalSeparator=","
                prefix="R$ "
                className="w-full bg-white border border-slate-200 rounded-xl px-4 h-14 text-lg font-black text-emerald-600 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Descrição / Referência</Label>
              <Input 
                value={receivableForm.descricao} 
                onChange={e => setReceivableForm({ ...receivableForm, descricao: e.target.value })}
                placeholder="Ex: Faturamento Março/2024"
                className="h-12 rounded-xl font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Vencimento</Label>
                <Input 
                  type="date" 
                  value={receivableForm.vencimento} 
                  onChange={e => setReceivableForm({ ...receivableForm, vencimento: e.target.value })}
                  className="h-12 rounded-xl font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Categoria</Label>
                <select 
                  value={receivableForm.categoria} 
                  onChange={e => setReceivableForm({ ...receivableForm, categoria: e.target.value })}
                  className="w-full h-12 bg-white border border-slate-200 rounded-xl px-3 font-bold text-sm outline-none"
                >
                  <option value="comissao">Comissão</option>
                  <option value="venda">Venda de Passeio</option>
                  <option value="pacote">Pacote Turístico</option>
                  <option value="servico">Serviço</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white border-t border-slate-100 p-6 flex gap-3">
            <Button variant="ghost" onClick={() => setReceivableDialogOpen(false)} className="flex-1 h-12 rounded-xl font-black uppercase text-[10px] tracking-widest">
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveReceivable} 
              disabled={saving} 
              className="flex-[2] h-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 shadow-xl shadow-emerald-500/20 font-black uppercase text-[10px] tracking-widest text-white"
            >
              {saving ? <Loader2 className="animate-spin mr-2" size={18} /> : <CheckCircle2 size={18} className="mr-2" />}
              Confirmar Lançamento
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </AdminLayout>
  );
};

export default AdminParceiros;




