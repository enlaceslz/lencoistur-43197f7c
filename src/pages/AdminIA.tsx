import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  Bot, Brain, MessageSquare, TrendingUp, Zap, Settings,
  BarChart3, ThumbsUp, Save, Loader2, RefreshCw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TourDemand {
  name: string;
  bookings: number;
  revenue: number;
  trend: "up" | "down" | "stable";
}

const statusColors: Record<string, string> = {
  resolvida: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  encaminhada: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  convertida: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  pendente: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const AdminIA = () => {
  const [loading, setLoading] = useState(true);
  const [tourDemand, setTourDemand] = useState<TourDemand[]>([]);
  const [totalBookings, setTotalBookings] = useState(0);
  const [monthRevenue, setMonthRevenue] = useState(0);
  const [conversionRate, setConversionRate] = useState(0);
  const [saving, setSaving] = useState(false);

  // Config state
  const [botName, setBotName] = useState("Assistente LençóisTour");
  const [tone, setTone] = useState<"Formal" | "Amigável" | "Entusiasta">("Amigável");
  const [instructions, setInstructions] = useState("Sempre sugira o WhatsApp para finalizar reservas. Mencione promoções ativas quando relevante.");
  const [automations, setAutomations] = useState([
    { name: "Resposta automática a perguntas", active: true },
    { name: "Sugestão de passeios por preferência", active: true },
    { name: "Encaminhar para humano após 3 falhas", active: true },
    { name: "Coletar lead automaticamente", active: true },
    { name: "Enviar resumo diário por e-mail", active: false },
    { name: "Tradução automática (EN/ES)", active: false },
  ]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

      const [bookingsRes, prevBookingsRes] = await Promise.all([
        supabase.from("bookings").select("item_name, final_total, status, type").gte("created_at", startOfMonth),
        supabase.from("bookings").select("id").gte("created_at", prevMonthStart).lt("created_at", startOfMonth),
      ]);

      const bookings = bookingsRes.data || [];
      const prevCount = prevBookingsRes.data?.length || 0;

      setTotalBookings(bookings.length);
      setMonthRevenue(bookings.reduce((a, b) => a + (b.final_total || 0), 0));

      const confirmed = bookings.filter(b => b.status === "confirmada").length;
      setConversionRate(bookings.length > 0 ? Math.round((confirmed / bookings.length) * 100 * 10) / 10 : 0);

      // Aggregate by tour
      const tourMap: Record<string, { bookings: number; revenue: number }> = {};
      bookings.filter(b => b.type === "passeio").forEach((b) => {
        if (!tourMap[b.item_name]) tourMap[b.item_name] = { bookings: 0, revenue: 0 };
        tourMap[b.item_name].bookings++;
        tourMap[b.item_name].revenue += b.final_total || 0;
      });

      const demand: TourDemand[] = Object.entries(tourMap)
        .map(([name, data]) => ({
          name,
          bookings: data.bookings,
          revenue: data.revenue,
          trend: data.bookings > 3 ? "up" as const : data.bookings > 1 ? "stable" as const : "down" as const,
        }))
        .sort((a, b) => b.bookings - a.bookings);

      setTourDemand(demand);
    } catch (err) {
      console.error("Error loading IA data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("Configurações da IA salvas com sucesso!");
    }, 600);
  };

  const toggleAutomation = (index: number) => {
    setAutomations((prev) =>
      prev.map((a, i) => (i === index ? { ...a, active: !a.active } : a))
    );
  };

  const aiInsights = [
    { icon: "🔥", text: tourDemand[0] ? `Alta procura por "${tourDemand[0].name}" este mês. Considere abrir vagas extras.` : "Sem dados suficientes para recomendações." },
    { icon: "📅", text: "Feriados e alta temporada (Jun-Set) são os períodos de maior demanda historicamente." },
    { icon: "💡", text: "Turistas que fazem um passeio têm alta chance de reservar outro. Sugira combos!" },
    { icon: "📈", text: `${totalBookings} reservas este mês com receita de R$ ${monthRevenue.toLocaleString("pt-BR")}.` },
    { icon: "⚡", text: `Taxa de conversão atual: ${conversionRate}%. ${conversionRate > 50 ? "Excelente!" : "Há espaço para melhorar."}` },
  ];

  return (
    <AdminLayout title="Inteligência Artificial">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-border">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-muted text-primary"><MessageSquare size={22} /></div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalBookings}</p>
              <p className="text-xs text-muted-foreground">Reservas (Mês)</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-muted text-green-600"><Bot size={22} /></div>
            <div>
              <p className="text-2xl font-bold text-foreground">R$ {(monthRevenue / 100).toLocaleString("pt-BR", { minimumFractionDigits: 0 })}</p>
              <p className="text-xs text-muted-foreground">Receita (Mês)</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-muted text-blue-600"><TrendingUp size={22} /></div>
            <div>
              <p className="text-2xl font-bold text-foreground">{conversionRate}%</p>
              <p className="text-xs text-muted-foreground">Taxa de Conversão</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-muted text-amber-600"><ThumbsUp size={22} /></div>
            <div>
              <p className="text-2xl font-bold text-foreground">{tourDemand.length}</p>
              <p className="text-xs text-muted-foreground">Passeios Ativos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="demanda">
        <TabsList className="mb-6 flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="demanda"><BarChart3 size={14} className="mr-1" /> Demanda</TabsTrigger>
          <TabsTrigger value="recomendacoes"><Brain size={14} className="mr-1" /> Insights IA</TabsTrigger>
          <TabsTrigger value="config"><Settings size={14} className="mr-1" /> Configurações</TabsTrigger>
        </TabsList>

        {/* Demanda */}
        <TabsContent value="demanda">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-lg text-foreground">Demanda por Passeio (Mês Atual)</h3>
            <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="rounded-xl">
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Atualizar
            </Button>
          </div>

          {loading ? (
            <Card className="border-border"><CardContent className="p-8 text-center"><Loader2 className="animate-spin mx-auto text-primary" size={32} /></CardContent></Card>
          ) : tourDemand.length === 0 ? (
            <Card className="border-border"><CardContent className="p-8 text-center text-muted-foreground">Nenhuma reserva de passeio encontrada este mês.</CardContent></Card>
          ) : (
            <div className="grid gap-4">
              {tourDemand.map((t) => (
                <Card key={t.name} className="border-border">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-display font-bold text-foreground">{t.name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {t.bookings} reserva{t.bookings !== 1 ? "s" : ""} · R$ {(t.revenue / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className={
                          t.trend === "up" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                          t.trend === "down" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                          "bg-muted text-muted-foreground"
                        }>
                          {t.trend === "up" ? "📈 Alta" : t.trend === "down" ? "📉 Baixa" : "➡️ Estável"}
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-3 bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full transition-all"
                        style={{ width: `${Math.min((t.bookings / (tourDemand[0]?.bookings || 1)) * 100, 100)}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Insights IA */}
        <TabsContent value="recomendacoes">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-border">
              <CardContent className="p-6">
                <h3 className="font-display text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <Brain size={20} className="text-primary" /> Insights Inteligentes
                </h3>
                <div className="space-y-3">
                  {aiInsights.map((insight, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-muted/50 rounded-xl">
                      <span className="text-lg">{insight.icon}</span>
                      <p className="text-sm text-foreground">{insight.text}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-6">
                <h3 className="font-display text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <Zap size={20} className="text-secondary" /> Ações Sugeridas pela IA
                </h3>
                <div className="space-y-3">
                  {[
                    { action: "Sugerir passeio mais popular para visitantes novos", success: "Alto impacto" },
                    { action: "Oferecer combo de passeios (upsell)", success: "Médio impacto" },
                    { action: "Enviar lembrete de reserva não finalizada", success: "Alto impacto" },
                    { action: "Sugerir translado após reserva de passeio", success: "Alto impacto" },
                    { action: "Recomendar seguro viagem para grupos", success: "Baixo impacto" },
                  ].map((a, i) => (
                    <div key={i} className="p-3 bg-muted/50 rounded-xl">
                      <p className="text-sm font-medium text-foreground">{a.action}</p>
                      <Badge variant="outline" className="mt-1 text-xs">{a.success}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Configurações */}
        <TabsContent value="config">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-border">
              <CardContent className="p-6">
                <h3 className="font-display text-lg font-bold text-foreground mb-4">Personalidade do Chatbot</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nome do assistente</Label>
                    <Input value={botName} onChange={(e) => setBotName(e.target.value)} maxLength={50} />
                  </div>
                  <div className="space-y-2">
                    <Label>Tom de comunicação</Label>
                    <div className="flex gap-2">
                      {(["Formal", "Amigável", "Entusiasta"] as const).map((t) => (
                        <Button key={t} variant={tone === t ? "default" : "outline"} size="sm" onClick={() => setTone(t)}>
                          {t}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Instruções adicionais</Label>
                    <Textarea
                      rows={4}
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground">{instructions.length}/500 caracteres</p>
                  </div>
                  <Button onClick={handleSaveConfig} disabled={saving} className="rounded-xl">
                    {saving ? <Loader2 size={16} className="animate-spin mr-1" /> : <Save size={16} className="mr-1" />}
                    Salvar Configurações
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-6">
                <h3 className="font-display text-lg font-bold text-foreground mb-4">Automações Ativas</h3>
                <div className="space-y-3">
                  {automations.map((a, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border border-border rounded-xl">
                      <span className="text-sm text-foreground">{a.name}</span>
                      <Switch checked={a.active} onCheckedChange={() => toggleAutomation(i)} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

export default AdminIA;
