import { useState, useRef, useEffect, useCallback } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Globe, CreditCard, Bell, Shield, Save, Loader2, Eye, EyeOff, Upload, Image, X, CheckCircle, AlertCircle, Banknote, Landmark, Database, Download, UploadCloud, Clock, HardDrive, RefreshCw, Trash2, Plus, Users, UserPlus, ShieldCheck, Mail, Lock, Key, LayoutDashboard, Compass, ShoppingCart, Car, UserCheck, UserCheck2, Megaphone, FileText, BarChart3, Settings, Edit, Fingerprint, QrCode } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
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
    facebook: "",
    tiktok: "", 
    corPrimaria: "#2563eb", 
    logoUrl: null as string | null, 
    bannerUrl: null as string | null,
    banners: [] as Array<{ url: string; id: string }>,
    bannerTransition: "fade" as "fade" | "slide",
    exibirParceiros: true,
    footerDesc: "A Lençóis Tour Experience é a sua porta de entrada para os Lençóis Maranhenses. Localizada estrategicamente em Santo Amaro, oferecemos a experiência mais autêntica e segura da região.",
    footerTours: ["Lagoa da Gaivota", "Circuito Betânia", "Circuito Emendadas", "Canto do Atins", "Circuito Ponta Verde", "Trekking nas Dunas", "Passeio de Quadriciclo", "Descida de Caiaque"],
    footerCopyright: "© 2026 LençóisTour. Todos os direitos reservados."
  },
  pagamentos: { pix: true, cartao: true, boleto: false, dinheiro: true, transferencia: false, pixChave: "12.345.678/0001-90", pixTipo: "cnpj" as PixKeyType },
  notificacoes: { email: true, whatsapp: true, push: false, novaReserva: true, cancelamento: true, pagamento: true },
  gallery: { images: [] as Array<{ src: string; alt: string }> },
};

const AdminConfig = () => {
  const [activeTab, setActiveTab] = useState("empresa");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [empresa, setEmpresa] = useState(DEFAULTS.empresa);
  const [site, setSite] = useState(DEFAULTS.site);
  const [pagamentos, setPagamentos] = useState(DEFAULTS.pagamentos);
  const [notifications, setNotifications] = useState(DEFAULTS.notificacoes);
  const [gallery, setGallery] = useState(DEFAULTS.gallery);
  const [isDeletingGalleryImage, setIsDeletingGalleryImage] = useState<number | null>(null);

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
  const [backupHistory, setBackupHistory] = useState<Array<{ date: string; tables: number; records: number; size: string }>>(() => {
    const saved = localStorage.getItem("backup_history");
    return saved ? JSON.parse(saved) : [];
  });
  const [systemUsers, setSystemUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUser, setNewUser] = useState({ full_name: "", email: "", role: "operador", password: "" });
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isEditingPermissions, setIsEditingPermissions] = useState(false);

  const MODULES = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "passeios", label: "Passeios", icon: Compass },
    { id: "reservas", label: "Reservas", icon: ShoppingCart },
    { id: "translados", label: "Translados", icon: Car },
    { id: "crm", label: "CRM / Clientes", icon: Users },
    { id: "parceiros", label: "Parceiros", icon: UserCheck },
    { id: "colaboradores", label: "Colaboradores", icon: UserCheck2 },
    { id: "financeiro", label: "Financeiro", icon: CreditCard },
    { id: "marketing", label: "Marketing", icon: Megaphone },
    { id: "documentos", label: "Documentação", icon: FileText },
    { id: "relatorios", label: "Relatórios", icon: BarChart3 },
    { id: "sgs", label: "Segurança (SGS)", icon: Shield },
    "---",
    { id: "configuracoes", label: "Configurações", icon: Settings },
  ];

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

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_management")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      setSystemUsers(data || []);
    } catch (err) {
      console.error("Error loading users:", err);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab) setActiveTab(tab);
  }, []);

  useEffect(() => { 
    loadSettings(); 
    loadUsers();
  }, [loadSettings, loadUsers]);

  const saveSetting = async (key: string, value: Record<string, unknown>, label: string) => {
    setSaving(true);
    try {
      // Validations
      if (key === "pagamentos" && (value as any).pix) {
        const v = validatePixKey((value as any).pixChave, (value as any).pixTipo);
        if (!v.valid) {
          toast.error(`Chave PIX inválida: ${v.message}`);
          setSaving(false);
          return;
        }
      }

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
    "site_settings", "ai_settings", "tours", "transfer_routes", "customers", "dependents",
    "bookings", "packages", "package_tours", "partners", "partner_types", 
    "contas_pagar", "contas_receber", "reviews", "documents", "document_types",
    "collaborators", "collaborator_types", "collaborator_payments",
    "marketing_campaigns", "marketing_leads", "remarketing_rules",
    "sgs_risks", "sgs_incidents", "sgs_corrective_actions", "sgs_staff",
    "sgs_staff_trainings", "sgs_audits", "sgs_audit_items", "sgs_briefings",
    "sgs_risk_terms", "sgs_risk_term_minors", "sgs_safety_surveys", "sgs_supplier_compliance",
    "sgs_empresa", "sgs_veiculos", "sgs_condutores", "sgs_rotas", 
    "sgs_checklists", "sgs_checklist_items", "sgs_pgsat", "sgs_condutores_visitantes",
    "sgs_procedures", "sgs_equipment", "customer_documents"
  ] as string[];

  const STORAGE_BUCKETS = ["tour-images", "company-documents", "customer-documents", "avatars"] as const;

  const handleBackup = async () => {
    setBackupLoading(true);
    try {
      const backup: Record<string, any> = {};
      let totalRecords = 0;

      // Backup Database Tables
      for (const table of BACKUP_TABLES) {
        const { data, error } = await supabase.from(table as any).select("*");
        if (error) {
          console.error(`Erro ao exportar ${table}:`, error.message);
          backup[table] = [];
        } else {
          backup[table] = data || [];
          totalRecords += (data || []).length;
        }
      }

      // Backup Storage Images/Files
      const storageBackup: Record<string, Array<{ name: string; bucket: string; data: string }>> = {};
      let totalFiles = 0;

      for (const bucket of STORAGE_BUCKETS) {
        let hasMore = true;
        let offset = 0;
        
        while (hasMore) {
          const { data: files, error: listError } = await supabase.storage.from(bucket).list("", {
            limit: 100,
            offset: offset,
            sortBy: { column: 'name', order: 'desc' },
          });

          if (listError) {
            console.error(`Erro ao listar arquivos do bucket ${bucket}:`, listError.message);
            hasMore = false;
            continue;
          }

          if (!files || files.length === 0) {
            hasMore = false;
            continue;
          }

          if (!storageBackup[bucket]) storageBackup[bucket] = [];
          
          for (const file of files) {
            if (file.id && file.name !== '.emptyFolderPlaceholder') { 
              try {
                const { data: blob, error: downloadError } = await supabase.storage.from(bucket).download(file.name);
                if (downloadError) {
                  console.warn(`Pulando arquivo ${file.name} (erro no download):`, downloadError.message);
                  continue;
                }

                const base64 = await new Promise<string>((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onloadend = () => resolve(reader.result as string);
                  reader.onerror = reject;
                  reader.readAsDataURL(blob);
                });

                storageBackup[bucket].push({
                  name: file.name,
                  bucket: bucket,
                  data: base64
                });
                totalFiles++;
              } catch (err) {
                console.error(`Erro ao processar arquivo ${file.name} do bucket ${bucket}:`, err);
              }
            }
          }
          
          if (files.length < 100) {
            hasMore = false;
          } else {
            offset += 100;
          }
        }
      }

      const now = new Date();
      const exportData = {
        metadata: {
          version: "1.1",
          created_at: now.toISOString(),
          tables_count: BACKUP_TABLES.length,
          total_records: totalRecords,
          total_files: totalFiles,
          app: "LençóisTour ERP",
        },
        data: backup,
        storage: storageBackup,
      };

      const json = JSON.stringify(exportData, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const sizeMB = (blob.size / (1024 * 1024)).toFixed(2);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup-completo-lencoistour-${formatDate(now, "yyyy-MM-dd-HHmmss")}.json`;
...
        ? formatDate(new Date(parsed.metadata.created_at), "dd/MM/yyyy 'às' HH:mm:ss")
...
                          <span className="font-medium text-foreground">{formatDate(new Date(b.date), "dd/MM/yyyy 'às' HH:mm:ss")}</span>
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

        {/* USUÁRIOS */}
        <TabsContent value="usuarios">
          <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4 md:p-8 space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-teal-500/10 text-teal-600">
                    <Users size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-foreground">Gestão de Usuários</h3>
                    <p className="text-sm text-muted-foreground">Administre quem pode acessar o sistema e seus níveis de permissão.</p>
                  </div>
                </div>
                <Button 
                  onClick={() => setIsAddingUser(true)}
                  className="rounded-xl px-6 h-12 font-black uppercase tracking-widest shadow-lg shadow-teal-500/20 bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-2"
                >
                  <UserPlus size={18} />
                  Novo Usuário
                </Button>
              </div>

              {isAddingUser && (
                <div className="bg-muted/50 p-6 rounded-2xl border border-border space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-foreground flex items-center gap-2">
                      <UserPlus size={16} /> Cadastrar Novo Usuário do Sistema
                    </h4>
                    <Button variant="ghost" size="icon" onClick={() => setIsAddingUser(false)}>
                      <X size={18} />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Nome Completo</Label>
                      <Input 
                        placeholder="Ex: João da Silva" 
                        value={newUser.full_name}
                        onChange={e => setNewUser({...newUser, full_name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>E-mail (Login)</Label>
                      <Input 
                        type="email" 
                        placeholder="joao@lencoistour.com" 
                        value={newUser.email}
                        onChange={e => setNewUser({...newUser, email: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Senha Inicial</Label>
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        value={newUser.password}
                        onChange={e => setNewUser({...newUser, password: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Hierarquia</Label>
                      <select 
                        className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all hover:border-primary/50"
                        value={newUser.role}
                        onChange={e => setNewUser({...newUser, role: e.target.value})}
                      >
                        <option value="operador">Operador (Reservas)</option>
                        <option value="financeiro">Financeiro</option>
                        <option value="gerente">Gerente</option>
                        <option value="administrador">Administrador</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <Button 
                      onClick={handleAddUser}
                      disabled={saving}
                      className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold px-8"
                    >
                      {saving ? <Loader2 size={18} className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}
                      Salvar Usuário
                    </Button>
                  </div>
                </div>
              )}

              {isEditingPermissions && editingUser && (
                <div className="bg-muted/50 p-6 rounded-2xl border border-border space-y-4 animate-in fade-in zoom-in-95 duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-teal-500/10 text-teal-600">
                        <Fingerprint size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground">Permissões de Acesso: {editingUser.full_name}</h4>
                        <p className="text-xs text-muted-foreground">Selecione quais módulos este usuário pode visualizar e gerenciar.</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => { setIsEditingPermissions(false); setEditingUser(null); }}>
                      <X size={18} />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
                    {MODULES.map((module) => {
                      if (typeof module === 'string') return null;
                      const hasAccess = editingUser.permissions?.[module.id];
                      return (
                        <button
                          key={module.id}
                          onClick={() => togglePermission(module.id)}
                          className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                            hasAccess 
                            ? "bg-teal-500/10 border-teal-500 text-teal-700 shadow-sm" 
                            : "bg-background border-border text-muted-foreground hover:border-muted-foreground/30"
                          }`}
                        >
                          <module.icon size={20} className={hasAccess ? "text-teal-600" : "text-muted-foreground/50"} />
                          <span className="text-[10px] font-bold mt-2 text-center uppercase tracking-tighter leading-none">
                            {module.label}
                          </span>
                          {hasAccess && (
                            <div className="mt-1 w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex justify-end pt-4 border-t border-border/50">
                    <Button 
                      onClick={handleUpdatePermissions}
                      disabled={saving}
                      className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-black uppercase tracking-widest px-8 shadow-lg shadow-teal-500/20"
                    >
                      {saving ? <Loader2 size={18} className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}
                      Sincronizar Acessos
                    </Button>
                  </div>
                </div>
              )}


              <div className="border border-border rounded-2xl overflow-x-auto bg-card no-scrollbar">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border">
                      <th className="p-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Usuário</th>
                      <th className="p-4 text-xs font-black uppercase tracking-widest text-muted-foreground">E-mail</th>
                      <th className="p-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Hierarquia</th>
                      <th className="p-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Status</th>
                      <th className="p-4 text-xs font-black uppercase tracking-widest text-muted-foreground text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersLoading ? (
                      <tr>
                        <td colSpan={5} className="p-12 text-center">
                          <Loader2 size={32} className="animate-spin text-primary mx-auto mb-2" />
                          <p className="text-muted-foreground">Carregando usuários...</p>
                        </td>
                      </tr>
                    ) : systemUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-12 text-center">
                          <Users size={32} className="text-muted-foreground opacity-20 mx-auto mb-2" />
                          <p className="text-muted-foreground">Nenhum usuário cadastrado.</p>
                        </td>
                      </tr>
                    ) : (
                      systemUsers.map((user) => (
                        <tr key={user.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-teal-500/10 text-teal-600 flex items-center justify-center font-bold text-xs">
                                {user.full_name?.charAt(0).toUpperCase() || 'U'}
                              </div>
                              <span className="font-bold text-foreground">{user.full_name}</span>
                            </div>
                          </td>
                          <td className="p-4 text-sm text-muted-foreground">{user.email}</td>
                          <td className="p-4">
                            <select 
                              className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer hover:text-primary transition-colors"
                              value={user.role}
                              onChange={(e) => handleUpdateUserRole(user.id, e.target.value)}
                            >
                              <option value="operador">Operador</option>
                              <option value="financeiro">Financeiro</option>
                              <option value="gerente">Gerente</option>
                              <option value="administrador">Administrador</option>
                            </select>
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                              user.status === 'ativo' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                            }`}>
                              {user.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-teal-600 hover:bg-teal-50"
                                    onClick={() => { setEditingUser({...user}); setIsEditingPermissions(true); }}
                                  >
                                    <Edit size={16} />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Editar Permissões</p></TooltipContent>
                              </Tooltip>

                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className={`h-8 px-3 rounded-lg font-bold text-xs ${user.status === 'ativo' ? 'text-rose-600 hover:text-rose-700 hover:bg-rose-50' : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'}`}
                                onClick={() => handleUpdateUserStatus(user.id, user.status)}
                              >
                                {user.status === 'ativo' ? 'Bloquear' : 'Ativar'}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex gap-4">
                  <ShieldCheck className="text-amber-600 shrink-0" size={24} />
                  <div>
                    <h5 className="font-bold text-amber-900 text-sm">Política de Hierarquia</h5>
                    <p className="text-xs text-amber-800/80 leading-relaxed mt-1">
                      <strong>Administrador:</strong> Acesso total ao sistema.<br />
                      <strong>Gerente:</strong> Visão completa de relatórios e gestão de passeios.<br />
                      <strong>Operador:</strong> Foco exclusivo em reservas e atendimento.<br />
                      <strong>Financeiro:</strong> Acesso aos módulos de contas e faturamento.
                    </p>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 flex gap-4">
                  <Key className="text-blue-600 shrink-0" size={24} />
                  <div>
                    <h5 className="font-bold text-blue-900 text-sm">Segurança de Acesso</h5>
                    <p className="text-xs text-blue-800/80 leading-relaxed mt-1">
                      A criação de usuários aqui registra o perfil operacional. Para o primeiro acesso, o usuário deve realizar o cadastro via login com o e-mail autorizado ou utilizar a senha temporária definida.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* GALERIA */}
        <TabsContent value="galeria">
          <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4 md:p-8 space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-600">
                    <Image size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-foreground">Acervo de Mídia</h3>
                    <p className="text-sm text-muted-foreground">Galeria "Momentos Inesquecíveis" do website.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    ref={galleryInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleGalleryUpload}
                  />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={() => galleryInputRef.current?.click()}
                          disabled={uploadingGallery}
                          variant="outline"
                          className="rounded-2xl h-12 px-6 font-bold border-indigo-200 bg-white hover:bg-indigo-50 hover:text-indigo-600 transition-all shadow-sm"
                        >
                          {uploadingGallery ? <Loader2 size={18} className="animate-spin mr-2" /> : <UploadCloud size={18} className="mr-2" />}
                          {uploadingGallery ? "Processando..." : "Subir Fotos"}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Fazer upload de múltiplas imagens</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={() => saveSetting("gallery", gallery as unknown as Record<string, unknown>, "Galeria")}
                          disabled={saving}
                          className="rounded-2xl h-12 px-8 font-black uppercase tracking-widest bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                        >
                          {saving ? <Loader2 size={18} className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}
                          Publicar Site
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Publicar alterações na galeria</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
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
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => setIsDeletingGalleryImage(index)}
                                className="p-3 bg-rose-500 text-white rounded-2xl hover:scale-110 transition-transform shadow-xl active:scale-95"
                              >
                                <Trash2 size={20} />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Remover imagem permanentemente</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
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

      {/* Galeria Delete Confirmation */}
      <Dialog open={isDeletingGalleryImage !== null} onOpenChange={() => setIsDeletingGalleryImage(null)}>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Remover Foto?</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground font-medium">Tem certeza que deseja excluir esta foto da galeria? Esta ação não poderá ser desfeita após salvar.</p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsDeletingGalleryImage(null)} className="rounded-xl font-bold">Cancelar</Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                if (isDeletingGalleryImage !== null) {
                  removeGalleryImage(isDeletingGalleryImage);
                  setIsDeletingGalleryImage(null);
                  toast.success("Foto marcada para remoção. Clique em 'Publicar' para salvar.");
                }
              }} 
              className="rounded-xl font-black uppercase tracking-widest bg-rose-600 hover:bg-rose-700"
            >
              Excluir Foto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Floating Save Button for Mobile */}
      <div className="fixed bottom-6 right-6 lg:hidden z-[60]">
        <Button
          onClick={() => {
            const activeTab = document.querySelector('[data-state="active"][role="tab"]')?.getAttribute('value');
            if (activeTab === 'empresa') saveSetting("empresa", empresa, "Agência");
            else if (activeTab === 'site') saveSetting("site", site as unknown as Record<string, unknown>, "Frontend");
            else if (activeTab === 'pagamento') saveSetting("pagamentos", pagamentos as unknown as Record<string, unknown>, "Financeiro");
            else if (activeTab === 'notificacoes') saveSetting("notificacoes", notifications as unknown as Record<string, unknown>, "Notificações");
            else if (activeTab === 'seguranca') handleChangePassword();
            else if (activeTab === 'galeria') saveSetting("gallery", gallery as unknown as Record<string, unknown>, "Galeria");
            else toast.info("Selecione uma aba para salvar");
          }}
          disabled={saving}
          className="w-16 h-16 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.3)] bg-blue-600 hover:bg-blue-700 text-white hover:scale-110 active:scale-95 transition-all p-0 flex flex-col items-center justify-center gap-1 border-4 border-background"
        >
          {saving ? <Loader2 size={24} className="animate-spin" /> : (
            <>
              <Save size={24} />
              <span className="text-[8px] font-black uppercase tracking-tighter">Salvar</span>
            </>
          )}
        </Button>
      </div>
    </AdminLayout>
  );
};

export default AdminConfig;
