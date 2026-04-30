import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { maskCPF, maskPhone } from "@/lib/masks";

import { UserCheck, Plus, Search, AlertTriangle, Pencil, Trash2 } from "lucide-react";

const emptyForm = { nome: "", cpf: "", cnh_numero: "", cnh_categoria: "B", cnh_validade: "", telefone: "", email: "", primeiros_socorros: false, off_road: false, status: "ativo" as const, observacoes: "" };

const AdminSGSCondutores = () => {
  const [condutores, setCondutores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("sgs_condutores").select("*").order("nome");
    setCondutores(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) { toast({ title: "Nome obrigatório", variant: "destructive" }); return; }
    const payload = { ...form };
    let res;
    if (editId) res = await supabase.from("sgs_condutores").update(payload).eq("id", editId);
    else res = await supabase.from("sgs_condutores").insert(payload);
    if (res.error) toast({ title: "Erro", description: res.error.message, variant: "destructive" });
    else { toast({ title: editId ? "Condutor atualizado!" : "Condutor cadastrado!" }); setForm(emptyForm); setShowForm(false); setEditId(null); load(); }
  };

  const openEdit = (c: any) => {
    setForm({
      nome: c.nome,
      cpf: c.cpf || "",
      cnh_numero: c.cnh_numero || "",
      cnh_categoria: c.cnh_categoria || "B",
      cnh_validade: c.cnh_validade || "",
      telefone: c.telefone || "",
      email: c.email || "",
      primeiros_socorros: !!c.primeiros_socorros,
      off_road: !!c.off_road,
      status: c.status || "ativo",
      observacoes: c.observacoes || ""
    });
    setEditId(c.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este condutor?")) return;
    const { error } = await supabase.from("sgs_condutores").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Condutor excluído com sucesso!" });
      load();
    }
  };

  const cnhExpired = (d: string | null) => d && new Date(d) < new Date();
  const filtered = condutores.filter(c => c.nome.toLowerCase().includes(search.toLowerCase()) || (c.cpf && c.cpf.includes(search)));
  const set = (k: string, v: any) => {
    let value = v;
    if (k === "cpf") value = maskCPF(v);
    if (k === "telefone") value = maskPhone(v);
    setForm(p => ({ ...p, [k]: value }));
  };


  return (
    <AdminLayout title="SGS — Condutores">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar condutor..." className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <button onClick={() => { setForm(emptyForm); setEditId(null); setShowForm(!showForm); }} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90">
            <Plus size={16} /> Novo Condutor
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h3 className="font-display font-bold text-foreground">{editId ? "Editar Condutor" : "Novo Condutor"}</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { l: "Nome *", k: "nome" }, { l: "CPF", k: "cpf" }, { l: "CNH Número", k: "cnh_numero" },
                { l: "CNH Categoria", k: "cnh_categoria" }, { l: "CNH Validade", k: "cnh_validade", t: "date" },
                { l: "Telefone", k: "telefone" }, { l: "E-mail", k: "email", t: "email" },
              ].map(f => (
                <div key={f.k}>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">{f.l}</label>
                  <input 
                    type={f.t || "text"} 
                    value={(form as any)[f.k]} 
                    onChange={e => set(f.k, e.target.value)} 
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30" 
                    maxLength={f.k === "cpf" ? 14 : f.k === "telefone" ? 15 : undefined}
                  />

                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Status</label>
                <select value={form.status} onChange={e => set("status", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm">
                  <option value="ativo">Ativo</option><option value="inativo">Inativo</option><option value="bloqueado">Bloqueado</option>
                </select>
              </div>
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.primeiros_socorros} onChange={e => set("primeiros_socorros", e.target.checked)} className="rounded" /> Primeiros Socorros</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.off_road} onChange={e => set("off_road", e.target.checked)} className="rounded" /> Off-Road</label>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="px-5 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90">Salvar</button>
              <button type="button" onClick={() => { setShowForm(false); setEditId(null); }} className="px-5 py-2 border border-border rounded-xl text-sm">Cancelar</button>
            </div>
          </form>
        )}

        {loading ? <div className="flex justify-center py-16"><Loader2 className="animate-spin text-primary" size={32} /></div> : filtered.length === 0 ? (
          <div className="text-center py-20 bg-card border border-dashed rounded-3xl">
            <UserCheck size={48} className="mx-auto mb-4 opacity-20" />
            <p className="font-bold text-lg">Nenhum condutor encontrado</p>
            <p className="text-sm text-muted-foreground">Cadastre motoristas e guias para gerenciar escalas e treinamentos.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(c => {
              const isCnhExpired = cnhExpired(c.cnh_validade);
              return (
                <div key={c.id} className="bg-card border border-border rounded-3xl p-6 hover:shadow-xl hover:border-primary/30 transition-all group relative overflow-hidden">
                  <div className={`absolute top-0 left-0 w-1.5 h-full transition-colors ${c.status === "ativo" ? "bg-emerald-500" : c.status === "bloqueado" ? "bg-destructive" : "bg-muted"}`} />
                  
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                        <UserCheck size={24} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-black text-foreground group-hover:text-primary transition-colors leading-tight truncate">{c.nome}</h4>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-0.5">{c.email || 'Sem e-mail'}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <Badge variant="outline" className={`font-black text-[9px] uppercase px-2.5 py-0.5 rounded-lg border ${c.status === "ativo" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-muted text-muted-foreground"}`}>
                        {c.status}
                      </Badge>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground font-bold uppercase tracking-tighter">CNH ({c.cnh_categoria})</span>
                      <span className="text-foreground font-mono font-bold">{c.cnh_numero || '—'}</span>
                    </div>
                    <div className={`flex items-center justify-between p-2 rounded-lg transition-colors ${isCnhExpired ? "bg-destructive/5 text-destructive" : "bg-muted/30 text-muted-foreground"}`}>
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase">
                        {isCnhExpired ? <AlertTriangle size={12} /> : <CheckCircle size={12} className="text-emerald-500" />}
                        Validade CNH
                      </div>
                      <span className={`text-[10px] font-black ${isCnhExpired ? 'animate-pulse' : ''}`}>
                        {c.cnh_validade ? new Date(c.cnh_validade + "T12:00").toLocaleDateString("pt-BR") : "N/A"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-4 border-t border-border/50">
                    {c.primeiros_socorros && (
                      <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10 text-[8px] font-black uppercase py-0 px-1.5">
                        🚑 1º Socorros
                      </Badge>
                    )}
                    {c.off_road && (
                      <Badge variant="secondary" className="bg-secondary/5 text-secondary border-secondary/10 text-[8px] font-black uppercase py-0 px-1.5">
                        🚜 Off-Road
                      </Badge>
                    )}
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

export default AdminSGSCondutores;
