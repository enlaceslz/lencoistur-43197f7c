import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Car, Plus, Search, AlertTriangle, CheckCircle } from "lucide-react";

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
    if (!form.marca.trim() || !form.placa.trim()) { toast({ title: "Marca e placa obrigatórios", variant: "destructive" }); return; }
    const payload = { 
      ...form, 
      ano: form.ano ? Number(form.ano) : null, 
      capacidade: form.capacidade ? Number(form.capacidade) : null, 
      quilometragem: form.quilometragem ? Number(form.quilometragem) : 0,
      seguro_validade: form.seguro_validade || null,
      licenciamento_validade: form.licenciamento_validade || null
    };
    let res;
    if (editId) {
      res = await supabase.from("sgs_veiculos").update(payload).eq("id", editId);
    } else {
      res = await supabase.from("sgs_veiculos").insert(payload);
    }
    if (res.error) toast({ title: "Erro", description: res.error.message, variant: "destructive" });
    else { toast({ title: editId ? "Veículo atualizado!" : "Veículo cadastrado!" }); setForm(emptyForm); setShowForm(false); setEditId(null); load(); }
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
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar veículo..." className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/30 outline-none" />
          </div>
          <button onClick={() => { setForm(emptyForm); setEditId(null); setShowForm(!showForm); }} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90">
            <Plus size={16} /> Novo Veículo
          </button>
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

        {loading ? <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div> : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground"><Car size={40} className="mx-auto mb-3 opacity-40" /><p>Nenhum veículo cadastrado</p></div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(v => {
              const st = STATUS_LABELS[v.status] || STATUS_LABELS.ativo;
              const seguroExp = isExpired(v.seguro_validade);
              const seguroWarn = isExpiring(v.seguro_validade);
              const licExp = isExpired(v.licenciamento_validade);
              const licWarn = isExpiring(v.licenciamento_validade);
              return (
                <div key={v.id} className="bg-card border border-border rounded-2xl p-5 cursor-pointer hover:shadow-md transition-shadow" onClick={() => openEdit(v)}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Car size={18} className="text-primary" />
                      <span className="font-bold text-foreground text-sm">{v.marca} {v.modelo}</span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${st.color}`}>{st.label}</span>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p><span className="font-semibold text-foreground">Placa:</span> {v.placa} {v.ano ? `· ${v.ano}` : ""}</p>
                    <p><span className="font-semibold text-foreground">Tipo:</span> {v.tipo} · {v.combustivel} · {v.capacidade} passageiros</p>
                    {v.quilometragem > 0 && <p><span className="font-semibold text-foreground">KM:</span> {v.quilometragem.toLocaleString()}</p>}
                  </div>
                  <div className="mt-3 space-y-1">
                    {v.seguro_validade && (
                      <div className={`flex items-center gap-1 text-xs ${seguroExp ? "text-destructive" : seguroWarn ? "text-secondary" : "text-muted-foreground"}`}>
                        {seguroExp ? <AlertTriangle size={12} /> : <CheckCircle size={12} />}
                        Seguro: {v.seguro_validade} {seguroExp && "(VENCIDO)"}
                      </div>
                    )}
                    {v.licenciamento_validade && (
                      <div className={`flex items-center gap-1 text-xs ${licExp ? "text-destructive" : licWarn ? "text-secondary" : "text-muted-foreground"}`}>
                        {licExp ? <AlertTriangle size={12} /> : <CheckCircle size={12} />}
                        Licenciamento: {v.licenciamento_validade} {licExp && "(VENCIDO)"}
                      </div>
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

export default AdminSGSVeiculos;
