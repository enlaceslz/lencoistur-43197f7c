import { useState, useRef, useEffect, useCallback } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Globe, CreditCard, Bell, Shield, Save, Loader2, Eye, EyeOff, Upload, Image, X, CheckCircle, AlertCircle, Banknote, Landmark, Database, Download, UploadCloud, Clock, HardDrive, RefreshCw, Trash2, Plus } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { maskCPF, maskCNPJ, maskPhone } from "@/lib/masks";


const PIX_KEY_TYPES = [
  { value: "cpf", label: "CPF", mask: "###.###.###-##", maxLength: 14 },
  { value: "cnpj", label: "CNPJ", mask: "##.###.###/####-##", maxLength: 18 },
  { value: "email", label: "E-mail", mask: "", maxLength: 100 },
  { value: "telefone", label: "Telefone", mask: "+## (##) #####-####", maxLength: 20 },
  { value: "aleatoria", label: "Chave Aleatória", mask: "", maxLength: 36 },
] as const;

type PixKeyType = typeof PIX_KEY_TYPES[number]["value"];

const validatePixKey = (key: string, type: PixKeyType): { valid: boolean; message: string } => {
  if (!key.trim()) return { valid: false, message: "Chave PIX é obrigatória." };
  const cleaned = key.replace(/[.\-/() +]/g, "");
  switch (type) {
    case "cpf":
      if (!/^\d{11}$/.test(cleaned)) return { valid: false, message: "CPF deve conter 11 dígitos." };
      if (/^(\d)\1{10}$/.test(cleaned)) return { valid: false, message: "CPF inválido." };
      { const digits = cleaned.split("").map(Number);
        let sum = 0; for (let i = 0; i < 9; i++) sum += digits[i] * (10 - i);
        let rem = (sum * 10) % 11; if (rem === 10) rem = 0;
        if (rem !== digits[9]) return { valid: false, message: "CPF inválido (dígito verificador)." };
        sum = 0; for (let i = 0; i < 10; i++) sum += digits[i] * (11 - i);
        rem = (sum * 10) % 11; if (rem === 10) rem = 0;
        if (rem !== digits[10]) return { valid: false, message: "CPF inválido (dígito verificador)." };
      }
      return { valid: true, message: "CPF válido ✓" };
    case "cnpj":
      if (!/^\d{14}$/.test(cleaned)) return { valid: false, message: "CNPJ deve conter 14 dígitos." };
      if (/^(\d)\1{13}$/.test(cleaned)) return { valid: false, message: "CNPJ inválido." };
      { const digits = cleaned.split("").map(Number);
        const w1 = [5,4,3,2,9,8,7,6,5,4,3,2]; let sum = 0;
        for (let i = 0; i < 12; i++) sum += digits[i] * w1[i];
        let rem = sum % 11; const d1 = rem < 2 ? 0 : 11 - rem;
        if (d1 !== digits[12]) return { valid: false, message: "CNPJ inválido (dígito verificador)." };
        const w2 = [6,5,4,3,2,9,8,7,6,5,4,3,2]; sum = 0;
        for (let i = 0; i < 13; i++) sum += digits[i] * w2[i];
        rem = sum % 11; const d2 = rem < 2 ? 0 : 11 - rem;
        if (d2 !== digits[13]) return { valid: false, message: "CNPJ inválido (dígito verificador)." };
      }
      return { valid: true, message: "CNPJ válido ✓" };
    case "email":
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(key.trim())) return { valid: false, message: "E-mail inválido." };
      return { valid: true, message: "E-mail válido ✓" };
    case "telefone":
      if (!/^\d{10,13}$/.test(cleaned)) return { valid: false, message: "Telefone deve ter 10 a 13 dígitos (com DDD e código do país)." };
      return { valid: true, message: "Telefone válido ✓" };
    case "aleatoria":
      if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(key.trim()))
        return { valid: false, message: "Chave aleatória deve estar no formato UUID." };
      return { valid: true, message: "Chave aleatória válida ✓" };
    default:
      return { valid: false, message: "Tipo de chave inválido." };
  }
};

const DEFAULTS = {
  empresa: { nome: "LençóisTour", cnpj: "12.345.678/0001-90", telefone: "(98) 99999-0000", whatsapp: "(98) 99999-0000", endereco: "Santo Amaro do Maranhão, MA", email: "contato@lencoistour.com" },
  site: { 
    titulo: "LençóisTour - Passeios nos Lençóis Maranhenses", 
    metaDescricao: "Descubra os Lençóis Maranhenses com a melhor experiência turística.", 
    whatsappUrl: "https://wa.me/5598999990000", 
    instagram: "https://instagram.com/lencoistour", 
    corPrimaria: "#2563eb", 
    logoUrl: null as string | null, 
    bannerUrl: null as string | null,
    banners: [] as Array<{ url: string; id: string }>,
    bannerTransition: "fade" as "fade" | "slide"
  },
  pagamentos: { pix: true, cartao: true, boleto: false, dinheiro: true, transferencia: false, pixChave: "12.345.678/0001-90", pixTipo: "cnpj" as PixKeyType },
  notificacoes: { email: true, whatsapp: true, push: false, novaReserva: true, cancelamento: true, pagamento: true },
  gallery: { images: [] as Array<{ src: string; alt: string }> },
};

const AdminConfig = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [empresa, setEmpresa] = useState(DEFAULTS.empresa);
  const [site, setSite] = useState(DEFAULTS.site);
  const [pagamentos, setPagamentos] = useState(DEFAULTS.pagamentos);
  const [notifications, setNotifications] = useState(DEFAULTS.notificacoes);
  const [gallery, setGallery] = useState(DEFAULTS.gallery);

  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const restoreInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [backupHistory, setBackupHistory] = useState<Array<{ date: string; tables: number; records: number; size: string }>>([]);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value");
      
      if (error) {
        toast.error("Erro ao carregar configurações: " + error.message);
        throw error;
      }

      if (data) {
        const settingsMap: Record<string, any> = {};
        data.forEach(row => { settingsMap[row.key] = row.value; });

        if (settingsMap.empresa) setEmpresa({ ...DEFAULTS.empresa, ...settingsMap.empresa });
        
        if (settingsMap.site) {
          const siteVal = { ...DEFAULTS.site, ...settingsMap.site };
          if (siteVal.banners?.length > 0 && !siteVal.bannerUrl) {
            siteVal.bannerUrl = siteVal.banners[0].url;
          }
          setSite(siteVal);
          if (siteVal.corPrimaria) {
            document.documentElement.style.setProperty('--primary', siteVal.corPrimaria);
          }
        }

        if (settingsMap.pagamentos) {
          const p = settingsMap.pagamentos;
          setPagamentos({ 
            ...DEFAULTS.pagamentos, 
            ...p, 
            pixTipo: p.pixTipo && PIX_KEY_TYPES.some(t => t.value === p.pixTipo) ? p.pixTipo : DEFAULTS.pagamentos.pixTipo 
          });
        }

        if (settingsMap.notificacoes) setNotifications({ ...DEFAULTS.notificacoes, ...settingsMap.notificacoes });
        if (settingsMap.gallery) setGallery({ ...DEFAULTS.gallery, ...settingsMap.gallery });
      }
    } catch (err) {
      console.error("Error loading settings:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const saveSetting = async (key: string, value: Record<string, unknown>, label: string) => {
    setSaving(true);
    try {
      // Use upsert to handle cases where the key might not exist yet
      const { error } = await supabase
        .from("site_settings")
        .upsert({ 
          key, 
          value: value as any, 
          updated_at: new Date().toISOString() 
        }, { onConflict: 'key' });

      if (error) throw error;
      
      if (key === "site" && value.corPrimaria) {
        document.documentElement.style.setProperty('--primary', value.corPrimaria as string);
      }
      
      toast.success(`Configurações de ${label} salvas com sucesso!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error("Erro ao salvar: " + msg);
      console.error(`Error saving ${key}:`, err);
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Selecione um arquivo de imagem válido."); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error("A imagem deve ter no máximo 2MB."); return; }

    setUploadingLogo(true);
    const ext = file.name.split(".").pop() || "png";
    const path = `logo/logo-${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from("tour-images").upload(path, file, { upsert: true });
    if (error) { toast.error("Erro ao enviar logo: " + error.message); setUploadingLogo(false); return; }

    const { data: urlData } = supabase.storage.from("tour-images").getPublicUrl(path);
    setSite((prev) => ({ ...prev, logoUrl: urlData.publicUrl }));
    setUploadingLogo(false);
    toast.success("Logo enviada com sucesso!");
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Selecione um arquivo de imagem válido."); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("A imagem deve ter no máximo 5MB."); return; }

    setUploadingBanner(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `banners/banner-${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from("tour-images").upload(path, file, { upsert: true });
    if (error) { toast.error("Erro ao enviar banner: " + error.message); setUploadingBanner(false); return; }

    const { data: urlData } = supabase.storage.from("tour-images").getPublicUrl(path);
    setSite((prev) => ({ ...prev, bannerUrl: urlData.publicUrl }));
    setUploadingBanner(false);
    toast.success("Banner principal enviado com sucesso!");
  };

  const handleChangePassword = async () => {
    if (!novaSenha || !confirmarSenha) { toast.error("Preencha a nova senha e a confirmação."); return; }
    if (novaSenha.length < 8) { toast.error("A nova senha deve ter pelo menos 8 caracteres."); return; }
    if (novaSenha !== confirmarSenha) { toast.error("As senhas não conferem."); return; }

    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: novaSenha });
    setChangingPassword(false);

    if (error) { toast.error("Erro ao alterar senha: " + error.message); return; }
    toast.success("Senha alterada com sucesso!");
    setNovaSenha("");
    setConfirmarSenha("");
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingGallery(true);
    const newImages = [...gallery.images];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) continue;
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`A imagem ${file.name} é muito grande (máx 5MB)`);
        continue;
      }

      const ext = file.name.split(".").pop() || "jpg";
      const path = `gallery/img-${Date.now()}-${i}.${ext}`;

      const { error } = await supabase.storage.from("tour-images").upload(path, file);
      if (error) {
        toast.error(`Erro ao enviar ${file.name}: ${error.message}`);
        continue;
      }

      const { data: urlData } = supabase.storage.from("tour-images").getPublicUrl(path);
      newImages.push({ src: urlData.publicUrl, alt: "Foto da Galeria LençóisTour" });
    }

    setGallery({ images: newImages });
    setUploadingGallery(false);
    toast.success("Imagens enviadas! Não esqueça de salvar as alterações.");
  };

  const removeGalleryImage = (index: number) => {
    const newImages = gallery.images.filter((_, i) => i !== index);
    setGallery({ images: newImages });
  };

  const BACKUP_TABLES = [
    "site_settings", "tours", "transfer_routes", "customers", "bookings",
    "partners", "contas_pagar", "contas_receber", "reviews", "documents",
    "marketing_campaigns", "marketing_leads", "remarketing_rules",
    "sgs_risks", "sgs_incidents", "sgs_corrective_actions", "sgs_staff",
    "sgs_staff_trainings", "sgs_audits", "sgs_audit_items", "sgs_briefings",
    "sgs_risk_terms", "sgs_safety_surveys", "sgs_supplier_compliance",
  ] as const;

  const handleBackup = async () => {
    setBackupLoading(true);
    try {
      const backup: Record<string, unknown[]> = {};
      let totalRecords = 0;

      for (const table of BACKUP_TABLES) {
        const { data, error } = await supabase.from(table).select("*");
        if (error) {
          console.error(`Erro ao exportar ${table}:`, error.message);
          backup[table] = [];
        } else {
          backup[table] = data || [];
          totalRecords += (data || []).length;
        }
      }

      const now = new Date();
      const exportData = {
        metadata: {
          version: "1.0",
          created_at: now.toISOString(),
          tables_count: BACKUP_TABLES.length,
          total_records: totalRecords,
          app: "LençóisTour ERP",
        },
        data: backup,
      };

      const json = JSON.stringify(exportData, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const sizeKB = (blob.size / 1024).toFixed(1);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup-lencoistour-${format(now, "yyyy-MM-dd-HHmmss")}.json`;
      a.click();
      URL.revokeObjectURL(url);

      setBackupHistory((prev) => [
        { date: now.toISOString(), tables: BACKUP_TABLES.length, records: totalRecords, size: `${sizeKB} KB` },
        ...prev.slice(0, 9),
      ]);

      toast.success(`Backup realizado com sucesso! ${totalRecords} registros em ${BACKUP_TABLES.length} tabelas.`);
    } catch (err) {
      toast.error("Erro ao gerar backup: " + (err instanceof Error ? err.message : "Erro desconhecido"));
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".json")) { toast.error("Selecione um arquivo .json de backup válido."); return; }

    const confirmRestore = window.confirm(
      "⚠️ ATENÇÃO: A restauração irá SUBSTITUIR todos os dados atuais pelos dados do backup.\n\nEssa ação não pode ser desfeita.\n\nDeseja continuar?"
    );
    if (!confirmRestore) { e.target.value = ""; return; }

    setRestoreLoading(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (!parsed.metadata || !parsed.data) {
        toast.error("Arquivo de backup inválido. Formato não reconhecido.");
        return;
      }

      const backupDate = parsed.metadata.created_at
        ? format(new Date(parsed.metadata.created_at), "dd/MM/yyyy 'às' HH:mm:ss")
        : "Data desconhecida";

      const confirmFinal = window.confirm(
        `Backup de: ${backupDate}\n${parsed.metadata.total_records || "?"} registros em ${parsed.metadata.tables_count || "?"} tabelas.\n\nConfirmar restauração?`
      );
      if (!confirmFinal) return;

      let restored = 0;
      let errors = 0;

      for (const table of BACKUP_TABLES) {
        const rows = parsed.data[table];
        if (!rows || !Array.isArray(rows) || rows.length === 0) continue;

        // Delete existing data
        const { error: delError } = await supabase.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
        if (delError) {
          console.error(`Erro ao limpar ${table}:`, delError.message);
          errors++;
          continue;
        }

        // Insert backup data in batches of 100
        for (let i = 0; i < rows.length; i += 100) {
          const batch = rows.slice(i, i + 100);
          const { error: insError } = await supabase.from(table).insert(batch);
          if (insError) {
            console.error(`Erro ao restaurar ${table}:`, insError.message);
            errors++;
          } else {
            restored += batch.length;
          }
        }
      }

      if (errors > 0) {
        toast.warning(`Restauração parcial: ${restored} registros restaurados com ${errors} erro(s). Verifique o console.`);
      } else {
        toast.success(`Restauração completa! ${restored} registros restaurados com sucesso.`);
      }
    } catch (err) {
      toast.error("Erro ao processar arquivo: " + (err instanceof Error ? err.message : "Formato inválido"));
    } finally {
      setRestoreLoading(false);
      e.target.value = "";
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Configurações">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Configurações">
      <Tabs defaultValue="empresa" className="space-y-6">
        <div className="bg-card border border-border p-2 rounded-2xl shadow-sm overflow-x-auto no-scrollbar">
          <TabsList className="bg-transparent flex-nowrap h-auto gap-1">
            {[
              { value: "empresa", icon: Building2, label: "Agência" },
              { value: "site", icon: Globe, label: "Frontend" },
              { value: "pagamento", icon: CreditCard, label: "Financeiro" },
              { value: "notificacoes", icon: Bell, label: "Alertas" },
              { value: "seguranca", icon: Shield, label: "Acesso" },
              { value: "backup", icon: Database, label: "Backup" },
              { value: "galeria", icon: Image, label: "Mídia" },
            ].map((tab) => (
              <TabsTrigger 
                key={tab.value}
                value={tab.value} 
                className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl px-5 py-2.5 text-xs font-black uppercase tracking-widest transition-all"
              >
                <tab.icon size={14} className="mr-2" /> {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* EMPRESA */}
        <TabsContent value="empresa">
          <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                  <Building2 size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-foreground">Identidade da Agência</h3>
                  <p className="text-sm text-muted-foreground">Dados institucionais utilizados em termos, vouchers e notas.</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nome Fantasia</Label>
                  <Input 
                    value={empresa.nome} 
                    onChange={e => setEmpresa({ ...empresa, nome: e.target.value })}
                    className="h-12 rounded-xl border-muted-foreground/20 focus:ring-primary font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">CNPJ / Identificação</Label>
                  <Input 
                    value={empresa.cnpj} 
                    onChange={e => setEmpresa({ ...empresa, cnpj: maskCNPJ(e.target.value) })}
                    className="h-12 rounded-xl border-muted-foreground/20 focus:ring-primary font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">WhatsApp Operacional</Label>
                  <Input 
                    value={empresa.whatsapp} 
                    onChange={e => setEmpresa({ ...empresa, whatsapp: maskPhone(e.target.value) })}
                    className="h-12 rounded-xl border-muted-foreground/20 focus:ring-primary font-bold text-green-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">E-mail de Contato</Label>
                  <Input 
                    value={empresa.email} 
                    onChange={e => setEmpresa({ ...empresa, email: e.target.value })}
                    className="h-12 rounded-xl border-muted-foreground/20 focus:ring-primary"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Endereço Completo (Sede)</Label>
                  <Input 
                    value={empresa.endereco} 
                    onChange={e => setEmpresa({ ...empresa, endereco: e.target.value })}
                    className="h-12 rounded-xl border-muted-foreground/20 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="mt-10 pt-6 border-t border-border flex justify-end">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      onClick={() => saveSetting("empresa", empresa, "Empresa")} 
                      disabled={saving}
                      className="rounded-xl px-8 h-12 font-black uppercase tracking-widest shadow-lg shadow-primary/20"
                    >
                      {saving ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save size={18} className="mr-2" />}
                      Atualizar Dados
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Salvar alterações nas informações da agência</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SITE */}
        <TabsContent value="site">
          <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
            <CardContent className="p-8 space-y-8">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                  <Globe size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-foreground">Aparência do Website</h3>
                  <p className="text-sm text-muted-foreground">Personalize a identidade visual e banners do site público.</p>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Logotipo da Marca</Label>
                    <div className="flex items-center gap-6 p-4 rounded-2xl bg-muted/30 border border-border/50">
                      <div className="w-24 h-24 rounded-xl border-2 border-dashed border-muted-foreground/20 flex items-center justify-center bg-background overflow-hidden shrink-0">
                        {site.logoUrl ? (
                          <img src={site.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                        ) : (
                          <Image size={32} className="text-muted-foreground/20" />
                        )}
                      </div>
                      <div className="space-y-2">
                        <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                        <div className="flex gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo} className="rounded-xl font-bold h-9">
                            {uploadingLogo ? <Loader2 size={14} className="animate-spin mr-2" /> : <Upload size={14} className="mr-2" />}
                            {site.logoUrl ? "Alterar Logo" : "Fazer Upload"}
                          </Button>
                          {site.logoUrl && (
                            <Button type="button" variant="ghost" size="sm" onClick={() => setSite({ ...site, logoUrl: null })} className="text-destructive rounded-lg h-9">
                              <X size={14} className="mr-1" /> Remover
                            </Button>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground font-medium italic">Sugerido: PNG transparente, máx 2MB.</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Banner Principal (Carrossel)</Label>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {site.banners?.map((b, i) => (
                          <div key={b.id || i} className="aspect-video rounded-xl border border-border bg-muted/30 overflow-hidden relative group">
                            <img src={b.url} alt={`Banner ${i+1}`} className="w-full h-full object-cover" />
                            <button 
                              onClick={() => {
                                const newBanners = site.banners.filter((_, idx) => idx !== i);
                                setSite({ ...site, banners: newBanners, bannerUrl: newBanners[0]?.url || null });
                              }}
                              className="absolute top-2 right-2 p-1.5 bg-destructive text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 size={12} />
                            </button>
                            <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/50 text-[10px] text-white rounded-md font-bold">
                              #{i + 1}
                            </div>
                          </div>
                        ))}
                        
                        <button 
                          type="button"
                          onClick={() => bannerInputRef.current?.click()}
                          disabled={uploadingBanner}
                          className="aspect-video rounded-xl border-2 border-dashed border-muted-foreground/20 flex flex-col items-center justify-center bg-muted/10 hover:bg-muted/20 transition-colors"
                        >
                          {uploadingBanner ? (
                            <Loader2 size={24} className="animate-spin text-muted-foreground" />
                          ) : (
                            <>
                              <Plus size={24} className="text-muted-foreground mb-1" />
                              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Adicionar</span>
                            </>
                          )}
                        </button>
                      </div>
                      
                      {site.banners?.length > 1 && (
                        <div className="flex flex-col gap-3 p-4 rounded-2xl bg-muted/30 border border-border/50">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Efeito de Transição</Label>
                          <div className="flex gap-2">
                            <Button 
                              type="button" 
                              variant={site.bannerTransition === "fade" ? "default" : "outline"}
                              size="sm"
                              className="rounded-lg font-bold"
                              onClick={() => setSite({ ...site, bannerTransition: "fade" })}
                            >
                              Esmaecer (Fade)
                            </Button>
                            <Button 
                              type="button" 
                              variant={site.bannerTransition === "slide" ? "default" : "outline"}
                              size="sm"
                              className="rounded-lg font-bold"
                              onClick={() => setSite({ ...site, bannerTransition: "slide" })}
                            >
                              Deslizar (Slide)
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (!file.type.startsWith("image/")) { toast.error("Selecione um arquivo de imagem válido."); return; }
                        if (file.size > 5 * 1024 * 1024) { toast.error("A imagem deve ter no máximo 5MB."); return; }

                        setUploadingBanner(true);
                        const ext = file.name.split(".").pop() || "jpg";
                        const path = `banners/banner-${Date.now()}.${ext}`;

                        const { error } = await supabase.storage.from("tour-images").upload(path, file, { upsert: true });
                        if (error) { toast.error("Erro ao enviar banner: " + error.message); setUploadingBanner(false); return; }

                        const { data: urlData } = supabase.storage.from("tour-images").getPublicUrl(path);
                        const newBanner = { url: urlData.publicUrl, id: crypto.randomUUID() };
                        const updatedBanners = [...(site.banners || []), newBanner];
                        
                        setSite((prev) => ({ 
                          ...prev, 
                          banners: updatedBanners,
                          bannerUrl: updatedBanners[0]?.url || null 
                        }));
                        setUploadingBanner(false);
                        toast.success("Imagem adicionada ao banner!");
                      }} />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cor Primária da Marca</Label>
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 border border-border/50">
                      <div 
                        className="w-12 h-12 rounded-xl border border-border shadow-inner shrink-0" 
                        style={{ backgroundColor: site.corPrimaria || "#2563eb" }}
                      />
                      <Input 
                        type="color" 
                        value={site.corPrimaria || "#2563eb"} 
                        onChange={(e) => setSite({ ...site, corPrimaria: e.target.value })}
                        className="w-16 h-10 p-1 rounded-lg border-none bg-transparent cursor-pointer"
                      />
                      <Input 
                        type="text" 
                        value={site.corPrimaria || "#2563eb"} 
                        onChange={(e) => setSite({ ...site, corPrimaria: e.target.value })}
                        className="h-10 rounded-xl border-muted-foreground/20 font-mono text-sm"
                        placeholder="#000000"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">SEO e Títulos</Label>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs">Título do Site</Label>
                        <Input 
                          value={site.titulo} 
                          onChange={(e) => setSite({ ...site, titulo: e.target.value })} 
                          className="h-10 rounded-xl border-muted-foreground/20 font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Meta Descrição</Label>
                        <Textarea 
                          value={site.metaDescricao} 
                          onChange={(e) => setSite({ ...site, metaDescricao: e.target.value })} 
                          className="rounded-xl border-muted-foreground/20 resize-none h-24 p-4 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 border-t border-border pt-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Instagram (URL)</Label>
                      <Input 
                        value={site.instagram} 
                        placeholder="https://instagram.com/sua-agencia"
                        onChange={(e) => setSite({ ...site, instagram: e.target.value })} 
                        className="h-11 rounded-xl border-muted-foreground/20" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">WhatsApp do Site (URL)</Label>
                      <Input 
                        value={site.whatsappUrl} 
                        placeholder="https://wa.me/5598..."
                        onChange={(e) => setSite({ ...site, whatsappUrl: e.target.value })} 
                        className="h-11 rounded-xl border-muted-foreground/20" 
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-border flex justify-end">
                <Button 
                  onClick={() => saveSetting("site", site as unknown as Record<string, unknown>, "Frontend")} 
                  disabled={saving} 
                  className="rounded-xl px-8 h-12 font-black uppercase tracking-widest shadow-lg shadow-primary/20"
                >
                  {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
                  Publicar Frontend
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FINANCEIRO / PAGAMENTO */}
        <TabsContent value="pagamento">
          <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
            <CardContent className="p-8 space-y-8">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600">
                  <CreditCard size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-foreground">Configurações Financeiras</h3>
                  <p className="text-sm text-muted-foreground">Gerencie métodos de recebimento e chaves PIX.</p>
                </div>
              </div>

              <div className="grid gap-4">
                {/* PIX */}
                <div className="flex items-center justify-between p-4 border border-border rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center"><Banknote size={20} className="text-emerald-600" /></div>
                    <div>
                      <p className="font-medium text-foreground">PIX</p>
                      <p className="text-sm text-muted-foreground">Pagamento instantâneo via PIX</p>
                    </div>
                  </div>
                  <Switch checked={pagamentos.pix} onCheckedChange={(v) => setPagamentos({ ...pagamentos, pix: v })} />
                </div>
                {pagamentos.pix && (() => {
                  const validation = validatePixKey(pagamentos.pixChave, pagamentos.pixTipo);
                  const selectedType = PIX_KEY_TYPES.find(t => t.value === pagamentos.pixTipo);
                  return (
                    <div className="space-y-4 pl-4 border-l-2 border-emerald-500/30 ml-5">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">Tipo da Chave PIX</Label>
                        <div className="flex flex-wrap gap-2">
                          {PIX_KEY_TYPES.map((t) => (
                            <button
                              key={t.value}
                              type="button"
                              onClick={() => setPagamentos({ ...pagamentos, pixTipo: t.value, pixChave: "" })}
                              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                                pagamentos.pixTipo === t.value
                                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                  : "bg-muted text-muted-foreground border-border hover:bg-accent"
                              }`}
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Chave PIX ({selectedType?.label})</Label>
                        <div className="relative">
                          <Input
                            value={pagamentos.pixChave}
                            onChange={(e) => {
                              let val = e.target.value;
                              if (pagamentos.pixTipo === "cpf") val = maskCPF(val);
                              if (pagamentos.pixTipo === "cnpj") val = maskCNPJ(val);
                              if (pagamentos.pixTipo === "telefone") val = maskPhone(val);
                              setPagamentos({ ...pagamentos, pixChave: val });
                            }}

                            maxLength={selectedType?.maxLength || 50}
                            placeholder={
                              pagamentos.pixTipo === "cpf" ? "000.000.000-00" :
                              pagamentos.pixTipo === "cnpj" ? "00.000.000/0000-00" :
                              pagamentos.pixTipo === "email" ? "email@exemplo.com" :
                              pagamentos.pixTipo === "telefone" ? "+55 (00) 00000-0000" :
                              "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                            }
                            className={pagamentos.pixChave ? (validation.valid ? "border-emerald-500 pr-10" : "border-destructive pr-10") : ""}
                          />
                          {pagamentos.pixChave && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2">
                              {validation.valid
                                ? <CheckCircle size={16} className="text-emerald-500" />
                                : <AlertCircle size={16} className="text-destructive" />}
                            </span>
                          )}
                        </div>
                        {pagamentos.pixChave && (
                          <p className={`text-xs ${validation.valid ? "text-emerald-600" : "text-destructive"}`}>
                            {validation.message}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Cartão */}
                <div className="flex items-center justify-between p-4 border border-border rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center"><CreditCard size={20} className="text-blue-600" /></div>
                    <div>
                      <p className="font-medium text-foreground">Cartão de Crédito/Débito</p>
                      <p className="text-sm text-muted-foreground">Visa, Mastercard, Elo</p>
                    </div>
                  </div>
                  <Switch checked={pagamentos.cartao} onCheckedChange={(v) => setPagamentos({ ...pagamentos, cartao: v })} />
                </div>

                {/* Boleto */}
                <div className="flex items-center justify-between p-4 border border-border rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center"><Landmark size={20} className="text-orange-600" /></div>
                    <div>
                      <p className="font-medium text-foreground">Boleto Bancário</p>
                      <p className="text-sm text-muted-foreground">Compensação em até 3 dias úteis</p>
                    </div>
                  </div>
                  <Switch checked={pagamentos.boleto} onCheckedChange={(v) => setPagamentos({ ...pagamentos, boleto: v })} />
                </div>

                {/* Dinheiro */}
                <div className="flex items-center justify-between p-4 border border-border rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center"><Banknote size={20} className="text-green-600" /></div>
                    <div>
                      <p className="font-medium text-foreground">Dinheiro</p>
                      <p className="text-sm text-muted-foreground">Pagamento em espécie no local</p>
                    </div>
                  </div>
                  <Switch checked={pagamentos.dinheiro} onCheckedChange={(v) => setPagamentos({ ...pagamentos, dinheiro: v })} />
                </div>

                {/* Transferência */}
                <div className="flex items-center justify-between p-4 border border-border rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center"><Landmark size={20} className="text-purple-600" /></div>
                    <div>
                      <p className="font-medium text-foreground">Transferência Bancária</p>
                      <p className="text-sm text-muted-foreground">TED/DOC entre contas</p>
                    </div>
                  </div>
                  <Switch checked={pagamentos.transferencia} onCheckedChange={(v) => setPagamentos({ ...pagamentos, transferencia: v })} />
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-[10px] text-muted-foreground italic font-medium">
                  {pagamentos.pix ? "PIX ativado. Certifique-se de que a chave está correta." : "PIX desativado."}
                </p>
                <Button
                  onClick={() => {
                    if (pagamentos.pix) {
                      const v = validatePixKey(pagamentos.pixChave, pagamentos.pixTipo);
                      if (!v.valid) { toast.error("Chave PIX inválida: " + v.message); return; }
                    }
                    saveSetting("pagamentos", pagamentos as unknown as Record<string, unknown>, "Financeiro");
                  }}
                  disabled={saving}
                  className="rounded-xl px-8 h-12 font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700 text-white w-full md:w-auto"
                >
                  {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
                  Atualizar Financeiro
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* NOTIFICAÇÕES */}
        <TabsContent value="notificacoes">
          <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
            <CardContent className="p-8 space-y-8">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600">
                  <Bell size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-foreground">Alertas e Notificações</h3>
                  <p className="text-sm text-muted-foreground">Configure como e quando a agência será avisada.</p>
                </div>
              </div>

              <div className="space-y-6">
                {([
                  { key: "email" as const, label: "E-mail", desc: "Receber notificações por e-mail" },
                  { key: "whatsapp" as const, label: "WhatsApp", desc: "Alertas de reservas via WhatsApp" },
                  { key: "push" as const, label: "Push Notifications", desc: "Notificações no navegador" },
                ] as const).map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-4 border border-border rounded-xl">
                    <div>
                      <p className="font-medium text-foreground">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch checked={notifications[item.key]} onCheckedChange={(v) => setNotifications({ ...notifications, [item.key]: v })} />
                  </div>
                ))}
              </div>
              <h3 className="font-display font-bold text-foreground text-lg pt-4">Eventos</h3>
              <div className="space-y-3">
                {([
                  { key: "novaReserva" as const, label: "Nova Reserva", desc: "Notificar quando uma nova reserva é criada" },
                  { key: "cancelamento" as const, label: "Cancelamento", desc: "Notificar quando uma reserva é cancelada" },
                  { key: "pagamento" as const, label: "Pagamento Confirmado", desc: "Notificar quando um pagamento é confirmado" },
                ] as const).map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-4 border border-border rounded-xl">
                    <div>
                      <p className="font-medium text-foreground">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch checked={notifications[item.key]} onCheckedChange={(v) => setNotifications({ ...notifications, [item.key]: v })} />
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-6 border-t border-border flex justify-end">
                <Button onClick={() => saveSetting("notificacoes", notifications as unknown as Record<string, unknown>, "Notificações")} disabled={saving} className="rounded-xl px-8 h-12 font-black uppercase tracking-widest shadow-lg shadow-amber-500/20 bg-amber-600 hover:bg-amber-700 text-white">
                  {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
                  Atualizar Alertas
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEGURANÇA */}
        <TabsContent value="seguranca">
          <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
            <CardContent className="p-8 space-y-8">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-slate-500/10 text-slate-600">
                  <Shield size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-foreground">Acesso e Segurança</h3>
                  <p className="text-sm text-muted-foreground">Gestão de credenciais do painel administrativo.</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Nova Senha</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={novaSenha}
                      onChange={(e) => setNovaSenha(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      maxLength={72}
                    />
                    <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Confirmar Nova Senha</Label>
                  <Input type={showPassword ? "text" : "password"} value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} placeholder="Repita a nova senha" maxLength={72} />
                </div>
                {novaSenha && novaSenha.length < 8 && <p className="text-xs text-destructive">A senha deve ter pelo menos 8 caracteres.</p>}
                {confirmarSenha && novaSenha !== confirmarSenha && <p className="text-xs text-destructive">As senhas não conferem.</p>}
              </div>
              <div className="mt-6 pt-6 border-t border-border flex justify-end">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={handleChangePassword} disabled={changingPassword} className="rounded-xl px-8 h-12 font-black uppercase tracking-widest shadow-lg shadow-slate-500/20 bg-slate-700 hover:bg-slate-800 text-white">
                      {changingPassword ? <Loader2 size={16} className="animate-spin mr-2" /> : <Shield size={16} className="mr-2" />}
                      Atualizar Senha
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Salvar nova senha de acesso</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* BACKUP & RESTAURAÇÃO */}
        <TabsContent value="backup">
          <div className="space-y-6">
            <Card className="border-border">
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <HardDrive size={20} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-foreground text-lg">Backup do Sistema</h3>
                    <p className="text-sm text-muted-foreground">Exporte todos os dados do sistema em formato JSON</p>
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-xl space-y-2">
                  <p className="text-sm text-foreground font-medium">O backup inclui:</p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Configurações do sistema e site</li>
                    <li>Passeios, translados e reservas</li>
                    <li>Clientes, parceiros e avaliações</li>
                    <li>Dados financeiros (contas a pagar/receber)</li>
                    <li>Marketing (campanhas, leads, remarketing)</li>
                    <li>SGS (riscos, incidentes, auditorias, equipe, termos)</li>
                    <li>Documentação da empresa</li>
                  </ul>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button onClick={handleBackup} disabled={backupLoading} className="rounded-xl">
                        {backupLoading ? <Loader2 size={16} className="animate-spin mr-1" /> : <Download size={16} className="mr-1" />}
                        {backupLoading ? "Gerando backup..." : "Gerar Backup Completo"}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Exportar todos os dados do banco para um arquivo JSON</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <RefreshCw size={20} className="text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-foreground text-lg">Restaurar Backup</h3>
                    <p className="text-sm text-muted-foreground">Importe um arquivo de backup para restaurar os dados</p>
                  </div>
                </div>

                <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-xl space-y-2">
                  <p className="text-sm font-medium text-destructive">⚠️ Atenção</p>
                  <p className="text-sm text-muted-foreground">
                    A restauração <strong>substituirá todos os dados atuais</strong> pelos dados do backup selecionado. 
                    Recomendamos realizar um backup antes de restaurar.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <input ref={restoreInputRef} type="file" accept=".json" className="hidden" onChange={handleRestore} />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        onClick={() => restoreInputRef.current?.click()}
                        disabled={restoreLoading}
                        className="rounded-xl"
                      >
                        {restoreLoading ? <Loader2 size={16} className="animate-spin mr-1" /> : <UploadCloud size={16} className="mr-1" />}
                        {restoreLoading ? "Restaurando..." : "Selecionar Arquivo de Backup"}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Substituir dados atuais por um arquivo de backup anterior</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardContent>
            </Card>

            {backupHistory.length > 0 && (
              <Card className="border-border">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <Clock size={20} className="text-muted-foreground" />
                    <h3 className="font-display font-bold text-foreground text-lg">Histórico de Backups (sessão atual)</h3>
                  </div>
                  <div className="space-y-2">
                    {backupHistory.map((b, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-muted rounded-lg text-sm">
                        <div className="flex items-center gap-3">
                          <Database size={14} className="text-primary" />
                          <span className="font-medium text-foreground">{format(new Date(b.date), "dd/MM/yyyy 'às' HH:mm:ss")}</span>
                        </div>
                        <div className="flex items-center gap-4 text-muted-foreground">
                          <span>{b.tables} tabelas</span>
                          <span>{b.records} registros</span>
                          <span>{b.size}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* GALERIA */}
        <TabsContent value="galeria">
          <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
            <CardContent className="p-8 space-y-8">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-600">
                    <Image size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-foreground">Acervo de Mídia</h3>
                    <p className="text-sm text-muted-foreground">Galeria "Momentos Inesquecíveis" do website.</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <input
                    ref={galleryInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleGalleryUpload}
                  />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => galleryInputRef.current?.click()}
                        disabled={uploadingGallery}
                        variant="outline"
                        className="rounded-xl font-bold"
                      >
                        {uploadingGallery ? <Loader2 size={16} className="animate-spin mr-2" /> : <UploadCloud size={16} className="mr-2" />}
                        {uploadingGallery ? "Enviando..." : "Fazer Upload"}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Adicionar novas fotos à galeria do site</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => saveSetting("gallery", gallery as unknown as Record<string, unknown>, "Galeria")}
                        disabled={saving}
                        className="rounded-xl font-black uppercase tracking-widest bg-primary text-white shadow-lg shadow-primary/20 h-10 px-8"
                      >
                        {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
                        Publicar Galeria
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Salvar e atualizar a galeria no site público</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {gallery.images.length === 0 ? (
                  <div className="col-span-full py-12 text-center border-2 border-dashed border-border rounded-2xl bg-muted/30">
                    <Image size={40} className="mx-auto mb-2 text-muted-foreground opacity-20" />
                    <p className="text-sm text-muted-foreground">Nenhuma imagem personalizada. A galeria está usando as imagens padrão.</p>
                  </div>
                ) : (
                  gallery.images.map((img, index) => (
                    <div key={index} className="relative group aspect-square rounded-xl overflow-hidden border border-border shadow-sm">
                      <img src={img.src} alt={img.alt} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => removeGalleryImage(index)}
                              className="p-2 bg-destructive text-destructive-foreground rounded-full hover:scale-110 transition-transform"
                            >
                              <Trash2 size={16} />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Remover imagem</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-1 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                        <input
                          className="w-full bg-transparent text-[10px] text-white outline-none border-none focus:ring-0 px-1"
                          value={img.alt}
                          onChange={(e) => {
                            const newImages = [...gallery.images];
                            newImages[index].alt = e.target.value;
                            setGallery({ images: newImages });
                          }}
                          placeholder="Legenda (ALT)"
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-6">* Use legendas para melhorar o SEO das imagens no Google.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

export default AdminConfig;
