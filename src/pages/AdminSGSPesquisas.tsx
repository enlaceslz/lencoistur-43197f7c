import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Star, AlertTriangle, Trash2, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

const AdminSGSPesquisas = () => {
  const [surveys, setSurveys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    felt_safe: 5, guide_explained_risks: true, danger_situations: false,
    danger_description: "", overall_rating: 5, comments: "",
  });

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("sgs_safety_surveys").select("*").order("created_at", { ascending: false });
    setSurveys(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("sgs_safety_surveys").insert(form);
    if (error) {
      toast({ title: "Erro ao registrar pesquisa", variant: "destructive" });
    } else {
      toast({ title: "Pesquisa de segurança registrada!" });
      setShowForm(false);
      setForm({ felt_safe: 5, guide_explained_risks: true, danger_situations: false, danger_description: "", overall_rating: 5, comments: "" });
      load();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta pesquisa?")) return;
    const { error } = await supabase.from("sgs_safety_surveys").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Pesquisa excluída!" });
      load();
    }
  };

  const avgSafe = surveys.length ? (surveys.reduce((s, v) => s + (v.felt_safe || 0), 0) / surveys.length).toFixed(1) : "—";
  const avgRating = surveys.length ? (surveys.reduce((s, v) => s + (v.overall_rating || 0), 0) / surveys.length).toFixed(1) : "—";
  const dangerPct = surveys.length ? ((surveys.filter(v => v.danger_situations).length / surveys.length) * 100).toFixed(0) : "0";

  return (
    <AdminLayout title="SGS - Pesquisas de Segurança">
      <div className="space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-card border border-border rounded-3xl p-6 hover:shadow-lg transition-all flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-3">
              <Shield size={24} />
            </div>
            <p className="text-3xl font-black text-foreground font-display">{avgSafe}</p>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Sensação de Segurança (1-5)</p>
          </div>
          <div className="bg-card border border-border rounded-3xl p-6 hover:shadow-lg transition-all flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary mb-3">
              <Star size={24} />
            </div>
            <p className="text-3xl font-black text-foreground font-display">{avgRating}</p>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Avaliação Geral (1-5)</p>
          </div>
          <div className="bg-card border border-border rounded-3xl p-6 hover:shadow-lg transition-all flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive mb-3">
              <AlertTriangle size={24} />
            </div>
            <p className="text-3xl font-black text-foreground font-display">{dangerPct}%</p>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Relataram Perigo</p>
          </div>
        </div>

        <div className="flex justify-between gap-4">
          <p className="text-sm text-muted-foreground">{surveys.length} pesquisas registradas</p>
          <button onClick={() => setShowForm(!showForm)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2">
            <Plus size={16} /> Nova Pesquisa
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h3 className="font-display font-bold text-foreground">Pesquisa de Segurança Pós-Passeio</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Sentiu-se seguro? (1-5) *</label>
                <input type="number" min={1} max={5} required value={form.felt_safe}
                  onChange={e => setForm({ ...form, felt_safe: Number(e.target.value) })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Avaliação geral (1-5) *</label>
                <input type="number" min={1} max={5} required value={form.overall_rating}
                  onChange={e => setForm({ ...form, overall_rating: Number(e.target.value) })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" />
              </div>
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input type="checkbox" checked={form.guide_explained_risks}
                  onChange={e => setForm({ ...form, guide_explained_risks: e.target.checked })} className="rounded" />
                O guia explicou os riscos?
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input type="checkbox" checked={form.danger_situations}
                  onChange={e => setForm({ ...form, danger_situations: e.target.checked })} className="rounded" />
                Houve situações de perigo?
              </label>
            </div>
            {form.danger_situations && (
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Descreva a situação de perigo</label>
                <textarea value={form.danger_description} onChange={e => setForm({ ...form, danger_description: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none h-20" />
              </div>
            )}
            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">Comentários</label>
              <textarea value={form.comments} onChange={e => setForm({ ...form, comments: e.target.value })}
                className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none h-20" />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-semibold">Salvar</button>
              <button type="button" onClick={() => setShowForm(false)} className="bg-muted text-muted-foreground px-6 py-2.5 rounded-xl text-sm font-semibold">Cancelar</button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {loading ? (
            <div className="col-span-full py-12 text-center text-muted-foreground animate-pulse">Carregando pesquisas...</div>
          ) : surveys.length === 0 ? (
            <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/30 rounded-3xl border-2 border-dashed border-border">
              Nenhuma pesquisa registrada pós-passeio.
            </div>
          ) : surveys.map(s => (
            <div key={s.id} className={`bg-card border border-border rounded-3xl p-6 hover:shadow-xl transition-all group relative overflow-hidden flex flex-col ${s.danger_situations ? "border-destructive/30" : "hover:border-primary/30"}`}>
              <div className={`absolute top-0 left-0 w-1.5 h-full transition-colors ${s.danger_situations ? "bg-destructive" : "bg-primary"}`} />
              
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.danger_situations ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
                    {s.danger_situations ? <AlertTriangle size={20} /> : <Star size={20} />}
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
                      Pesquisa #{s.id.slice(0, 4).toUpperCase()}
                      {s.danger_situations && <Badge variant="destructive" className="text-[8px] font-black uppercase py-0 px-1">Alerta</Badge>}
                    </h4>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-0.5">
                      {new Date(s.created_at).toLocaleDateString("pt-BR")} • Guia explicou riscos: {s.guide_explained_risks ? "Sim" : "Não"}
                    </p>
                  </div>
                </div>
                <button onClick={() => handleDelete(s.id)} className="p-2 rounded-xl hover:bg-destructive/10 text-destructive opacity-0 group-hover:opacity-100 transition-all">
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-muted/30 p-2.5 rounded-xl border border-border/50 text-center">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-tighter mb-0.5">Segurança</p>
                  <p className="text-xl font-black text-primary font-display">{s.felt_safe}/5</p>
                </div>
                <div className="bg-muted/30 p-2.5 rounded-xl border border-border/50 text-center">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-tighter mb-0.5">Geral</p>
                  <p className="text-xl font-black text-secondary font-display">{s.overall_rating}/5</p>
                </div>
              </div>

              {(s.comments || s.danger_description) && (
                <div className={`flex-1 p-3 rounded-2xl text-xs leading-relaxed italic ${s.danger_situations ? "bg-destructive/5 text-destructive border border-destructive/10" : "bg-muted/20 text-muted-foreground"}`}>
                  "{s.danger_description || s.comments}"
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSGSPesquisas;
