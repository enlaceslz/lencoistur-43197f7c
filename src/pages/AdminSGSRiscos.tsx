import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Plus, AlertTriangle, Search, Info, Pencil, Trash2, Printer, CheckCircle, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total de Riscos", value: summary.total, icon: AlertTriangle, color: "text-slate-600", bg: "bg-slate-100" },
            { label: "Aceitável (NR < 6)", value: summary.acceptable, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-100" },
            { label: "Temporário (6-11)", value: summary.temporary, icon: Clock, color: "text-amber-600", bg: "bg-amber-100" },
            { label: "Inaceitável (NR ≥ 12)", value: summary.unacceptable, icon: AlertTriangle, color: "text-rose-600", bg: "bg-rose-100" },
          ].map((stat, i) => (
            <Card key={i} className="border-none shadow-sm bg-card hover:shadow-md transition-all">
              <CardContent className="p-6 flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} shadow-inner`}><stat.icon size={24} strokeWidth={2.5} /></div>
                <div>
                  <p className="text-2xl font-black text-foreground leading-none">{stat.value}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-2">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Header */}
        <div className="flex flex-col xl:flex-row gap-6">
          {/* Heatmap Matrix */}
          <div className="bg-card border border-border rounded-2xl p-5 flex-shrink-0">
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <AlertTriangle size={16} className="text-secondary" />
              Matriz de Riscos (PxC)
            </h3>
            <div className="grid grid-cols-6 gap-1 w-full max-w-[300px]">
              <div className="aspect-square flex items-center justify-center text-[10px] font-bold text-muted-foreground italic">C \ P</div>
              {[1, 2, 3, 4, 5].map(p => (
                <div key={p} className="aspect-square flex items-center justify-center text-[10px] font-bold text-muted-foreground">{p}</div>
              ))}
              {[5, 4, 3, 2, 1].map(c => (
                <div key={`row-${c}`} className="contents">
                  <div className="aspect-square flex items-center justify-center text-[10px] font-bold text-muted-foreground">{c}</div>
                  {[1, 2, 3, 4, 5].map(p => {
                    const level = p * c;
                    const count = risks.filter(r => r.probability === p && r.impact === c).length;
                    let bgColor = "bg-primary/20";
                    if (level >= 12) bgColor = "bg-destructive/80";
                    else if (level >= 6) bgColor = "bg-secondary/60";
                    
                    return (
                      <div 
                        key={`${p}-${c}`} 
                        className={`aspect-square rounded-md flex items-center justify-center text-xs font-bold transition-all ${count > 0 ? bgColor + " text-white shadow-sm scale-105" : "bg-muted/30 text-muted-foreground/30"}`}
                        title={`P=${p}, C=${c}, NR=${level}: ${count} riscos`}
                      >
                        {count > 0 ? count : ""}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <div className="w-2.5 h-2.5 rounded-full bg-primary/30" /> Aceitável
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <div className="w-2.5 h-2.5 rounded-full bg-secondary/60" /> Temp. Aceitável
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <div className="w-2.5 h-2.5 rounded-full bg-destructive/80" /> Inaceitável
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-4">
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
                <button onClick={() => window.print()}
                  className="bg-muted text-muted-foreground px-3 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-1 hidden sm:flex">
                  <Printer size={16} /> Imprimir
                </button>
                <button onClick={() => setShowLegend(!showLegend)}
                  className="bg-muted text-muted-foreground px-3 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-1">
                  <Info size={16} /> Critérios NR
                </button>
                <button onClick={() => { setEditing(null); setForm(emptyForm); setShowForm(!showForm); }}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm shadow-primary/20">
                  <Plus size={16} /> Novo Risco
                </button>
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground italic">
              A matriz acima visualiza a distribuição dos riscos cadastrados. Clique em "Critérios NR" para entender a pontuação.
            </p>
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((r) => {
          const rc = riskClass(r.risk_level);
          return (
            <div key={r.id} className="bg-card border border-border rounded-3xl p-6 hover:shadow-xl hover:border-primary/30 transition-all group relative overflow-hidden flex flex-col">
              <div className={`absolute top-0 left-0 w-1.5 h-full transition-colors ${rc.label === 'Inaceitável' ? 'bg-destructive' : rc.label === 'Aceitável' ? 'bg-primary' : 'bg-secondary'}`} />
              
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-inner ${rc.label === 'Inaceitável' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                    <AlertTriangle size={24} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-black text-foreground group-hover:text-primary transition-colors leading-tight truncate">{r.activity}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="bg-muted text-muted-foreground font-black text-[8px] uppercase px-1.5 py-0 rounded border">
                        {STAGES[r.stage] || r.stage}
                      </Badge>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter font-mono">
                        {r.risk_code}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <Badge className={`font-black text-[9px] uppercase px-2.5 py-1 rounded-lg border shadow-sm ${rc.color}`}>
                    NR {r.risk_level} — {rc.label}
                  </Badge>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => openEdit(r)} className="p-2 rounded-xl hover:bg-primary/10 hover:text-primary transition-colors">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => handleDelete(r.id)} className="p-2 rounded-xl hover:bg-destructive/10 text-destructive transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <div className="bg-muted/30 p-4 rounded-2xl border border-border/50">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Danos Potenciais / Perigo</p>
                    <p className="text-sm font-bold text-foreground leading-relaxed">{r.hazard}</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1 bg-muted/20 p-3 rounded-xl border border-border/30">
                      <p className="text-[8px] font-black text-muted-foreground uppercase tracking-tighter">Probabilidade</p>
                      <p className="text-xs font-bold">{r.probability} - {PROB_LABELS[r.probability]}</p>
                    </div>
                    <div className="flex-1 bg-muted/20 p-3 rounded-xl border border-border/30">
                      <p className="text-[8px] font-black text-muted-foreground uppercase tracking-tighter">Consequência</p>
                      <p className="text-xs font-bold">{r.impact} - {CONS_LABELS[r.impact].split('—')[0]}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                    <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <CheckCircle size={12} /> Medidas de Controle
                    </p>
                    <p className="text-xs font-medium text-emerald-900 leading-relaxed line-clamp-3">
                      {r.control_measures || "Nenhuma medida cadastrada"}
                    </p>
                  </div>
                  {r.treatment_measures && (
                    <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100">
                      <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <Info size={12} /> Plano de Tratamento
                      </p>
                      <p className="text-xs font-medium text-amber-900 leading-relaxed line-clamp-2">
                        {r.treatment_measures}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-auto pt-4 border-t border-border/50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-black">
                    {r.responsible?.charAt(0).toUpperCase() || 'R'}
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Resp: {r.responsible}</span>
                </div>
                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border ${STATUS_COLORS[r.status] || ''}`}>
                  {r.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSGSRiscos;