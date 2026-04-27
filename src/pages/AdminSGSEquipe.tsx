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

  const addStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("sgs_staff").insert(form);
    if (error) { toast({ title: "Erro", variant: "destructive" }); return; }
    toast({ title: "Membro adicionado!" });
    setShowForm(false);
    setForm({ name: "", role: "guia", phone: "", email: "", document: "" });
    load();
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
    <AdminLayout title="SGS - Equipe e Competências (ISO 21102)">
      <div className="space-y-6">
        <div className="flex justify-between gap-4">
          <p className="text-sm text-muted-foreground">Gestão de competências conforme ABNT NBR ISO 21102</p>
          <button onClick={() => setShowForm(!showForm)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2">
            <Plus size={16} /> Novo Membro
          </button>
        </div>

        {showForm && (
          <form onSubmit={addStaff} className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h3 className="font-display font-bold text-foreground">Adicionar Membro</h3>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Nome *</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Função *</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none">
                  {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Telefone</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-semibold">Salvar</button>
              <button type="button" onClick={() => setShowForm(false)} className="bg-muted text-muted-foreground px-6 py-2.5 rounded-xl text-sm font-semibold">Cancelar</button>
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
            <div key={s.id} className={`bg-card border rounded-2xl p-5 ${expired ? "border-destructive" : "border-border"}`}>
              <div className="flex flex-col sm:flex-row justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${s.blocked ? "bg-destructive/10" : "bg-primary/10"}`}>
                    <UserCheck size={20} className={s.blocked ? "text-destructive" : "text-primary"} />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground">{s.name}</h4>
                    <p className="text-xs text-muted-foreground">{ROLES[s.role]} {s.blocked && "• ⛔ BLOQUEADO"}</p>
                  </div>
                </div>
                <button onClick={() => setShowTrainingForm(showTrainingForm === s.id ? null : s.id)}
                  className="text-primary text-xs font-semibold hover:underline flex items-center gap-1">
                  <Shield size={14} /> Adicionar Treinamento
                </button>
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
