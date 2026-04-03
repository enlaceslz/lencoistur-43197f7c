import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Plus, AlertTriangle, Search, Filter } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const STAGES: Record<string, string> = {
  venda_recepcao: "Venda / Recepção",
  trajeto_ida: "Trajeto de Ida",
  passeio_dunas: "Passeio nas Dunas",
  retorno: "Retorno",
  pos_passeio: "Pós Passeio",
};

const STATUS_COLORS: Record<string, string> = {
  ativo: "bg-destructive/10 text-destructive",
  monitorando: "bg-primary/10 text-primary",
  tratando: "bg-secondary/10 text-secondary",
  resolvido: "bg-muted text-muted-foreground",
};

const riskClass = (level: number) => {
  if (level > 10) return { label: "Inaceitável", color: "bg-destructive text-destructive-foreground" };
  if (level >= 6) return { label: "Temporário", color: "bg-secondary text-secondary-foreground" };
  return { label: "Aceitável", color: "bg-primary text-primary-foreground" };
};

interface Risk {
  id: string; risk_code: string; stage: string; activity: string; hazard: string;
  probability: number; impact: number; risk_level: number;
  control_measures: string; treatment_measures: string; responsible: string; status: string;
}

const AdminSGSRiscos = () => {
  const [risks, setRisks] = useState<Risk[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStage, setFilterStage] = useState("todas");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    stage: "venda_recepcao", activity: "", hazard: "", probability: 1, impact: 1,
    control_measures: "", treatment_measures: "", responsible: "",
  });

  useEffect(() => {
    loadRisks();
  }, []);

  const loadRisks = async () => {
    setLoading(true);
    const { data } = await supabase.from("sgs_risks").select("*").order("risk_level", { ascending: false });
    setRisks((data as Risk[]) || []);
    setLoading(false);
  };

  const generateCode = () => `RSK-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, "0")}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("sgs_risks").insert({
      risk_code: generateCode(), ...form,
    });
    if (error) {
      toast({ title: "Erro ao cadastrar risco", variant: "destructive" });
    } else {
      toast({ title: "Risco cadastrado com sucesso!" });
      setShowForm(false);
      setForm({ stage: "venda_recepcao", activity: "", hazard: "", probability: 1, impact: 1, control_measures: "", treatment_measures: "", responsible: "" });
      loadRisks();

      // Auto-create corrective action if risk > 10
      const level = form.probability * form.impact;
      if (level > 10) {
        await supabase.from("sgs_corrective_actions").insert({
          action_code: `AC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, "0")}`,
          description: `Ação urgente para risco: ${form.hazard}`,
          responsible: form.responsible,
          due_date: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
        });
        toast({ title: "⚠️ Ação corretiva criada automaticamente", description: "Risco inaceitável detectado (NR > 10)" });
      }
    }
  };

  const filtered = risks.filter((r) => {
    const matchSearch = !search || r.activity.toLowerCase().includes(search.toLowerCase()) || r.hazard.toLowerCase().includes(search.toLowerCase());
    const matchStage = filterStage === "todas" || r.stage === filterStage;
    return matchSearch && matchStage;
  });

  return (
    <AdminLayout title="SGS - Matriz de Riscos">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex gap-2 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3 top-3 text-muted-foreground" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar riscos..."
                className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <select value={filterStage} onChange={(e) => setFilterStage(e.target.value)}
              className="bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none">
              <option value="todas">Todas etapas</option>
              {Object.entries(STAGES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2">
            <Plus size={16} /> Novo Risco
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h3 className="font-display font-bold text-foreground">Registrar Novo Risco</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Etapa *</label>
                <select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none">
                  {Object.entries(STAGES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Atividade *</label>
                <input required value={form.activity} onChange={(e) => setForm({ ...form, activity: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" placeholder="Ex: Travessia de lagoa" />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Perigo Identificado *</label>
                <input required value={form.hazard} onChange={(e) => setForm({ ...form, hazard: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" placeholder="Ex: Afogamento" />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Probabilidade (1-5) *</label>
                <input type="number" min={1} max={5} required value={form.probability} onChange={(e) => setForm({ ...form, probability: Number(e.target.value) })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Impacto (1-5) *</label>
                <input type="number" min={1} max={5} required value={form.impact} onChange={(e) => setForm({ ...form, impact: Number(e.target.value) })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">NR (auto)</label>
                <div className={`px-3 py-2.5 rounded-xl text-sm font-bold text-center ${riskClass(form.probability * form.impact).color}`}>
                  {form.probability * form.impact} — {riskClass(form.probability * form.impact).label}
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Medidas de Controle</label>
                <input value={form.control_measures} onChange={(e) => setForm({ ...form, control_measures: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" placeholder="Medidas implementadas" />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Medidas de Tratamento</label>
                <input value={form.treatment_measures} onChange={(e) => setForm({ ...form, treatment_measures: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" placeholder="Ações de tratamento" />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Responsável *</label>
                <input required value={form.responsible} onChange={(e) => setForm({ ...form, responsible: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" placeholder="Nome do responsável" />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-semibold">Salvar Risco</button>
              <button type="button" onClick={() => setShowForm(false)} className="bg-muted text-muted-foreground px-6 py-2.5 rounded-xl text-sm font-semibold">Cancelar</button>
            </div>
          </form>
        )}

        {/* Table */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Código</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Etapa</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Perigo</th>
                  <th className="text-center px-4 py-3 font-semibold text-muted-foreground">P</th>
                  <th className="text-center px-4 py-3 font-semibold text-muted-foreground">I</th>
                  <th className="text-center px-4 py-3 font-semibold text-muted-foreground">NR</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Responsável</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">Carregando...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">Nenhum risco encontrado</td></tr>
                ) : filtered.map((r) => {
                  const rc = riskClass(r.risk_level);
                  return (
                    <tr key={r.id} className="border-t border-border hover:bg-muted/50">
                      <td className="px-4 py-3 font-mono text-xs text-foreground">{r.risk_code}</td>
                      <td className="px-4 py-3 text-foreground">{STAGES[r.stage]}</td>
                      <td className="px-4 py-3 text-foreground font-medium">{r.hazard}</td>
                      <td className="px-4 py-3 text-center text-foreground">{r.probability}</td>
                      <td className="px-4 py-3 text-center text-foreground">{r.impact}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-lg text-xs font-bold ${rc.color}`}>{r.risk_level}</span>
                      </td>
                      <td className="px-4 py-3 text-foreground">{r.responsible}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[r.status]}`}>{r.status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSGSRiscos;
