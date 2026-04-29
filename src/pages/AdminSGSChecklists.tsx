import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ClipboardCheck, Plus, CheckCircle, Circle, Trash2, Calendar, User } from "lucide-react";

const CHECKLIST_TEMPLATES: Record<string, string[]> = {
  veiculo_diario: ["Nível de óleo", "Nível de água/radiador", "Pressão dos pneus", "Estado dos pneus (desgaste)", "Freios (teste)", "Luzes (farol/lanterna/seta)", "Limpador/lavador de para-brisa", "Cinto de segurança (todos)", "Extintor de incêndio (validade)", "Triângulo de sinalização", "Macaco e chave de roda", "Estepe calibrado", "Kit primeiros socorros", "Documentação do veículo", "Combustível suficiente"],
  embarcacao: ["Coletes salva-vidas (quantidade)", "Estado dos coletes", "Motor de popa (funcionamento)", "Combustível suficiente", "Remo reserva", "Cabo de reboque", "Kit primeiros socorros", "Documentação embarcação", "Luzes de navegação", "Bomba de porão"],
  epi_equipe: ["Capacete", "Colete refletivo", "Calçado adequado", "Protetor solar", "Repelente", "Óculos de proteção", "Luvas (se necessário)", "Rádio comunicador"],
};

const AdminSGSChecklists = () => {
  const [checklists, setChecklists] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ titulo: "", tipo: "veiculo_diario", responsavel: "", observacoes: "" });
  const [templateItems, setTemplateItems] = useState<{ item_nome: string; categoria: string; conforme: boolean }[]>([]);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const [cl, ci] = await Promise.all([
      supabase.from("sgs_checklists").select("*").order("created_at", { ascending: false }),
      supabase.from("sgs_checklist_items").select("*"),
    ]);
    setChecklists(cl.data || []);
    setItems(ci.data || []);
    setLoading(false);
  };

  const selectTemplate = (tipo: string) => {
    setForm(p => ({ ...p, tipo }));
    const tpl = CHECKLIST_TEMPLATES[tipo] || CHECKLIST_TEMPLATES.veiculo_diario;
    setTemplateItems(tpl.map(name => ({ item_nome: name, categoria: tipo, conforme: false })));
  };

  const toggleItem = (idx: number) => {
    setTemplateItems(prev => prev.map((it, i) => i === idx ? { ...it, conforme: !it.conforme } : it));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titulo.trim()) { toast({ title: "Título obrigatório", variant: "destructive" }); return; }
    const allOk = templateItems.every(i => i.conforme);
    const { data: cl, error } = await supabase.from("sgs_checklists").insert({ ...form, status: allOk ? "concluido" : "em_andamento" }).select().single();
    if (error || !cl) { toast({ title: "Erro", description: error?.message, variant: "destructive" }); return; }
    if (templateItems.length > 0) {
      await supabase.from("sgs_checklist_items").insert(templateItems.map(i => ({ ...i, checklist_id: cl.id })));
    }
    toast({ title: "Checklist criado!" });
    setForm({ titulo: "", tipo: "veiculo_diario", responsavel: "", observacoes: "" });
    setTemplateItems([]);
    setShowForm(false);
    load();
  };

  const getItems = (id: string) => items.filter(i => i.checklist_id === id);
  const getProgress = (id: string) => {
    const ci = getItems(id);
    if (!ci.length) return 0;
    return Math.round((ci.filter(i => i.conforme).length / ci.length) * 100);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este checklist? Esta ação não pode ser desfeita.")) return;
    
    // Delete items first
    await supabase.from("sgs_checklist_items").delete().eq("checklist_id", id);
    
    const { error } = await supabase.from("sgs_checklists").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Checklist excluído com sucesso!" });
      load();
    }
  };

  const toggleChecklistItem = async (itemId: string, current: boolean) => {
    await supabase.from("sgs_checklist_items").update({ conforme: !current }).eq("id", itemId);
    load();
  };

  return (
    <AdminLayout title="SGS — Checklists Operacionais">
      <div className="space-y-6">
        <div className="flex justify-end">
          <button onClick={() => { setShowForm(!showForm); if (!showForm) selectTemplate("veiculo_diario"); }} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90">
            <Plus size={16} /> Novo Checklist
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h3 className="font-display font-bold text-foreground">Novo Checklist</h3>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Título *</label>
                <input value={form.titulo} onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Tipo</label>
                <select value={form.tipo} onChange={e => selectTemplate(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm">
                  <option value="veiculo_diario">Veículo Diário</option>
                  <option value="embarcacao">Embarcação</option>
                  <option value="epi_equipe">EPI da Equipe</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Responsável</label>
                <input value={form.responsavel} onChange={e => setForm(p => ({ ...p, responsavel: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>

            {templateItems.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Itens ({templateItems.filter(i => i.conforme).length}/{templateItems.length})</p>
                <div className="grid sm:grid-cols-2 gap-2">
                  {templateItems.map((item, idx) => (
                    <button key={idx} type="button" onClick={() => toggleItem(idx)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${item.conforme ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                      {item.conforme ? <CheckCircle size={16} /> : <Circle size={16} />}
                      {item.item_nome}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button type="submit" className="px-5 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90">Criar Checklist</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2 border border-border rounded-xl text-sm">Cancelar</button>
            </div>
          </form>
        )}

        {loading ? <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div> : checklists.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground"><ClipboardCheck size={40} className="mx-auto mb-3 opacity-40" /><p>Nenhum checklist realizado</p></div>
        ) : (
          <div className="space-y-4">
            {checklists.map(cl => {
              const progress = getProgress(cl.id);
              const clItems = getItems(cl.id);
              return (
                <div key={cl.id} className="bg-card border border-border rounded-2xl p-5 hover:shadow-md transition-all group border-l-4 border-l-primary/10 hover:border-l-primary transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${cl.status === "concluido" ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary shadow-sm shadow-secondary/10"}`}>
                        <ClipboardCheck size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground text-base mb-1">{cl.titulo}</h4>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                          <span className="text-[11px] flex items-center gap-1.5 text-muted-foreground font-medium">
                            <Calendar size={12} className="text-primary" /> {new Date(cl.created_at).toLocaleDateString("pt-BR")}
                          </span>
                          {cl.responsavel && (
                            <span className="text-[11px] flex items-center gap-1.5 text-muted-foreground font-medium">
                              <User size={12} className="text-primary" /> {cl.responsavel}
                            </span>
                          )}
                          <span className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-bold uppercase tracking-wider">
                            {cl.tipo.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-widest ${cl.status === "concluido" ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"}`}>
                        {cl.status === "concluido" ? "Concluído" : "Em andamento"}
                      </span>
                      <button onClick={() => handleDelete(cl.id)} className="p-2 rounded-xl hover:bg-destructive/10 text-destructive transition-colors" title="Excluir">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-wider">
                      <span className="text-muted-foreground">Progresso da Inspeção</span>
                      <span className={progress === 100 ? "text-primary" : "text-secondary"}>{progress}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${progress === 100 ? "bg-primary" : "bg-secondary"}`} style={{ width: `${progress}%` }} />
                    </div>
                    <p className="text-[11px] text-muted-foreground font-medium italic">
                      {clItems.filter(i => i.conforme).length} de {clItems.length} itens em conformidade
                    </p>
                  </div>
                  {clItems.length > 0 && (
                    <div className="grid sm:grid-cols-2 gap-1">
                      {clItems.map(item => (
                        <button key={item.id} onClick={() => toggleChecklistItem(item.id, item.conforme)}
                          className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs text-left transition-colors ${item.conforme ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                          {item.conforme ? <CheckCircle size={14} /> : <Circle size={14} />}
                          {item.item_nome}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminSGSChecklists;
