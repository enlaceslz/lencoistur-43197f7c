import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Map, Plus, Search, Pencil, Trash2, Clock, Footprints, Loader2 } from "lucide-react";

const DIFICULDADE: Record<string, { label: string; color: string }> = {
  facil: { label: "Fácil", color: "bg-primary/10 text-primary" },
  moderado: { label: "Moderado", color: "bg-secondary/10 text-secondary" },
  dificil: { label: "Difícil", color: "bg-destructive/10 text-destructive" },
};

const emptyForm = { nome: "", tipo: "trilha", descricao: "", distancia_km: "", duracao_estimada: "", dificuldade: "moderado", capacidade_maxima: "", status: "ativa", observacoes: "" };

const AdminSGSRotas = () => {
  const [rotas, setRotas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("sgs_rotas").select("*").order("nome");
    setRotas(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) { toast({ title: "Nome obrigatório", variant: "destructive" }); return; }
    const payload = { ...form, distancia_km: form.distancia_km ? Number(form.distancia_km) : null, capacidade_maxima: form.capacidade_maxima ? Number(form.capacidade_maxima) : null };
    let res;
    if (editId) res = await supabase.from("sgs_rotas").update(payload).eq("id", editId);
    else res = await supabase.from("sgs_rotas").insert(payload);
    if (res.error) toast({ title: "Erro", description: res.error.message, variant: "destructive" });
    else { toast({ title: editId ? "Rota atualizada!" : "Rota cadastrada!" }); setForm(emptyForm); setShowForm(false); setEditId(null); load(); }
  };

  const openEdit = (r: any) => {
    setForm({ nome: r.nome, tipo: r.tipo, descricao: r.descricao || "", distancia_km: r.distancia_km?.toString() || "", duracao_estimada: r.duracao_estimada || "", dificuldade: r.dificuldade || "moderado", capacidade_maxima: r.capacidade_maxima?.toString() || "", status: r.status, observacoes: r.observacoes || "" });
    setEditId(r.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta rota?")) return;
    const { error } = await supabase.from("sgs_rotas").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Rota excluída!" });
      load();
    }
  };

  const filtered = rotas.filter(r => r.nome.toLowerCase().includes(search.toLowerCase()) || r.tipo.toLowerCase().includes(search.toLowerCase()));
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  return (
    <AdminLayout title="SGS — Rotas e Trilhas">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar rota..." className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <button 
            onClick={() => { setForm(emptyForm); setEditId(null); setShowForm(!showForm); }} 
            className="flex items-center gap-3 px-8 h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-95"
          >
            <Plus size={20} strokeWidth={3} /> Nova Rota
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h3 className="font-display font-bold text-foreground">{editId ? "Editar Rota" : "Nova Rota"}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div><label className="block text-xs font-medium text-muted-foreground mb-1">Nome *</label><input value={form.nome} onChange={e => set("nome", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30" /></div>
              <div><label className="block text-xs font-medium text-muted-foreground mb-1">Tipo</label>
                <select value={form.tipo} onChange={e => set("tipo", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm">
                  <option value="trilha">Trilha</option><option value="rota_4x4">Rota 4x4</option><option value="aquatica">Aquática</option><option value="mista">Mista</option>
                </select>
              </div>
              <div><label className="block text-xs font-medium text-muted-foreground mb-1">Distância (km)</label><input type="number" step="0.1" value={form.distancia_km} onChange={e => set("distancia_km", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30" /></div>
              <div><label className="block text-xs font-medium text-muted-foreground mb-1">Duração Estimada</label><input value={form.duracao_estimada} onChange={e => set("duracao_estimada", e.target.value)} placeholder="Ex: 3h30" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30" /></div>
              <div><label className="block text-xs font-medium text-muted-foreground mb-1">Dificuldade</label>
                <select value={form.dificuldade} onChange={e => set("dificuldade", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm">
                  <option value="facil">Fácil</option><option value="moderado">Moderado</option><option value="dificil">Difícil</option>
                </select>
              </div>
              <div><label className="block text-xs font-medium text-muted-foreground mb-1">Capacidade Máxima</label><input type="number" value={form.capacidade_maxima} onChange={e => set("capacidade_maxima", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30" /></div>
              <div><label className="block text-xs font-medium text-muted-foreground mb-1">Status</label>
                <select value={form.status} onChange={e => set("status", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm">
                  <option value="ativa">Ativa</option><option value="inativa">Inativa</option><option value="manutencao">Em Manutenção</option>
                </select>
              </div>
            </div>
            <div><label className="block text-xs font-medium text-muted-foreground mb-1">Descrição</label><textarea value={form.descricao} onChange={e => set("descricao", e.target.value)} rows={2} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30" /></div>
            <div className="flex gap-2">
              <button type="submit" className="px-5 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90">Salvar</button>
              <button type="button" onClick={() => { setShowForm(false); setEditId(null); }} className="px-5 py-2 border border-border rounded-xl text-sm">Cancelar</button>
            </div>
          </form>
        )}

        {loading ? <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div> : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground"><Map size={40} className="mx-auto mb-3 opacity-40" /><p>Nenhuma rota cadastrada</p></div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(r => {
              const dif = DIFICULDADE[r.dificuldade] || DIFICULDADE.moderado;
              return (
                <div key={r.id} className="bg-card border border-border rounded-3xl p-6 hover:shadow-xl hover:border-primary/30 transition-all group relative overflow-hidden flex flex-col">
                  <div className={`absolute top-0 left-0 w-1.5 h-full transition-colors ${r.status === 'ativa' ? 'bg-primary' : 'bg-muted'}`} />
                  
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                        <Map size={24} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-black text-foreground group-hover:text-primary transition-colors leading-tight truncate">{r.nome}</h4>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-0.5">{r.tipo.replace("_", " ")}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <Badge variant="outline" className={`font-black text-[9px] uppercase px-2.5 py-0.5 rounded-lg border ${dif.color}`}>
                        {dif.label}
                      </Badge>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="bg-muted/30 p-2.5 rounded-xl border border-border/50">
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-tighter mb-0.5">Distância</p>
                      <p className="text-sm font-black text-foreground">{r.distancia_km ? `${r.distancia_km} km` : 'N/A'}</p>
                    </div>
                    <div className="bg-muted/30 p-2.5 rounded-xl border border-border/50">
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-tighter mb-0.5">Duração</p>
                      <p className="text-sm font-black text-foreground">{r.duracao_estimada || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex-1">
                    {r.descricao && (
                      <p className="text-xs text-muted-foreground font-medium italic leading-relaxed line-clamp-2">
                        "{r.descricao}"
                      </p>
                    )}
                  </div>
                  
                  <div className="mt-5 pt-4 border-t border-border/50 flex justify-between items-center">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${r.status === "ativa" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-muted text-muted-foreground"}`}>
                      {r.status}
                    </span>
                    {r.capacidade_maxima && (
                      <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                        Pax Máx: {r.capacidade_maxima}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminSGSRotas;
