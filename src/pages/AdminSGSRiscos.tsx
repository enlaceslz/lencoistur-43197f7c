import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Plus, AlertTriangle, Search, Info, Pencil, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

// P2 - Etapas conforme Devolutiva VATTI
const STAGES: Record<string, string> = {
  venda_recepcao: "Venda / Recepção",
  trajeto_ida: "Trajeto de Ida",
  passeio_dunas: "Passeio nas Dunas",
  travessia_rios: "Travessia de Rios e Terrenos Alagados",
  paradas: "Paradas (Lagoas/Povoados)",
  trajeto_volta: "Trajeto de Volta",
  banho_lagoas: "Banho nas Lagoas",
  passeio_barco: "Passeio de Barco",
  trilhas: "Trilhas / Caminhadas",
};

const STATUS_COLORS: Record<string, string> = {
  ativo: "bg-destructive/10 text-destructive",
  monitorando: "bg-primary/10 text-primary",
  tratando: "bg-secondary/10 text-secondary",
  resolvido: "bg-muted text-muted-foreground",
};

// NR classification per VATTI criteria
const riskClass = (level: number) => {
  if (level >= 12) return { label: "Inaceitável", color: "bg-destructive text-destructive-foreground", action: "Tratar o mais breve possível" };
  if (level >= 6) return { label: "Temporariamente Aceitável", color: "bg-secondary text-secondary-foreground", action: "Tratar assim que possível" };
  return { label: "Aceitável", color: "bg-primary text-primary-foreground", action: "Monitorar o risco" };
};

// Critérios VATTI
const PROB_LABELS: Record<number, string> = {
  1: "Quase Impossível",
  2: "Improvável",
  3: "Pouco Provável",
  4: "Provável",
  5: "Quase Certo",
};
const CONS_LABELS: Record<number, string> = {
  1: "Insignificante — não requer tratamento",
  2: "Baixa — primeiros socorros no local",
  3: "Moderada — remoção e tratamento hospitalar breve",
  4: "Alta — remoção complexa ou internação",
  5: "Crítica — invalidez permanente ou morte",
};

interface Risk {
  id: string; risk_code: string; stage: string; activity: string; hazard: string;
  probability: number; impact: number; risk_level: number;
  control_measures: string; treatment_measures: string; responsible: string; status: string;
}

const emptyForm = {
  stage: "venda_recepcao", activity: "", hazard: "", probability: 1, impact: 1,
  control_measures: "", treatment_measures: "", responsible: "",
};

const AdminSGSRiscos = () => {
  const [risks, setRisks] = useState<Risk[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStage, setFilterStage] = useState("todas");
  const [showForm, setShowForm] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [editing, setEditing] = useState<Risk | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { loadRisks(); }, []);

  const loadRisks = async () => {
    setLoading(true);
    const { data } = await supabase.from("sgs_risks").select("*").order("risk_level", { ascending: false });
    setRisks((data as Risk[]) || []);
    setLoading(false);
  };

  const generateCode = () => `RSK-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, "0")}`;

  const openEdit = (r: Risk) => {
    setEditing(r);
    setForm({
      stage: r.stage, activity: r.activity, hazard: r.hazard,
      probability: r.probability, impact: r.impact,
      control_measures: r.control_measures || "", treatment_measures: r.treatment_measures || "",
      responsible: r.responsible,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este risco?")) return;
    await supabase.from("sgs_risks").delete().eq("id", id);
    toast({ title: "Risco excluído." });
    loadRisks();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const level = form.probability * form.impact;

    if (editing) {
      const { error } = await supabase.from("sgs_risks").update({ ...form, risk_level: level }).eq("id", editing.id);
      if (error) { toast({ title: "Erro ao atualizar", variant: "destructive" }); return; }
      toast({ title: "Risco atualizado!" });
    } else {
      const { error } = await supabase.from("sgs_risks").insert({ risk_code: generateCode(), ...form, risk_level: level });
      if (error) { toast({ title: "Erro ao cadastrar risco", variant: "destructive" }); return; }
      toast({ title: "Risco cadastrado com sucesso!" });

      // P3: Auto-create corrective action if NR >= 6
      if (level >= 6) {
        const rc = riskClass(level);
        await supabase.from("sgs_corrective_actions").insert({
          action_code: `AC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, "0")}`,
          description: `Ação ${level >= 12 ? "URGENTE" : "corretiva"} para risco: ${form.hazard} (NR=${level})`,
          responsible: form.responsible,
          due_date: new Date(Date.now() + (level >= 12 ? 3 : 14) * 86400000).toISOString().split("T")[0],
        });
        toast({
          title: level >= 12 ? "🚨 Ação URGENTE criada automaticamente" : "⚠️ Ação corretiva criada automaticamente",
          description: `Risco ${rc.label} detectado (NR = ${level}). ${rc.action}.`,
        });
      }
      // Obs VATTI: Riscos com probabilidade baixa mas consequência alta também devem ser tratados
      if (form.probability <= 2 && form.impact >= 4 && level < 6) {
        await supabase.from("sgs_corrective_actions").insert({
          action_code: `AC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, "0")}`,
          description: `Monitoramento especial: ${form.hazard} — probabilidade baixa mas consequência alta (P=${form.probability}, C=${form.impact})`,
          responsible: form.responsible,
          due_date: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
        });
        toast({ title: "📋 Ação de monitoramento criada", description: "Conforme VATTI: riscos com P baixa e C alta devem ser tratados." });
      }
    }

    setShowForm(false);
    setEditing(null);
    setForm(emptyForm);
    loadRisks();
  };

  const filtered = risks.filter((r) => {
    const matchSearch = !search || r.activity.toLowerCase().includes(search.toLowerCase()) || r.hazard.toLowerCase().includes(search.toLowerCase());
    const matchStage = filterStage === "todas" || r.stage === filterStage;
    return matchSearch && matchStage;
  });

  const summary = {
    total: risks.length,
    acceptable: risks.filter(r => r.risk_level < 6).length,
    temporary: risks.filter(r => r.risk_level >= 6 && r.risk_level < 12).length,
    unacceptable: risks.filter(r => r.risk_level >= 12).length,
  };

  return (
    <AdminLayout title="SGS - Matriz de Riscos (P2)">
      <div className="space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-xs text-muted-foreground">Total de Riscos</p>
            <p className="text-2xl font-bold text-foreground">{summary.total}</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-xs text-primary">Aceitável (NR &lt; 6)</p>
            <p className="text-2xl font-bold text-primary">{summary.acceptable}</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-xs text-secondary">Temporário (6-11)</p>
            <p className="text-2xl font-bold text-secondary">{summary.temporary}</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-xs text-destructive">Inaceitável (NR ≥ 12)</p>
            <p className="text-2xl font-bold text-destructive">{summary.unacceptable}</p>
          </div>
        </div>

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
          <div className="flex gap-2">
            <button onClick={() => setShowLegend(!showLegend)}
              className="bg-muted text-muted-foreground px-3 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-1">
              <Info size={16} /> Critérios NR
            </button>
            <button onClick={() => { setEditing(null); setForm(emptyForm); setShowForm(!showForm); }}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2">
              <Plus size={16} /> Novo Risco
            </button>
          </div>
        </div>

        {/* NR Legend - VATTI criteria */}
        {showLegend && (
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h3 className="font-display font-bold text-foreground mb-3">Critérios VATTI para Avaliação de Riscos</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Probabilidade (P)</p>
                <div className="space-y-1">
                  {Object.entries(PROB_LABELS).map(([k, v]) => (
                    <div key={k} className="flex items-center gap-2 text-xs text-foreground bg-muted rounded-lg px-3 py-2">
                      <span className="font-bold text-primary w-4">{k}</span> {v}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Consequência (C)</p>
                <div className="space-y-1">
                  {Object.entries(CONS_LABELS).map(([k, v]) => (
                    <div key={k} className="flex items-center gap-2 text-xs text-foreground bg-muted rounded-lg px-3 py-2">
                      <span className="font-bold text-destructive w-4">{k}</span> {v}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-3 mt-4">
              <div className="bg-primary/10 rounded-xl p-4">
                <p className="font-bold text-primary text-sm">NR &lt; 6 — Aceitável</p>
                <p className="text-xs text-muted-foreground mt-1">Monitorar o risco.</p>
              </div>
              <div className="bg-secondary/10 rounded-xl p-4">
                <p className="font-bold text-secondary text-sm">6 ≤ NR &lt; 12 — Temporariamente Aceitável</p>
                <p className="text-xs text-muted-foreground mt-1">Tratar assim que possível. Ação corretiva automática.</p>
              </div>
              <div className="bg-destructive/10 rounded-xl p-4">
                <p className="font-bold text-destructive text-sm">NR ≥ 12 — Inaceitável</p>
                <p className="text-xs text-muted-foreground mt-1">Tratar o mais breve possível. Ação URGENTE.</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground italic">⚠️ Conforme VATTI: riscos com probabilidade baixa mas consequência alta também devem ser tratados.</p>
          </div>
        )}

        {/* Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h3 className="font-display font-bold text-foreground">{editing ? "Editar Risco" : "Registrar Novo Risco"}</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Etapa do Passeio *</label>
                <select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none">
                  {Object.entries(STAGES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Atividade / Perigo *</label>
                <input required value={form.activity} onChange={(e) => setForm({ ...form, activity: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" placeholder="Ex: Travessia de lagoa" />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Danos Potenciais *</label>
                <input required value={form.hazard} onChange={(e) => setForm({ ...form, hazard: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" placeholder="Ex: Afogamento, traumatismo" />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Probabilidade (P) 1-5 *</label>
                <select value={form.probability} onChange={(e) => setForm({ ...form, probability: Number(e.target.value) })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none">
                  {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} — {PROB_LABELS[n]}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Consequência (C) 1-5 *</label>
                <select value={form.impact} onChange={(e) => setForm({ ...form, impact: Number(e.target.value) })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none">
                  {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} — {CONS_LABELS[n].split("—")[0]}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">NR (auto)</label>
                <div className={`px-3 py-2.5 rounded-xl text-sm font-bold text-center ${riskClass(form.probability * form.impact).color}`}>
                  {form.probability * form.impact} — {riskClass(form.probability * form.impact).label}
                </div>
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="text-sm font-semibold text-foreground mb-1 block">Medidas de Controle Implementadas</label>
                <textarea value={form.control_measures} onChange={(e) => setForm({ ...form, control_measures: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none h-16 resize-none" placeholder="Medidas já em execução..." />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="text-sm font-semibold text-foreground mb-1 block">Tratamento (Medidas a Implementar)</label>
                <textarea value={form.treatment_measures} onChange={(e) => setForm({ ...form, treatment_measures: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none h-16 resize-none" placeholder="Ações planejadas para reduzir ou eliminar o risco..." />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Responsável *</label>
                <input required value={form.responsible} onChange={(e) => setForm({ ...form, responsible: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-semibold">{editing ? "Atualizar" : "Salvar"} Risco</button>
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="bg-muted text-muted-foreground px-6 py-2.5 rounded-xl text-sm font-semibold">Cancelar</button>
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
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Perigo / Danos</th>
                  <th className="text-center px-4 py-3 font-semibold text-muted-foreground">P</th>
                  <th className="text-center px-4 py-3 font-semibold text-muted-foreground">C</th>
                  <th className="text-center px-4 py-3 font-semibold text-muted-foreground">NR</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Classificação</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Responsável</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Status</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={10} className="text-center py-8 text-muted-foreground">Carregando...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={10} className="text-center py-8 text-muted-foreground">Nenhum risco encontrado</td></tr>
                ) : filtered.map((r) => {
                  const rc = riskClass(r.risk_level);
                  return (
                    <tr key={r.id} className="border-t border-border hover:bg-muted/50">
                      <td className="px-4 py-3 font-mono text-xs text-foreground">{r.risk_code}</td>
                      <td className="px-4 py-3 text-foreground text-xs">{STAGES[r.stage] || r.stage}</td>
                      <td className="px-4 py-3">
                        <p className="text-foreground font-medium text-xs">{r.activity}</p>
                        <p className="text-muted-foreground text-xs">{r.hazard}</p>
                      </td>
                      <td className="px-4 py-3 text-center text-foreground">{r.probability}</td>
                      <td className="px-4 py-3 text-center text-foreground">{r.impact}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-lg text-xs font-bold ${rc.color}`}>{r.risk_level}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${rc.color}`}>{rc.label}</span>
                      </td>
                      <td className="px-4 py-3 text-foreground text-xs">{r.responsible}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[r.status] || ""}`}>{r.status}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><Pencil size={14} /></button>
                          <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 size={14} /></button>
                        </div>
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
