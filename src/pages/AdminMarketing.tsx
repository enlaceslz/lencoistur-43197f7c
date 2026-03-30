import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  MessageSquare, Mail, Target, TrendingUp, Users, Send, Clock,
  CheckCircle, AlertCircle, BarChart3, Megaphone, RefreshCw,
  Plus, Eye, Copy, Smartphone, Zap
} from "lucide-react";
import { useState } from "react";

type Tab = "whatsapp" | "email" | "leads" | "remarketing";

const whatsappCampaigns = [
  { id: 1, name: "Promo Lençóis Julho", status: "ativa", sent: 1240, delivered: 1198, read: 876, clicked: 312, date: "2026-03-25" },
  { id: 2, name: "Lembrete Reservas Semana", status: "ativa", sent: 89, delivered: 87, read: 72, clicked: 45, date: "2026-03-28" },
  { id: 3, name: "Black Friday Antecipada", status: "finalizada", sent: 3200, delivered: 3100, read: 2450, clicked: 890, date: "2026-03-15" },
  { id: 4, name: "Recuperação Carrinho", status: "automática", sent: 156, delivered: 150, read: 120, clicked: 78, date: "2026-03-29" },
];

const emailCampaigns = [
  { id: 1, name: "Newsletter Março", status: "enviada", recipients: 2400, opens: 864, clicks: 192, bounces: 48, date: "2026-03-20" },
  { id: 2, name: "Novos Passeios 2026", status: "rascunho", recipients: 0, opens: 0, clicks: 0, bounces: 0, date: "2026-03-30" },
  { id: 3, name: "Cupom Primeira Compra", status: "automática", recipients: 580, opens: 348, clicks: 145, bounces: 12, date: "2026-03-01" },
];

const leads = [
  { id: 1, name: "Carlos Mendes", phone: "(98) 99123-4567", email: "carlos@email.com", source: "WhatsApp", interest: "Lençóis Completo", status: "quente", lastContact: "2026-03-29", score: 85 },
  { id: 2, name: "Ana Beatriz", phone: "(11) 98765-1234", email: "ana.b@email.com", source: "Site", interest: "Atins + Caburé", status: "morno", lastContact: "2026-03-27", score: 60 },
  { id: 3, name: "Pedro Alves", phone: "(21) 97654-3210", email: "pedro@email.com", source: "Instagram", interest: "Translado São Luís", status: "frio", lastContact: "2026-03-20", score: 25 },
  { id: 4, name: "Mariana Costa", phone: "(98) 98877-6655", email: "mari@email.com", source: "Indicação", interest: "Pacote Família", status: "quente", lastContact: "2026-03-30", score: 92 },
  { id: 5, name: "Roberto Lima", phone: "(85) 99988-7766", email: "roberto.l@email.com", source: "Google Ads", interest: "Day Use Lençóis", status: "abandonou", lastContact: "2026-03-22", score: 40 },
];

const remarketingRules = [
  { id: 1, trigger: "Carrinho abandonado", delay: "30 min", channel: "WhatsApp", message: "Oi {nome}! Notamos que você não finalizou sua reserva para {passeio}. Precisa de ajuda? 😊", active: true, conversions: 34 },
  { id: 2, trigger: "Visitou passeio 2x sem reservar", delay: "24h", channel: "WhatsApp", message: "Olá {nome}! O passeio {passeio} é um dos nossos mais procurados. Que tal garantir sua vaga?", active: true, conversions: 18 },
  { id: 3, trigger: "Reserva concluída", delay: "48h", channel: "E-mail", message: "Sua aventura nos Lençóis está chegando! Confira dicas para aproveitar ao máximo.", active: true, conversions: 0 },
  { id: 4, trigger: "Pós-passeio (7 dias)", delay: "7 dias", channel: "E-mail + WhatsApp", message: "Como foi sua experiência? Avalie e ganhe 10% na próxima reserva!", active: false, conversions: 56 },
  { id: 5, trigger: "Aniversário do cliente", delay: "No dia", channel: "WhatsApp", message: "Feliz aniversário, {nome}! 🎂 Presente especial: 15% OFF em qualquer passeio!", active: true, conversions: 12 },
];

const statusColors: Record<string, string> = {
  ativa: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  finalizada: "bg-muted text-muted-foreground",
  automática: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  enviada: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  rascunho: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  quente: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  morno: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  frio: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  abandonou: "bg-muted text-muted-foreground",
};

const AdminMarketing = () => {
  const [tab, setTab] = useState<Tab>("whatsapp");

  const stats = [
    { label: "Leads Ativos", value: leads.filter(l => l.status !== "frio").length, icon: Users, color: "text-primary" },
    { label: "Campanhas Ativas", value: whatsappCampaigns.filter(c => c.status === "ativa" || c.status === "automática").length + emailCampaigns.filter(c => c.status === "automática").length, icon: Megaphone, color: "text-secondary" },
    { label: "Taxa de Conversão", value: "12.8%", icon: TrendingUp, color: "text-green-600" },
    { label: "Recuperações (mês)", value: remarketingRules.reduce((a, r) => a + r.conversions, 0), icon: RefreshCw, color: "text-blue-600" },
  ];

  const tabs: { key: Tab; label: string; icon: typeof MessageSquare }[] = [
    { key: "whatsapp", label: "WhatsApp", icon: MessageSquare },
    { key: "email", label: "E-mail", icon: Mail },
    { key: "leads", label: "Leads", icon: Target },
    { key: "remarketing", label: "Remarketing", icon: RefreshCw },
  ];

  return (
    <AdminLayout title="Marketing & WhatsApp" subtitle="Campanhas, leads e automações de marketing">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <Card key={s.label} className="border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <s.icon size={20} className={s.color} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold text-foreground font-display">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap ${
              tab === t.key ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {/* WhatsApp Tab */}
      {tab === "whatsapp" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-lg text-foreground">Campanhas WhatsApp</h2>
            <button className="bg-whatsapp hover:bg-whatsapp-hover text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors">
              <Plus size={16} /> Nova Campanha
            </button>
          </div>

          <Card className="border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground">Campanha</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground text-center">Enviadas</TableHead>
                  <TableHead className="text-muted-foreground text-center">Lidas</TableHead>
                  <TableHead className="text-muted-foreground text-center">Cliques</TableHead>
                  <TableHead className="text-muted-foreground text-center">Taxa</TableHead>
                  <TableHead className="text-muted-foreground">Data</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {whatsappCampaigns.map((c) => (
                  <TableRow key={c.id} className="border-border">
                    <TableCell className="font-semibold text-foreground">{c.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[c.status]}>{c.status}</Badge>
                    </TableCell>
                    <TableCell className="text-center text-foreground">{c.sent}</TableCell>
                    <TableCell className="text-center text-foreground">{c.read}</TableCell>
                    <TableCell className="text-center text-foreground">{c.clicked}</TableCell>
                    <TableCell className="text-center font-semibold text-primary">
                      {c.sent > 0 ? `${((c.clicked / c.sent) * 100).toFixed(1)}%` : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(c.date).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <button className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                        <Eye size={16} className="text-muted-foreground" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Quick stats */}
          <div className="grid sm:grid-cols-3 gap-4">
            <Card className="border-border">
              <CardContent className="p-4 text-center">
                <Send size={24} className="mx-auto text-whatsapp mb-2" />
                <p className="text-2xl font-bold text-foreground font-display">
                  {whatsappCampaigns.reduce((a, c) => a + c.sent, 0).toLocaleString("pt-BR")}
                </p>
                <p className="text-xs text-muted-foreground">Mensagens enviadas (mês)</p>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="p-4 text-center">
                <CheckCircle size={24} className="mx-auto text-green-600 mb-2" />
                <p className="text-2xl font-bold text-foreground font-display">
                  {((whatsappCampaigns.reduce((a, c) => a + c.read, 0) / whatsappCampaigns.reduce((a, c) => a + c.sent, 0)) * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">Taxa de leitura média</p>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="p-4 text-center">
                <Zap size={24} className="mx-auto text-secondary mb-2" />
                <p className="text-2xl font-bold text-foreground font-display">
                  {((whatsappCampaigns.reduce((a, c) => a + c.clicked, 0) / whatsappCampaigns.reduce((a, c) => a + c.sent, 0)) * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">Taxa de clique média</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Email Tab */}
      {tab === "email" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-lg text-foreground">Campanhas de E-mail</h2>
            <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors">
              <Plus size={16} /> Nova Campanha
            </button>
          </div>

          <Card className="border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground">Campanha</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground text-center">Destinatários</TableHead>
                  <TableHead className="text-muted-foreground text-center">Aberturas</TableHead>
                  <TableHead className="text-muted-foreground text-center">Cliques</TableHead>
                  <TableHead className="text-muted-foreground text-center">Taxa Abertura</TableHead>
                  <TableHead className="text-muted-foreground">Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emailCampaigns.map((c) => (
                  <TableRow key={c.id} className="border-border">
                    <TableCell className="font-semibold text-foreground">{c.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[c.status]}>{c.status}</Badge>
                    </TableCell>
                    <TableCell className="text-center text-foreground">{c.recipients || "—"}</TableCell>
                    <TableCell className="text-center text-foreground">{c.opens || "—"}</TableCell>
                    <TableCell className="text-center text-foreground">{c.clicks || "—"}</TableCell>
                    <TableCell className="text-center font-semibold text-primary">
                      {c.recipients > 0 ? `${((c.opens / c.recipients) * 100).toFixed(1)}%` : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(c.date).toLocaleDateString("pt-BR")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* Leads Tab */}
      {tab === "leads" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-lg text-foreground">Gestão de Leads</h2>
            <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors">
              <Plus size={16} /> Adicionar Lead
            </button>
          </div>

          <Card className="border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground">Nome</TableHead>
                  <TableHead className="text-muted-foreground">Contato</TableHead>
                  <TableHead className="text-muted-foreground">Origem</TableHead>
                  <TableHead className="text-muted-foreground">Interesse</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground text-center">Score</TableHead>
                  <TableHead className="text-muted-foreground">Último Contato</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((l) => (
                  <TableRow key={l.id} className="border-border">
                    <TableCell className="font-semibold text-foreground">{l.name}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p className="text-foreground">{l.phone}</p>
                        <p className="text-muted-foreground text-xs">{l.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-muted text-muted-foreground">{l.source}</Badge>
                    </TableCell>
                    <TableCell className="text-foreground text-sm">{l.interest}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[l.status]}>{l.status}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold ${
                        l.score >= 80 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : l.score >= 50 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}>
                        {l.score}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(l.lastContact).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <a
                          href={`https://wa.me/55${l.phone.replace(/\D/g, "")}?text=Olá ${l.name.split(" ")[0]}! Tudo bem?`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg hover:bg-whatsapp/10 transition-colors"
                        >
                          <Smartphone size={16} className="text-whatsapp" />
                        </a>
                        <button className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                          <Eye size={16} className="text-muted-foreground" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* Remarketing Tab */}
      {tab === "remarketing" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-lg text-foreground">Automações de Remarketing</h2>
            <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors">
              <Plus size={16} /> Nova Automação
            </button>
          </div>

          <div className="grid gap-4">
            {remarketingRules.map((r) => (
              <Card key={r.id} className={`border-border ${!r.active ? "opacity-60" : ""}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-display font-bold text-foreground">{r.trigger}</h3>
                        <Badge variant="outline" className={r.active ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-muted text-muted-foreground"}>
                          {r.active ? "Ativa" : "Inativa"}
                        </Badge>
                        <Badge variant="outline" className="bg-muted text-muted-foreground">
                          {r.channel}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock size={14} /> Delay: {r.delay}</span>
                        <span className="flex items-center gap-1"><TrendingUp size={14} /> {r.conversions} conversões</span>
                      </div>

                      <div className="bg-muted rounded-xl p-3">
                        <p className="text-sm text-foreground italic">"{r.message}"</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 shrink-0">
                      <button className="p-2 rounded-lg hover:bg-muted transition-colors" title="Editar">
                        <BarChart3 size={16} className="text-muted-foreground" />
                      </button>
                      <button className="p-2 rounded-lg hover:bg-muted transition-colors" title="Duplicar">
                        <Copy size={16} className="text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminMarketing;
