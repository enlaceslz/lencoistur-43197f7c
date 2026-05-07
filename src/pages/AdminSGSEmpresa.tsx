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
    <AdminLayout title="SGS — Perfil Organizacional">
      <div className="max-w-5xl space-y-8 animate-in fade-in duration-500">
        <div className="glass-card p-8 rounded-[2.5rem] border border-border/50 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="p-4 rounded-3xl bg-primary/10 text-primary shadow-inner">
              <Building2 size={32} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">Lençóis Tour</h2>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Configuração do Sistema de Gestão de Segurança</p>
            </div>
          </div>
          <div className="flex gap-3">
             <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-black px-4 py-1.5 rounded-full uppercase text-[10px]">Sistema Ativo</Badge>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-8">
          {/* Logo */}
          <div className="bg-card/50 backdrop-blur-xl border border-border rounded-[2.5rem] p-8 md:p-10 shadow-sm admin-card-hover transition-all">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 rounded-2xl bg-primary/10 text-primary shadow-inner">
                <Image size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-xl font-black text-foreground tracking-tight">Identidade Visual</h3>
                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Logo oficial para documentos e relatórios SGS</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-10">
              {logoPreview ? (
                <div className="relative group">
                  <div className="w-40 h-40 rounded-[2rem] border-2 border-border bg-white p-4 shadow-inner flex items-center justify-center overflow-hidden transition-all group-hover:border-primary/50">
                    <img
                      src={logoPreview}
                      alt="Logo da empresa"
                      className="w-full h-full object-contain"
                      onError={() => setLogoPreview(null)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="absolute -top-3 -right-3 bg-destructive text-destructive-foreground rounded-full p-2 hover:scale-110 transition-transform shadow-lg"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="w-40 h-40 rounded-[2rem] border-2 border-dashed border-border flex items-center justify-center bg-muted/50 shadow-inner">
                  <Building2 size={48} className="text-muted-foreground/20" />
                </div>
              )}
              <div className="space-y-4 text-center sm:text-left">
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
                  size="lg"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="h-12 px-8 rounded-2xl font-black uppercase tracking-widest text-xs border-2 hover:bg-primary hover:text-white hover:border-primary transition-all active:scale-95"
                >
                  {uploading ? (
                    <><Loader2 size={16} className="animate-spin mr-2" /> Enviando...</>
                  ) : (
                    <><Upload size={16} className="mr-2" /> {logoPreview ? "Trocar Logotipo" : "Selecionar Logotipo"}</>
                  )}
                </Button>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Formatos aceitos: PNG, JPG, WebP ou SVG (Máx 2MB)</p>
              </div>
            </div>
          </div>

          {/* Dados Gerais */}
          <div className="bg-card/50 backdrop-blur-xl border border-border rounded-[2.5rem] p-8 md:p-10 shadow-sm admin-card-hover transition-all">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 rounded-2xl bg-primary/10 text-primary shadow-inner">
                <Building2 size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-xl font-black text-foreground tracking-tight">Dados Jurídicos e Localização</h3>
                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Informações cadastrais e endereço oficial</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5 ml-1">Razão Social *</label>
                <input type="text" value={form.razao_social} onChange={e => set("razao_social", e.target.value)}
                  className="w-full h-12 px-5 rounded-2xl border border-border bg-background text-foreground text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all" 
                />
              </div>
              <Field label="Nome Fantasia" field="nome_fantasia" />
              <Field label="CNPJ" field="cnpj" />
              <Field label="CADASTUR" field="cadastur" />
              <Field label="Telefone" field="telefone" />
              <Field label="E-mail Corporativo" field="email" type="email" />
              <Field label="Endereço" field="endereco" span={2} />
              <Field label="Cidade" field="cidade" />
              <Field label="Estado" field="estado" />
            </div>
          </div>

          {/* Responsáveis */}
          <div className="bg-card/50 backdrop-blur-xl border border-border rounded-[2.5rem] p-8 md:p-10 shadow-sm admin-card-hover transition-all">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 rounded-2xl bg-primary/10 text-primary shadow-inner">
                <Building2 size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-xl font-black text-foreground tracking-tight">Corpo Técnico e Responsabilidade</h3>
                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Responsáveis legais e operacionais</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-6">
              <Field label="Responsável Legal" field="responsavel_nome" />
              <Field label="Cargo / Função" field="responsavel_cargo" />
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5 ml-1">Responsável Técnico (RT)</label>
                <input type="text" value={form.responsavel_tecnico} onChange={e => set("responsavel_tecnico", e.target.value)}
                  className="w-full h-12 px-5 rounded-2xl border border-border bg-background text-foreground text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all" 
                />
              </div>
            </div>
          </div>

          {/* Observações */}
          <div className="bg-card/50 backdrop-blur-xl border border-border rounded-[2.5rem] p-8 md:p-10 shadow-sm admin-card-hover transition-all">
            <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 ml-1">Observações Gerais</label>
            <textarea value={form.observacoes} onChange={e => set("observacoes", e.target.value)} rows={4}
              className="w-full p-5 rounded-3xl border border-border bg-background text-foreground text-sm font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all resize-none" 
            />
          </div>

          <div className="flex justify-end pt-4 pb-20">
            <Button 
              type="submit" 
              disabled={saving}
              className="h-16 px-12 rounded-[2rem] bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest shadow-2xl shadow-primary/40 transition-all active:scale-95 flex items-center gap-4 group"
            >
              {saving ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} strokeWidth={3} className="group-hover:scale-110 transition-transform" />}
              Finalizar e Atualizar Perfil
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default AdminSGSEmpresa;