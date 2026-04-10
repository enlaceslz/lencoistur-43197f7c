import { useState, useRef, useEffect, useCallback } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Globe, CreditCard, Bell, Shield, Save, Loader2, Eye, EyeOff, Upload, Image, X, CheckCircle, AlertCircle, Banknote, Landmark, Database, Download, UploadCloud, Clock, HardDrive, RefreshCw, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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
  site: { titulo: "LençóisTour - Passeios nos Lençóis Maranhenses", metaDescricao: "Descubra os Lençóis Maranhenses com a melhor experiência turística.", whatsappUrl: "https://wa.me/5598999990000", instagram: "https://instagram.com/lencoistour", corPrimaria: "#2563eb", logoUrl: null as string | null },
  pagamentos: { pix: true, cartao: true, boleto: false, dinheiro: true, transferencia: false, pixChave: "12.345.678/0001-90", pixTipo: "cnpj" as PixKeyType },
  notificacoes: { email: true, whatsapp: true, push: false, novaReserva: true, cancelamento: true, pagamento: true },
};

const AdminConfig = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [empresa, setEmpresa] = useState(DEFAULTS.empresa);
  const [site, setSite] = useState(DEFAULTS.site);
  const [pagamentos, setPagamentos] = useState(DEFAULTS.pagamentos);
  const [notifications, setNotifications] = useState(DEFAULTS.notificacoes);

  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value");
      if (error) throw error;
      if (data) {
        for (const row of data) {
          const val = row.value as Record<string, unknown>;
          if (row.key === "empresa") setEmpresa({ ...DEFAULTS.empresa, ...val });
          if (row.key === "site") setSite({ ...DEFAULTS.site, ...val });
          if (row.key === "pagamentos") setPagamentos({ ...DEFAULTS.pagamentos, ...val, pixTipo: (val as any).pixTipo && PIX_KEY_TYPES.some(t => t.value === (val as any).pixTipo) ? (val as any).pixTipo : DEFAULTS.pagamentos.pixTipo });
          if (row.key === "notificacoes") setNotifications({ ...DEFAULTS.notificacoes, ...val });
        }
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
      const { error } = await supabase
        .from("site_settings")
        .update({ value: value as any, updated_at: new Date().toISOString() })
        .eq("key", key);
      if (error) throw error;
      toast.success(`Configurações de ${label} salvas com sucesso!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error("Erro ao salvar: " + msg);
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
        <TabsList className="bg-muted flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="empresa"><Building2 size={14} className="mr-1" /> Empresa</TabsTrigger>
          <TabsTrigger value="site"><Globe size={14} className="mr-1" /> Site</TabsTrigger>
          <TabsTrigger value="pagamento"><CreditCard size={14} className="mr-1" /> Pagamento</TabsTrigger>
          <TabsTrigger value="notificacoes"><Bell size={14} className="mr-1" /> Notificações</TabsTrigger>
          <TabsTrigger value="seguranca"><Shield size={14} className="mr-1" /> Segurança</TabsTrigger>
        </TabsList>

        {/* EMPRESA */}
        <TabsContent value="empresa">
          <Card className="border-border">
            <CardContent className="p-6 space-y-5">
              <h3 className="font-display font-bold text-foreground text-lg">Dados da Empresa</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome da Empresa</Label>
                  <Input value={empresa.nome} onChange={(e) => setEmpresa({ ...empresa, nome: e.target.value })} maxLength={100} />
                </div>
                <div className="space-y-2">
                  <Label>CNPJ</Label>
                  <Input value={empresa.cnpj} onChange={(e) => setEmpresa({ ...empresa, cnpj: e.target.value })} maxLength={18} />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input value={empresa.telefone} onChange={(e) => setEmpresa({ ...empresa, telefone: e.target.value })} maxLength={20} />
                </div>
                <div className="space-y-2">
                  <Label>WhatsApp</Label>
                  <Input value={empresa.whatsapp} onChange={(e) => setEmpresa({ ...empresa, whatsapp: e.target.value })} maxLength={20} />
                </div>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input type="email" value={empresa.email} onChange={(e) => setEmpresa({ ...empresa, email: e.target.value })} maxLength={100} />
                </div>
                <div className="space-y-2">
                  <Label>Endereço</Label>
                  <Input value={empresa.endereco} onChange={(e) => setEmpresa({ ...empresa, endereco: e.target.value })} maxLength={200} />
                </div>
              </div>
              <Button onClick={() => saveSetting("empresa", empresa, "Empresa")} disabled={saving} className="rounded-xl">
                {saving ? <Loader2 size={16} className="animate-spin mr-1" /> : <Save size={16} className="mr-1" />}
                Salvar Alterações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SITE */}
        <TabsContent value="site">
          <Card className="border-border">
            <CardContent className="p-6 space-y-5">
              <h3 className="font-display font-bold text-foreground text-lg">Configurações do Site</h3>
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Logo da Empresa</Label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-muted overflow-hidden">
                    {site.logoUrl ? (
                      <img src={site.logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                    ) : (
                      <Image size={32} className="text-muted-foreground" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                    <Button type="button" variant="outline" size="sm" onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo} className="rounded-lg">
                      {uploadingLogo ? <Loader2 size={14} className="animate-spin mr-1" /> : <Upload size={14} className="mr-1" />}
                      {site.logoUrl ? "Trocar Logo" : "Enviar Logo"}
                    </Button>
                    {site.logoUrl && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => setSite({ ...site, logoUrl: null })} className="text-destructive rounded-lg">
                        <X size={14} className="mr-1" /> Remover
                      </Button>
                    )}
                    <p className="text-xs text-muted-foreground">PNG, JPG ou SVG. Máx. 2MB.</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Ou cole a URL da logo</Label>
                  <Input placeholder="https://exemplo.com/logo.png" value={site.logoUrl || ""} onChange={(e) => setSite({ ...site, logoUrl: e.target.value || null })} maxLength={500} />
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Título do Site (SEO)</Label>
                  <Input value={site.titulo} onChange={(e) => setSite({ ...site, titulo: e.target.value })} maxLength={100} />
                </div>
                <div className="space-y-2">
                  <Label>Meta Descrição (SEO)</Label>
                  <Textarea value={site.metaDescricao} onChange={(e) => setSite({ ...site, metaDescricao: e.target.value })} maxLength={300} rows={3} />
                  <p className="text-xs text-muted-foreground">{site.metaDescricao.length}/300 caracteres</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>URL WhatsApp (CTA)</Label>
                    <Input value={site.whatsappUrl} onChange={(e) => setSite({ ...site, whatsappUrl: e.target.value })} maxLength={100} />
                  </div>
                  <div className="space-y-2">
                    <Label>Instagram</Label>
                    <Input value={site.instagram} onChange={(e) => setSite({ ...site, instagram: e.target.value })} maxLength={100} />
                  </div>
                </div>
              </div>
              <Button onClick={() => saveSetting("site", site as unknown as Record<string, unknown>, "Site")} disabled={saving} className="rounded-xl">
                {saving ? <Loader2 size={16} className="animate-spin mr-1" /> : <Save size={16} className="mr-1" />}
                Salvar
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PAGAMENTO */}
        <TabsContent value="pagamento">
          <Card className="border-border">
            <CardContent className="p-6 space-y-5">
              <h3 className="font-display font-bold text-foreground text-lg">Métodos de Pagamento</h3>
              <div className="space-y-4">
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
                            onChange={(e) => setPagamentos({ ...pagamentos, pixChave: e.target.value })}
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
              <Button
                onClick={() => {
                  if (pagamentos.pix) {
                    const v = validatePixKey(pagamentos.pixChave, pagamentos.pixTipo);
                    if (!v.valid) { toast.error("Chave PIX inválida: " + v.message); return; }
                  }
                  saveSetting("pagamentos", pagamentos as unknown as Record<string, unknown>, "Pagamento");
                }}
                disabled={saving}
                className="rounded-xl"
              >
                {saving ? <Loader2 size={16} className="animate-spin mr-1" /> : <Save size={16} className="mr-1" />}
                Salvar
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* NOTIFICAÇÕES */}
        <TabsContent value="notificacoes">
          <Card className="border-border">
            <CardContent className="p-6 space-y-5">
              <h3 className="font-display font-bold text-foreground text-lg">Canais de Notificação</h3>
              <div className="space-y-3">
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
              <Button onClick={() => saveSetting("notificacoes", notifications as unknown as Record<string, unknown>, "Notificações")} disabled={saving} className="rounded-xl">
                {saving ? <Loader2 size={16} className="animate-spin mr-1" /> : <Save size={16} className="mr-1" />}
                Salvar
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEGURANÇA */}
        <TabsContent value="seguranca">
          <Card className="border-border">
            <CardContent className="p-6 space-y-5">
              <h3 className="font-display font-bold text-foreground text-lg">Alterar Senha</h3>
              <div className="space-y-4 max-w-md">
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
              <Button onClick={handleChangePassword} disabled={changingPassword} className="rounded-xl">
                {changingPassword ? <Loader2 size={16} className="animate-spin mr-1" /> : <Shield size={16} className="mr-1" />}
                Alterar Senha
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

export default AdminConfig;
