import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { maskCPF } from "@/lib/masks";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

import { Users, Plus, Search, AlertTriangle, CheckCircle, MapPin, Calendar, Pencil } from "lucide-react";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  autorizado: { label: "Autorizado", color: "bg-primary/10 text-primary" },
  pendente: { label: "Pendente", color: "bg-secondary/10 text-secondary" },
  encerrado: { label: "Encerrado", color: "bg-muted text-muted-foreground" },
  negado: { label: "Negado", color: "bg-destructive/10 text-destructive" },
};

const emptyForm = { nome: "", cpf: "", cnh_numero: "", cnh_categoria: "", cnh_validade: "", empresa_instituicao: "", veiculo_descricao: "", veiculo_placa: "", motivo: "", destino_uc: "", data_entrada: new Date().toISOString().split("T")[0], data_saida: "", status: "pendente", observacoes: "" };

const AdminSGSCondutoresVisitantes = () => {
  const [visitantes, setVisitantes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("sgs_condutores_visitantes").select("*").order("created_at", { ascending: false });
    setVisitantes(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) { toast({ title: "Nome obrigatório", variant: "destructive" }); return; }
    let res;
    if (editId) res = await supabase.from("sgs_condutores_visitantes").update(form).eq("id", editId);
    else res = await supabase.from("sgs_condutores_visitantes").insert(form);
    if (res.error) toast({ title: "Erro", description: res.error.message, variant: "destructive" });
    else { toast({ title: editId ? "Visitante atualizado!" : "Visitante registrado!" }); setForm(emptyForm); setShowForm(false); setEditId(null); load(); }
  };

  const openEdit = (v: any) => {
    setForm({ nome: v.nome, cpf: v.cpf || "", cnh_numero: v.cnh_numero || "", cnh_categoria: v.cnh_categoria || "", cnh_validade: v.cnh_validade || "", empresa_instituicao: v.empresa_instituicao || "", veiculo_descricao: v.veiculo_descricao || "", veiculo_placa: v.veiculo_placa || "", motivo: v.motivo || "", destino_uc: v.destino_uc || "", data_entrada: v.data_entrada || "", data_saida: v.data_saida || "", status: v.status, observacoes: v.observacoes || "" });
    setEditId(v.id);
    setShowForm(true);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("sgs_condutores_visitantes").update({ status }).eq("id", id);
    toast({ title: `Status atualizado para ${STATUS_LABELS[status]?.label}` });
    load();
  };

  const cnhExpired = (d: string | null) => d && new Date(d) < new Date();
  const filtered = visitantes.filter(v => `${v.nome} ${v.empresa_instituicao || ""}`.toLowerCase().includes(search.toLowerCase()));
  const set = (k: string, v: string) => {
    let value = v;
    if (k === "cpf") value = maskCPF(v);
    setForm(p => ({ ...p, [k]: value }));
  };


  return (
    <AdminLayout title="SGS — Condutores Visitantes">
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="glass-card p-4 rounded-3xl border border-border/50 flex flex-wrap gap-4 items-center justify-between">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Buscar visitante..." 
              className="w-full pl-11 pr-4 h-12 rounded-2xl border border-border bg-background text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 transition-all" 
            />
          </div>
          <button 
            onClick={() => { setForm(emptyForm); setEditId(null); setShowForm(!showForm); }} 
            className="flex items-center gap-3 px-8 h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-95"
          >
            <Plus size={20} strokeWidth={3} /> Registrar Visitante
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-card/50 backdrop-blur-xl border border-border rounded-[2rem] p-8 space-y-6 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
            <h3 className="font-display font-black text-xl text-foreground">{editId ? "Editar Registro de Visitante" : "Novo Registro de Visitante"}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { l: "Nome *", k: "nome" }, { l: "CPF", k: "cpf" }, { l: "CNH Número", k: "cnh_numero" },
                { l: "CNH Categoria", k: "cnh_categoria" }, { l: "CNH Validade", k: "cnh_validade", t: "date" },
                { l: "Empresa/Instituição", k: "empresa_instituicao" }, { l: "Veículo", k: "veiculo_descricao" },
                { l: "Placa Veículo", k: "veiculo_placa" }, { l: "Motivo da Visita", k: "motivo" },
                { l: "Destino na UC", k: "destino_uc" }, { l: "Data Entrada", k: "data_entrada", t: "date" }, { l: "Data Saída", k: "data_saida", t: "date" },
              ].map(f => (
                <div key={f.k}>
                  <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5 ml-1">{f.l}</label>
                  <input 
                    type={f.t || "text"} 
                    value={(form as any)[f.k]} 
                    onChange={e => set(f.k, e.target.value)} 
                    className="w-full h-11 px-4 rounded-xl border border-border bg-background text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all" 
                    maxLength={f.k === "cpf" ? 14 : undefined}
                  />
                </div>
              ))}
              <div>
                <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5 ml-1">Status da Autorização</label>
                <select value={form.status} onChange={e => set("status", e.target.value)} className="w-full h-11 px-4 rounded-xl border border-border bg-background text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all outline-none">
                  {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="px-8 py-3 bg-primary text-primary-foreground rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:opacity-90 transition-all">Salvar Registro</button>
              <button type="button" onClick={() => { setShowForm(false); setEditId(null); }} className="px-8 py-3 border border-border rounded-2xl text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-muted transition-all">Cancelar</button>
            </div>
          </form>
        )}

        {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={40} /></div> : filtered.length === 0 ? (
          <div className="text-center py-20 bg-card/50 border border-dashed border-border rounded-[2.5rem]">
            <Users size={64} className="mx-auto mb-4 opacity-20 text-foreground" />
            <h4 className="font-display font-black text-xl text-foreground">Nenhum visitante registrado</h4>
            <p className="text-sm text-muted-foreground">Registre entradas e saídas de condutores e pesquisadores externos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(v => {
              const st = STATUS_LABELS[v.status] || STATUS_LABELS.pendente;
              const isCnhExpired = cnhExpired(v.cnh_validade);
              return (
                <div key={v.id} className="bg-card border border-border rounded-[2rem] p-6 hover:shadow-2xl hover:border-primary/30 transition-all group relative overflow-hidden flex flex-col admin-card-hover">
                  <div className={`absolute top-0 left-0 w-2 h-full transition-colors ${v.status === 'autorizado' ? 'bg-primary' : v.status === 'negado' ? 'bg-destructive' : 'bg-secondary'}`} />
                  
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                        <Users size={28} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-display font-black text-foreground group-hover:text-primary transition-colors leading-tight truncate">{v.nome}</h4>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1 truncate">{v.empresa_instituicao || 'Visitante Avulso'}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={`font-black text-[9px] uppercase px-3 py-1 rounded-full border ${st.color}`}>
                      {st.label}
                    </Badge>
                  </div>

                  <div className="space-y-4 mb-6 flex-1">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-muted/30 p-3 rounded-2xl border border-border/50">
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">CPF</p>
                        <p className="font-bold text-sm text-foreground truncate">{v.cpf || '—'}</p>
                      </div>
                      <div className="bg-muted/30 p-3 rounded-2xl border border-border/50">
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">CNH</p>
                        <p className="font-bold text-sm text-foreground truncate">{v.cnh_numero || '—'} {v.cnh_categoria && `(${v.cnh_categoria})`}</p>
                      </div>
                    </div>

                    <div className={`flex items-center justify-between p-3 rounded-2xl transition-colors ${isCnhExpired ? "bg-destructive/10 text-destructive" : "bg-muted/20 text-muted-foreground"}`}>
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                        {isCnhExpired ? <AlertTriangle size={14} /> : <CheckCircle size={14} className="text-emerald-500" />}
                        Validade CNH
                      </div>
                      <span className="text-[10px] font-black">{v.cnh_validade ? new Date(v.cnh_validade + "T12:00").toLocaleDateString("pt-BR") : "N/A"}</span>
                    </div>

                    {v.veiculo_placa && (
                      <div className="bg-muted/20 p-3 rounded-2xl border border-border/30">
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Veículo Autorizado</p>
                        <p className="text-[11px] font-black text-foreground truncate">{v.veiculo_descricao} • {v.veiculo_placa}</p>
                      </div>
                    )}

                    <div className="text-[11px] text-muted-foreground pt-4 border-t border-border/50 space-y-2">
                      <p className="flex items-center gap-2 font-bold"><MapPin size={12} className="text-primary" /> <span className="uppercase tracking-tighter">Destino:</span> <span className="text-foreground">{v.destino_uc || 'Não informado'}</span></p>
                      <p className="flex items-center gap-2 font-bold"><Calendar size={12} className="text-primary" /> <span className="uppercase tracking-tighter">Período:</span> <span className="text-foreground">{new Date(v.data_entrada + "T12:00").toLocaleDateString("pt-BR")} → {v.data_saida ? new Date(v.data_saida + "T12:00").toLocaleDateString("pt-BR") : "em aberto"}</span></p>
                    </div>
                  </div>

                  <div className="mt-auto pt-6 border-t border-border/50 flex flex-col gap-3">
                    {v.status === "pendente" && (
                      <div className="flex gap-2">
                        <button onClick={() => updateStatus(v.id, "autorizado")} className="flex-1 text-[10px] font-black uppercase tracking-widest py-3 bg-emerald-500/10 text-emerald-600 rounded-xl hover:bg-emerald-500 hover:text-white transition-all">Autorizar</button>
                        <button onClick={() => updateStatus(v.id, "negado")} className="flex-1 text-[10px] font-black uppercase tracking-widest py-3 bg-destructive/10 text-destructive rounded-xl hover:bg-destructive hover:text-white transition-all">Negar</button>
                      </div>
                    )}
                    {v.status === "autorizado" && (
                      <button onClick={() => updateStatus(v.id, "encerrado")} className="w-full text-[10px] font-black uppercase tracking-widest py-3 bg-muted text-muted-foreground rounded-xl hover:bg-muted/80 transition-all">Encerrar Visita</button>
                    )}
                    <div className="flex w-full gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button onClick={() => openEdit(v)} className="flex-1 h-10 rounded-xl hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all flex items-center justify-center border border-border">
                            <Pencil size={16} />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Editar Registro</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
    </AdminLayout>
  );
};

export default AdminSGSCondutoresVisitantes;
