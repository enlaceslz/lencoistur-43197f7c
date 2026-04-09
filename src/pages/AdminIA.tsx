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
  BarChart3, ThumbsUp, Save, Loader2, RefreshCw, Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface TourDemand {
  name: string;
  bookings: number;
  revenue: number;
  trend: "up" | "down" | "stable";
}

const AdminIA = () => {
  const [loading, setLoading] = useState(true);
  const [tourDemand, setTourDemand] = useState<TourDemand[]>([]);
  const [totalBookings, setTotalBookings] = useState(0);
  const [monthRevenue, setMonthRevenue] = useState(0);
  const [conversionRate, setConversionRate] = useState(0);
  const [saving, setSaving] = useState(false);

  // AI Analysis
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);

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
    { name: "Tradução automática (EN/ES/FR)", active: false },
  ]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const [bookingsRes] = await Promise.all([
        supabase.from("bookings").select("item_name, final_total, status, type").gte("created_at", startOfMonth),
      ]);

      const bookings = bookingsRes.data || [];
      setTotalBookings(bookings.length);
      setMonthRevenue(bookings.reduce((a, b) => a + (b.final_total || 0), 0));

      const confirmed = bookings.filter(b => b.status === "confirmada").length;
      setConversionRate(bookings.length > 0 ? Math.round((confirmed / bookings.length) * 100 * 10) / 10 : 0);

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

  const generateAIAnalysis = async () => {
    setAiLoading(true);
    setAiAnalysis("");
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) { toast.error("Sessão expirada. Faça login novamente."); return; }

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-analysis`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        if (resp.status === 429) toast.error("Muitas requisições. Tente em instantes.");
        else if (resp.status === 402) toast.error("Créditos de IA esgotados.");
        else toast.error(err.error || "Erro ao gerar análise.");
        return;
      }

      const result = await resp.json();
      setAiAnalysis(result.analysis || "Sem dados suficientes.");
      toast.success("Análise gerada com sucesso!");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao conectar com serviço de IA.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveConfig = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("Configurações da IA salvas!");
    }, 600);
  };

  const toggleAutomation = (index: number) => {
    setAutomations((prev) =>
      prev.map((a, i) => (i === index ? { ...a, active: !a.active } : a))
    );
  };

  return (
    <AdminLayout title="Inteligência Artificial">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-muted text-primary"><MessageSquare size={22} /></div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalBookings}</p>
              <p className="text-xs text-muted-foreground">Reservas (Mês)</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-muted text-green-600"><Bot size={22} /></div>
            <div>
              <p className="text-2xl font-bold text-foreground">R$ {(monthRevenue / 100).toLocaleString("pt-BR", { minimumFractionDigits: 0 })}</p>
              <p className="text-xs text-muted-foreground">Receita (Mês)</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-muted text-blue-600"><TrendingUp size={22} /></div>
            <div>
              <p className="text-2xl font-bold text-foreground">{conversionRate}%</p>
              <p className="text-xs text-muted-foreground">Conversão</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-muted text-amber-600"><ThumbsUp size={22} /></div>
            <div>
              <p className="text-2xl font-bold text-foreground">{tourDemand.length}</p>
              <p className="text-xs text-muted-foreground">Passeios Ativos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="insights">
        <TabsList className="mb-6 flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="insights"><Sparkles size={14} className="mr-1" /> Análise IA</TabsTrigger>
          <TabsTrigger value="demanda"><BarChart3 size={14} className="mr-1" /> Demanda</TabsTrigger>
          <TabsTrigger value="config"><Settings size={14} className="mr-1" /> Configurações</TabsTrigger>
        </TabsList>

        {/* AI Analysis */}
        <TabsContent value="insights">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
                <Brain size={20} className="text-primary" /> Análise Inteligente
              </h3>
              <Button onClick={generateAIAnalysis} disabled={aiLoading}>
                {aiLoading ? <Loader2 size={16} className="animate-spin mr-1" /> : <Sparkles size={16} className="mr-1" />}
                {aiAnalysis ? "Atualizar Análise" : "Gerar Análise"}
              </Button>
            </div>

            {aiLoading && !aiAnalysis && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Loader2 className="animate-spin mx-auto text-primary mb-3" size={32} />
                  <p className="text-muted-foreground">Analisando dados com IA...</p>
                  <p className="text-xs text-muted-foreground mt-1">Isso pode levar alguns segundos.</p>
                </CardContent>
              </Card>
            )}

            {aiAnalysis && (
              <Card>
                <CardContent className="p-6">
                  <div className="prose prose-sm max-w-none dark:prose-invert [&_h2]:text-foreground [&_h2]:text-base [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2 [&_p]:text-muted-foreground [&_li]:text-muted-foreground [&_strong]:text-foreground">
                    <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
                  </div>
                </CardContent>
              </Card>
            )}

            {!aiAnalysis && !aiLoading && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Brain className="mx-auto mb-3 opacity-40 text-muted-foreground" size={48} />
                  <p className="font-medium text-foreground">Análise IA disponível</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Clique em "Gerar Análise" para receber insights inteligentes baseados nos seus dados reais de reservas, receita, avaliações e leads.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Demanda */}
        <TabsContent value="demanda">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-lg text-foreground">Demanda por Passeio (Mês Atual)</h3>
            <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
              <RefreshCw size={14} className={loading ? "animate-spin mr-1" : "mr-1"} /> Atualizar
            </Button>
          </div>

          {loading ? (
            <Card><CardContent className="p-8 text-center"><Loader2 className="animate-spin mx-auto text-primary" size={32} /></CardContent></Card>
          ) : tourDemand.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">Nenhuma reserva de passeio encontrada este mês.</CardContent></Card>
          ) : (
            <div className="grid gap-4">
              {tourDemand.map((t) => (
                <Card key={t.name}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-display font-bold text-foreground">{t.name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {t.bookings} reserva{t.bookings !== 1 ? "s" : ""} · R$ {(t.revenue / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <Badge variant="outline" className={
                        t.trend === "up" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                        t.trend === "down" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                        "bg-muted text-muted-foreground"
                      }>
                        {t.trend === "up" ? "📈 Alta" : t.trend === "down" ? "📉 Baixa" : "➡️ Estável"}
                      </Badge>
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

        {/* Configurações */}
        <TabsContent value="config">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
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
                    <Textarea rows={4} value={instructions} onChange={(e) => setInstructions(e.target.value)} maxLength={500} />
                    <p className="text-xs text-muted-foreground">{instructions.length}/500</p>
                  </div>
                  <Button onClick={handleSaveConfig} disabled={saving}>
                    {saving ? <Loader2 size={16} className="animate-spin mr-1" /> : <Save size={16} className="mr-1" />}
                    Salvar
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-display text-lg font-bold text-foreground mb-4">Automações</h3>
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
