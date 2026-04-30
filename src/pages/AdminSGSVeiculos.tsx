import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Car, Plus, Search, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  ativo: { label: "Ativo", color: "bg-primary/10 text-primary" },
  manutencao: { label: "Manutenção", color: "bg-secondary/10 text-secondary" },
  inativo: { label: "Inativo", color: "bg-destructive/10 text-destructive" },
};

const emptyForm = { marca: "", modelo: "", ano: "", placa: "", renavam: "", chassi: "", cor: "", capacidade: "4", tipo: "4x4", combustivel: "diesel", quilometragem: "0", seguradora: "", seguro_validade: "", licenciamento_validade: "", status: "ativo", observacoes: "" };

const AdminSGSVeiculos = () => {
  const [veiculos, setVeiculos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("sgs_veiculos").select("*").order("created_at", { ascending: false });
    setVeiculos(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.marca.trim() || !form.modelo.trim() || !form.placa.trim()) { 
      toast({ title: "Marca, modelo e placa são obrigatórios", variant: "destructive" }); 
      return; 
    }

    const payload = { 
      marca: form.marca.trim(),
      modelo: form.modelo.trim(),
      placa: form.placa.trim().toUpperCase(),
      ano: form.ano ? Number(form.ano) : null, 
      capacidade: form.capacidade ? Number(form.capacidade) : null, 
      quilometragem: form.quilometragem ? Number(form.quilometragem) : 0,
      renavam: form.renavam?.trim() || null,
      chassi: form.chassi?.trim() || null,
      cor: form.cor?.trim() || null,
      tipo: form.tipo,
      combustivel: form.combustivel,
      seguradora: form.seguradora?.trim() || null,
      seguro_validade: form.seguro_validade || null,
      licenciamento_validade: form.licenciamento_validade || null,
      status: form.status,
      observacoes: form.observacoes?.trim() || null
    };

    try {
      let res;
      if (editId) {
        res = await supabase.from("sgs_veiculos").update(payload).eq("id", editId);
      } else {
        res = await supabase.from("sgs_veiculos").insert(payload);
      }

      if (res.error) throw res.error;

      // Sincronização com Parceiros: Se for um veículo terceirizado, pode ser interessante 
      // ter um parceiro vinculado, mas como a estrutura de parceiros é focada em pessoas/empresas,
      // aqui focamos em garantir que o status e dados básicos estejam consistentes se houver integração.
      // Por enquanto, apenas confirmamos o sucesso no SGS.

      toast({ title: editId ? "Veículo atualizado!" : "Veículo cadastrado!" });
      setForm(emptyForm);
      setShowForm(false);
      setEditId(null);
      load();
    } catch (err: any) {
      console.error("Erro ao salvar veículo:", err);
      toast({ 
        title: "Erro ao salvar", 
        description: err.message, 
        variant: "destructive" 
      });
    }
  };

  const openEdit = (v: any) => {
    setForm({ marca: v.marca, modelo: v.modelo, ano: v.ano?.toString() || "", placa: v.placa, renavam: v.renavam || "", chassi: v.chassi || "", cor: v.cor || "", capacidade: v.capacidade?.toString() || "4", tipo: v.tipo, combustivel: v.combustivel || "diesel", quilometragem: v.quilometragem?.toString() || "0", seguradora: v.seguradora || "", seguro_validade: v.seguro_validade || "", licenciamento_validade: v.licenciamento_validade || "", status: v.status, observacoes: v.observacoes || "" });
    setEditId(v.id);
    setShowForm(true);
  };

  const isExpired = (date: string | null) => date && new Date(date) < new Date();
  const isExpiring = (date: string | null) => { if (!date) return false; const d = new Date(date); const now = new Date(); const soon = new Date(); soon.setDate(now.getDate() + 30); return d >= now && d <= soon; };

  const filtered = veiculos.filter(v => `${v.marca} ${v.modelo} ${v.placa}`.toLowerCase().includes(search.toLowerCase()));
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  return (
    <AdminLayout title="SGS — Veículos / Frota">
      <TooltipProvider>
        <div className="space-y-6">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar veículo..." className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/30 outline-none" />
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={() => { setForm(emptyForm); setEditId(null); setShowForm(!showForm); }} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90">
                  <Plus size={16} /> Novo Veículo
                </button>
              </TooltipTrigger>
              <TooltipContent>Cadastrar novo veículo na frota</TooltipContent>
            </Tooltip>
          </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h3 className="font-display font-bold text-foreground">{editId ? "Editar Veículo" : "Novo Veículo"}</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { l: "Marca *", k: "marca" }, { l: "Modelo *", k: "modelo" }, { l: "Ano", k: "ano", t: "number" },
                { l: "Placa *", k: "placa" }, { l: "RENAVAM", k: "renavam" }, { l: "Chassi", k: "chassi" },
                { l: "Cor", k: "cor" }, { l: "Capacidade", k: "capacidade", t: "number" }, { l: "Quilometragem", k: "quilometragem", t: "number" },
                { l: "Seguradora", k: "seguradora" }, { l: "Seguro Validade", k: "seguro_validade", t: "date" }, { l: "Licenciamento Validade", k: "licenciamento_validade", t: "date" },
              ].map(f => (
                <div key={f.k}>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">{f.l}</label>
                  <input type={f.t || "text"} value={(form as any)[f.k]} onChange={e => set(f.k, e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Tipo</label>
                <select value={form.tipo} onChange={e => set("tipo", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm">
                  <option value="4x4">4x4</option><option value="4x2">4x2</option><option value="embarcacao">Embarcação</option><option value="outro">Outro</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Combustível</label>
                <select value={form.combustivel} onChange={e => set("combustivel", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm">
                  <option value="diesel">Diesel</option><option value="gasolina">Gasolina</option><option value="flex">Flex</option><option value="eletrico">Elétrico</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Status</label>
                <select value={form.status} onChange={e => set("status", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm">
                  <option value="ativo">Ativo</option><option value="manutencao">Manutenção</option><option value="inativo">Inativo</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="px-5 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90">Salvar</button>
              <button type="button" onClick={() => { setShowForm(false); setEditId(null); }} className="px-5 py-2 border border-border rounded-xl text-sm">Cancelar</button>
            </div>
          </form>
        )}

        {loading ? <div className="flex justify-center py-16"><Loader2 className="animate-spin text-primary" size={32} /></div> : filtered.length === 0 ? (
          <div className="text-center py-20 bg-card border border-dashed rounded-3xl">
            <Car size={48} className="mx-auto mb-4 opacity-20" />
            <p className="font-bold text-lg">Nenhum veículo na frota</p>
            <p className="text-sm text-muted-foreground">Cadastre seus veículos para gerenciar seguros e manutenções.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(v => {
              const st = STATUS_LABELS[v.status] || STATUS_LABELS.ativo;
              const seguroExp = isExpired(v.seguro_validade);
              const seguroWarn = isExpiring(v.seguro_validade);
              const licExp = isExpired(v.licenciamento_validade);
              const licWarn = isExpiring(v.licenciamento_validade);
              
              return (
                <div key={v.id} className="bg-card border border-border rounded-3xl p-6 cursor-pointer hover:shadow-xl hover:border-primary/30 transition-all group relative overflow-hidden" onClick={() => openEdit(v)}>
                  <div className={`absolute top-0 left-0 w-1.5 h-full transition-colors ${st.label === 'Ativo' ? 'bg-primary' : st.label === 'Manutenção' ? 'bg-secondary' : 'bg-destructive'}`} />
                  
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                        <Car size={24} />
                      </div>
                      <div>
                        <h4 className="font-black text-foreground group-hover:text-primary transition-colors leading-tight">{v.marca}</h4>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{v.modelo}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={`font-black text-[9px] uppercase px-2.5 py-1 rounded-lg border ${st.color}`}>
                      {st.label}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="bg-muted/30 p-2.5 rounded-xl border border-border/50">
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-tighter mb-0.5">Placa</p>
                      <p className="text-sm font-black text-foreground font-mono">{v.placa}</p>
                    </div>
                    <div className="bg-muted/30 p-2.5 rounded-xl border border-border/50">
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-tighter mb-0.5">KM Atual</p>
                      <p className="text-sm font-black text-foreground">{v.quilometragem?.toLocaleString() || '0'}</p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-border/50">
                    <div className={`flex items-center justify-between p-2 rounded-lg transition-colors ${seguroExp ? "bg-destructive/5 text-destructive" : seguroWarn ? "bg-amber-50 text-amber-700" : "bg-muted/20 text-muted-foreground"}`}>
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase">
                        {seguroExp ? <AlertTriangle size={12} /> : <CheckCircle size={12} className={!seguroExp && !seguroWarn ? "text-emerald-500" : ""} />}
                        Seguro
                      </div>
                      <span className="text-[10px] font-black">{v.seguro_validade ? new Date(v.seguro_validade + "T12:00").toLocaleDateString("pt-BR") : "N/A"}</span>
                    </div>

                    <div className={`flex items-center justify-between p-2 rounded-lg transition-colors ${licExp ? "bg-destructive/5 text-destructive" : licWarn ? "bg-amber-50 text-amber-700" : "bg-muted/20 text-muted-foreground"}`}>
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase">
                        {licExp ? <AlertTriangle size={12} /> : <CheckCircle size={12} className={!licExp && !licWarn ? "text-emerald-500" : ""} />}
                        Licenciamento
                      </div>
                      <span className="text-[10px] font-black">{v.licenciamento_validade ? new Date(v.licenciamento_validade + "T12:00").toLocaleDateString("pt-BR") : "N/A"}</span>
                    </div>
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

export default AdminSGSVeiculos;
