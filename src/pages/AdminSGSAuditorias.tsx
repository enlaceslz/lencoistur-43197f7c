import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Plus, ClipboardCheck, CheckCircle, XCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const CATEGORIES: Record<string, string> = {
  veiculo: "Veículos Revisados", epi: "EPIs Disponíveis", resgate: "Equipamentos de Resgate",
  documentacao: "Documentação do Guia", briefing: "Resumo Realizado", termo_risco: "Termo de Risco Assinado", outro: "Outro",
};

const AdminSGSAuditorias = () => {
  const [audits, setAudits] = useState<any[]>([]);
  const [auditItems, setAuditItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ auditor: "", observations: "" });
  const [checklist, setChecklist] = useState(
    Object.keys(CATEGORIES).map((cat) => ({ category: cat, item_name: CATEGORIES[cat], compliant: false, observation: "" }))
  );

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const [auditsRes, itemsRes] = await Promise.all([
      supabase.from("sgs_audits").select("*").order("date", { ascending: false }),
      supabase.from("sgs_audit_items").select("*"),
    ]);
    setAudits(auditsRes.data || []);
    setAuditItems(itemsRes.data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = `AUD-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 999) + 1).padStart(3, "0")}`;
    const compliantCount = checklist.filter((c) => c.compliant).length;
    const score = ((compliantCount / checklist.length) * 100).toFixed(1);

    const { data: audit, error } = await supabase.from("sgs_audits").insert({
      audit_code: code, auditor: form.auditor, score: Number(score),
      observations: form.observations, status: "concluida",
    }).select().single();

    if (error || !audit) { toast({ title: "Erro", variant: "destructive" }); return; }

    await supabase.from("sgs_audit_items").insert(
      checklist.map((c) => ({ audit_id: audit.id, ...c }))
    );

    toast({ title: `Auditoria concluída! Score: ${score}%` });
    setShowForm(false);
    setForm({ auditor: "", observations: "" });
    setChecklist(Object.keys(CATEGORIES).map((cat) => ({ category: cat, item_name: CATEGORIES[cat], compliant: false, observation: "" })));
    load();
  };

  const getAuditItems = (auditId: string) => auditItems.filter((i) => i.audit_id === auditId);

  return (
    <AdminLayout title="SGS - Auditorias Internas">
      <div className="space-y-6">
        <div className="flex justify-between gap-4">
          <p className="text-sm text-muted-foreground">Auditorias periódicas de segurança conforme ISO 21101</p>
          <button onClick={() => setShowForm(!showForm)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2">
            <Plus size={16} /> Nova Auditoria
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h3 className="font-display font-bold text-foreground">Nova Auditoria de Segurança</h3>
            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">Auditor *</label>
              <input required value={form.auditor} onChange={(e) => setForm({ ...form, auditor: e.target.value })}
                className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none max-w-md" />
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground">Checklist de Segurança</h4>
              {checklist.map((item, i) => (
                <div key={item.category} className="flex items-center gap-3 bg-muted rounded-xl p-3">
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
                  }} placeholder="Observação" className="bg-card border border-border rounded-lg px-2 py-1.5 text-xs text-foreground outline-none w-48" />
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
        <div className="space-y-3">
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Carregando...</p>
          ) : audits.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhuma auditoria realizada</p>
          ) : audits.map((audit) => {
            const items = getAuditItems(audit.id);
            const scoreColor = audit.score >= 80 ? "text-primary" : audit.score >= 50 ? "text-secondary" : "text-destructive";
            return (
              <div key={audit.id} className="bg-card border border-border rounded-2xl p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <ClipboardCheck size={18} className="text-primary" />
                      <span className="font-mono text-xs text-muted-foreground">{audit.audit_code}</span>
                    </div>
                    <p className="text-sm text-foreground">Auditor: <strong>{audit.auditor}</strong></p>
                    <p className="text-xs text-muted-foreground">{new Date(audit.date).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-3xl font-bold font-display ${scoreColor}`}>{audit.score}%</p>
                    <p className="text-xs text-muted-foreground">Score</p>
                  </div>
                </div>
                {items.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center gap-1.5 text-xs">
                        {item.compliant ? <CheckCircle size={14} className="text-primary" /> : <XCircle size={14} className="text-destructive" />}
                        <span className="text-foreground">{CATEGORIES[item.category] || item.item_name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSGSAuditorias;
