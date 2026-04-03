import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Search, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  pendente: { label: "Pendente", color: "bg-secondary/10 text-secondary", icon: Clock },
  em_andamento: { label: "Em Andamento", color: "bg-primary/10 text-primary", icon: Clock },
  concluida: { label: "Concluída", color: "bg-muted text-muted-foreground", icon: CheckCircle },
  atrasada: { label: "Atrasada", color: "bg-destructive/10 text-destructive", icon: AlertTriangle },
  cancelada: { label: "Cancelada", color: "bg-muted text-muted-foreground", icon: CheckCircle },
};

const AdminSGSAcoes = () => {
  const [actions, setActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ description: "", responsible: "", due_date: "" });

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("sgs_corrective_actions").select("*").order("created_at", { ascending: false });
    setActions(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = `AC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, "0")}`;
    const { error } = await supabase.from("sgs_corrective_actions").insert({ action_code: code, ...form });
    if (error) {
      toast({ title: "Erro", variant: "destructive" });
    } else {
      toast({ title: "Ação corretiva cadastrada!" });
      setShowForm(false);
      setForm({ description: "", responsible: "", due_date: "" });
      load();
    }
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("sgs_corrective_actions").update({
      status,
      ...(status === "concluida" ? { completed_date: new Date().toISOString().split("T")[0] } : {}),
    }).eq("id", id);
    load();
  };

  const filtered = actions.filter((a) => !search || a.description?.toLowerCase().includes(search.toLowerCase()));

  return (
    <AdminLayout title="SGS - Ações Corretivas">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-3 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar ações..."
              className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2">
            <Plus size={16} /> Nova Ação
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h3 className="font-display font-bold text-foreground">Nova Ação Corretiva</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-sm font-semibold text-foreground mb-1 block">Descrição *</label>
                <textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none resize-none" />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Responsável *</label>
                <input required value={form.responsible} onChange={(e) => setForm({ ...form, responsible: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Prazo</label>
                <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-semibold">Salvar</button>
              <button type="button" onClick={() => setShowForm(false)} className="bg-muted text-muted-foreground px-6 py-2.5 rounded-xl text-sm font-semibold">Cancelar</button>
            </div>
          </form>
        )}

        {/* Cards */}
        <div className="space-y-3">
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Carregando...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhuma ação corretiva</p>
          ) : filtered.map((a) => {
            const st = STATUS_CONFIG[a.status] || STATUS_CONFIG.pendente;
            const isOverdue = a.due_date && new Date(a.due_date) < new Date() && a.status !== "concluida" && a.status !== "cancelada";
            return (
              <div key={a.id} className={`bg-card border rounded-2xl p-5 ${isOverdue ? "border-destructive" : "border-border"}`}>
                <div className="flex flex-col sm:flex-row justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-muted-foreground">{a.action_code}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${st.color}`}>{st.label}</span>
                      {isOverdue && <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-destructive text-destructive-foreground">ATRASADA</span>}
                    </div>
                    <p className="text-foreground font-medium">{a.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      👤 {a.responsible} {a.due_date && `• Prazo: ${new Date(a.due_date + "T12:00").toLocaleDateString("pt-BR")}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {a.status === "pendente" && (
                      <button onClick={() => updateStatus(a.id, "em_andamento")} className="text-primary text-xs font-semibold hover:underline">Iniciar</button>
                    )}
                    {(a.status === "pendente" || a.status === "em_andamento") && (
                      <button onClick={() => updateStatus(a.id, "concluida")} className="text-primary text-xs font-semibold hover:underline">Concluir</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSGSAcoes;
