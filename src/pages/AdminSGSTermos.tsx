import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Plus, CheckCircle, XCircle, Shield, FileText } from "lucide-react";
import { toast } from "@/hooks/use-toast";

// Riscos inerentes conforme P6 VATTI
const RISKS_OPTIONS = [
  "Insolação e hipotermia",
  "Picadas de insetos e animais peçonhentos",
  "Mau tempo e mudanças climáticas repentinas",
  "Perda de objetos pessoais",
  "Capotamento ou tombamento do veículo",
  "Colisão com outro veículo",
  "Quedas na água",
  "Ingestão ou respiração de água",
  "Afogamento",
  "Lesões graves ou gravíssimas (traumatismos, escoriações)",
  "Queimadura solar",
  "Desidratação",
];

// Controles operacionais VATTI
const SAFETY_CONTROLS = [
  "Capacitação constante da equipe de condutores",
  "Cabo de resgate disponível em todas as operações",
  "Orientações de segurança por escrito e verbalmente",
  "Equipe capacitada pelo Corpo de Bombeiros em primeiros socorros",
  "Equipe preparada para realizar resgates",
  "Plano de Resposta a Emergências (PRE) implementado",
  "Veículos equipados: extintor, kit primeiros socorros, GPS, cinta de reboque, pá",
  "Checklist operacional verificado antes de cada passeio",
];

// Questões de saúde P6 VATTI
const HEALTH_QUESTIONS = [
  "Alergia", "Diabetes", "Desmaios e/ou convulsões", "Obeso(a)",
  "Cirurgia recente", "Sedentário(a)", "Parte do corpo imobilizada",
  "Portador de necessidades especiais", "Fobia a água",
  "Sob efeito de álcool e/ou entorpecentes",
];

const AdminSGSTermos = () => {
  const [terms, setTerms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    customer_name: "", nationality: "", phone: "", tour_name: "",
    risks_informed: [] as string[],
    cancellation_policy: "Cancelamento com reembolso integral até 30 dias antes do passeio. Prazo inferior a 30 dias: sem reembolso. No-show: sem reembolso. Em caso de cancelamento por segurança/motivos alheios ao comprador: remarcação ou reembolso integral.",
  });

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("sgs_risk_terms").select("*").order("created_at", { ascending: false });
    setTerms(data || []);
    setLoading(false);
  };

  const toggleRisk = (risk: string) => {
    setForm(f => ({
      ...f,
      risks_informed: f.risks_informed.includes(risk)
        ? f.risks_informed.filter(r => r !== risk)
        : [...f.risks_informed, risk],
    }));
  };

  const selectAllRisks = () => {
    setForm(f => ({ ...f, risks_informed: f.risks_informed.length === RISKS_OPTIONS.length ? [] : [...RISKS_OPTIONS] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.risks_informed.length === 0) {
      toast({ title: "Selecione ao menos um risco informado", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("sgs_risk_terms").insert({
      ...form, accepted: true, signed_at: new Date().toISOString(),
    });
    if (error) {
      toast({ title: "Erro ao registrar termo", variant: "destructive" });
    } else {
      toast({ title: "Termo de ciência registrado com sucesso!" });
      setShowForm(false);
      setForm({ ...form, customer_name: "", nationality: "", phone: "", tour_name: "", risks_informed: [] });
      load();
    }
  };

  const filtered = terms.filter(t =>
    !search || t.customer_name?.toLowerCase().includes(search.toLowerCase()) || t.tour_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout title="SGS - Termos de Ciência de Risco (P6)">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por cliente ou passeio..."
              className="w-full pl-4 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2">
            <Plus size={16} /> Novo Termo
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-5">
            {/* Company header P6 VATTI */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <Shield size={20} className="text-primary" />
                <h3 className="font-display font-bold text-foreground">Termo de Conhecimento de Risco e Corresponsabilidade</h3>
              </div>
              <p className="text-xs text-muted-foreground">LENÇÓIS TOUR — CNPJ: 11.622.667/0001-42</p>
              <p className="text-xs text-muted-foreground">Pça Nsa Sra Conceição, s/n, Centro, Santo Amaro-MA • Tel: (98) 98588-0954</p>
              <p className="text-xs text-muted-foreground mt-1">Operadora de Turismo Fora de Estrada — Rota das Emoções, Lençóis Maranhenses</p>
              <p className="text-xs text-muted-foreground">Conforme ABNT NBR ISO 21103 — Informações aos Participantes</p>
            </div>

            {/* Activity description VATTI */}
            <div className="bg-muted rounded-xl p-4 text-xs text-muted-foreground space-y-2">
              <p className="font-semibold text-foreground text-sm flex items-center gap-2"><FileText size={14} /> Descrição da Atividade</p>
              <p>Passeio em veículo 4x4 na Rota das Emoções — duração aprox. 8h. Saída às 9h com visita às dunas, três paradas para banho nas lagoas e retorno ao ponto de embarque às 17h. Veículos comportam de 4 a 9 pessoas.</p>
              <p>Idade mínima recomendada: 2 anos. Peso corporal máximo: 110kg.</p>
              <p><strong>Recomendações:</strong> saber nadar, traje de banho, roupas e calçados confortáveis, toalha, chapéu/boné, óculos de sol, repelente, protetor solar. Não usar acessórios. Levar água e lanche.</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Nome Completo *</label>
                <input required value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Nacionalidade</label>
                <input value={form.nationality} onChange={e => setForm({ ...form, nationality: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Telefone / WhatsApp</label>
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Passeio Contratado *</label>
                <input required value={form.tour_name} onChange={e => setForm({ ...form, tour_name: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" />
              </div>
            </div>

            {/* Health questions P6 VATTI */}
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">Informações de Saúde (conforme P6 VATTI)</label>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {HEALTH_QUESTIONS.map(q => (
                  <div key={q} className="flex items-center gap-2 text-xs text-foreground bg-muted rounded-xl px-3 py-2">
                    <span className="text-muted-foreground">( )</span> {q}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2 italic">Obs.: preenchido pelo cliente no momento da assinatura presencial.</p>
            </div>

            {/* Risks */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-foreground">Riscos Informados ao Participante *</label>
                <button type="button" onClick={selectAllRisks} className="text-xs text-primary hover:underline">
                  {form.risks_informed.length === RISKS_OPTIONS.length ? "Desmarcar todos" : "Selecionar todos"}
                </button>
              </div>
              <div className="grid sm:grid-cols-2 gap-2">
                {RISKS_OPTIONS.map(risk => (
                  <label key={risk} className="flex items-center gap-2 text-sm text-foreground bg-muted rounded-xl px-3 py-2 cursor-pointer hover:bg-muted/80">
                    <input type="checkbox" checked={form.risks_informed.includes(risk)} onChange={() => toggleRisk(risk)} className="rounded" />
                    {risk}
                  </label>
                ))}
              </div>
            </div>

            {/* Safety controls */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
              <p className="font-semibold text-sm text-foreground mb-2">Controles Operacionais Adotados (conforme VATTI):</p>
              <ul className="space-y-1">
                {SAFETY_CONTROLS.map(ctrl => (
                  <li key={ctrl} className="flex items-center gap-2 text-xs text-foreground">
                    <CheckCircle size={12} className="text-primary flex-shrink-0" /> {ctrl}
                  </li>
                ))}
              </ul>
            </div>

            {/* Cancellation policy VATTI */}
            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">Política de Cancelamento</label>
              <textarea value={form.cancellation_policy} onChange={e => setForm({ ...form, cancellation_policy: e.target.value })}
                className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none h-20" />
            </div>

            {/* Declaration P6 VATTI */}
            <div className="bg-secondary/5 border border-secondary/20 rounded-xl p-4 text-sm text-foreground">
              <p className="font-semibold mb-2">Declaração de Ciência e Aceitação:</p>
              <p className="text-xs text-muted-foreground">
                Declaro que li todas as informações e recomendações acima para a participação do passeio fora de estrada em veículo 4x4 na Rota das Emoções,
                que respondi as questões com veracidade, que minhas dúvidas foram sanadas durante o briefing. Comprometo-me a cumprir com os procedimentos
                e seguir as orientações passadas pela equipe de profissionais, comportando-me adequadamente para manter a saúde e segurança de todos.
                Tenho ciência de que qualquer ato meu, contrário às informações recebidas e orientações da equipe da CONTRATADA, podem causar danos à minha
                integridade física, ao meio ambiente e a terceiros, os quais assumo integralmente.
              </p>
            </div>

            <div className="flex gap-3">
              <button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-semibold">Registrar Termo</button>
              <button type="button" onClick={() => setShowForm(false)} className="bg-muted text-muted-foreground px-6 py-2.5 rounded-xl text-sm font-semibold">Cancelar</button>
            </div>
          </form>
        )}

        <div className="space-y-3">
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Carregando...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum termo encontrado</p>
          ) : filtered.map(t => (
            <div key={t.id} className="bg-card border border-border rounded-2xl p-5">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.accepted ? "bg-primary/10" : "bg-destructive/10"}`}>
                    {t.accepted ? <CheckCircle size={20} className="text-primary" /> : <XCircle size={20} className="text-destructive" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground">{t.customer_name}</h4>
                    <p className="text-xs text-muted-foreground">{t.tour_name} • {t.nationality || "BR"} • {t.phone || "—"}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${t.accepted ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                    {t.accepted ? "Aceito" : "Pendente"}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t.signed_at ? new Date(t.signed_at).toLocaleDateString("pt-BR") : "—"}
                  </p>
                </div>
              </div>
              {t.risks_informed?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {t.risks_informed.map((r: string, i: number) => (
                    <span key={i} className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-lg">{r}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSGSTermos;
