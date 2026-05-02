import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { ClipboardCheck, Plus, CheckCircle, Circle, Trash2, Calendar, User, Loader2 } from "lucide-react";

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
  const [form, setForm] = useState({ titulo: "", tipo: "veiculo_diario", responsavel: "", observacoes: "", veiculo_id: "", condutor_id: "", booking_id: "" });
  const [veiculos, setVeiculos] = useState<any[]>([]);
  const [condutores, setCondutores] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [templateItems, setTemplateItems] = useState<{ item_nome: string; categoria: string; conforme: boolean }[]>([]);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const [cl, ci, vRes, cRes, bRes] = await Promise.all([
      supabase.from("sgs_checklists").select("*").order("created_at", { ascending: false }),
      supabase.from("sgs_checklist_items").select("*"),
      supabase.from("sgs_veiculos").select("id, placa, modelo").eq("status", "ativo"),
      supabase.from("sgs_condutores").select("id, nome").eq("status", "ativo"),
      supabase.from("bookings").select("id, booking_code, item_name").order("created_at", { ascending: false }).limit(20)
    ]);
    setChecklists(cl.data || []);
    setItems(ci.data || []);
    setVeiculos(vRes.data || []);
    setCondutores(cRes.data || []);
    setBookings(bRes.data || []);
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
    const payload: any = { ...form, status: allOk ? "concluido" : "em_andamento" };
    if (!payload.veiculo_id) delete payload.veiculo_id;
    if (!payload.condutor_id) delete payload.condutor_id;
    if (!payload.booking_id) delete payload.booking_id;
    
    const { data: cl, error } = await supabase.from("sgs_checklists").insert(payload).select().single();
    if (error || !cl) { toast({ title: "Erro", description: error?.message, variant: "destructive" }); return; }
    if (templateItems.length > 0) {
      await supabase.from("sgs_checklist_items").insert(templateItems.map(i => ({ ...i, checklist_id: cl.id })));
    }
    toast({ title: "Checklist criado!" });
    setForm({ titulo: "", tipo: "veiculo_diario", responsavel: "", observacoes: "", veiculo_id: "", condutor_id: "", booking_id: "" });
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
            
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Veículo (se aplicável)</label>
                <select value={form.veiculo_id} onChange={e => setForm(p => ({ ...p, veiculo_id: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm">
                  <option value="">Nenhum</option>
                  {veiculos.map(v => <option key={v.id} value={v.id}>{v.modelo} ({v.placa})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Condutor (se aplicável)</label>
                <select value={form.condutor_id} onChange={e => setForm(p => ({ ...p, condutor_id: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm">
                  <option value="">Nenhum</option>
                  {condutores.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Reserva Relacionada</label>
                <select value={form.booking_id} onChange={e => setForm(p => ({ ...p, booking_id: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm">
                  <option value="">Nenhuma</option>
                  {bookings.map(b => <option key={b.id} value={b.id}>{b.booking_code} - {b.item_name}</option>)}
                </select>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {checklists.map(cl => {
              const progress = getProgress(cl.id);
              const clItems = getItems(cl.id);
              return (
                <div key={cl.id} className="bg-card border border-border rounded-3xl p-6 hover:shadow-xl hover:border-primary/30 transition-all group relative overflow-hidden flex flex-col">
                  <div className={`absolute top-0 left-0 w-1.5 h-full transition-colors ${cl.status === "concluido" ? "bg-primary" : "bg-secondary"}`} />
                  
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-inner ${cl.status === "concluido" ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"}`}>
                        <ClipboardCheck size={24} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-black text-foreground group-hover:text-primary transition-colors leading-tight truncate">{cl.titulo}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="bg-muted text-muted-foreground font-black text-[8px] uppercase px-1.5 py-0 rounded border">
                            {cl.tipo.replace('_', ' ')}
                          </Badge>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                            {new Date(cl.created_at).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => handleDelete(cl.id)} className="p-2 rounded-xl hover:bg-destructive/10 text-destructive transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="bg-muted/30 p-4 rounded-2xl border border-border/50 mb-6">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest mb-2">
                      <span className="text-muted-foreground italic flex items-center gap-1.5">
                        <User size={12} className="text-primary" /> {cl.responsavel || "Responsável não informado"}
                      </span>
                      <span className={progress === 100 ? "text-primary" : "text-secondary"}>{progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden shadow-inner">
                      <div className={`h-full rounded-full transition-all duration-700 ${progress === 100 ? "bg-primary" : "bg-secondary"}`} style={{ width: `${progress}%` }} />
                    </div>
                  </div>

                  <div className="flex-1 space-y-1.5 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                    {clItems.map(item => (
                      <button 
                        key={item.id} 
                        onClick={() => toggleChecklistItem(item.id, item.conforme)}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-[11px] font-bold text-left transition-all border border-transparent hover:border-primary/10 ${item.conforme ? "bg-primary/5 text-primary" : "bg-muted/10 text-muted-foreground hover:bg-muted/20"}`}
                      >
                        <div className={`shrink-0 transition-colors ${item.conforme ? "text-primary" : "text-muted-foreground/30"}`}>
                          {item.conforme ? <CheckCircle size={14} /> : <Circle size={14} />}
                        </div>
                        <span className="truncate">{item.item_nome}</span>
                      </button>
                    ))}
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-border/50 flex justify-between items-center">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${cl.status === "concluido" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-amber-50 text-amber-700 border-amber-100"}`}>
                      {cl.status === "concluido" ? "Aprovado" : "Pendente"}
                    </span>
                    <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline flex items-center gap-1">
                      Visualizar Laudo Completo
                    </button>
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

export default AdminSGSChecklists;
