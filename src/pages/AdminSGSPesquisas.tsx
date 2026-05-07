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
  const [bookings, setBookings] = useState<any[]>([]);
  const [form, setForm] = useState({
    booking_id: "", felt_safe: 5, guide_explained_risks: true, danger_situations: false,
    danger_description: "", overall_rating: 5, comments: "",
  });

  useEffect(() => { load(); loadBookings(); }, []);

  const loadBookings = async () => {
    const { data } = await supabase.from("bookings").select("id, booking_code, item_name, customer_name").order("created_at", { ascending: false }).limit(50);
    setBookings(data || []);
  };

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("sgs_safety_surveys").select("*, bookings(booking_code, item_name, customer_name)").order("created_at", { ascending: false });
    setSurveys(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form };
    if (!payload.booking_id) delete (payload as any).booking_id;

    const { error } = await supabase.from("sgs_safety_surveys").insert(payload);
    if (error) {
      toast({ title: "Erro ao registrar pesquisa", variant: "destructive" });
    } else {
      toast({ title: "Pesquisa de segurança registrada!" });
      setShowForm(false);
      setForm({ booking_id: "", felt_safe: 5, guide_explained_risks: true, danger_situations: false, danger_description: "", overall_rating: 5, comments: "" });
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
    <AdminLayout title="SGS — Feedback de Segurança">
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="glass-card p-6 rounded-[2.5rem] border border-border/50 flex flex-col items-center text-center group admin-card-hover transition-all">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4 shadow-inner group-hover:bg-primary group-hover:text-white transition-all">
              <Shield size={28} />
            </div>
            <p className="text-4xl font-black text-foreground font-display">{avgSafe}</p>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-2">Segurança Percebida (1-5)</p>
          </div>
          <div className="glass-card p-6 rounded-[2.5rem] border border-border/50 flex flex-col items-center text-center group admin-card-hover transition-all">
            <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary mb-4 shadow-inner group-hover:bg-secondary group-hover:text-white transition-all">
              <Star size={28} />
            </div>
            <p className="text-4xl font-black text-foreground font-display">{avgRating}</p>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-2">Satisfação Geral (1-5)</p>
          </div>
          <div className="glass-card p-6 rounded-[2.5rem] border border-border/50 flex flex-col items-center text-center group admin-card-hover transition-all">
            <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive mb-4 shadow-inner group-hover:bg-destructive group-hover:text-white transition-all">
              <AlertTriangle size={28} />
            </div>
            <p className="text-4xl font-black text-foreground font-display">{dangerPct}%</p>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-2">Alertas de Perigo</p>
          </div>
        </div>

        <div className="glass-card p-4 rounded-3xl border border-border/50 flex flex-wrap gap-4 items-center justify-between">
          <p className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-4">{surveys.length} feedbacks analisados</p>
          <button onClick={() => setShowForm(!showForm)}
            className="w-full md:w-auto flex items-center justify-center gap-3 px-8 h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-95"
          >
            <Plus size={20} strokeWidth={3} /> Registrar Pesquisa
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h3 className="font-display font-bold text-foreground">Pesquisa de Segurança Pós-Passeio</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Reserva (Opcional)</label>
                <select value={form.booking_id} onChange={e => setForm({ ...form, booking_id: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none">
                  <option value="">Nenhuma / Geral</option>
                  {bookings.map(b => (
                    <option key={b.id} value={b.id}>{b.booking_code} - {b.customer_name} ({b.item_name})</option>
                  ))}
                </select>
              </div>
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
            <div key={s.id} className={`bg-card border border-border rounded-[2.5rem] p-6 hover:shadow-2xl transition-all group relative overflow-hidden flex flex-col admin-card-hover ${s.danger_situations ? "border-destructive/30" : "hover:border-primary/30"}`}>
              <div className={`absolute top-0 left-0 w-2 h-full transition-colors ${s.danger_situations ? "bg-destructive" : "bg-primary"}`} />
              
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner transition-all ${s.danger_situations ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white"}`}>
                    {s.danger_situations ? <AlertTriangle size={28} /> : <Star size={28} />}
                  </div>
                  <div>
                    <h4 className="font-display font-black text-sm text-foreground flex items-center gap-2">
                      {s.bookings?.customer_name ? `Feedback: ${s.bookings.customer_name}` : `Anônimo #${s.id.slice(0, 4).toUpperCase()}`}
                      {s.danger_situations && <Badge variant="destructive" className="text-[8px] font-black uppercase py-0 px-2 rounded-full">Alerta de Risco</Badge>}
                    </h4>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">
                      {new Date(s.created_at).toLocaleDateString("pt-BR")} • {s.bookings?.item_name || "Passeio Geral"}
                    </p>
                  </div>
                </div>
                <button onClick={() => handleDelete(s.id)} className="p-2 rounded-xl hover:bg-destructive/10 text-destructive opacity-0 group-hover:opacity-100 transition-all">
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-muted/30 p-4 rounded-2xl border border-border/50 text-center">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Segurança</p>
                  <p className="text-2xl font-black text-primary font-display">{s.felt_safe}/5</p>
                </div>
                <div className="bg-muted/30 p-4 rounded-2xl border border-border/50 text-center">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Nota Geral</p>
                  <p className="text-2xl font-black text-secondary font-display">{s.overall_rating}/5</p>
                </div>
              </div>

              <div className="space-y-3 flex-1">
                 <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest px-1">Comentário do Cliente</p>
                 <div className={`p-4 rounded-3xl text-xs leading-relaxed italic ${s.danger_situations ? "bg-destructive/5 text-destructive border border-destructive/10" : "bg-muted/20 text-muted-foreground"}`}>
                  "{s.danger_description || s.comments || "Sem observações escritas."}"
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSGSPesquisas;
