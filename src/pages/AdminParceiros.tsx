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
  Building2, Compass, Car, Users, Search, Plus, Edit, Trash2, Loader2, MapPin,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
}

const typeConfig: Record<string, { icon: typeof Building2; label: string; color: string }> = {
  hotel: { icon: Building2, label: "Hotel / Pousada", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  guia: { icon: Compass, label: "Guia Turístico", color: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" },
  motorista: { icon: Car, label: "Motorista", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  agencia: { icon: Users, label: "Agência", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300" },
};

function formatCpfCnpj(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2}\.\d{3})(\d)/, "$1.$2")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

function isCnpj(value: string): boolean {
  return value.replace(/\D/g, "").length >= 14;
}

const AdminParceiros = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editPartner, setEditPartner] = useState<Partner | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [cnpjLoading, setCnpjLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", type: "hotel", contact_name: "", phone: "", email: "",
    commission_rate: "10", cpf_cnpj: "", address: "",
  });

  const types = ["todos", ...Object.keys(typeConfig)];

  useEffect(() => { fetchPartners(); }, []);

  const fetchPartners = async () => {
    setLoading(true);
    const { data } = await supabase.from("partners").select("*").order("created_at", { ascending: false });
    if (data) setPartners(data as Partner[]);
    setLoading(false);
  };

  const openNew = () => {
    setEditPartner(null);
    setForm({ name: "", type: "hotel", contact_name: "", phone: "", email: "", commission_rate: "10", cpf_cnpj: "", address: "" });
    setDialogOpen(true);
  };

  const openEdit = (p: Partner) => {
    setEditPartner(p);
    setForm({
      name: p.name, type: p.type,
      contact_name: p.contact_name || "", phone: p.phone || "",
      email: p.email || "", commission_rate: String(p.commission_rate || 0),
      cpf_cnpj: p.cpf_cnpj || "", address: p.address || "",
    });
    setDialogOpen(true);
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
    const formatted = formatCpfCnpj(value);
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
    };

    if (editPartner) {
      const { error } = await supabase.from("partners").update(payload).eq("id", editPartner.id);
      if (error) toast.error("Erro ao atualizar."); else toast.success("Parceiro atualizado!");
    } else {
      const { error } = await supabase.from("partners").insert(payload);
      if (error) toast.error("Erro ao cadastrar."); else toast.success("Parceiro cadastrado!");
    }
    setSaving(false);
    setDialogOpen(false);
    fetchPartners();
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

  const filtered = partners.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = p.name.toLowerCase().includes(q) || (p.contact_name || "").toLowerCase().includes(q) || (p.email || "").toLowerCase().includes(q) || (p.cpf_cnpj || "").includes(q);
    const matchType = typeFilter === "todos" || p.type === typeFilter;
    return matchSearch && matchType;
  });

  const activeCount = partners.filter((p) => p.active).length;
  const stats = [
    { icon: Building2, label: "Hotéis", value: partners.filter((p) => p.type === "hotel").length, color: "text-blue-600" },
    { icon: Compass, label: "Guias", value: partners.filter((p) => p.type === "guia").length, color: "text-green-600" },
    { icon: Car, label: "Motoristas", value: partners.filter((p) => p.type === "motorista").length, color: "text-amber-600" },
    { icon: Users, label: "Agências", value: partners.filter((p) => p.type === "agencia").length, color: "text-purple-600" },
  ];

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
      <div className="flex items-center gap-3 mb-6">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{partners.length}</span> parceiros cadastrados · <span className="font-semibold text-green-600">{activeCount}</span> ativos
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`p-3 rounded-xl bg-muted ${s.color}`}><s.icon size={22} /></div>
              <div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mb-6">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input placeholder="Buscar por nome, contato, email ou CPF/CNPJ..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {types.map((t) => (
              <Button key={t} variant={typeFilter === t ? "default" : "outline"} size="sm" onClick={() => setTypeFilter(t)} className="capitalize">
                {t === "todos" ? "Todos" : typeConfig[t]?.label || t}
              </Button>
            ))}
          </div>
          <Button onClick={openNew}><Plus size={16} className="mr-1" /> Novo Parceiro</Button>
        </CardContent>
      </Card>

      <Card>
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Users className="mx-auto mb-3 opacity-40" size={40} />
            <p className="font-medium">Nenhum parceiro encontrado</p>
            <p className="text-sm mt-1">Cadastre um novo parceiro para começar.</p>
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
                  <TableHead>Comissão</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => {
                  const tc = typeConfig[p.type] || typeConfig.hotel;
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div>
                          <p className="font-semibold text-foreground">{p.name}</p>
                          {p.email && <p className="text-xs text-muted-foreground">{p.email}</p>}
                          {p.address && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin size={10} />{p.address.length > 40 ? p.address.slice(0, 40) + "..." : p.address}</p>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={tc.color}>
                          <tc.icon size={12} className="mr-1" />{tc.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm font-mono">{p.cpf_cnpj || "—"}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {p.contact_name && <span className="block">{p.contact_name}</span>}
                        {p.phone && <span className="block">{p.phone}</span>}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">{p.commission_rate || 0}%</TableCell>
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
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Edit size={14} /></Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteId(p.id)}><Trash2 size={14} className="text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
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
              {isCnpj(form.cpf_cnpj) && (
                <p className="text-xs text-muted-foreground mt-1">CNPJ detectado — dados serão preenchidos automaticamente via Receita Federal.</p>
              )}
            </div>
            <div>
              <Label className="mb-1.5 block">Nome / Razão Social *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label className="mb-1.5 block">Tipo *</Label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm text-foreground outline-none">
                {Object.entries(typeConfig).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
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
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            <div>
              <Label className="mb-1.5 block">Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <Label className="mb-1.5 block">Comissão (%)</Label>
              <Input type="number" min="0" max="100" value={form.commission_rate} onChange={(e) => setForm({ ...form, commission_rate: e.target.value })} />
            </div>
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
    </AdminLayout>
  );
};

export default AdminParceiros;
