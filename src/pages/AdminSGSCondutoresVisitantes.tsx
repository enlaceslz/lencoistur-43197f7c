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
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar visitante..." className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <button onClick={() => { setForm(emptyForm); setEditId(null); setShowForm(!showForm); }} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90">
            <Plus size={16} /> Novo Visitante
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h3 className="font-display font-bold text-foreground">{editId ? "Editar Visitante" : "Novo Visitante"}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { l: "Nome *", k: "nome" }, { l: "CPF", k: "cpf" }, { l: "CNH Número", k: "cnh_numero" },
                { l: "CNH Categoria", k: "cnh_categoria" }, { l: "CNH Validade", k: "cnh_validade", t: "date" },
                { l: "Empresa/Instituição", k: "empresa_instituicao" }, { l: "Veículo", k: "veiculo_descricao" },
                { l: "Placa Veículo", k: "veiculo_placa" }, { l: "Motivo", k: "motivo" },
                { l: "Destino na UC", k: "destino_uc" }, { l: "Data Entrada", k: "data_entrada", t: "date" }, { l: "Data Saída", k: "data_saida", t: "date" },
              ].map(f => (
                <div key={f.k}>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">{f.l}</label>
                  <input 
                    type={f.t || "text"} 
                    value={(form as any)[f.k]} 
                    onChange={e => set(f.k, e.target.value)} 
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30" 
                    maxLength={f.k === "cpf" ? 14 : undefined}
                  />

                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Status</label>
                <select value={form.status} onChange={e => set("status", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm">
                  {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="px-5 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90">Salvar</button>
              <button type="button" onClick={() => { setShowForm(false); setEditId(null); }} className="px-5 py-2 border border-border rounded-xl text-sm">Cancelar</button>
            </div>
          </form>
        )}

        {loading ? <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div> : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground"><Users size={40} className="mx-auto mb-3 opacity-40" /><p>Nenhum visitante registrado</p></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(v => {
              const st = STATUS_LABELS[v.status] || STATUS_LABELS.pendente;
              const isCnhExpired = cnhExpired(v.cnh_validade);
              return (
                <div key={v.id} className="bg-card border border-border rounded-3xl p-6 hover:shadow-xl hover:border-primary/30 transition-all group relative overflow-hidden flex flex-col">
                  <div className={`absolute top-0 left-0 w-1.5 h-full transition-colors ${v.status === 'autorizado' ? 'bg-primary' : v.status === 'negado' ? 'bg-destructive' : 'bg-secondary'}`} />
                  
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                        <Users size={24} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-black text-foreground group-hover:text-primary transition-colors leading-tight truncate">{v.nome}</h4>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-0.5">{v.empresa_instituicao || 'Visitante Avulso'}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={`font-black text-[9px] uppercase px-2.5 py-1 rounded-lg border ${st.color}`}>
                      {st.label}
                    </Badge>
                  </div>

                  <div className="space-y-3 mb-5 flex-1">
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="bg-muted/30 p-2 rounded-xl border border-border/50">
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-tighter mb-0.5">CPF</p>
                        <p className="font-bold text-foreground truncate">{v.cpf || '—'}</p>
                      </div>
                      <div className="bg-muted/30 p-2 rounded-xl border border-border/50">
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-tighter mb-0.5">CNH</p>
                        <p className="font-bold text-foreground truncate">{v.cnh_numero || '—'} {v.cnh_categoria && `(${v.cnh_categoria})`}</p>
                      </div>
                    </div>

                    <div className={`flex items-center justify-between p-2 rounded-lg transition-colors ${isCnhExpired ? "bg-destructive/5 text-destructive" : "bg-muted/20 text-muted-foreground"}`}>
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase">
                        {isCnhExpired ? <AlertTriangle size={12} /> : <CheckCircle size={12} className="text-emerald-500" />}
                        Validade CNH
                      </div>
                      <span className="text-[10px] font-black">{v.cnh_validade ? new Date(v.cnh_validade + "T12:00").toLocaleDateString("pt-BR") : "N/A"}</span>
                    </div>

                    {v.veiculo_placa && (
                      <div className="bg-muted/20 p-2 rounded-xl border border-border/30">
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-tighter mb-0.5">Veículo</p>
                        <p className="text-[11px] font-bold text-foreground truncate">{v.veiculo_descricao} • {v.veiculo_placa}</p>
                      </div>
                    )}

                    <div className="text-[11px] text-muted-foreground pt-2 border-t border-border/50">
                      <p className="flex items-center gap-1.5"><MapPin size={10} className="text-primary" /> <strong>Destino:</strong> {v.destino_uc || 'Não informado'}</p>
                      <p className="mt-1 flex items-center gap-1.5"><Calendar size={10} className="text-primary" /> {new Date(v.data_entrada + "T12:00").toLocaleDateString("pt-BR")} → {v.data_saida ? new Date(v.data_saida + "T12:00").toLocaleDateString("pt-BR") : "em aberto"}</p>
                    </div>
                  </div>

                  <div className="mt-auto pt-4 border-t border-border/50 flex flex-wrap gap-2">
                    {v.status === "pendente" && (
                      <>
                        <button onClick={() => updateStatus(v.id, "autorizado")} className="flex-1 text-[10px] font-black uppercase tracking-widest py-2 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-white transition-all">Autorizar</button>
                        <button onClick={() => updateStatus(v.id, "negado")} className="flex-1 text-[10px] font-black uppercase tracking-widest py-2 bg-destructive/10 text-destructive rounded-xl hover:bg-destructive hover:text-white transition-all">Negar</button>
                      </>
                    )}
                    {v.status === "autorizado" && (
                      <button onClick={() => updateStatus(v.id, "encerrado")} className="w-full text-[10px] font-black uppercase tracking-widest py-2 bg-muted text-muted-foreground rounded-xl hover:bg-muted/80 transition-all">Encerrar Visita</button>
                    )}
                    <div className="flex w-full gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button onClick={() => openEdit(v)} className="flex-1 py-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors flex items-center justify-center">
                            <Pencil size={14} />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Editar Visitante</p>
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
  );
};

export default AdminSGSCondutoresVisitantes;
