import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { maskCPF, maskPhone } from "@/lib/masks";
import { Badge } from "@/components/ui/badge";
import { UserCheck, Plus, Search, AlertTriangle, Pencil, Trash2, Loader2, CheckCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const emptyForm = { nome: "", cpf: "", cnh_numero: "", cnh_categoria: "B", cnh_validade: "", telefone: "", email: "", primeiros_socorros: false, first_aid_expiry: "", off_road: false, status: "ativo" as const, observacoes: "", training_history: [] as any[] };

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
    
    if (res.error) {
      toast({ title: "Erro", description: res.error.message, variant: "destructive" });
    } else {
      // Sincronização inversa: Atualiza ou cria o parceiro correspondente
      const partnerPayload = {
        name: form.nome.trim(),
        type: "motorista", // Default para condutores do SGS
        phone: form.telefone.trim() || null,
        email: form.email.trim() || null,
        cpf_cnpj: form.cpf || null,
        cnh: form.cnh_numero || null,
        cnh_validade: form.cnh_validade || null,
        active: form.status === "ativo"
      };

      const { data: existingPartner } = await supabase
        .from("partners")
        .select("id")
        .or(`name.eq."${form.nome.trim()}"${form.cpf ? `,cpf_cnpj.eq."${form.cpf.trim()}"` : ""}`)
        .maybeSingle();

      if (existingPartner) {
        await supabase.from("partners").update(partnerPayload).eq("id", existingPartner.id);
      } else {
        await supabase.from("partners").insert(partnerPayload);
      }

      toast({ title: editId ? "Condutor atualizado!" : "Condutor cadastrado!" });
      setForm(emptyForm);
      setShowForm(false);
      setEditId(null);
      load();
    }
  };

  const openEdit = async (c: any) => {
    setForm({
      nome: c.nome,
      cpf: c.cpf || "",
      cnh_numero: c.cnh_numero || "",
      cnh_categoria: c.cnh_categoria || "B",
      cnh_validade: c.cnh_validade || "",
      telefone: c.telefone || "",
      email: c.email || "",
      primeiros_socorros: !!c.primeiros_socorros,
      first_aid_expiry: c.first_aid_expiry || "",
      off_road: !!c.off_road,
      status: c.status || "ativo",
      observacoes: c.observacoes || "",
      training_history: Array.isArray(c.training_history) ? c.training_history : []
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

  const isDateExpired = (d: string | null) => d && new Date(d) < new Date();
  const filtered = condutores.filter(c => (c.nome || "").toLowerCase().includes(search.toLowerCase()) || (c.cpf && c.cpf.includes(search)));
  const set = (k: string, v: any) => {
    let value = v;
    if (k === "cpf") value = maskCPF(v);
    if (k === "telefone") value = maskPhone(v);
    setForm(p => ({ ...p, [k]: value }));
  };


  return (
    <AdminLayout title="SGS — Condutores">
      <TooltipProvider>
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3 items-center justify-between glass-card p-4 rounded-3xl border border-border/50">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar condutor..." className="w-full pl-9 pr-4 py-2.5 rounded-2xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={() => { setForm(emptyForm); setEditId(null); setShowForm(!showForm); }} 
                className="flex items-center gap-3 px-6 h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-95"
              >
                <Plus size={20} strokeWidth={3} /> Novo Condutor
              </button>
            </TooltipTrigger>
            <TooltipContent>Cadastrar novo motorista ou guia</TooltipContent>
          </Tooltip>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-card/50 backdrop-blur-xl border border-border rounded-3xl p-8 space-y-6 animate-in fade-in slide-in-from-top-4">
            <h3 className="font-display font-black text-xl text-foreground">{editId ? "Editar Condutor" : "Novo Condutor"}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { l: "Nome *", k: "nome" }, { l: "CPF", k: "cpf" }, { l: "CNH Número", k: "cnh_numero" },
                { l: "CNH Categoria", k: "cnh_categoria" }, { l: "CNH Validade", k: "cnh_validade", t: "date" },
                { l: "Telefone", k: "telefone" }, { l: "E-mail", k: "email", t: "email" },
              ].map(f => (
                <div key={f.k}>
                  <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5">{f.l}</label>
                  <input 
                    type={f.t || "text"} 
                    value={(form as any)[f.k]} 
                    onChange={e => set(f.k, e.target.value)} 
                    className="w-full px-4 py-3 rounded-2xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all" 
                    maxLength={f.k === "cpf" ? 14 : f.k === "telefone" ? 15 : undefined}
                  />
                </div>
              ))}
              <div>
                <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5">Status</label>
                <select value={form.status} onChange={e => set("status", e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all">
                  <option value="ativo">Ativo</option><option value="inativo">Inativo</option><option value="bloqueado">Bloqueado</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/30 p-6 rounded-2xl border border-border">
              <div className="space-y-4">
                <label className="flex items-center gap-3 text-sm font-bold uppercase tracking-tight text-foreground cursor-pointer">
                  <input type="checkbox" checked={form.primeiros_socorros} onChange={e => set("primeiros_socorros", e.target.checked)} className="rounded size-5" /> 
                  🚒 Primeiros Socorros / WFR
                </label>
                {form.primeiros_socorros && (
                  <div>
                    <label className="block text-[10px] font-black text-muted-foreground uppercase mb-1">Validade da Certificação *</label>
                    <input type="date" value={form.first_aid_expiry} onChange={e => set("first_aid_expiry", e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                )}
              </div>
              <div>
                <label className="flex items-center gap-3 text-sm font-bold uppercase tracking-tight text-foreground cursor-pointer pt-1">
                  <input type="checkbox" checked={form.off_road} onChange={e => set("off_road", e.target.checked)} className="rounded size-5" /> 
                  🚜 Direção Defensiva / Off-Road
                </label>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="px-8 py-3 bg-primary text-primary-foreground rounded-2xl text-sm font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-primary/20">Salvar</button>
              <button type="button" onClick={() => { setShowForm(false); setEditId(null); }} className="px-8 py-3 border border-border rounded-2xl text-sm font-black uppercase tracking-widest text-muted-foreground hover:bg-muted transition-all">Cancelar</button>
            </div>
          </form>
        )}

        {loading ? <div className="flex justify-center py-16"><Loader2 className="animate-spin text-primary" size={32} /></div> : filtered.length === 0 ? (
          <div className="text-center py-20 bg-card border border-dashed border-border rounded-3xl">
            <UserCheck size={48} className="mx-auto mb-4 opacity-20 text-foreground" />
            <p className="font-display font-black text-xl text-foreground">Nenhum condutor encontrado</p>
            <p className="text-sm text-muted-foreground">Cadastre motoristas e guias para gerenciar escalas e treinamentos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(c => {
              const isCnhExpired = isDateExpired(c.cnh_validade);
              return (
                <div key={c.id} className="bg-card border border-border rounded-[2rem] p-6 hover:shadow-2xl hover:border-primary/30 transition-all group relative overflow-hidden admin-card-hover">
                  <div className={`absolute top-0 left-0 w-2 h-full transition-colors ${c.status === "ativo" ? "bg-emerald-500" : c.status === "bloqueado" ? "bg-destructive" : "bg-muted"}`} />
                  
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                        <UserCheck size={28} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-display font-black text-foreground group-hover:text-primary transition-colors leading-tight truncate">{c.nome}</h4>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">{c.email || 'Sem e-mail'}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <Badge variant="outline" className={`font-black text-[9px] uppercase px-3 py-1 rounded-full border ${c.status === "ativo" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-muted text-muted-foreground"}`}>
                        {c.status}
                      </Badge>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button onClick={() => openEdit(c)} className="p-2 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors">
                              <Pencil size={16} />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Editar dados do condutor</TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button onClick={() => handleDelete(c.id)} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors">
                              <Trash2 size={16} />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Remover condutor do sistema</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground font-black uppercase tracking-widest">CNH ({c.cnh_categoria})</span>
                      <span className="text-foreground font-mono font-bold">{c.cnh_numero || '—'}</span>
                    </div>
                    <div className={`flex items-center justify-between p-3 rounded-2xl transition-colors ${isCnhExpired ? "bg-destructive/10 text-destructive" : "bg-muted/50 text-muted-foreground"}`}>
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                        {isCnhExpired ? <AlertTriangle size={14} /> : <CheckCircle size={14} className="text-emerald-500" />}
                        Validade CNH
                      </div>
                      <span className={`text-[10px] font-black ${isCnhExpired ? 'animate-pulse' : ''}`}>
                        {c.cnh_validade ? new Date(c.cnh_validade + "T12:00").toLocaleDateString("pt-BR") : "N/A"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-6 border-t border-border/50">
                    {c.primeiros_socorros && (
                      <Badge variant="secondary" className={`border text-[9px] font-black uppercase py-1 px-3 rounded-full ${isDateExpired(c.first_aid_expiry) ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-primary/10 text-primary border-primary/20"}`}>
                        🚑 1º Socorros {c.first_aid_expiry && `(v. ${new Date(c.first_aid_expiry + "T12:00").toLocaleDateString("pt-BR")})`}
                      </Badge>
                    )}
                    {c.off_road && (
                      <Badge variant="secondary" className="bg-secondary/10 text-secondary border-secondary/20 text-[9px] font-black uppercase py-1 px-3 rounded-full">
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
      </TooltipProvider>
    </AdminLayout>
  );
};

export default AdminSGSCondutores;
