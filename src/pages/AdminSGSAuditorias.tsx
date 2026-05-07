import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Plus, ClipboardCheck, CheckCircle, XCircle, Loader2, User, Calendar, FileText } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const CATEGORIES: Record<string, string> = {
  veiculo: "Veículos Revisados", epi: "EPIs Disponíveis", resgate: "Equipamentos de Resgate",
  documentacao: "Documentação do Guia", briefing: "Resumo Realizado", termo_risco: "Termo de Risco Assinado", outro: "Outro",
};

const AdminSGSAuditorias = () => {
  const [audits, setAudits] = useState<any[]>([]);
  const [auditItems, setAuditItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ auditor: "", auditor_id: "", observations: "" });
  const [checklist, setChecklist] = useState(
    Object.keys(CATEGORIES).map((cat) => ({ category: cat, item_name: CATEGORIES[cat], compliant: false, observation: "" }))
  );

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const [auditsRes, itemsRes, collabsRes] = await Promise.all([
      supabase.from("sgs_audits").select("*").order("date", { ascending: false }),
      supabase.from("sgs_audit_items").select("*"),
      supabase.from("collaborators").select("id, name").eq("status", "active").order("name"),
    ]);
    setAudits(auditsRes.data || []);
    setAuditItems(itemsRes.data || []);
    setCollaborators(collabsRes.data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = `AUD-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 999) + 1).padStart(3, "0")}`;
    const compliantCount = checklist.filter((c) => c.compliant).length;
    const score = ((compliantCount / checklist.length) * 100).toFixed(1);

    const { data: audit, error } = await supabase.from("sgs_audits").insert({
      audit_code: code, 
      auditor: form.auditor, 
      auditor_id: form.auditor_id || null,
      score: Number(score),
      observations: form.observations, 
      status: "concluida",
    }).select().single();

    if (error || !audit) { toast({ title: "Erro", variant: "destructive" }); return; }

    await supabase.from("sgs_audit_items").insert(
      checklist.map((c) => ({ audit_id: audit.id, ...c }))
    );

    toast({ title: `Auditoria concluída! Score: ${score}%` });
    setShowForm(false);
    setForm({ auditor: "", auditor_id: "", observations: "" });
    setChecklist(Object.keys(CATEGORIES).map((cat) => ({ category: cat, item_name: CATEGORIES[cat], compliant: false, observation: "" })));
    load();
  };

  const createAction = async (item: any, auditCode: string) => {
    const code = `AC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, "0")}`;
    const { error } = await supabase.from("sgs_corrective_actions").insert({
      action_code: code,
      description: `Ação corretiva para não conformidade na auditoria ${auditCode}: ${item.item_name}. Obs: ${item.observation || "Nenhuma"}`,
      status: "pendente",
      responsible: "Gestor de Segurança",
    });
    if (error) toast({ title: "Erro ao criar ação", variant: "destructive" });
    else toast({ title: "Ação corretiva criada!", description: `Código: ${code}` });
  };

  const getAuditItems = (auditId: string) => auditItems.filter((i) => i.audit_id === auditId);

  return (
    <AdminLayout title="SGS - Auditorias Internas">
      <div className="space-y-6">
        <div className="flex justify-between gap-4">
          <p className="text-sm text-muted-foreground">Auditorias periódicas de segurança conforme ISO 21101</p>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-3 px-8 h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-95"
          >
            <Plus size={20} strokeWidth={3} /> Nova Auditoria
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h3 className="font-display font-bold text-foreground">Nova Auditoria de Segurança</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Auditor (Equipe) *</label>
                <select 
                  required 
                  value={form.auditor_id} 
                  onChange={(e) => {
                    const collab = collaborators.find(c => c.id === e.target.value);
                    setForm({ ...form, auditor_id: e.target.value, auditor: collab?.name || "" });
                  }}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none"
                >
                  <option value="">Selecione um membro da equipe</option>
                  {collaborators.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Auditor Externo (se aplicável)</label>
                <input 
                  value={form.auditor_id ? "" : form.auditor} 
                  disabled={!!form.auditor_id}
                  onChange={(e) => setForm({ ...form, auditor: e.target.value })}
                  placeholder="Nome do auditor externo"
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" 
                />
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground">Checklist de Segurança</h4>
              {checklist.map((item, i) => (
                <div key={item.category} className="flex flex-col sm:flex-row sm:items-center gap-3 bg-muted rounded-xl p-3">
                  <button type="button" onClick={() => {
                    const updated = [...checklist];
                    updated[i].compliant = !updated[i].compliant;
                    setChecklist(updated);
                  }} className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.compliant ? "bg-primary" : "bg-card border border-border"}`}>
                    {item.compliant && <CheckCircle size={16} className="text-primary-foreground" />}
                  </button>
                  <span className="text-sm text-foreground flex-1">{item.item_name}</span>
                  <input value={item.observation} onChange={(e) => {
                    const updated = [...checklist];
                    updated[i].observation = e.target.value;
                    setChecklist(updated);
                  }} placeholder="Observação" className="bg-card border border-border rounded-lg px-2 py-1.5 text-xs text-foreground outline-none w-full sm:w-48" />
                </div>
              ))}
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">Observações Gerais</label>
              <textarea value={form.observations} onChange={(e) => setForm({ ...form, observations: e.target.value })} rows={2}
                className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none resize-none" />
            </div>

            <div className="flex gap-3">
              <button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-semibold">Finalizar Auditoria</button>
              <button type="button" onClick={() => setShowForm(false)} className="bg-muted text-muted-foreground px-6 py-2.5 rounded-xl text-sm font-semibold">Cancelar</button>
            </div>
          </form>
        )}

        {/* Audit list */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {loading ? (
            <div className="col-span-full py-20 text-center"><Loader2 className="animate-spin text-primary mx-auto" size={32} /></div>
          ) : audits.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-card border border-dashed rounded-3xl">
              <ClipboardCheck size={48} className="mx-auto mb-4 opacity-20" />
              <p className="font-bold text-lg">Nenhuma auditoria realizada</p>
              <p className="text-sm text-muted-foreground">Inicie auditorias periódicas para manter a conformidade ISO.</p>
            </div>
          ) : audits.map((audit) => {
            const items = getAuditItems(audit.id);
            const scoreColor = audit.score >= 80 ? "text-primary border-primary/20 bg-primary/5" : audit.score >= 50 ? "text-secondary border-secondary/20 bg-secondary/5" : "text-destructive border-destructive/20 bg-destructive/5";
            return (
              <div key={audit.id} className="glass-card admin-card-hover rounded-[2.5rem] p-8 group relative overflow-hidden flex flex-col border-2 border-transparent transition-all hover:border-primary/20">
                <div className={`absolute top-0 left-0 w-1.5 h-full transition-colors ${audit.score >= 80 ? 'bg-primary' : audit.score >= 50 ? 'bg-secondary' : 'bg-destructive'}`} />
                
                <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-inner ${
                      audit.score >= 80 ? 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white' : 
                      audit.score >= 50 ? 'bg-secondary/10 text-secondary group-hover:bg-secondary group-hover:text-white' : 
                      'bg-destructive/10 text-destructive group-hover:bg-destructive group-hover:text-white'
                    }`}>
                      <ClipboardCheck size={28} />
                    </div>
                    <div>
                      <h4 className="font-display font-black text-xl text-foreground group-hover:text-primary transition-colors leading-tight uppercase tracking-tighter">{audit.audit_code}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[8px] font-black">
                          {audit.auditor?.charAt(0).toUpperCase()}
                        </div>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Auditor: {audit.auditor}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`px-5 py-3 rounded-2xl border ${scoreColor} transition-all shadow-sm`}>
                      <p className="text-3xl font-black font-display leading-none tracking-tighter">{audit.score}%</p>
                      <p className="text-[8px] font-black uppercase tracking-widest mt-1.5 opacity-60">Compliance</p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 space-y-4 mb-8">
                   <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Checklist de Verificação</p>
                   <div className="grid grid-cols-2 gap-3">
                    {items.map((item) => (
                      <div key={item.id} className="flex flex-col gap-2 p-3 rounded-2xl bg-muted/30 border border-border/50 hover:bg-white hover:shadow-lg transition-all">
                        <div className="flex items-center gap-2">
                          {item.compliant ? (
                            <div className="w-5 h-5 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                              <CheckCircle size={14} strokeWidth={3} />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive">
                              <XCircle size={14} strokeWidth={3} />
                            </div>
                          )}
                          <span className="text-[10px] font-black text-foreground truncate uppercase tracking-tighter">{CATEGORIES[item.category] || item.item_name}</span>
                        </div>
                        {!item.compliant && (
                          <button 
                            onClick={() => createAction(item, audit.audit_code)}
                            className="w-full h-7 rounded-lg bg-destructive/10 text-destructive text-[8px] font-black uppercase tracking-widest hover:bg-destructive hover:text-white transition-all mt-1"
                          >
                            + Gerar Ação Corretiva
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-auto pt-6 border-t border-border/50 flex justify-between items-center">
                  <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    <Calendar size={12} className="text-primary" />
                    <span>{new Date(audit.date).toLocaleDateString("pt-BR")}</span>
                  </div>
                  <button className="h-9 px-4 rounded-xl bg-muted text-muted-foreground text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all flex items-center gap-2">
                    <FileText size={14} /> Laudo Completo
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSGSAuditorias;
