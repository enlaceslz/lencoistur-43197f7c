import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Star, AlertTriangle, Trash2 } from "lucide-react";
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

  const avgSafe = surveys.length ? (surveys.reduce((s, v) => s + (v.felt_safe || 0), 0) / surveys.length).toFixed(1) : "—";
  const avgRating = surveys.length ? (surveys.reduce((s, v) => s + (v.overall_rating || 0), 0) / surveys.length).toFixed(1) : "—";
  const dangerPct = surveys.length ? ((surveys.filter(v => v.danger_situations).length / surveys.length) * 100).toFixed(0) : "0";

  return (
    <AdminLayout title="SGS - Pesquisas de Segurança">
      <div className="space-y-6">
        {/* KPIs */}
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-2xl p-5 text-center">
            <p className="text-3xl font-bold text-primary">{avgSafe}</p>
            <p className="text-sm text-muted-foreground">Sensação de Segurança (1-5)</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-5 text-center">
            <p className="text-3xl font-bold text-secondary">{avgRating}</p>
            <p className="text-sm text-muted-foreground">Avaliação Geral (1-5)</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-5 text-center">
            <p className="text-3xl font-bold text-destructive">{dangerPct}%</p>
            <p className="text-sm text-muted-foreground">Relataram Perigo</p>
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

        <div className="space-y-3">
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Carregando...</p>
          ) : surveys.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhuma pesquisa registrada</p>
          ) : surveys.map(s => (
            <div key={s.id} className={`bg-card border rounded-2xl p-5 ${s.danger_situations ? "border-destructive" : "border-border"}`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  {s.danger_situations ? (
                    <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                      <AlertTriangle size={20} className="text-destructive" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Star size={20} className="text-primary" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">Segurança: {s.felt_safe}/5</span>
                      <span className="text-sm text-muted-foreground">•</span>
                      <span className="text-sm font-bold text-foreground">Geral: {s.overall_rating}/5</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(s.created_at).toLocaleDateString("pt-BR")} •
                      Guia explicou riscos: {s.guide_explained_risks ? "Sim" : "Não"}
                    </p>
                  </div>
                </div>
              </div>
              {(s.comments || s.danger_description) && (
                <p className="mt-2 text-sm text-muted-foreground">{s.danger_description || s.comments}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSGSPesquisas;
