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
  Building2, Compass, Car, Users, Search, Plus, Edit, Trash2, Loader2, MapPin, Settings2, Eye, Phone, Mail, User, Percent, FileText, Calendar, CheckCircle2, XCircle, Banknote, Landmark, Clock
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { maskCPF, maskCNPJ, maskPhone, maskCpfCnpj } from "@/lib/masks";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";


interface PartnerType {
  id: string;
  name: string;
  label: string;
  icon: string;
  color: string;
}

interface Partner {
  id: string;
  name: string;
  type: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  commission_rate: number | null;
  active: boolean;
  cpf_cnpj: string | null;
  address: string | null;
  cnh: string | null;
  cnh_validade: string | null;
  cadastur: string | null;
  remuneration_type: string | null;
  remuneration_value: number | null;
}

const iconMap: Record<string, any> = {
  Building2, Compass, Car, Users, MapPin, Search, Plus, Edit, Trash2, Loader2
};

const getIcon = (name: string) => iconMap[name] || Building2;

function isCnpj(value: string): boolean {
  return value.replace(/\D/g, "").length >= 14;
}


const AdminParceiros = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [partnerTypes, setPartnerTypes] = useState<PartnerType[]>([]);
  const [loading, setLoading] = useState(true);
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
  const [company, setCompany] = useState<any>(null);
  
  const [form, setForm] = useState({
    name: "", type: "hotel", contact_name: "", phone: "", email: "",
    commission_rate: "10", cpf_cnpj: "", address: "", cnh: "", cnh_validade: "", cadastur: "",
    remuneration_type: "comissao_percent", remuneration_value: "0"
  });

  const [typeForm, setTypeForm] = useState({
    name: "", label: "", icon: "Building2", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
  });

  useEffect(() => { 
    fetchInitialData(); 
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    await Promise.all([fetchPartners(), fetchTypes(), fetchCompany()]);
    setLoading(false);
  };

  const fetchCompany = async () => {
    const { data } = await supabase.from("sgs_empresa").select("*").limit(1).maybeSingle();
    if (data) setCompany(data);
  };

  const fetchPartners = async () => {
    const { data } = await supabase.from("partners").select("*").order("created_at", { ascending: false });
    if (data) setPartners(data as Partner[]);
  };

  const fetchTypes = async () => {
    const { data } = await supabase.from("partner_types").select("*").order("label", { ascending: true });
    if (data) setPartnerTypes(data as PartnerType[]);
  };

  const openNew = () => {
    setEditPartner(null);
    setForm({ 
      name: "", type: partnerTypes[0]?.name || "hotel", contact_name: "", phone: "", 
      email: "", commission_rate: "10", cpf_cnpj: "", address: "", 
      cnh: "", cnh_validade: "", cadastur: "",
      remuneration_type: "comissao_percent", remuneration_value: "0"
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
      remuneration_value: String(p.remuneration_value || 0)
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
          cnh_numero: form.cnh.trim() || null,
          cnh_validade: form.cnh_validade || null,
          status: "ativo",
          observacoes: `Sincronizado automaticamente do módulo Parceiros (${form.type})`
        };

        // Verifica se já existe um condutor com esse nome ou CPF
        const { data: existing } = await supabase
          .from("sgs_condutores")
          .select("id")
          .or(`nome.eq."${form.name.trim()}"${form.cpf_cnpj ? `,cpf.eq."${form.cpf_cnpj.trim()}"` : ""}`)
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{partners.length}</span> parceiros cadastrados · <span className="font-semibold text-green-600">{activeCount}</span> ativos
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportPDF}>
            <Settings2 size={16} className="mr-1.5" /> Exportar PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => setTypesDialogOpen(true)}>
            <Settings2 size={16} className="mr-1.5" /> Gerenciar Tipos
          </Button>
          <Button onClick={openNew} size="sm">
            <Plus size={16} className="mr-1.5" /> Novo Parceiro
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {partnerTypes.map((t) => {
          const Icon = getIcon(t.icon);
          return (
            <Card key={t.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setTypeFilter(t.name)}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`p-3 rounded-xl ${t.color}`}><Icon size={22} /></div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{partners.filter((p) => p.type === t.name).length}</p>
                  <p className="text-xs text-muted-foreground">{t.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mb-6">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input placeholder="Buscar por nome, contato, email ou CPF/CNPJ..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          <div className="flex gap-2 flex-wrap overflow-x-auto no-scrollbar pb-1">
            <Button variant={typeFilter === "todos" ? "default" : "outline"} size="sm" onClick={() => setTypeFilter("todos")}>
              Todos
            </Button>
            {partnerTypes.map((t) => (
              <Button key={t.id} variant={typeFilter === t.name ? "default" : "outline"} size="sm" onClick={() => setTypeFilter(t.name)}>
                {t.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Users className="mx-auto mb-3 opacity-40" size={40} />
            <p className="font-medium">Nenhum parceiro encontrado</p>
            <p className="text-sm mt-1">Cadastre um novo parceiro ou mude o filtro.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parceiro</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>CPF/CNPJ</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Remuneração</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => {
                  const type = partnerTypes.find(t => t.name === p.type) || partnerTypes[0];
                  const Icon = getIcon(type?.icon || "Building2");
                  return (
                    <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setViewPartner(p)}>
                      <TableCell>
                        <div>
                          <p className="font-semibold text-foreground">{p.name}</p>
                          {p.email && <p className="text-xs text-muted-foreground">{p.email}</p>}
                          {p.address && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin size={10} />{p.address.length > 40 ? p.address.slice(0, 40) + "..." : p.address}</p>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={type?.color}>
                          <Icon size={12} className="mr-1" />{type?.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm font-mono">{p.cpf_cnpj || "—"}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {p.contact_name && <span className="block">{p.contact_name}</span>}
                        {p.phone && <span className="block">{p.phone}</span>}
                        {p.type === "motorista" && p.cnh && (
                          <span className="block text-xs text-amber-600 dark:text-amber-400">CNH: {p.cnh}{p.cnh_validade ? ` (val. ${new Date(p.cnh_validade + "T12:00:00").toLocaleDateString("pt-BR")})` : ""}</span>
                        )}
                        {p.type === "guia" && p.cadastur && (
                          <span className="block text-xs text-green-600 dark:text-green-400">Cadastur: {p.cadastur}</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {p.remuneration_type === "comissao_percent" && `${p.remuneration_value || 0}%`}
                        {p.remuneration_type === "valor_por_passeio" && `R$ ${p.remuneration_value || 0} / passeio`}
                        {p.remuneration_type === "valor_mensal" && `R$ ${p.remuneration_value || 0} / mês`}
                        {!p.remuneration_type && `${p.commission_rate || 0}%`}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={p.active
                            ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 cursor-pointer"
                            : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 cursor-pointer"
                          }
                          onClick={() => toggleActive(p)}
                        >
                          {p.active ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" onClick={() => setViewPartner(p)} title="Visualizar"><Eye size={14} /></Button>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(p)} title="Editar"><Edit size={14} /></Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteId(p.id)} title="Excluir"><Trash2 size={14} className="text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          </div>
        )}
      </Card>

      {/* Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editPartner ? "Editar Parceiro" : "Novo Parceiro"}</DialogTitle>
            <DialogDescription>Preencha os dados do parceiro. Ao digitar um CNPJ válido, os dados serão preenchidos automaticamente.</DialogDescription>
          </DialogHeader>
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
            <div className="p-4 border border-blue-100 dark:border-blue-900 rounded-xl bg-blue-50/30 dark:bg-blue-900/10 space-y-4">
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-1">
                <Landmark size={14} /> Regra de Remuneração
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="mb-1.5 block">Tipo de Remuneração</Label>
                  <select 
                    value={form.remuneration_type} 
                    onChange={(e) => setForm({ ...form, remuneration_type: e.target.value })}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="comissao_percent">Comissão %</option>
                    <option value="valor_por_passeio">Por Passeio R$</option>
                    <option value="valor_mensal">Mensal R$</option>
                  </select>
                </div>
                <div>
                  <Label className="mb-1.5 block">
                    {form.remuneration_type === "comissao_percent" ? "Porcentagem (%)" : "Valor (R$)"}
                  </Label>
                  <Input 
                    type="number" 
                    min="0" 
                    value={form.remuneration_value} 
                    onChange={(e) => setForm({ ...form, remuneration_value: e.target.value })} 
                  />
                </div>
              </div>
            </div>

            {form.type === "motorista" && (
              <div className="space-y-4 p-4 border border-amber-200 dark:border-amber-800 rounded-xl bg-amber-50/50 dark:bg-amber-900/10">
                <p className="text-sm font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1"><Car size={14} /> Dados do Motorista</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-1.5 block">Nº da CNH</Label>
                    <Input value={form.cnh} onChange={(e) => setForm({ ...form, cnh: e.target.value })} placeholder="00000000000" maxLength={20} />
                  </div>
                  <div>
                    <Label className="mb-1.5 block">Validade da CNH</Label>
                    <Input type="date" value={form.cnh_validade} onChange={(e) => setForm({ ...form, cnh_validade: e.target.value })} />
                  </div>
                </div>
              </div>
            )}

            {form.type === "guia" && (
              <div className="space-y-4 p-4 border border-green-200 dark:border-green-800 rounded-xl bg-green-50/50 dark:bg-green-900/10">
                <p className="text-sm font-semibold text-green-700 dark:text-green-400 flex items-center gap-1"><Compass size={14} /> Dados do Guia</p>
                <div>
                  <Label className="mb-1.5 block">Nº Cadastur (Autorização)</Label>
                  <Input value={form.cadastur} onChange={(e) => setForm({ ...form, cadastur: e.target.value })} placeholder="Número de registro no Cadastur" maxLength={30} />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="animate-spin mr-2" size={16} />}
              {editPartner ? "Salvar" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Types Management Dialog */}
      <Dialog open={typesDialogOpen} onOpenChange={setTypesDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gerenciar Tipos de Parceiros</DialogTitle>
            <DialogDescription>Adicione, edite ou remova categorias de parceiros.</DialogDescription>
          </DialogHeader>
          
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
        <DialogContent className="max-w-2xl sm:max-w-xl">
          <DialogHeader className="pb-4 border-b">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-2xl ${partnerTypes.find(t => t.name === viewPartner?.type)?.color || "bg-primary/10 text-primary"}`}>
                {(() => {
                  const Icon = getIcon(partnerTypes.find(t => t.name === viewPartner?.type)?.icon || "Building2");
                  return <Icon size={32} />;
                })()}
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold">{viewPartner?.name}</DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs uppercase font-semibold tracking-wider">
                    {partnerTypes.find(t => t.name === viewPartner?.type)?.label || viewPartner?.type}
                  </Badge>
                  <Badge 
                    className={viewPartner?.active 
                      ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" 
                      : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                    }
                  >
                    {viewPartner?.active ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
              </div>
            </div>
          </DialogHeader>

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
                            {viewPartner.cnh_validade ? format(new Date(viewPartner.cnh_validade + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR }) : "N/A"}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">CADASTUR</span>
                        <span className="text-sm font-bold">{viewPartner.cadastur || "Não cadastrado"}</span>
                      </div>
                    )}
                  </div>
                </section>
              )}
            </div>
          </div>

          <DialogFooter className="border-t pt-4 sm:justify-between gap-2">
            <Button variant="outline" className="gap-2" onClick={() => {
              if (viewPartner) {
                openEdit(viewPartner);
                setViewPartner(null);
              }
            }}>
              <Edit size={16} /> Editar Dados
            </Button>
            <div className="flex gap-2">
              <Button 
                variant={viewPartner?.active ? "destructive" : "default"} 
                className="gap-2"
                onClick={() => {
                  if (viewPartner) {
                    toggleActive(viewPartner);
                    setViewPartner(null);
                  }
                }}
              >
                {viewPartner?.active ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
                {viewPartner?.active ? "Desativar Parceiro" : "Ativar Parceiro"}
              </Button>
              <Button onClick={() => setViewPartner(null)}>Fechar</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminParceiros;
