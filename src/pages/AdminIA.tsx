import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bot, Brain, MessageSquare, TrendingUp, Zap, Settings,
  BarChart3, Users, Clock, ThumbsUp, ThumbsDown, Eye,
} from "lucide-react";

const conversations = [
  { id: 1, user: "Maria Silva", lastMsg: "Quais passeios têm para amanhã?", date: "31/03/2026 14:32", messages: 8, status: "resolvida", satisfaction: "positivo" },
  { id: 2, user: "John Smith", lastMsg: "How much is the Lagoa Azul tour?", date: "31/03/2026 13:15", messages: 5, status: "resolvida", satisfaction: "positivo" },
  { id: 3, user: "Carlos Mendes", lastMsg: "Preciso cancelar minha reserva", date: "31/03/2026 12:40", messages: 12, status: "encaminhada", satisfaction: "neutro" },
  { id: 4, user: "Sophie Martin", lastMsg: "Vocês fazem transfer do aeroporto?", date: "31/03/2026 11:20", messages: 4, status: "resolvida", satisfaction: "positivo" },
  { id: 5, user: "Ana Costa", lastMsg: "Qual a melhor época pra ir?", date: "31/03/2026 10:05", messages: 6, status: "resolvida", satisfaction: "positivo" },
  { id: 6, user: "Pedro Santos", lastMsg: "Quero um pacote com tudo incluído", date: "30/03/2026 18:50", messages: 15, status: "convertida", satisfaction: "positivo" },
];

const recommendations = [
  { tour: "Lagoa Azul", predictions: 45, confidence: 92, trend: "up" },
  { tour: "Santo Amaro", predictions: 28, confidence: 88, trend: "up" },
  { tour: "Atins & Caburé", predictions: 22, confidence: 85, trend: "stable" },
  { tour: "Sobrevoo", predictions: 15, confidence: 78, trend: "up" },
  { tour: "Rio Preguiças", predictions: 18, confidence: 82, trend: "down" },
];

const statusColors: Record<string, string> = {
  resolvida: "bg-green-100 text-green-700",
  encaminhada: "bg-amber-100 text-amber-700",
  convertida: "bg-blue-100 text-blue-700",
  pendente: "bg-red-100 text-red-700",
};

const AdminIA = () => {
  const totalConversations = 342;
  const resolvedByAI = 289;
  const conversionRate = 12.4;
  const avgSatisfaction = 94;

  return (
    <AdminLayout title="Inteligência Artificial">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-muted text-primary"><MessageSquare size={22} /></div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalConversations}</p>
              <p className="text-xs text-muted-foreground">Conversas (Mês)</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-muted text-green-600"><Bot size={22} /></div>
            <div>
              <p className="text-2xl font-bold text-foreground">{resolvedByAI}</p>
              <p className="text-xs text-muted-foreground">Resolvidas pela IA</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-muted text-blue-600"><TrendingUp size={22} /></div>
            <div>
              <p className="text-2xl font-bold text-foreground">{conversionRate}%</p>
              <p className="text-xs text-muted-foreground">Taxa de Conversão</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-muted text-amber-600"><ThumbsUp size={22} /></div>
            <div>
              <p className="text-2xl font-bold text-foreground">{avgSatisfaction}%</p>
              <p className="text-xs text-muted-foreground">Satisfação</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="conversas">
        <TabsList className="mb-6">
          <TabsTrigger value="conversas"><MessageSquare size={14} className="mr-1" /> Conversas</TabsTrigger>
          <TabsTrigger value="recomendacoes"><Brain size={14} className="mr-1" /> Recomendações</TabsTrigger>
          <TabsTrigger value="demanda"><BarChart3 size={14} className="mr-1" /> Previsão de Demanda</TabsTrigger>
          <TabsTrigger value="config"><Settings size={14} className="mr-1" /> Configurações</TabsTrigger>
        </TabsList>

        {/* Conversas */}
        <TabsContent value="conversas">
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {conversations.map((c) => (
                  <div key={c.id} className="p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-sm text-foreground">{c.user}</p>
                          <Badge variant="secondary" className={statusColors[c.status]}>{c.status}</Badge>
                          {c.satisfaction === "positivo" && <ThumbsUp size={12} className="text-green-600" />}
                          {c.satisfaction === "neutro" && <ThumbsDown size={12} className="text-amber-600" />}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{c.lastMsg}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-muted-foreground">{c.date}</p>
                        <p className="text-xs text-muted-foreground mt-1">{c.messages} msgs</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recomendações IA */}
        <TabsContent value="recomendacoes">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-display text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <Brain size={20} className="text-primary" /> Previsão de Demanda por Passeio
                </h3>
                <div className="space-y-4">
                  {recommendations.map((r) => (
                    <div key={r.tour} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm text-foreground">{r.tour}</p>
                        <p className="text-xs text-muted-foreground">{r.predictions} reservas previstas (próx. 7 dias)</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary" className={r.confidence >= 90 ? "bg-green-100 text-green-700" : r.confidence >= 80 ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}>
                          {r.confidence}% confiança
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {r.trend === "up" ? "📈 Tendência alta" : r.trend === "down" ? "📉 Tendência baixa" : "➡️ Estável"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-display text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <Zap size={20} className="text-secondary" /> Ações Automáticas da IA
                </h3>
                <div className="space-y-3">
                  {[
                    { action: "Sugerir Lagoa Azul para visitantes de 1ª viagem", triggers: 156, success: "89%" },
                    { action: "Oferecer upgrade para Santo Amaro (upsell)", triggers: 43, success: "34%" },
                    { action: "Recomendar pacote casal para viagens a dois", triggers: 67, success: "52%" },
                    { action: "Enviar lembrete de reserva não finalizada", triggers: 89, success: "28%" },
                    { action: "Sugerir translado após reserva de passeio", triggers: 124, success: "61%" },
                  ].map((a, i) => (
                    <div key={i} className="p-3 bg-muted/50 rounded-xl">
                      <p className="text-sm font-medium text-foreground">{a.action}</p>
                      <div className="flex gap-4 mt-1">
                        <span className="text-xs text-muted-foreground">{a.triggers} acionamentos</span>
                        <span className="text-xs text-green-600 font-medium">{a.success} conversão</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Previsão de Demanda */}
        <TabsContent value="demanda">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { period: "Próximos 7 dias", bookings: 128, revenue: "R$ 42.800", occupancy: "78%" },
              { period: "Próximos 30 dias", bookings: 456, revenue: "R$ 152.000", occupancy: "65%" },
              { period: "Próximos 90 dias", bookings: 1240, revenue: "R$ 413.000", occupancy: "52%" },
            ].map((d) => (
              <Card key={d.period}>
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-muted-foreground mb-2">{d.period}</p>
                  <p className="text-3xl font-bold text-foreground">{d.bookings}</p>
                  <p className="text-xs text-muted-foreground mb-3">reservas previstas</p>
                  <div className="flex justify-center gap-4">
                    <div>
                      <p className="text-sm font-bold text-primary">{d.revenue}</p>
                      <p className="text-[10px] text-muted-foreground">Receita estimada</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-secondary">{d.occupancy}</p>
                      <p className="text-[10px] text-muted-foreground">Ocupação</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mt-6">
            <CardContent className="p-6">
              <h3 className="font-display text-lg font-bold text-foreground mb-4">Insights da IA</h3>
              <div className="space-y-3">
                {[
                  { icon: "🔥", text: "Alta procura por Lagoa Azul na próxima semana. Considere abrir vagas extras." },
                  { icon: "📅", text: "Feriado de Páscoa em 2 semanas. Historicamente +40% de demanda." },
                  { icon: "💡", text: "Turistas que fazem Lagoa Azul têm 65% de chance de reservar Santo Amaro depois." },
                  { icon: "⚠️", text: "Previsão de chuva para 05/04. Pode haver cancelamentos na trilha do Morro do Boi." },
                  { icon: "📈", text: "Busca por 'sobrevoo lençóis' cresceu 120% no Google esta semana." },
                ].map((insight, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-muted/50 rounded-xl">
                    <span className="text-lg">{insight.icon}</span>
                    <p className="text-sm text-foreground">{insight.text}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configurações */}
        <TabsContent value="config">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-display text-lg font-bold text-foreground mb-4">Personalidade do Chatbot</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">Nome do assistente</label>
                    <Input defaultValue="Assistente LençóisTour" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Tom de comunicação</label>
                    <div className="flex gap-2 mt-1">
                      {["Formal", "Amigável", "Entusiasta"].map((t) => (
                        <Button key={t} variant={t === "Amigável" ? "default" : "outline"} size="sm">
                          {t}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Instruções adicionais</label>
                    <Textarea
                      className="mt-1"
                      rows={4}
                      defaultValue="Sempre sugira o WhatsApp para finalizar reservas. Mencione promoções ativas quando relevante."
                    />
                  </div>
                  <Button>Salvar Configurações</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-display text-lg font-bold text-foreground mb-4">Automações Ativas</h3>
                <div className="space-y-3">
                  {[
                    { name: "Resposta automática a perguntas", active: true },
                    { name: "Sugestão de passeios por preferência", active: true },
                    { name: "Encaminhar para humano após 3 falhas", active: true },
                    { name: "Coletar lead automaticamente", active: true },
                    { name: "Enviar resumo diário por e-mail", active: false },
                    { name: "Tradução automática (EN/ES)", active: false },
                  ].map((a, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                      <span className="text-sm text-foreground">{a.name}</span>
                      <Badge variant="secondary" className={a.active ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}>
                        {a.active ? "Ativo" : "Inativo"}
                      </Badge>
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
