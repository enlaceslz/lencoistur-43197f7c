import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { maskCPF } from "@/lib/masks";

import { Users, Plus, Search, AlertTriangle } from "lucide-react";

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
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { l: "Nome *", k: "nome" }, { l: "CPF", k: "cpf" }, { l: "CNH Número", k: "cnh_numero" },
                { l: "CNH Categoria", k: "cnh_categoria" }, { l: "CNH Validade", k: "cnh_validade", t: "date" },
                { l: "Empresa/Instituição", k: "empresa_instituicao" }, { l: "Veículo", k: "veiculo_descricao" },
                { l: "Placa Veículo", k: "veiculo_placa" }, { l: "Motivo", k: "motivo" },
                { l: "Destino na UC", k: "destino_uc" }, { l: "Data Entrada", k: "data_entrada", t: "date" }, { l: "Data Saída", k: "data_saida", t: "date" },
              ].map(f => (
                <div key={f.k}>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">{f.l}</label>
                  <input type={f.t || "text"} value={(form as any)[f.k]} onChange={e => set(f.k, e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30" />
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
          <div className="space-y-3">
            {filtered.map(v => {
              const st = STATUS_LABELS[v.status] || STATUS_LABELS.pendente;
              return (
                <div key={v.id} className="bg-card border border-border rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-foreground text-sm">{v.nome}</span>
                      {v.empresa_instituicao && <span className="text-xs text-muted-foreground">({v.empresa_instituicao})</span>}
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${st.color}`}>{st.label}</span>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-2 text-xs text-muted-foreground">
                    {v.cpf && <p>CPF: {v.cpf}</p>}
                    {v.cnh_numero && <p>CNH: {v.cnh_numero} {v.cnh_categoria && `(${v.cnh_categoria})`}</p>}
                    {v.cnh_validade && <p className={cnhExpired(v.cnh_validade) ? "text-destructive font-semibold" : ""}>{cnhExpired(v.cnh_validade) && <AlertTriangle size={12} className="inline mr-1" />}CNH Val.: {v.cnh_validade}</p>}
                    {v.veiculo_placa && <p>Veículo: {v.veiculo_descricao} · {v.veiculo_placa}</p>}
                    {v.destino_uc && <p>Destino: {v.destino_uc}</p>}
                    <p>Período: {v.data_entrada} → {v.data_saida || "em aberto"}</p>
                  </div>
                  {v.status === "pendente" && (
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => updateStatus(v.id, "autorizado")} className="text-xs px-3 py-1 bg-primary/10 text-primary rounded-lg hover:bg-primary/20">Autorizar</button>
                      <button onClick={() => updateStatus(v.id, "negado")} className="text-xs px-3 py-1 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20">Negar</button>
                    </div>
                  )}
                  {v.status === "autorizado" && (
                    <button onClick={() => updateStatus(v.id, "encerrado")} className="mt-3 text-xs px-3 py-1 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80">Encerrar Visita</button>
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

export default AdminSGSCondutoresVisitantes;
