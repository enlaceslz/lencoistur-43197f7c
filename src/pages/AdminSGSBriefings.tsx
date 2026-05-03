import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Plus, CheckCircle, XCircle, MapPin, Pencil, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const CHECKLIST_ITEMS = [
  { key: "safety_rules", label: "Regras de segurança explicadas", label_en: "Safety rules explained" },
  { key: "tour_risks", label: "Riscos do passeio informados", label_en: "Tour risks informed" },
  { key: "lagoon_behavior", label: "Comportamento nas lagoas orientado", label_en: "Lagoon behavior guided" },
  { key: "group_distance", label: "Limite de distância do grupo definido", label_en: "Group distance limit defined" },
  { key: "emergency_orientation", label: "Orientação de emergência realizada", label_en: "Emergency orientation performed" },
];

const LANGUAGES = { pt: "Português", en: "English", es: "Español" };

interface TourOpt { id: string; name: string; }

const AdminSGSBriefings = () => {
  const [briefings, setBriefings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [tours, setTours] = useState<TourOpt[]>([]);
  const [form, setForm] = useState({
    guide_name: "", language: "pt", tour_id: "" as string,
    safety_rules: false, tour_risks: false, lagoon_behavior: false,
    group_distance: false, emergency_orientation: false, notes: "",
  });

  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (!showForm) return;
    supabase.from("tours").select("id, name").eq("active", true).order("name").then(({ data }) => {
      if (data) setTours(data);
    });
  }, [showForm]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("sgs_briefings").select("*, tours(name)").order("created_at", { ascending: false });
    setBriefings(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const allChecked = CHECKLIST_ITEMS.every(item => form[item.key as keyof typeof form]);
    const submitData: any = { ...form, completed: allChecked };
    if (!submitData.tour_id) delete submitData.tour_id;
    
    let res;
    if (editId) res = await supabase.from("sgs_briefings").update(submitData).eq("id", editId);
    else res = await supabase.from("sgs_briefings").insert(submitData);

    if (res.error) {
      toast({ title: "Erro ao registrar resumo", variant: "destructive" });
    } else {
      toast({ title: editId ? "Resumo atualizado!" : (allChecked ? "Resumo completo registrado!" : "⚠️ Resumo registrado com itens pendentes") });
      setShowForm(false);
      setEditId(null);
      setForm({ guide_name: "", language: "pt", tour_id: "", safety_rules: false, tour_risks: false, lagoon_behavior: false, group_distance: false, emergency_orientation: false, notes: "" });
      load();
    }
  };

  const openEdit = (b: any) => {
    setForm({
      guide_name: b.guide_name,
      language: b.language || "pt",
      tour_id: b.tour_id || "",
      safety_rules: !!b.safety_rules,
      tour_risks: !!b.tour_risks,
      lagoon_behavior: !!b.lagoon_behavior,
      group_distance: !!b.group_distance,
      emergency_orientation: !!b.emergency_orientation,
      notes: b.notes || ""
    });
    setEditId(b.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este resumo de segurança?")) return;
    const { error } = await supabase.from("sgs_briefings").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Resumo excluído!" });
      load();
    }
  };

  const completedCount = (b: any) => CHECKLIST_ITEMS.filter(i => b[i.key]).length;

  return (
    <AdminLayout title={form.language === "en" ? "SGS - Safety Briefings" : "SGS - Resumos de Segurança"}>
      <div className="space-y-6">
        <div className="flex justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            {form.language === "en" 
              ? "Mandatory guide checklist before each tour (ISO 21103)" 
              : "Checklist obrigatório do guia antes de cada passeio (ISO 21103)"}
          </p>
          <button onClick={() => setShowForm(!showForm)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2">
            <Plus size={16} /> {form.language === "en" ? "New Briefing" : "Novo Resumo"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h3 className="font-display font-bold text-foreground">
              {form.language === "en" ? "Register Safety Briefing" : "Registrar Resumo de Segurança"}
            </h3>
            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">
                {form.language === "en" ? "Related Tour" : "Passeio Relacionado"}
              </label>
              <select value={form.tour_id} onChange={e => setForm({ ...form, tour_id: e.target.value })}
                className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none">
                <option value="">{form.language === "en" ? "None (general)" : "Nenhum (geral)"}</option>
                {tours.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">
                  {form.language === "en" ? "Responsible Guide *" : "Guia Responsável *"}
                </label>
                <input required value={form.guide_name} onChange={e => setForm({ ...form, guide_name: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">
                  {form.language === "en" ? "Briefing Language *" : "Idioma do Resumo *"}
                </label>
                <select value={form.language} onChange={e => setForm({ ...form, language: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none">
                  {Object.entries(LANGUAGES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">
                {form.language === "en" ? "Safety Checklist" : "Checklist de Segurança"}
              </label>
              <div className="space-y-2">
                {CHECKLIST_ITEMS.map(item => (
                  <label key={item.key} className="flex items-center gap-3 bg-muted rounded-xl px-4 py-3 cursor-pointer hover:bg-muted/80">
                    <input type="checkbox" checked={form[item.key as keyof typeof form] as boolean}
                      onChange={e => setForm({ ...form, [item.key]: e.target.checked })} className="rounded w-5 h-5" />
                    <span className="text-sm text-foreground font-medium">
                      {form.language === "en" ? item.label_en : item.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">
                {form.language === "en" ? "Notes" : "Observações"}
              </label>
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none h-20" 
                placeholder={form.language === "en" ? "Additional notes..." : "Observações adicionais..."} />
            </div>

            <div className="flex gap-3">
              <button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-semibold">
                {form.language === "en" ? "Save Briefing" : "Salvar Resumo"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="bg-muted text-muted-foreground px-6 py-2.5 rounded-xl text-sm font-semibold">
                {form.language === "en" ? "Cancel" : "Cancelar"}
              </button>
            </div>
          </form>
        )}

        <div className="space-y-3">
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Carregando...</p>
          ) : briefings.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum resumo registrado</p>
          ) : briefings.map(b => (
            <div key={b.id} className={`bg-card border rounded-2xl p-4 sm:p-5 ${b.completed ? "border-border" : "border-secondary"}`}>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${b.completed ? "bg-primary/10" : "bg-secondary/10 shadow-sm shadow-secondary/20"}`}>
                    {b.completed ? <CheckCircle size={20} className="text-primary" /> : <XCircle size={20} className="text-secondary" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
                      {b.guide_name}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest ${b.completed ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"}`}>
                        {b.completed ? (form.language === "en" ? "COMPLETE" : "CONCLUÍDO") : (form.language === "en" ? "PENDING" : "PENDENTE")}
                      </span>
                    </h4>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                      {b.tours?.name && <span className="flex items-center gap-1 font-medium text-foreground/80"><MapPin size={10} className="text-primary" />{b.tours.name}</span>}
                      <span>•</span>
                      <span className="uppercase">{LANGUAGES[b.language as keyof typeof LANGUAGES] || b.language}</span>
                      <span>•</span>
                      <span>{new Date(b.created_at).toLocaleDateString("pt-BR")}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Checklist</p>
                    <span className={`text-xs font-bold ${b.completed ? "text-primary" : "text-secondary"}`}>
                      {completedCount(b)}/{CHECKLIST_ITEMS.length}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(b)} className="p-2 rounded-xl hover:bg-muted text-muted-foreground transition-colors" title="Editar">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => handleDelete(b.id)} className="p-2 rounded-xl hover:bg-destructive/10 text-destructive transition-colors" title="Excluir">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {CHECKLIST_ITEMS.map(item => (
                  <span key={item.key} className={`text-xs px-2 py-0.5 rounded-lg ${b[item.key] ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                    {b[item.key] ? "✓" : "✗"} {item.label}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSGSBriefings;
