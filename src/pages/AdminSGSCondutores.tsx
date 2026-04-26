import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { maskCPF, maskPhone } from "@/lib/masks";

import { UserCheck, Plus, Search, AlertTriangle } from "lucide-react";

const emptyForm = { nome: "", cpf: "", cnh_numero: "", cnh_categoria: "B", cnh_validade: "", telefone: "", email: "", primeiros_socorros: false, off_road: false, status: "ativo", observacoes: "" };

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
    setForm({ nome: c.nome, cpf: c.cpf || "", cnh_numero: c.cnh_numero || "", cnh_categoria: c.cnh_categoria || "B", cnh_validade: c.cnh_validade || "", telefone: c.telefone || "", email: c.email || "", primeiros_socorros: c.primeiros_socorros, off_road: c.off_road, status: c.status, observacoes: c.observacoes || "" });
    setEditId(c.id);
    setShowForm(true);
  };

  const cnhExpired = (d: string | null) => d && new Date(d) < new Date();
  const filtered = condutores.filter(c => c.nome.toLowerCase().includes(search.toLowerCase()));
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

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
                  <input type={f.t || "text"} value={(form as any)[f.k]} onChange={e => set(f.k, e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30" />
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

        {loading ? <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div> : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground"><UserCheck size={40} className="mx-auto mb-3 opacity-40" /><p>Nenhum condutor cadastrado</p></div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(c => (
              <div key={c.id} className="bg-card border border-border rounded-2xl p-5 cursor-pointer hover:shadow-md transition-shadow" onClick={() => openEdit(c)}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-foreground text-sm">{c.nome}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${c.status === "ativo" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>{c.status}</span>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  {c.cnh_numero && <p>CNH: {c.cnh_numero} ({c.cnh_categoria})</p>}
                  {c.cnh_validade && (
                    <p className={cnhExpired(c.cnh_validade) ? "text-destructive font-medium" : ""}>
                      {cnhExpired(c.cnh_validade) && <AlertTriangle size={12} className="inline mr-1" />}
                      Validade CNH: {c.cnh_validade} {cnhExpired(c.cnh_validade) && "(VENCIDA)"}
                    </p>
                  )}
                  <div className="flex gap-2 mt-2">
                    {c.primeiros_socorros && <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full">1º Socorros</span>}
                    {c.off_road && <span className="bg-secondary/10 text-secondary text-[10px] px-2 py-0.5 rounded-full">Off-Road</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminSGSCondutores;
