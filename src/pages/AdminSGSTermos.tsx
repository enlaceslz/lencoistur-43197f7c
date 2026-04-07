import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Plus, CheckCircle, XCircle, Shield } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const RISKS_OPTIONS = [
  "Exposição solar intensa e risco de insolação",
  "Terreno irregular nas dunas (risco de torção/queda)",
  "Possibilidade de afogamento nas lagoas",
  "Chuvas e mudanças climáticas repentinas",
  "Contato com fauna local (insetos, animais silvestres)",
  "Esforço físico moderado a intenso",
  "Risco de colisão veicular no trajeto",
  "Condições de maré e correntes aquáticas",
];

const SAFETY_CONTROLS = [
  "Capacitação constante da equipe de condutores",
  "Cabo de resgate disponível em todas as operações",
  "Orientações de segurança aos clientes antes e durante",
  "Equipe capacitada em primeiros socorros",
  "Equipe preparada para realizar resgates",
  "Plano de Resposta a Emergências (PRE) implementado",
];

const AdminSGSTermos = () => {
  const [terms, setTerms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    customer_name: "", nationality: "", phone: "", tour_name: "",
    risks_informed: [] as string[],
    cancellation_policy: "Cancelamento gratuito até 24h antes do passeio. Após esse prazo, retenção de 50% do valor. No-show: sem reembolso.",
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
      setForm({ customer_name: "", nationality: "", phone: "", tour_name: "", risks_informed: [], cancellation_policy: form.cancellation_policy });
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
            {/* Company header */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <Shield size={20} className="text-primary" />
                <h3 className="font-display font-bold text-foreground">Termo de Ciência e Aceitação de Riscos</h3>
              </div>
              <p className="text-xs text-muted-foreground">LENÇÓIS TOUR — Operadora de Turismo de Aventura • Rota das Emoções — Lençóis Maranhenses</p>
              <p className="text-xs text-muted-foreground">Conforme ABNT NBR ISO 21103:2014 — Informações aos Participantes</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Nome do Cliente *</label>
                <input required value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Nacionalidade</label>
                <input value={form.nationality} onChange={e => setForm({ ...form, nationality: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Telefone</label>
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Passeio Contratado *</label>
                <input required value={form.tour_name} onChange={e => setForm({ ...form, tour_name: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">Riscos Informados ao Participante *</label>
              <div className="grid sm:grid-cols-2 gap-2">
                {RISKS_OPTIONS.map(risk => (
                  <label key={risk} className="flex items-center gap-2 text-sm text-foreground bg-muted rounded-xl px-3 py-2 cursor-pointer hover:bg-muted/80">
                    <input type="checkbox" checked={form.risks_informed.includes(risk)} onChange={() => toggleRisk(risk)} className="rounded" />
                    {risk}
                  </label>
                ))}
              </div>
            </div>

            {/* Safety controls per P6 */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
              <p className="font-semibold text-sm text-foreground mb-2">Controles Operacionais Adotados pela Empresa:</p>
              <ul className="space-y-1">
                {SAFETY_CONTROLS.map(ctrl => (
                  <li key={ctrl} className="flex items-center gap-2 text-xs text-foreground">
                    <CheckCircle size={12} className="text-primary flex-shrink-0" /> {ctrl}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">Política de Cancelamento</label>
              <textarea value={form.cancellation_policy} onChange={e => setForm({ ...form, cancellation_policy: e.target.value })}
                className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none h-20" />
            </div>

            <div className="bg-secondary/5 border border-secondary/20 rounded-xl p-4 text-sm text-foreground">
              <p className="font-semibold mb-2">Declaração de Ciência e Aceitação:</p>
              <p className="text-xs text-muted-foreground">
                Declaro que fui informado(a) sobre os riscos inerentes à atividade contratada e sobre os controles operacionais 
                adotados pela empresa LENÇÓIS TOUR, incluindo capacitação da equipe, equipamentos de resgate e orientações de segurança.
                A equipe está capacitada para agir em emergências e está preparada para realizar resgates e atendimento de primeiros socorros, 
                condizentes com o Plano de Resposta a Emergências (PRE). Declaro que aceito participar de forma consciente e voluntária.
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
