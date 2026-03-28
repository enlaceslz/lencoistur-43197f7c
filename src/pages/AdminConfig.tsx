import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Globe, CreditCard, Bell, Shield } from "lucide-react";

const AdminConfig = () => {
  const [notifications, setNotifications] = useState({ email: true, whatsapp: true, push: false });

  return (
    <AdminLayout title="Configurações">
      <Tabs defaultValue="empresa" className="space-y-6">
        <TabsList className="bg-muted">
          <TabsTrigger value="empresa"><Building2 size={14} className="mr-1" /> Empresa</TabsTrigger>
          <TabsTrigger value="site"><Globe size={14} className="mr-1" /> Site</TabsTrigger>
          <TabsTrigger value="pagamento"><CreditCard size={14} className="mr-1" /> Pagamento</TabsTrigger>
          <TabsTrigger value="notificacoes"><Bell size={14} className="mr-1" /> Notificações</TabsTrigger>
          <TabsTrigger value="seguranca"><Shield size={14} className="mr-1" /> Segurança</TabsTrigger>
        </TabsList>

        <TabsContent value="empresa">
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold text-foreground text-lg">Dados da Empresa</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome da Empresa</Label>
                  <Input defaultValue="<Input defaultValue="LençóisTour" /> />
                </div>
                <div className="space-y-2">
                  <Label>CNPJ</Label>
                  <Input defaultValue="12.345.678/0001-90" />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input defaultValue="(98) 99999-0000" />
                </div>
                <div className="space-y-2">
                  <Label>WhatsApp</Label>
                  <Input defaultValue="(98) 99999-0000" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Endereço</Label>
                  <Input defaultValue="Santo Amaro do Maranhão, MA" />
                </div>
              </div>
              <Button>Salvar Alterações</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="site">
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold text-foreground text-lg">Configurações do Site</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Título do Site</Label>
                  <Input defaultValue="<Input defaultValue="LençóisTour - Passeios nos Lençóis Maranhenses" /> />
                </div>
                <div className="space-y-2">
                  <Label>Meta Descrição</Label>
                  <Textarea defaultValue="Descubra os Lençóis Maranhenses com a melhor experiência turística. Passeios, translados e aventuras inesquecíveis." />
                </div>
                <div className="space-y-2">
                  <Label>URL WhatsApp (CTA)</Label>
                  <Input defaultValue="https://wa.me/5598999990000" />
                </div>
              </div>
              <Button>Salvar</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pagamento">
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold text-foreground text-lg">Métodos de Pagamento</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-xl">
                  <div>
                    <p className="font-medium text-foreground">PIX</p>
                    <p className="text-sm text-muted-foreground">Pagamento instantâneo via PIX</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-xl">
                  <div>
                    <p className="font-medium text-foreground">Cartão de Crédito</p>
                    <p className="text-sm text-muted-foreground">Visa, Mastercard, Elo</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-xl">
                  <div>
                    <p className="font-medium text-foreground">Boleto Bancário</p>
                    <p className="text-sm text-muted-foreground">Compensação em até 3 dias</p>
                  </div>
                  <Switch />
                </div>
              </div>
              <Button>Salvar</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notificacoes">
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold text-foreground text-lg">Preferências de Notificação</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-xl">
                  <div>
                    <p className="font-medium text-foreground">E-mail</p>
                    <p className="text-sm text-muted-foreground">Receber notificações por e-mail</p>
                  </div>
                  <Switch checked={notifications.email} onCheckedChange={(v) => setNotifications({ ...notifications, email: v })} />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-xl">
                  <div>
                    <p className="font-medium text-foreground">WhatsApp</p>
                    <p className="text-sm text-muted-foreground">Alertas de reservas via WhatsApp</p>
                  </div>
                  <Switch checked={notifications.whatsapp} onCheckedChange={(v) => setNotifications({ ...notifications, whatsapp: v })} />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-xl">
                  <div>
                    <p className="font-medium text-foreground">Push Notifications</p>
                    <p className="text-sm text-muted-foreground">Notificações no navegador</p>
                  </div>
                  <Switch checked={notifications.push} onCheckedChange={(v) => setNotifications({ ...notifications, push: v })} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seguranca">
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold text-foreground text-lg">Segurança</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Senha Atual</Label>
                  <Input type="password" />
                </div>
                <div className="space-y-2">
                  <Label>Nova Senha</Label>
                  <Input type="password" />
                </div>
                <div className="space-y-2">
                  <Label>Confirmar Nova Senha</Label>
                  <Input type="password" />
                </div>
              </div>
              <Button>Alterar Senha</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

export default AdminConfig;
