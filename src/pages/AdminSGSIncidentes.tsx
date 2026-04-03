import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Search, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const SEVERITY: Record<string, { label: string; color: string }> = {
  baixa: { label: "Baixa", color: "bg-muted text-muted-foreground" },
  media: { label: "Média", color: "bg-secondary/10 text-secondary" },
  alta: { label: "Alta", color: "bg-destructive/10 text-destructive" },
  critica: { label: "Crítica", color: "bg-destructive text-destructive-foreground" },
};

const TYPE_LABELS: Record<string, string> = {
  incidente: "Incidente",
  quase_incidente: "Quase Incidente",
  acidente: "Acidente",
};

const AdminSGSIncidentes = () => {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    type: "incidente", location: "", guide_name: "", description: "", severity: "media",
    people_involved: "", action_taken: "",
  });

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("sgs_incidents").select("*").order("date", { ascending: false });
    setIncidents(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = `INC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, "0")}`;
    const { error } = await supabase.from("sgs_incidents").insert({ incident_code: code, ...form });
    if (error) {
      toast({ title: "Erro ao registrar incidente", variant: "destructive" });
    } else {
      toast({ title: "Incidente registrado!" });
      setShowForm(false);
      setForm({ type: "incidente", location: "", guide_name: "", description: "", severity: "media", people_involved: "", action_taken: "" });
      load();
      // Auto corrective action for alta/critica
      if (form.severity === "alta" || form.severity === "critica") {
        await supabase.from("sgs_corrective_actions").insert({
          action_code: `AC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, "0")}`,
          description: `Ação corretiva para incidente: ${form.description.slice(0, 100)}`,
          responsible: form.guide_name || "A definir",
          due_date: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
        });
        toast({ title: "⚠️ Ação corretiva gerada automaticamente" });
      }
    }
  };

  const filtered = incidents.filter((i) => !search || i.description?.toLowerCase().includes(search.toLowerCase()) || i.location?.toLowerCase().includes(search.toLowerCase()));

  return (
    <AdminLayout title="SGS - Incidentes e Quase Acidentes">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-3 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar incidentes..."
              className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2">
            <Plus size={16} /> Registrar Incidente
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h3 className="font-display font-bold text-foreground">Registrar Incidente</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Tipo *</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none">
                  {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Local *</label>
                <input required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" placeholder="Ex: Lagoa Azul" />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Gravidade *</label>
                <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none">
                  {Object.entries(SEVERITY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Guia Responsável</label>
                <input value={form.guide_name} onChange={(e) => setForm({ ...form, guide_name: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Pessoas Envolvidas</label>
                <input value={form.people_involved} onChange={(e) => setForm({ ...form, people_involved: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Ação Tomada</label>
                <input value={form.action_taken} onChange={(e) => setForm({ ...form, action_taken: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">Descrição *</label>
              <textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3}
                className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none resize-none" />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="bg-destructive hover:bg-destructive/90 text-destructive-foreground px-6 py-2.5 rounded-xl text-sm font-semibold">Registrar</button>
              <button type="button" onClick={() => setShowForm(false)} className="bg-muted text-muted-foreground px-6 py-2.5 rounded-xl text-sm font-semibold">Cancelar</button>
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
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-muted-foreground">{inc.incident_code}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${SEVERITY[inc.severity]?.color}`}>{SEVERITY[inc.severity]?.label}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground">{TYPE_LABELS[inc.type]}</span>
                  </div>
                  <p className="text-foreground font-medium">{inc.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">📍 {inc.location} {inc.guide_name && `• Guia: ${inc.guide_name}`}</p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <p>{new Date(inc.date).toLocaleDateString("pt-BR")}</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${inc.status === "resolvido" ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"}`}>
                    {inc.status}
                  </span>
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
