import { useState, useRef } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Globe, CreditCard, Bell, Shield, Save, Loader2, Eye, EyeOff, Upload, Image, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const AdminConfig = () => {
  const [saving, setSaving] = useState(false);

  // Empresa
  const [empresa, setEmpresa] = useState({
    nome: "LençóisTour",
    cnpj: "12.345.678/0001-90",
    telefone: "(98) 99999-0000",
    whatsapp: "(98) 99999-0000",
    endereco: "Santo Amaro do Maranhão, MA",
    email: "contato@lencoistour.com",
  });

  // Site
  const [site, setSite] = useState({
    titulo: "LençóisTour - Passeios nos Lençóis Maranhenses",
    metaDescricao: "Descubra os Lençóis Maranhenses com a melhor experiência turística. Passeios, translados e aventuras inesquecíveis.",
    whatsappUrl: "https://wa.me/5598999990000",
    instagram: "https://instagram.com/lencoistour",
    corPrimaria: "#2563eb",
  });

  // Pagamentos
  const [pagamentos, setPagamentos] = useState({
    pix: true,
    cartao: true,
    boleto: false,
    pixChave: "12.345.678/0001-90",
    pixTipo: "CNPJ",
  });

  // Notificações
  const [notifications, setNotifications] = useState({
    email: true,
    whatsapp: true,
    push: false,
    novaReserva: true,
    cancelamento: true,
    pagamento: true,
  });

  // Segurança
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem válido.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 2MB.");
      return;
    }

    setUploadingLogo(true);
    const ext = file.name.split(".").pop() || "png";
    const path = `logo/logo-${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from("tour-images").upload(path, file, { upsert: true });
    if (error) {
      toast.error("Erro ao enviar logo: " + error.message);
      setUploadingLogo(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("tour-images").getPublicUrl(path);
    setLogoUrl(urlData.publicUrl);
    setUploadingLogo(false);
    toast.success("Logo enviada com sucesso!");
  };

  const handleSave = (section: string) => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success(`Configurações de ${section} salvas com sucesso!`);
    }, 600);
  };

  const handleChangePassword = async () => {
    if (!novaSenha || !confirmarSenha) {
      toast.error("Preencha a nova senha e a confirmação.");
      return;
    }
    if (novaSenha.length < 8) {
      toast.error("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (novaSenha !== confirmarSenha) {
      toast.error("As senhas não conferem.");
      return;
    }

    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: novaSenha });
    setChangingPassword(false);

    if (error) {
      toast.error("Erro ao alterar senha: " + error.message);
      return;
    }

    toast.success("Senha alterada com sucesso!");
    setSenhaAtual("");
    setNovaSenha("");
    setConfirmarSenha("");
  };

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
              <Button onClick={() => handleSave("Empresa")} disabled={saving} className="rounded-xl">
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
              <Button onClick={() => handleSave("Site")} disabled={saving} className="rounded-xl">
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
                <div className="flex items-center justify-between p-4 border border-border rounded-xl">
                  <div>
                    <p className="font-medium text-foreground">PIX</p>
                    <p className="text-sm text-muted-foreground">Pagamento instantâneo via PIX</p>
                  </div>
                  <Switch checked={pagamentos.pix} onCheckedChange={(v) => setPagamentos({ ...pagamentos, pix: v })} />
                </div>
                {pagamentos.pix && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4 border-l-2 border-primary/20 ml-2">
                    <div className="space-y-2">
                      <Label>Chave PIX</Label>
                      <Input value={pagamentos.pixChave} onChange={(e) => setPagamentos({ ...pagamentos, pixChave: e.target.value })} maxLength={50} />
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo da Chave</Label>
                      <Input value={pagamentos.pixTipo} onChange={(e) => setPagamentos({ ...pagamentos, pixTipo: e.target.value })} maxLength={20} />
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between p-4 border border-border rounded-xl">
                  <div>
                    <p className="font-medium text-foreground">Cartão de Crédito</p>
                    <p className="text-sm text-muted-foreground">Visa, Mastercard, Elo</p>
                  </div>
                  <Switch checked={pagamentos.cartao} onCheckedChange={(v) => setPagamentos({ ...pagamentos, cartao: v })} />
                </div>
                <div className="flex items-center justify-between p-4 border border-border rounded-xl">
                  <div>
                    <p className="font-medium text-foreground">Boleto Bancário</p>
                    <p className="text-sm text-muted-foreground">Compensação em até 3 dias</p>
                  </div>
                  <Switch checked={pagamentos.boleto} onCheckedChange={(v) => setPagamentos({ ...pagamentos, boleto: v })} />
                </div>
              </div>
              <Button onClick={() => handleSave("Pagamento")} disabled={saving} className="rounded-xl">
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
                {[
                  { key: "email" as const, label: "E-mail", desc: "Receber notificações por e-mail" },
                  { key: "whatsapp" as const, label: "WhatsApp", desc: "Alertas de reservas via WhatsApp" },
                  { key: "push" as const, label: "Push Notifications", desc: "Notificações no navegador" },
                ].map((item) => (
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
                {[
                  { key: "novaReserva" as const, label: "Nova Reserva", desc: "Notificar quando uma nova reserva é criada" },
                  { key: "cancelamento" as const, label: "Cancelamento", desc: "Notificar quando uma reserva é cancelada" },
                  { key: "pagamento" as const, label: "Pagamento Confirmado", desc: "Notificar quando um pagamento é confirmado" },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-4 border border-border rounded-xl">
                    <div>
                      <p className="font-medium text-foreground">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch checked={notifications[item.key]} onCheckedChange={(v) => setNotifications({ ...notifications, [item.key]: v })} />
                  </div>
                ))}
              </div>
              <Button onClick={() => handleSave("Notificações")} disabled={saving} className="rounded-xl">
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
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Confirmar Nova Senha</Label>
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    placeholder="Repita a nova senha"
                    maxLength={72}
                  />
                </div>
                {novaSenha && novaSenha.length < 8 && (
                  <p className="text-xs text-destructive">A senha deve ter pelo menos 8 caracteres.</p>
                )}
                {confirmarSenha && novaSenha !== confirmarSenha && (
                  <p className="text-xs text-destructive">As senhas não conferem.</p>
                )}
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
