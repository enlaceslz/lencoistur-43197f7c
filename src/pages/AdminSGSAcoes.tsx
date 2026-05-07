import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Search, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  pendente: { label: "Pendente", color: "bg-secondary/10 text-secondary", icon: Clock },
  em_andamento: { label: "Em Andamento", color: "bg-primary/10 text-primary", icon: Clock },
  concluida: { label: "Concluída", color: "bg-muted text-muted-foreground", icon: CheckCircle },
  atrasada: { label: "Atrasada", color: "bg-destructive/10 text-destructive", icon: AlertTriangle },
  cancelada: { label: "Cancelada", color: "bg-muted text-muted-foreground", icon: CheckCircle },
};

const AdminSGSAcoes = () => {
  const [actions, setActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ description: "", responsible: "", due_date: "", incident_id: "" as string, risk_id: "" as string });
  const [incidents, setIncidents] = useState<{ id: string; code: string; desc: string }[]>([]);
  const [risks, setRisks] = useState<{ id: string; code: string; hazard: string }[]>([]);

  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (!showForm) return;
    Promise.all([
      supabase.from("sgs_incidents").select("id, incident_code, description").order("date", { ascending: false }).limit(50),
      supabase.from("sgs_risks").select("id, risk_code, hazard").eq("status", "ativo").order("risk_level", { ascending: false }).limit(50),
    ]).then(([incRes, riskRes]) => {
      if (incRes.data) setIncidents(incRes.data.map(i => ({ id: i.id, code: i.incident_code, desc: i.description?.slice(0, 60) || "" })));
      if (riskRes.data) setRisks(riskRes.data.map(r => ({ id: r.id, code: r.risk_code, hazard: r.hazard?.slice(0, 60) || "" })));
    });
  }, [showForm]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("sgs_corrective_actions").select("*, sgs_incidents(incident_code), sgs_risks(risk_code, hazard)").order("created_at", { ascending: false });
    setActions(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = `AC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, "0")}`;
    const insertData: any = { action_code: code, description: form.description, responsible: form.responsible, due_date: form.due_date || null };
    if (form.incident_id) insertData.incident_id = form.incident_id;
    if (form.risk_id) insertData.risk_id = form.risk_id;
    const { error } = await supabase.from("sgs_corrective_actions").insert(insertData);
    if (error) {
      toast({ title: "Erro", variant: "destructive" });
    } else {
      toast({ title: "Ação corretiva cadastrada!" });
      setShowForm(false);
      setForm({ description: "", responsible: "", due_date: "", incident_id: "", risk_id: "" });
      load();
    }
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("sgs_corrective_actions").update({
      status,
      ...(status === "concluida" ? { completed_date: new Date().toISOString().split("T")[0] } : {}),
    }).eq("id", id);
    load();
  };

  const filtered = actions.filter((a) => !search || a.description?.toLowerCase().includes(search.toLowerCase()));

  return (
    <AdminLayout title="SGS - Ações Corretivas">
      <div className="space-y-6">
        <div className="flex flex-col xl:flex-row gap-6 items-center justify-between glass-card p-8 rounded-[2.5rem] mb-10 animate-in-fade border border-white/20 shadow-xl shadow-black/5" style={{ animationDelay: '0.1s' }}>
          <div className="relative flex-1 w-full group">
            <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-primary transition-colors" />
            <input 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder="Buscar ações corretivas ou preventivas..."
              className="w-full pl-14 pr-4 h-14 bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-2xl text-sm font-semibold outline-none focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-muted-foreground/40" 
            />
          </div>
          
          <div className="flex gap-3 w-full xl:w-auto justify-center">
            <button 
              onClick={() => setShowForm(!showForm)} 
              className="h-14 px-8 rounded-[1.5rem] bg-gradient-to-r from-primary to-indigo-600 font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all text-white flex items-center gap-2 whitespace-nowrap"
            >
              <Plus size={20} strokeWidth={3} /> NOVA AÇÃO
            </button>
          </div>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="glass-card border-none rounded-[2.5rem] p-8 space-y-8 animate-in-slide-down mb-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5"><CheckCircle size={120} className="text-primary" /></div>
            
            <div>
              <h3 className="text-xl font-black text-foreground uppercase tracking-tight flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                  <Plus size={20} strokeWidth={3} />
                </div>
                Registrar Ação Corretiva
              </h3>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-2 ml-13">Planejamento e execução de melhorias SGS</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Incidente Relacionado</label>
                <select value={form.incident_id} onChange={(e) => setForm({ ...form, incident_id: e.target.value })}
                  className="w-full h-12 bg-muted/30 border border-border/40 rounded-xl px-4 text-sm font-bold text-foreground outline-none focus:ring-4 focus:ring-primary/10 transition-all">
                  <option value="">Nenhum incidente</option>
                  {incidents.map(i => <option key={i.id} value={i.id}>{i.code} — {i.desc}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Risco Relacionado</label>
                <select value={form.risk_id} onChange={(e) => setForm({ ...form, risk_id: e.target.value })}
                  className="w-full h-12 bg-muted/30 border border-border/40 rounded-xl px-4 text-sm font-bold text-foreground outline-none focus:ring-4 focus:ring-primary/10 transition-all">
                  <option value="">Nenhum risco</option>
                  {risks.map(r => <option key={r.id} value={r.id}>{r.code} — {r.hazard}</option>)}
                </select>
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Descrição Detalhada *</label>
                <textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3}
                  className="w-full bg-muted/30 border border-border/40 rounded-xl px-4 py-3 text-sm font-bold text-foreground outline-none resize-none focus:ring-4 focus:ring-primary/10 transition-all" 
                  placeholder="Descreva a ação a ser tomada..." />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Responsável pela Execução *</label>
                <input required value={form.responsible} onChange={(e) => setForm({ ...form, responsible: e.target.value })}
                  className="w-full h-12 bg-muted/30 border border-border/40 rounded-xl px-4 text-sm font-bold text-foreground outline-none focus:ring-4 focus:ring-primary/10 transition-all" 
                  placeholder="Nome do colaborador" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Prazo Final</label>
                <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                  className="w-full h-12 bg-muted/30 border border-border/40 rounded-xl px-4 text-sm font-bold text-foreground outline-none focus:ring-4 focus:ring-primary/10 transition-all" />
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-border/50">
              <button type="submit" className="flex-1 h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 transition-all active:scale-95">
                Salvar Ação Corretiva
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-10 h-14 bg-muted text-muted-foreground rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all">
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* List Section */}
        <div className="space-y-6">
          <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] ml-2">Cronograma de Ações e Melhorias</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in-fade" style={{ animationDelay: '0.2s' }}>
            {loading ? (
              <div className="md:col-span-2 flex flex-col items-center justify-center py-20">
                <Loader2 className="animate-spin text-primary mb-4" size={32} />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Sincronizando Ações...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="md:col-span-2 glass-card rounded-[2.5rem] p-20 text-center border-2 border-dashed border-border/40">
                <CheckCircle size={48} className="mx-auto text-muted-foreground/20 mb-4" />
                <p className="text-xl font-black text-muted-foreground/40 uppercase tracking-widest">Nenhuma ação registrada</p>
              </div>
            ) : filtered.map((a, idx) => {
              const st = STATUS_CONFIG[a.status] || STATUS_CONFIG.pendente;
              const isOverdue = a.due_date && new Date(a.due_date) < new Date() && a.status !== "concluida" && a.status !== "cancelada";
              return (
                <div key={a.id} className={`glass-card admin-card-hover rounded-[2.5rem] p-8 group relative overflow-hidden flex flex-col border-2 transition-all ${isOverdue ? "border-rose-500/20 hover:border-rose-500/40" : "border-transparent hover:border-primary/20"}`} style={{ animationDelay: `${idx * 0.05}s` }}>
                  <div className={`absolute top-0 left-0 w-1.5 h-full transition-colors ${isOverdue ? "bg-rose-500" : st.color.includes('primary') ? "bg-primary" : st.color.includes('secondary') ? "bg-secondary" : "bg-muted"}`} />
                  
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-inner ${isOverdue ? 'bg-rose-500/10 text-rose-500' : 'bg-primary/10 text-primary'}`}>
                        <st.icon size={24} strokeWidth={2.5} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-[10px] font-black text-muted-foreground tracking-tighter uppercase px-2 py-0.5 bg-muted/50 rounded-lg border border-border/40">{a.action_code}</span>
                          <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${st.color}`}>{st.label}</span>
                          {isOverdue && <span className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-rose-500 text-white animate-pulse">ATRASADA</span>}
                        </div>
                        <h4 className="font-black text-foreground group-hover:text-primary transition-colors leading-tight line-clamp-1">{a.description}</h4>
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted/30 p-5 rounded-2xl border border-border/50 mb-6 flex-1">
                    <div className="flex items-center gap-6">
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Responsável</p>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[10px] font-black shadow-sm">
                            {a.responsible?.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs font-black text-foreground">{a.responsible}</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Prazo Final</p>
                        <div className="flex items-center gap-2">
                          <Clock size={12} className={isOverdue ? "text-rose-500" : "text-muted-foreground"} />
                          <span className={`text-xs font-black ${isOverdue ? "text-rose-500" : "text-foreground"}`}>
                            {a.due_date ? new Date(a.due_date + "T12:00").toLocaleDateString("pt-BR") : "S/ PRAZO"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {(a.sgs_incidents?.incident_code || a.sgs_risks?.risk_code) && (
                      <div className="mt-4 pt-4 border-t border-border/40 flex flex-wrap gap-3">
                        {a.sgs_incidents?.incident_code && (
                          <div className="flex items-center gap-1.5 bg-rose-500/5 px-2.5 py-1 rounded-lg border border-rose-500/10">
                            <AlertTriangle size={10} className="text-rose-500" />
                            <span className="text-[9px] font-black text-rose-600 uppercase tracking-tighter">INC: {a.sgs_incidents.incident_code}</span>
                          </div>
                        )}
                        {a.sgs_risks?.risk_code && (
                          <div className="flex items-center gap-1.5 bg-amber-500/5 px-2.5 py-1 rounded-lg border border-amber-500/10">
                            <Shield size={10} className="text-amber-600" />
                            <span className="text-[9px] font-black text-amber-700 uppercase tracking-tighter" title={a.sgs_risks.hazard}>RIS: {a.sgs_risks.risk_code}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-4 border-t border-border/40">
                    <div className="flex gap-2">
                      {a.status === "pendente" && (
                        <button onClick={() => updateStatus(a.id, "em_andamento")} className="h-9 px-4 rounded-xl bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all">Iniciar</button>
                      )}
                      {(a.status === "pendente" || a.status === "em_andamento") && (
                        <button onClick={() => updateStatus(a.id, "concluida")} className="h-9 px-4 rounded-xl bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all">Concluir</button>
                      )}
                    </div>
                    <button className="text-[9px] font-black text-muted-foreground uppercase tracking-widest hover:text-primary transition-colors">Visualizar Detalhes</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSGSAcoes;
