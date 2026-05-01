import { useEffect, useState, useRef } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Building2, Save, Upload, Loader2, X, Image } from "lucide-react";
import { maskCNPJ, maskPhone } from "@/lib/masks";

import { Button } from "@/components/ui/button";

const AdminSGSEmpresa = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    observacoes: "",
    logo_url: "",
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
        observacoes: data.observacoes || "",
        logo_url: data.logo_url || "",
      });
      if (data.logo_url) {
        setLogoPreview(data.logo_url);
      }
    }
    setLoading(false);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: "Formato inválido", description: "Use PNG, JPG, WebP ou SVG.", variant: "destructive" });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "Máximo 2MB.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const filePath = `logos/empresa-logo-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("company-documents")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        toast({ title: "Erro no upload", description: uploadError.message, variant: "destructive" });
        setUploading(false);
        return;
      }

      // Get signed URL (private bucket)
      const { data: signedData } = await supabase.storage
        .from("company-documents")
        .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 year

      const logoUrl = signedData?.signedUrl || "";

      // Save to form and preview
      setForm(prev => ({ ...prev, logo_url: logoUrl }));
      setLogoPreview(logoUrl);

      // Auto-save logo_url if empresa already exists
      if (form.id) {
        await supabase.from("sgs_empresa").update({ logo_url: logoUrl }).eq("id", form.id);
        toast({ title: "Logo atualizado!" });
      } else {
        toast({ title: "Logo carregado! Salve os dados para confirmar." });
      }
    } catch (err) {
      toast({ title: "Erro ao enviar logo", variant: "destructive" });
    }
    setUploading(false);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeLogo = async () => {
    setLogoPreview(null);
    setForm(prev => ({ ...prev, logo_url: "" }));
    if (form.id) {
      await supabase.from("sgs_empresa").update({ logo_url: null }).eq("id", form.id);
      toast({ title: "Logo removido!" });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.razao_social.trim()) { toast({ title: "Razão social obrigatória", variant: "destructive" }); return; }
    setSaving(true);
    const { id, ...payload } = form;
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

  const set = (k: string, v: string) => {
    let value = v;
    if (k === "cnpj") value = maskCNPJ(v);
    if (k === "telefone") value = maskPhone(v);
    setForm(p => ({ ...p, [k]: value }));
  };
  
  const Field = ({ label, field, type = "text", span = 1 }: { label: string; field: string; type?: string; span?: number }) => (
    <div className={span === 2 ? "sm:col-span-2" : ""}>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
      <input type={type} value={(form as any)[field] || ""} onChange={e => set(field, e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" 
        maxLength={field === "cnpj" ? 18 : field === "telefone" ? 15 : undefined}
      />
    </div>
  );


  if (loading) return <AdminLayout title="SGS — Empresa"><div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div></AdminLayout>;

  return (
    <AdminLayout title="SGS — Dados da Empresa">
      <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
        {/* Logo */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Image size={20} className="text-primary" />
            <h3 className="font-display font-bold text-foreground">Logo da Empresa</h3>
          </div>
          <div className="flex items-center gap-6">
            {logoPreview ? (
              <div className="relative">
                <img
                  src={logoPreview}
                  alt="Logo da empresa"
                  className="w-28 h-28 object-contain rounded-xl border border-border bg-muted p-2"
                  onError={() => setLogoPreview(null)}
                />
                <button
                  type="button"
                  onClick={removeLogo}
                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:opacity-80"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="w-28 h-28 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-muted/50">
                <Building2 size={32} className="text-muted-foreground/40" />
              </div>
            )}
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <><Loader2 size={14} className="animate-spin mr-1" /> Enviando...</>
                ) : (
                  <><Upload size={14} className="mr-1" /> {logoPreview ? "Trocar Logo" : "Enviar Logo"}</>
                )}
              </Button>
              <p className="text-xs text-muted-foreground">PNG, JPG, WebP ou SVG. Máx 2MB.</p>
            </div>
          </div>
        </div>

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