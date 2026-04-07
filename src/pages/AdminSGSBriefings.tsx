import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Plus, CheckCircle, XCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const CHECKLIST_ITEMS = [
  { key: "safety_rules", label: "Regras de segurança explicadas" },
  { key: "tour_risks", label: "Riscos do passeio informados" },
  { key: "lagoon_behavior", label: "Comportamento nas lagoas orientado" },
  { key: "group_distance", label: "Limite de distância do grupo definido" },
  { key: "emergency_orientation", label: "Orientação de emergência realizada" },
];

const LANGUAGES = { pt: "Português", en: "English", es: "Español" };

const AdminSGSBriefings = () => {
  const [briefings, setBriefings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    guide_name: "", language: "pt",
    safety_rules: false, tour_risks: false, lagoon_behavior: false,
    group_distance: false, emergency_orientation: false, notes: "",
  });

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("sgs_briefings").select("*").order("created_at", { ascending: false });
    setBriefings(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const allChecked = CHECKLIST_ITEMS.every(item => form[item.key as keyof typeof form]);
    const { error } = await supabase.from("sgs_briefings").insert({
      ...form, completed: allChecked,
    });
    if (error) {
      toast({ title: "Erro ao registrar resumo", variant: "destructive" });
    } else {
      toast({ title: allChecked ? "Resumo completo registrado!" : "⚠️ Resumo registrado com itens pendentes" });
      setShowForm(false);
      setForm({ guide_name: "", language: "pt", safety_rules: false, tour_risks: false, lagoon_behavior: false, group_distance: false, emergency_orientation: false, notes: "" });
      load();
    }
  };

  const completedCount = (b: any) => CHECKLIST_ITEMS.filter(i => b[i.key]).length;

  return (
    <AdminLayout title="SGS - Resumos de Segurança">
      <div className="space-y-6">
        <div className="flex justify-between gap-4">
          <p className="text-sm text-muted-foreground">Checklist obrigatório do guia antes de cada passeio (ISO 21103)</p>
          <button onClick={() => setShowForm(!showForm)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2">
            <Plus size={16} /> Novo Resumo
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h3 className="font-display font-bold text-foreground">Registrar Resumo de Segurança</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Guia Responsável *</label>
                <input required value={form.guide_name} onChange={e => setForm({ ...form, guide_name: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Idioma do Resumo *</label>
                <select value={form.language} onChange={e => setForm({ ...form, language: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none">
                  {Object.entries(LANGUAGES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">Checklist de Segurança</label>
              <div className="space-y-2">
                {CHECKLIST_ITEMS.map(item => (
                  <label key={item.key} className="flex items-center gap-3 bg-muted rounded-xl px-4 py-3 cursor-pointer hover:bg-muted/80">
                    <input type="checkbox" checked={form[item.key as keyof typeof form] as boolean}
                      onChange={e => setForm({ ...form, [item.key]: e.target.checked })} className="rounded w-5 h-5" />
                    <span className="text-sm text-foreground font-medium">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">Observações</label>
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none h-20" placeholder="Observações adicionais..." />
            </div>

            <div className="flex gap-3">
              <button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-semibold">Salvar Resumo</button>
              <button type="button" onClick={() => setShowForm(false)} className="bg-muted text-muted-foreground px-6 py-2.5 rounded-xl text-sm font-semibold">Cancelar</button>
            </div>
          </form>
        )}

        <div className="space-y-3">
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Carregando...</p>
          ) : briefings.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum resumo registrado</p>
          ) : briefings.map(b => (
            <div key={b.id} className={`bg-card border rounded-2xl p-5 ${b.completed ? "border-border" : "border-secondary"}`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${b.completed ? "bg-primary/10" : "bg-secondary/10"}`}>
                    {b.completed ? <CheckCircle size={20} className="text-primary" /> : <XCircle size={20} className="text-secondary" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground">{b.guide_name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {LANGUAGES[b.language as keyof typeof LANGUAGES] || b.language} • {new Date(b.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${b.completed ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"}`}>
                    {completedCount(b)}/{CHECKLIST_ITEMS.length}
                  </span>
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
