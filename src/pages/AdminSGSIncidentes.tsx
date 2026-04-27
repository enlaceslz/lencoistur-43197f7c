import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Search, AlertCircle, Pencil, Trash2, MapPin } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const SEVERITY: Record<string, { label: string; color: string }> = {
  baixa: { label: "Baixa", color: "bg-muted text-muted-foreground" },
  media: { label: "Média", color: "bg-secondary/10 text-secondary" },
  alta: { label: "Alta", color: "bg-destructive/10 text-destructive" },
  critica: { label: "Crítica", color: "bg-destructive text-destructive-foreground" },
};

const TYPE_LABELS: Record<string, string> = {
  sem_ocorrencia: "Sem Ocorrência",
  incidente: "Incidente",
  quase_incidente: "Quase Incidente",
  acidente: "Acidente",
  outras_anomalias: "Outras Anomalias",
};

const STATUS_COLORS: Record<string, string> = {
  aberto: "bg-secondary/10 text-secondary",
  investigando: "bg-primary/10 text-primary",
  resolvido: "bg-muted text-muted-foreground",
  fechado: "bg-muted text-muted-foreground",
};

const emptyForm = {
  type: "incidente", location: "", guide_name: "", description: "", severity: "media",
  people_involved: "", action_taken: "", tour_id: "" as string,
  date: new Date().toISOString().slice(0, 16),
};

interface TourOpt { id: string; name: string; }

const AdminSGSIncidentes = () => {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [tours, setTours] = useState<TourOpt[]>([]);

  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (!showForm) return;
    supabase.from("tours").select("id, name").eq("active", true).order("name").then(({ data }) => {
      if (data) setTours(data);
    });
  }, [showForm]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("sgs_incidents").select("*, tours(name)").order("date", { ascending: false });
    setIncidents(data || []);
    setLoading(false);
  };

  const openEdit = (inc: any) => {
    setEditing(inc);
    setForm({
      type: inc.type, location: inc.location, guide_name: inc.guide_name || "",
      description: inc.description, severity: inc.severity,
      people_involved: inc.people_involved || "", action_taken: inc.action_taken || "",
      tour_id: inc.tour_id || "",
      date: new Date(inc.date).toISOString().slice(0, 16),
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este incidente?")) return;
    await supabase.from("sgs_incidents").delete().eq("id", id);
    toast({ title: "Incidente excluído." });
    load();
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("sgs_incidents").update({ status }).eq("id", id);
    toast({ title: `Status atualizado para: ${status}` });
    load();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const submitData: any = { ...form };
    if (!submitData.tour_id) delete submitData.tour_id;

    if (editing) {
      const { error } = await supabase.from("sgs_incidents").update(submitData).eq("id", editing.id);
      if (error) { toast({ title: "Erro ao atualizar", variant: "destructive" }); return; }
      toast({ title: "Incidente atualizado!" });
    } else {
      const code = `INC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, "0")}`;
      const { error } = await supabase.from("sgs_incidents").insert({ incident_code: code, ...submitData });
      if (error) { toast({ title: "Erro ao registrar incidente", variant: "destructive" }); return; }
      toast({ title: "Incidente registrado!" });

      // Auto corrective action for alta/critica (P3 link)
      if (form.severity === "alta" || form.severity === "critica") {
        await supabase.from("sgs_corrective_actions").insert({
          action_code: `AC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, "0")}`,
          description: `Ação corretiva para ${form.severity === "critica" ? "ACIDENTE CRÍTICO" : "incidente grave"}: ${form.description.slice(0, 100)}`,
          responsible: form.guide_name || "A definir",
          due_date: new Date(Date.now() + (form.severity === "critica" ? 3 : 7) * 86400000).toISOString().split("T")[0],
        });
        toast({ title: "⚠️ Ação corretiva gerada automaticamente (P3)" });
      }
    }

    setShowForm(false);
    setEditing(null);
    setForm(emptyForm);
    load();
  };

  const filtered = incidents.filter((i) => {
    const matchSearch = !search || i.description?.toLowerCase().includes(search.toLowerCase()) || i.location?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "todos" || i.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const summary = {
    total: incidents.length,
    abertos: incidents.filter(i => i.status === "aberto").length,
    graves: incidents.filter(i => i.severity === "alta" || i.severity === "critica").length,
  };

  return (
    <AdminLayout title="SGS - Registro de Incidentes (P5)">
      <div className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-xs text-muted-foreground">Total Registrados</p>
            <p className="text-2xl font-bold text-foreground">{summary.total}</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-xs text-secondary">Abertos</p>
            <p className="text-2xl font-bold text-secondary">{summary.abertos}</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-xs text-destructive">Alta/Crítica</p>
            <p className="text-2xl font-bold text-destructive">{summary.graves}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex gap-2 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3 top-3 text-muted-foreground" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar incidentes..."
                className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none">
              <option value="todos">Todos status</option>
              <option value="aberto">Aberto</option>
              <option value="investigando">Investigando</option>
              <option value="resolvido">Resolvido</option>
              <option value="fechado">Fechado</option>
            </select>
          </div>
          <button onClick={() => { setEditing(null); setForm(emptyForm); setShowForm(!showForm); }}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2">
            <Plus size={16} /> Registrar Incidente
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h3 className="font-display font-bold text-foreground">{editing ? "Editar" : "Registrar"} Incidente (P5 VATTI)</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Tipo de Ocorrência *</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none">
                  {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Data e Hora *</label>
                <input required type="datetime-local" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Passeio Relacionado</label>
                <select value={form.tour_id} onChange={(e) => setForm({ ...form, tour_id: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none">
                  <option value="">Nenhum</option>
                  {tours.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Local do Incidente *</label>
                <input required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" placeholder="Ex: Lagoa Azul, Dunas" />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Gravidade *</label>
                <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none">
                  {Object.entries(SEVERITY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Condutor Responsável</label>
                <input value={form.guide_name} onChange={(e) => setForm({ ...form, guide_name: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Pessoas Envolvidas (Vítimas)</label>
                <input value={form.people_involved} onChange={(e) => setForm({ ...form, people_involved: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" placeholder="Nomes e idades" />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Ação Tomada / Resposta</label>
                <input value={form.action_taken} onChange={(e) => setForm({ ...form, action_taken: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" placeholder="Primeiros socorros, resgate..." />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">Descrição (fatos, circunstâncias e consequências) *</label>
              <textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3}
                className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none resize-none" />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="bg-destructive hover:bg-destructive/90 text-destructive-foreground px-6 py-2.5 rounded-xl text-sm font-semibold">{editing ? "Atualizar" : "Registrar"}</button>
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="bg-muted text-muted-foreground px-6 py-2.5 rounded-xl text-sm font-semibold">Cancelar</button>
            </div>
          </form>
        )}

        {/* List */}
        <div className="space-y-3">
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Carregando...</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <AlertCircle size={48} className="mx-auto text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground">Nenhum incidente registrado</p>
            </div>
          ) : filtered.map((inc) => (
            <div key={inc.id} className="bg-card border border-border rounded-2xl p-5 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono text-xs text-muted-foreground">{inc.incident_code}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${SEVERITY[inc.severity]?.color}`}>{SEVERITY[inc.severity]?.label}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground">{TYPE_LABELS[inc.type] || inc.type}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[inc.status] || ""}`}>{inc.status}</span>
                  </div>
                  <p className="text-foreground font-medium">{inc.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {inc.tours?.name && <><MapPin size={10} className="inline mr-1" />{inc.tours.name} • </>}
                    📍 {inc.location} {inc.guide_name && `• Condutor: ${inc.guide_name}`}
                  </p>
                  {inc.people_involved && <p className="text-xs text-muted-foreground">👥 Envolvidos: {inc.people_involved}</p>}
                  {inc.action_taken && <p className="text-xs text-primary mt-1">✅ Ação: {inc.action_taken}</p>}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <p className="text-xs text-muted-foreground">{new Date(inc.date).toLocaleDateString("pt-BR")}</p>
                  <div className="flex gap-1">
                    {inc.status === "aberto" && (
                      <button onClick={() => updateStatus(inc.id, "investigando")} className="text-primary text-xs font-semibold hover:underline">Investigar</button>
                    )}
                    {(inc.status === "aberto" || inc.status === "investigando") && (
                      <button onClick={() => updateStatus(inc.id, "resolvido")} className="text-primary text-xs font-semibold hover:underline">Resolver</button>
                    )}
                    <button onClick={() => openEdit(inc)} className="p-1 rounded hover:bg-muted text-muted-foreground"><Pencil size={14} /></button>
                    <button onClick={() => handleDelete(inc.id)} className="p-1 rounded hover:bg-destructive/10 text-destructive"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSGSIncidentes;
