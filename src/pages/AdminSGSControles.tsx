import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { 
  Plus, Search, Shield, FileText, ClipboardList, 
  Wrench, AlertCircle, CheckCircle2, Trash2, Pencil,
  Download, ExternalLink, Activity
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const EQUIPMENT_CATEGORIES: Record<string, string> = {
  resgate: "Resgate",
  primeiros_socorros: "Primeiros Socorros",
  comunicacao: "Comunicação",
  veiculo: "Veículo",
  outro: "Outro"
};

const PROCEDURE_CATEGORIES: Record<string, string> = {
  seguranca: "Segurança",
  emergencia: "Emergência",
  operacional: "Operacional",
  atendimento: "Atendimento"
};

const AdminSGSControles = () => {
  const [equipment, setEquipment] = useState<any[]>([]);
  const [procedures, setProcedures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEquipForm, setShowEquipForm] = useState(false);
  const [showProcForm, setShowProcForm] = useState(false);
  
  const [equipForm, setEquipForm] = useState({ 
    name: "", category: "resgate", status: "operacional", 
    last_inspection: "", next_inspection: "", responsible: "", notes: "" 
  });
  
  const [procForm, setProcForm] = useState({ 
    title: "", category: "seguranca", description: "", 
    version: "1.0", status: "vigente", file_url: "" 
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [equipRes, procRes] = await Promise.all([
      supabase.from("sgs_equipment").select("*").order("name"),
      supabase.from("sgs_procedures").select("*").order("title"),
    ]);
    setEquipment(equipRes.data || []);
    setProcedures(procRes.data || []);
    setLoading(false);
  };

  const handleAddEquip = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("sgs_equipment").insert(equipForm);
    if (error) { toast({ title: "Erro", variant: "destructive" }); return; }
    toast({ title: "Equipamento cadastrado!" });
    setShowEquipForm(false);
    setEquipForm({ 
      name: "", category: "resgate", status: "operacional", 
      last_inspection: "", next_inspection: "", responsible: "", notes: "" 
    });
    loadData();
  };

  const handleAddProc = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("sgs_procedures").insert(procForm);
    if (error) { toast({ title: "Erro", variant: "destructive" }); return; }
    toast({ title: "Procedimento cadastrado!" });
    setShowProcForm(false);
    setProcForm({ 
      title: "", category: "seguranca", description: "", 
      version: "1.0", status: "vigente", file_url: "" 
    });
    loadData();
  };

  const deleteEquip = async (id: string) => {
    if (!confirm("Excluir este equipamento?")) return;
    const { error } = await supabase.from("sgs_equipment").delete().eq("id", id);
    if (error) { toast({ title: "Erro ao excluir", variant: "destructive" }); return; }
    toast({ title: "Removido com sucesso" });
    loadData();
  };

  const deleteProc = async (id: string) => {
    if (!confirm("Excluir este procedimento?")) return;
    const { error } = await supabase.from("sgs_procedures").delete().eq("id", id);
    if (error) { toast({ title: "Erro ao excluir", variant: "destructive" }); return; }
    toast({ title: "Removido com sucesso" });
    loadData();
  };

  return (
    <AdminLayout title="SGS - Controles Internos (P5)">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <h2 className="text-sm text-muted-foreground">Gestão de Equipamentos e Procedimentos Operacionais Padrão (POP)</h2>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowEquipForm(!showEquipForm)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2">
              <Wrench size={16} /> Novo Equipamento
            </button>
            <button onClick={() => setShowProcForm(!showProcForm)}
              className="bg-secondary hover:bg-secondary/90 text-secondary-foreground px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2">
              <FileText size={16} /> Novo Procedimento
            </button>
          </div>
        </div>

        <Tabs defaultValue="equipamentos">
          <TabsList className="bg-muted p-1 rounded-xl">
            <TabsTrigger value="equipamentos" className="rounded-lg">
              <ClipboardList size={14} className="mr-2" /> Equipamentos (EPIs/Resgate)
            </TabsTrigger>
            <TabsTrigger value="procedimentos" className="rounded-lg">
              <Shield size={14} className="mr-2" /> Procedimentos (POPs)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="equipamentos" className="mt-6 space-y-6">
            {showEquipForm && (
              <form onSubmit={handleAddEquip} className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm animate-in fade-in slide-in-from-top-4">
                <h3 className="font-display font-bold text-foreground">Cadastrar Equipamento</h3>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Nome do Equipamento *</label>
                    <input required value={equipForm.name} onChange={(e) => setEquipForm({ ...equipForm, name: e.target.value })}
                      className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" placeholder="Ex: Cabo de Resgate 20m" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Categoria *</label>
                    <select value={equipForm.category} onChange={(e) => setEquipForm({ ...equipForm, category: e.target.value })}
                      className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-sm outline-none">
                      {Object.entries(EQUIPMENT_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Status *</label>
                    <select value={equipForm.status} onChange={(e) => setEquipForm({ ...equipForm, status: e.target.value })}
                      className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-sm outline-none">
                      <option value="operacional">Operacional</option>
                      <option value="manutencao">Manutenção</option>
                      <option value="descartado">Descartado</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Última Inspeção</label>
                    <input type="date" value={equipForm.last_inspection} onChange={(e) => setEquipForm({ ...equipForm, last_inspection: e.target.value })}
                      className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-sm outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Próxima Inspeção</label>
                    <input type="date" value={equipForm.next_inspection} onChange={(e) => setEquipForm({ ...equipForm, next_inspection: e.target.value })}
                      className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-sm outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Responsável</label>
                    <input value={equipForm.responsible} onChange={(e) => setEquipForm({ ...equipForm, responsible: e.target.value })}
                      className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-sm outline-none" placeholder="Nome do responsável" />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Observações</label>
                    <textarea value={equipForm.notes} onChange={(e) => setEquipForm({ ...equipForm, notes: e.target.value })}
                      className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-sm outline-none h-20 resize-none" placeholder="Detalhes técnicos, defeitos, etc." />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" className="bg-primary text-primary-foreground px-6 py-2 rounded-xl text-sm font-semibold">Salvar</button>
                  <button type="button" onClick={() => setShowEquipForm(false)} className="bg-muted text-muted-foreground px-6 py-2 rounded-xl text-sm font-semibold">Cancelar</button>
                </div>
              </form>
            )}

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {loading ? (
                <div className="col-span-full py-12 text-center text-muted-foreground">Carregando...</div>
              ) : equipment.length === 0 ? (
                <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/30 rounded-2xl border-2 border-dashed border-border">
                  Nenhum equipamento cadastrado. Comece adicionando um novo item de segurança.
                </div>
              ) : equipment.map((item) => (
                <div key={item.id} className="bg-card border border-border rounded-2xl p-5 hover:shadow-md transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-2 rounded-lg ${
                      item.status === 'operacional' ? 'bg-primary/10 text-primary' : 
                      item.status === 'manutencao' ? 'bg-secondary/10 text-secondary' : 'bg-destructive/10 text-destructive'
                    }`}>
                      <Wrench size={20} />
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => deleteEquip(item.id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </div>
                  <h4 className="font-bold text-foreground mb-1">{item.name}</h4>
                  <p className="text-xs text-muted-foreground mb-3">{EQUIPMENT_CATEGORIES[item.category]}</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-[10px] uppercase tracking-wider font-bold">
                      <span className="text-muted-foreground">Status</span>
                      <span className={
                        item.status === 'operacional' ? 'text-primary' : 
                        item.status === 'manutencao' ? 'text-secondary' : 'text-destructive'
                      }>{item.status}</span>
                    </div>
                    {item.next_inspection && (
                      <div className="flex justify-between text-[10px] uppercase tracking-wider font-bold">
                        <span className="text-muted-foreground">Próx. Inspeção</span>
                        <span className={new Date(item.next_inspection) < new Date() ? 'text-destructive' : 'text-foreground'}>
                          {new Date(item.next_inspection + "T12:00").toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground border-t border-border pt-3">
                    <Activity size={12} />
                    <span>Resp: {item.responsible || "N/A"}</span>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="procedimentos" className="mt-6 space-y-6">
            {showProcForm && (
              <form onSubmit={handleAddProc} className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm animate-in fade-in slide-in-from-top-4">
                <h3 className="font-display font-bold text-foreground">Cadastrar Procedimento (POP)</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="lg:col-span-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Título do Procedimento *</label>
                    <input required value={procForm.title} onChange={(e) => setProcForm({ ...procForm, title: e.target.value })}
                      className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-sm outline-none" placeholder="Ex: Resgate de Vítima em Lagoa" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Categoria *</label>
                    <select value={procForm.category} onChange={(e) => setProcForm({ ...procForm, category: e.target.value })}
                      className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-sm outline-none">
                      {Object.entries(PROCEDURE_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Versão</label>
                    <input value={procForm.version} onChange={(e) => setProcForm({ ...procForm, version: e.target.value })}
                      className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-sm outline-none" placeholder="1.0" />
                  </div>
                  <div className="lg:col-span-4">
                    <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Descrição / Link do Documento</label>
                    <textarea value={procForm.description} onChange={(e) => setProcForm({ ...procForm, description: e.target.value })}
                      className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-sm outline-none h-20 resize-none" placeholder="Instruções básicas ou link para o manual completo..." />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" className="bg-primary text-primary-foreground px-6 py-2 rounded-xl text-sm font-semibold">Publicar POP</button>
                  <button type="button" onClick={() => setShowProcForm(false)} className="bg-muted text-muted-foreground px-6 py-2 rounded-xl text-sm font-semibold">Cancelar</button>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {loading ? (
                <div className="py-12 text-center text-muted-foreground">Carregando...</div>
              ) : procedures.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground bg-muted/30 rounded-2xl border-2 border-dashed border-border">
                  Nenhum procedimento cadastrado.
                </div>
              ) : procedures.map((proc) => (
                <div key={proc.id} className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between hover:border-primary/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                      <FileText size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-foreground">{proc.title}</h4>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{PROCEDURE_CATEGORIES[proc.category]} • v{proc.version}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-primary hover:bg-primary/5 rounded-lg transition-colors" title="Visualizar">
                      <ExternalLink size={18} />
                    </button>
                    <button onClick={() => deleteProc(proc.id)} className="p-2 text-muted-foreground hover:text-destructive rounded-lg transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminSGSControles;