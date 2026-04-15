import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Building2, Save } from "lucide-react";

const AdminSGSEmpresa = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    id: "",
    razao_social: "",
    nome_fantasia: "",
    cnpj: "",
    cadastur: "",
    responsavel_nome: "",
    responsavel_cargo: "",
    responsavel_tecnico: "",
    telefone: "",
    email: "",
    endereco: "",
    cidade: "",
    estado: "MA",
    uc_nome: "",
    uc_tipo: "",
    icmbio_autorizacao: "",
    icmbio_validade: "",
    observacoes: "",
  });

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("sgs_empresa").select("*").limit(1).maybeSingle();
    if (data) {
      setForm({
        id: data.id,
        razao_social: data.razao_social || "",
        nome_fantasia: data.nome_fantasia || "",
        cnpj: data.cnpj || "",
        cadastur: data.cadastur || "",
        responsavel_nome: data.responsavel_nome || "",
        responsavel_cargo: data.responsavel_cargo || "",
        responsavel_tecnico: data.responsavel_tecnico || "",
        telefone: data.telefone || "",
        email: data.email || "",
        endereco: data.endereco || "",
        cidade: data.cidade || "",
        estado: data.estado || "MA",
        uc_nome: data.uc_nome || "",
        uc_tipo: data.uc_tipo || "",
        icmbio_autorizacao: data.icmbio_autorizacao || "",
        icmbio_validade: data.icmbio_validade || "",
        observacoes: data.observacoes || "",
      });
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.razao_social.trim()) { toast({ title: "Razão social obrigatória", variant: "destructive" }); return; }
    setSaving(true);
    const payload = { ...form, id: undefined };
    let res;
    if (form.id) {
      res = await supabase.from("sgs_empresa").update(payload).eq("id", form.id);
    } else {
      res = await supabase.from("sgs_empresa").insert(payload).select().single();
      if (res.data) setForm(prev => ({ ...prev, id: res.data.id }));
    }
    if (res.error) toast({ title: "Erro ao salvar", description: res.error.message, variant: "destructive" });
    else toast({ title: "Dados da empresa salvos!" });
    setSaving(false);
  };

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const Field = ({ label, field, type = "text", span = 1 }: { label: string; field: string; type?: string; span?: number }) => (
    <div className={span === 2 ? "sm:col-span-2" : ""}>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
      <input type={type} value={(form as any)[field] || ""} onChange={e => set(field, e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" />
    </div>
  );

  if (loading) return <AdminLayout title="SGS — Empresa"><div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div></AdminLayout>;

  return (
    <AdminLayout title="SGS — Dados da Empresa">
      <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
        {/* Dados Gerais */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Building2 size={20} className="text-primary" />
            <h3 className="font-display font-bold text-foreground">Dados Gerais</h3>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Razão Social *" field="razao_social" span={2} />
            <Field label="Nome Fantasia" field="nome_fantasia" />
            <Field label="CNPJ" field="cnpj" />
            <Field label="CADASTUR" field="cadastur" />
            <Field label="Telefone" field="telefone" />
            <Field label="E-mail" field="email" type="email" />
            <Field label="Endereço" field="endereco" span={2} />
            <Field label="Cidade" field="cidade" />
            <Field label="Estado" field="estado" />
          </div>
        </div>

        {/* Responsáveis */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-display font-bold text-foreground mb-4">Responsáveis</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Responsável Legal" field="responsavel_nome" />
            <Field label="Cargo" field="responsavel_cargo" />
            <Field label="Responsável Técnico" field="responsavel_tecnico" span={2} />
          </div>
        </div>

        {/* UC / ICMBio */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-display font-bold text-foreground mb-4">Unidade de Conservação</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Nome da UC" field="uc_nome" />
            <Field label="Tipo da UC" field="uc_tipo" />
            <Field label="Autorização ICMBio" field="icmbio_autorizacao" />
            <Field label="Validade Autorização" field="icmbio_validade" type="date" />
          </div>
        </div>

        {/* Observações */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <label className="block text-xs font-medium text-muted-foreground mb-1">Observações</label>
          <textarea value={form.observacoes} onChange={e => set("observacoes", e.target.value)} rows={3}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" />
        </div>

        <button type="submit" disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
          <Save size={18} />
          {saving ? "Salvando..." : "Salvar Dados"}
        </button>
      </form>
    </AdminLayout>
  );
};

export default AdminSGSEmpresa;
