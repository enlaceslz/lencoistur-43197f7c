import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Plus, AlertTriangle, Search, Info, Pencil, Trash2, Printer, CheckCircle, Clock } from "lucide-react";
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
  residual_probability?: number; residual_impact?: number; residual_risk_level?: number;
  control_measures: string; treatment_measures: string; responsible: string; status: string;
}

const emptyForm = {
  stage: "venda_recepcao", activity: "", hazard: "", probability: 1, impact: 1,
  residual_probability: 1, residual_impact: 1,
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
    try {
      setLoading(true);
      const { data } = await supabase.from("sgs_risks").select("*").order("risk_level", { ascending: false });
      setRisks((data as Risk[]) || []);
    } catch (err: any) {
      toast({ title: "Erro ao carregar riscos", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const generateCode = () => `RSK-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, "0")}`;

  const openEdit = (r: Risk) => {
    setEditing(r);
    setForm({
      stage: r.stage, activity: r.activity, hazard: r.hazard,
      probability: r.probability, impact: r.impact,
      residual_probability: r.residual_probability || 1,
      residual_impact: r.residual_impact || 1,
      control_measures: r.control_measures || "", treatment_measures: r.treatment_measures || "",
      responsible: r.responsible,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      if (!confirm("Excluir este risco?")) return;
      await supabase.from("sgs_risks").delete().eq("id", id);
      toast({ title: "Risco excluído." });
      loadRisks();
    } catch (err: any) {
      toast({ title: "Erro ao excluir risco", description: err.message, variant: "destructive" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const level = form.probability * form.impact;
    const residualLevel = form.residual_probability * form.residual_impact;

    const dataToSubmit = {
      ...form,
      risk_level: level,
      residual_risk_level: residualLevel
    };

    if (editing) {
      const { error } = await supabase.from("sgs_risks").update(dataToSubmit).eq("id", editing.id);
      if (error) { toast({ title: "Erro ao atualizar", variant: "destructive" }); return; }
      toast({ title: "Risco atualizado!" });
    } else {
      const { error } = await supabase.from("sgs_risks").insert({ risk_code: generateCode(), ...dataToSubmit });
      if (error) { toast({ title: "Erro ao cadastrar risco", variant: "destructive" }); return; }
      toast({ title: "Risco cadastrado com sucesso!" });

      // P3: Auto-create corrective action if NR >= 6
      if (level >= 6) {
        const rc = riskClass(level);
        try {
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
        } catch (err: any) {
          toast({ title: "Erro ao criar ação corretiva", description: err.message, variant: "destructive" });
        }
      }
      // Obs VATTI: Riscos com probabilidade baixa mas consequência alta também devem ser tratados
      if (form.probability <= 2 && form.impact >= 4 && level < 6) {
        try {
          await supabase.from("sgs_corrective_actions").insert({
            action_code: `AC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, "0")}`,
            description: `Monitoramento especial: ${form.hazard} — probabilidade baixa mas consequência alta (P=${form.probability}, C=${form.impact})`,
            responsible: form.responsible,
            due_date: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
          });
          toast({ title: "📋 Ação de monitoramento criada", description: "Conforme VATTI: riscos com P baixa e C alta devem ser tratados." });
        } catch (err: any) {
          toast({ title: "Erro ao criar ação de monitoramento", description: err.message, variant: "destructive" });
        }
      }
    }

    setShowForm(false);
    setEditing(null);
    setForm(emptyForm);
    loadRisks();
  };

  const filtered = risks.filter((r) => {
    const matchSearch = !search || (r.activity || "").toLowerCase().includes(search.toLowerCase()) || (r.hazard || "").toLowerCase().includes(search.toLowerCase());
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
    <AdminLayout title="SGS - Matriz de Riscos (ISO 21101)">
      <div className="space-y-6">
        {/* Superior "Conformity" Section */}
        <div className="bg-white rounded-lg p-8 border border-border shadow-sm mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Análise de Perigos e Riscos</h1>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/5 border border-emerald-500/10">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Matriz P2 Sincronizada</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="bg-slate-50 px-6 py-4 rounded-xl border border-slate-200">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Índice de Risco Médio</p>
                <p className="text-xl font-black text-primary">
                  {risks.length > 0 ? (risks.reduce((s, r) => s + r.risk_level, 0) / risks.length).toFixed(1) : "0.0"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 animate-in-fade" style={{ animationDelay: '0.1s' }}>

          {[
            { label: "Total de Riscos", value: summary.total, icon: AlertTriangle, color: "from-slate-500 to-slate-700", desc: "Mapeamento P2" },
            { label: "Aceitável (NR < 6)", value: summary.acceptable, icon: CheckCircle, color: "from-emerald-500 to-teal-600", desc: "Monitoramento" },
            { label: "Temporário (6-11)", value: summary.temporary, icon: Clock, color: "from-amber-500 to-orange-600", desc: "Tratamento breve" },
            { label: "Inaceitável (NR ≥ 12)", value: summary.unacceptable, icon: AlertTriangle, color: "from-rose-500 to-pink-600", desc: "Ação imediata" },
          ].map((stat, i) => (
            <div key={i} className="glass-card admin-card-hover rounded-[2rem] p-6 relative overflow-hidden group">
              <div className={`absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br ${stat.color} opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity`} />
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white shadow-lg shadow-primary/10 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                  <stat.icon size={22} strokeWidth={2.5} />
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">{stat.desc}</div>
              </div>
              <p className="text-2xl font-black text-foreground tracking-tighter group-hover:translate-x-1 transition-transform">{stat.value}</p>
              <p className="text-[10px] font-black text-muted-foreground mt-1 uppercase tracking-[0.2em]">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Header Toolbar */}
        <div className="flex flex-col xl:flex-row gap-6 items-center justify-between glass-card p-8 rounded-[2.5rem] mb-10 animate-in-fade border border-white/20 shadow-xl shadow-black/5" style={{ animationDelay: '0.2s' }}>
          <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
            <div className="relative flex-1 group">
              <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-primary transition-colors" />
              <input 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                placeholder="Buscar por atividade ou perigo..."
                className="w-full pl-14 pr-4 h-14 bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-2xl text-sm font-semibold outline-none focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-muted-foreground/40" 
              />
            </div>
            <select 
              value={filterStage} 
              onChange={(e) => setFilterStage(e.target.value)}
              className="h-14 bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-2xl px-6 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-primary/10 transition-all cursor-pointer min-w-[200px]"
            >
              <option value="todas">Todas etapas</option>
              {Object.entries(STAGES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          
          <div className="flex flex-wrap gap-3 w-full xl:w-auto justify-center">
            <button onClick={() => window.print()}
              className="h-14 px-6 rounded-2xl bg-white/50 dark:bg-white/5 border border-white/20 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-white/80 transition-all shadow-lg">
              <Printer size={16} strokeWidth={3} /> IMPRIMIR
            </button>
            <button onClick={() => setShowLegend(!showLegend)}
              className="h-14 px-6 rounded-2xl bg-white/50 dark:bg-white/5 border border-white/20 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-white/80 transition-all shadow-lg">
              <Info size={16} strokeWidth={3} /> CRITÉRIOS NR
            </button>
            <button onClick={() => { setEditing(null); setForm(emptyForm); setShowForm(!showForm); }}
              className="h-14 px-8 rounded-[1.5rem] bg-gradient-to-r from-primary to-indigo-600 font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all text-white flex items-center gap-2">
              <Plus size={20} strokeWidth={3} /> NOVO RISCO
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Heatmap Matrix */}
          <div className="xl:col-span-1 glass-card rounded-[2.5rem] p-8 shadow-sm animate-in-fade h-fit" style={{ animationDelay: '0.3s' }}>
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-8 flex items-center gap-3">
              <AlertTriangle size={16} className="text-secondary" strokeWidth={3} />
              Matriz de Riscos (PxC)
            </h3>
            <div className="grid grid-cols-6 gap-2 w-full">
              <div className="aspect-square flex items-center justify-center text-[9px] font-black uppercase tracking-tighter text-muted-foreground italic">C \ P</div>
              {[1, 2, 3, 4, 5].map(p => (
                <div key={p} className="aspect-square flex items-center justify-center text-[10px] font-black text-muted-foreground">{p}</div>
              ))}
              {[5, 4, 3, 2, 1].map(c => (
                <div key={`row-${c}`} className="contents">
                  <div className="aspect-square flex items-center justify-center text-[10px] font-black text-muted-foreground">{c}</div>
                  {[1, 2, 3, 4, 5].map(p => {
                    const level = p * c;
                    const count = risks.filter(r => r.probability === p && r.impact === c).length;
                    let bgColor = "bg-primary/20";
                    if (level >= 12) bgColor = "bg-destructive/80";
                    else if (level >= 6) bgColor = "bg-secondary/60";
                    
                    return (
                      <div 
                        key={`${p}-${c}`} 
                        className={`aspect-square rounded-xl flex items-center justify-center text-xs font-black transition-all ${count > 0 ? bgColor + " text-white shadow-lg scale-105" : "bg-muted/10 text-muted-foreground/10"}`}
                        title={`P=${p}, C=${c}, NR=${level}: ${count} riscos`}
                      >
                        {count > 0 ? count : ""}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="mt-8 space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-primary/5 border border-primary/10">
                <div className="w-3 h-3 rounded-full bg-primary/40" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Aceitável</p>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-secondary/5 border border-secondary/10">
                <div className="w-3 h-3 rounded-full bg-secondary/60" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Temp. Aceitável</p>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-destructive/5 border border-destructive/10">
                <div className="w-3 h-3 rounded-full bg-destructive/80" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Inaceitável</p>
              </div>
            </div>
          </div>

          </div>
        </div>

        {/* NR Legend - VATTI criteria */}

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
          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-6 animate-in-slide-down">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-black text-lg text-foreground uppercase tracking-tight">
                {editing ? "Editar Risco" : "Registrar Novo Risco"}
              </h3>
              <Badge variant="outline" className="font-mono text-[10px] uppercase opacity-50">VATTI Criteria (P2)</Badge>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Etapa do Passeio *</label>
                <select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none">
                  {Object.entries(STAGES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="lg:col-span-2">
                <label className="text-sm font-semibold text-foreground mb-1 block">Atividade / Perigo *</label>
                <input required value={form.activity} onChange={(e) => setForm({ ...form, activity: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" placeholder="Ex: Banho em lagoa profunda" />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Responsável</label>
                <input value={form.responsible} onChange={(e) => setForm({ ...form, responsible: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" placeholder="Nome ou cargo" />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 p-6 bg-muted/30 rounded-[2rem] border border-border/50">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Risco Bruto (Inicial)
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Probabilidade</label>
                    <select value={form.probability} onChange={(e) => setForm({ ...form, probability: Number(e.target.value) })}
                      className="w-full bg-card border border-border rounded-lg px-2 py-1.5 text-xs">
                      {[1,2,3,4,5].map(v => <option key={v} value={v}>{v} - {PROB_LABELS[v]}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Impacto (Consequência)</label>
                    <select value={form.impact} onChange={(e) => setForm({ ...form, impact: Number(e.target.value) })}
                      className="w-full bg-card border border-border rounded-lg px-2 py-1.5 text-xs">
                      {[1,2,3,4,5].map(v => <option key={v} value={v}>{v} - {CONS_LABELS[v].split("—")[0]}</option>)}
                    </select>
                  </div>
                </div>
                <div className={`p-3 rounded-xl text-center shadow-sm ${riskClass(form.probability * form.impact).color}`}>
                  <span className="text-xs font-black uppercase">NR: {form.probability * form.impact}</span>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-secondary flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                  Medidas e Risco Residual
                </h4>
                <div className="space-y-3">
                  <textarea value={form.control_measures} onChange={(e) => setForm({ ...form, control_measures: e.target.value })}
                    placeholder="Medidas de Controle (EPIs, Treinamento, etc)"
                    className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-xs outline-none resize-none h-24" />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Risco Residual (Pós-Controle)
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Prob. Residual</label>
                    <select value={form.residual_probability} onChange={(e) => setForm({ ...form, residual_probability: Number(e.target.value) })}
                      className="w-full bg-card border border-border rounded-lg px-2 py-1.5 text-xs">
                      {[1,2,3,4,5].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Impacto Resid.</label>
                    <select value={form.residual_impact} onChange={(e) => setForm({ ...form, residual_impact: Number(e.target.value) })}
                      className="w-full bg-card border border-border rounded-lg px-2 py-1.5 text-xs">
                      {[1,2,3,4,5].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                </div>
                <div className={`p-3 rounded-xl text-center shadow-sm ${riskClass(form.residual_probability * form.residual_impact).color}`}>
                  <span className="text-xs font-black uppercase">NR Final: {form.residual_probability * form.residual_impact}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">Plano de Tratamento / Emergência</label>
              <textarea value={form.treatment_measures} onChange={(e) => setForm({ ...form, treatment_measures: e.target.value })}
                placeholder="O que fazer se o risco ocorrer? Procedimentos do PRE..."
                className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground outline-none resize-none h-24" />
            </div>

            <div className="flex gap-4 pt-4 border-t border-border/50">
              <button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground h-12 rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-95">
                {editing ? "Atualizar Registro" : "Cadastrar Risco"}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="px-8 h-12 bg-muted text-muted-foreground rounded-2xl text-sm font-black uppercase tracking-widest transition-all">
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in-fade" style={{ animationDelay: '0.4s' }}>
        {filtered.map((r) => {
          const rc = riskClass(r.risk_level);
          const colorClass = rc.label === 'Inaceitável' ? 'from-rose-500 to-pink-600' : rc.label === 'Aceitável' ? 'from-emerald-500 to-teal-600' : 'from-amber-500 to-orange-600';
          return (
            <div key={r.id} className="glass-card admin-card-hover rounded-[2.5rem] p-8 group relative overflow-hidden flex flex-col">
              <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${colorClass} opacity-20 group-hover:opacity-100 transition-opacity`} />
              
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
                    {r.responsible?.charAt(0)?.toUpperCase() || 'R'}
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
    </AdminLayout>
  );
};



export default AdminSGSRiscos;