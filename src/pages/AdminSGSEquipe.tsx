import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Search, UserCheck, AlertTriangle, Shield, Pencil, Trash2, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const ROLES: Record<string, string> = { guia: "Guia", motorista: "Motorista", apoio: "Apoio" };
const TRAINING_TYPES: Record<string, string> = {
  primeiros_socorros: "Primeiros Socorros", resgate_lagoa: "Resgate em Lagoa",
  conducao_offroad: "Condução Off-Road", atendimento_turista: "Atendimento ao Turista", outro: "Outro",
};

const AdminSGSEquipe = () => {
  const [staff, setStaff] = useState<any[]>([]);
  const [trainings, setTrainings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showTrainingForm, setShowTrainingForm] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", role: "guia", phone: "", email: "", document: "", blocked: false });
  const [trainingForm, setTrainingForm] = useState({ training_name: "", training_type: "primeiros_socorros", completed_date: "", expiry_date: "" });

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const [staffRes, trainingRes] = await Promise.all([
      supabase.from("sgs_staff").select("*").order("name"),
      supabase.from("sgs_staff_trainings").select("*").order("expiry_date"),
    ]);
    setStaff(staffRes.data || []);
    setTrainings(trainingRes.data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    
    let res;
    if (editId) {
      res = await supabase.from("sgs_staff").update(form).eq("id", editId);
    } else {
      res = await supabase.from("sgs_staff").insert(form);
    }

    if (res.error) {
      toast({ title: "Erro", description: res.error.message, variant: "destructive" });
      return;
    }

    toast({ title: editId ? "Membro atualizado!" : "Membro adicionado!" });
    setShowForm(false);
    setEditId(null);
    setForm({ name: "", role: "guia", phone: "", email: "", document: "", blocked: false });
    load();
  };

  const openEdit = (s: any) => {
    setForm({
      name: s.name,
      role: s.role || "guia",
      phone: s.phone || "",
      email: s.email || "",
      document: s.document || "",
      blocked: !!s.blocked
    });
    setEditId(s.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este membro da equipe? Isso também removerá seus treinamentos vinculados.")) return;
    
    // First delete trainings
    await supabase.from("sgs_staff_trainings").delete().eq("staff_id", id);
    
    const { error } = await supabase.from("sgs_staff").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Membro excluído com sucesso!" });
      load();
    }
  };

  const deleteTraining = async (id: string) => {
    if (!confirm("Excluir este treinamento?")) return;
    const { error } = await supabase.from("sgs_staff_trainings").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao excluir treinamento", variant: "destructive" });
    } else {
      toast({ title: "Treinamento excluído!" });
      load();
    }
  };

  const addTraining = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showTrainingForm) return;
    const status = trainingForm.expiry_date && new Date(trainingForm.expiry_date) < new Date() ? "vencido" : "valido";
    const { error } = await supabase.from("sgs_staff_trainings").insert({ staff_id: showTrainingForm, ...trainingForm, status });
    if (error) { toast({ title: "Erro", variant: "destructive" }); return; }
    toast({ title: "Treinamento registrado!" });
    setShowTrainingForm(null);
    setTrainingForm({ training_name: "", training_type: "primeiros_socorros", completed_date: "", expiry_date: "" });
    load();
  };

  const getStaffTrainings = (staffId: string) => trainings.filter((t) => t.staff_id === staffId);
  const hasExpiredTraining = (staffId: string) => getStaffTrainings(staffId).some((t) => t.status === "vencido");

  return (
    <AdminLayout title="SGS — Equipe e Competências (ISO 21102)">
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="glass-card p-6 rounded-[2.5rem] border border-border/50 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-primary/10 text-primary shadow-inner">
              <Shield size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl font-black text-foreground tracking-tight">Gestão de Competências</h2>
              <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mt-1">Conformidade ABNT NBR ISO 21102</p>
            </div>
          </div>
          <button 
            onClick={() => { setEditId(null); setForm({ name: "", role: "guia", phone: "", email: "", document: "", blocked: false }); setShowForm(!showForm); }}
            className="w-full md:w-auto flex items-center justify-center gap-3 px-8 h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-95"
          >
            <Plus size={20} strokeWidth={3} /> Novo Membro da Equipe
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex justify-between items-center">
              <h3 className="font-display font-bold text-lg text-foreground">{editId ? "Editar Membro" : "Novo Membro"}</h3>
              <button type="button" onClick={() => { setShowForm(false); setEditId(null); }} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block uppercase tracking-wider">Nome *</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block uppercase tracking-wider">Função *</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all">
                  {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Telefone</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" />
              </div>
            </div>
            <div className="flex flex-wrap gap-6 items-center">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" checked={form.blocked} onChange={e => setForm({ ...form, blocked: e.target.checked })} 
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20" />
                <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">Membro Bloqueado (Suspenso)</span>
              </label>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all">
                {editId ? "Atualizar" : "Salvar Membro"}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditId(null); }} 
                className="bg-muted text-muted-foreground hover:bg-muted/80 px-8 py-2.5 rounded-xl text-sm font-bold transition-all">
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* Staff cards */}
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Carregando...</p>
        ) : staff.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Nenhum membro cadastrado</p>
        ) : staff.map((s) => {
          const sTrainings = getStaffTrainings(s.id);
          const expired = hasExpiredTraining(s.id);
          return (
            <div key={s.id} className={`bg-card border rounded-2xl p-5 hover:shadow-md transition-all ${expired ? "border-destructive/50" : "border-border"}`}>
              <div className="flex flex-col sm:flex-row justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${s.blocked ? "bg-destructive/10" : "bg-primary/10"}`}>
                    <UserCheck size={24} className={s.blocked ? "text-destructive" : "text-primary"} />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground text-lg">{s.name}</h4>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-tight">{ROLES[s.role]} {s.blocked && <span className="text-destructive ml-1">· BLOQUEADO</span>}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openEdit(s)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground" title="Editar">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => handleDelete(s.id)} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive" title="Excluir">
                    <Trash2 size={16} />
                  </button>
                  <button onClick={() => setShowTrainingForm(showTrainingForm === s.id ? null : s.id)}
                    className="ml-2 bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5">
                    <Shield size={14} /> Treinamento
                  </button>
                </div>
              </div>

              {showTrainingForm === s.id && (
                <form onSubmit={addTraining} className="bg-muted rounded-xl p-4 mb-3 space-y-3">
                  <div className="grid sm:grid-cols-4 gap-3">
                    <input required value={trainingForm.training_name} onChange={(e) => setTrainingForm({ ...trainingForm, training_name: e.target.value })}
                      placeholder="Nome do treinamento" className="bg-card border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none" />
                    <select value={trainingForm.training_type} onChange={(e) => setTrainingForm({ ...trainingForm, training_type: e.target.value })}
                      className="bg-card border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none">
                      {Object.entries(TRAINING_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <input type="date" required value={trainingForm.completed_date} onChange={(e) => setTrainingForm({ ...trainingForm, completed_date: e.target.value })}
                      className="bg-card border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none" />
                    <input type="date" value={trainingForm.expiry_date} onChange={(e) => setTrainingForm({ ...trainingForm, expiry_date: e.target.value })}
                      placeholder="Validade" className="bg-card border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none" />
                  </div>
                  <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-xs font-semibold">Salvar Treinamento</button>
                </form>
              )}

              {sTrainings.length > 0 && (
                <div className="space-y-1">
                  {sTrainings.map((t) => (
                    <div key={t.id} className="flex items-center justify-between text-xs py-1.5 px-3 bg-muted/50 rounded-lg">
                      <span className="text-foreground">{t.training_name} ({TRAINING_TYPES[t.training_type]})</span>
                      <div className="flex items-center gap-2">
                        {t.expiry_date && <span className="text-muted-foreground">Validade: {new Date(t.expiry_date + "T12:00").toLocaleDateString("pt-BR")}</span>}
                        <span className={`px-2 py-0.5 rounded-full font-semibold ${
                          t.status === "vencido" ? "bg-destructive/10 text-destructive" : t.status === "vencendo" ? "bg-secondary/10 text-secondary" : "bg-primary/10 text-primary"
                        }`}>{t.status}</span>
                        <button onClick={() => deleteTraining(t.id)} className="p-1 rounded hover:bg-destructive/10 text-destructive ml-1">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </AdminLayout>
  );
};

export default AdminSGSEquipe;
