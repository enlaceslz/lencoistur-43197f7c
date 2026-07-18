import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Plus, AlertTriangle, ShieldCheck } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const TYPES: Record<string, string> = { veiculo: "Veículo", condutor: "Condutor", parceiro: "Parceiro" };
const STATUS_COLORS: Record<string, string> = {
  regular: "bg-primary/10 text-primary", irregular: "bg-secondary/10 text-secondary",
  bloqueado: "bg-destructive text-destructive-foreground", vencido: "bg-destructive/10 text-destructive",
};

const AdminSGSFornecedores = () => {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    supplier_name: "", supplier_type: "veiculo", documentation_ok: false,
    vehicle_inspection_ok: false, vehicle_inspection_date: "", certification_expiry: "",
  });

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("sgs_supplier_compliance").select("*").order("supplier_name");
    setSuppliers(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isExpired = form.certification_expiry && new Date(form.certification_expiry + "T12:00:00") < today;
    const status = isExpired ? "vencido" : (!form.documentation_ok ? "irregular" : "regular");
    const blocked = status === "vencido" || !form.documentation_ok || !form.vehicle_inspection_ok;

    const { error } = await supabase.from("sgs_supplier_compliance").insert({
      ...form, status, blocked,
      block_reason: blocked ? (isExpired ? "Certificação vencida" : "Documentação incompleta") : null,
    });
    if (error) { toast({ title: "Erro", variant: "destructive" }); return; }
    toast({ title: blocked ? "⚠️ Fornecedor cadastrado como bloqueado" : "Fornecedor cadastrado!" });
    setShowForm(false);
    load();
  };

  return (
    <AdminLayout title="SGS — Monitoramento de Fornecedores">
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="glass-card p-6 rounded-[2.5rem] border border-border/50 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-primary/10 text-primary shadow-inner">
              <ShieldCheck size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl font-black text-foreground tracking-tight">Qualificação de Fornecedores</h2>
              <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mt-1">Controle de Documentação e Conformidade</p>
            </div>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="w-full md:w-auto flex items-center justify-center gap-3 px-8 h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-95"
          >
            <Plus size={20} strokeWidth={3} /> Homologar Fornecedor
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h3 className="font-display font-bold text-foreground">Cadastrar Fornecedor</h3>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Nome *</label>
                <input required value={form.supplier_name} onChange={(e) => setForm({ ...form, supplier_name: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Tipo *</label>
                <select value={form.supplier_type} onChange={(e) => setForm({ ...form, supplier_type: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none">
                  {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Validade Certificação</label>
                <input type="date" value={form.certification_expiry} onChange={(e) => setForm({ ...form, certification_expiry: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" />
              </div>
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input type="checkbox" checked={form.documentation_ok} onChange={(e) => setForm({ ...form, documentation_ok: e.target.checked })} className="rounded" />
                Documentação OK
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input type="checkbox" checked={form.vehicle_inspection_ok} onChange={(e) => setForm({ ...form, vehicle_inspection_ok: e.target.checked })} className="rounded" />
                Revisão Veicular OK
              </label>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-semibold">Salvar</button>
              <button type="button" onClick={() => setShowForm(false)} className="bg-muted text-muted-foreground px-6 py-2.5 rounded-xl text-sm font-semibold">Cancelar</button>
            </div>
          </form>
        )}

        {/* List */}
        <div className="space-y-3">
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Carregando...</p>
          ) : suppliers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum fornecedor cadastrado</p>
          ) : suppliers.map((s) => (
            <div key={s.id} className={`bg-card border rounded-[2rem] p-6 hover:shadow-2xl transition-all group admin-card-hover relative overflow-hidden ${s.blocked ? "border-destructive/50" : "border-border hover:border-primary/30"}`}>
              <div className={`absolute top-0 left-0 w-2 h-full transition-colors ${s.blocked ? "bg-destructive" : "bg-emerald-500"}`} />
              
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner transition-all ${s.blocked ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white"}`}>
                    {s.blocked ? <AlertTriangle size={28} /> : <ShieldCheck size={28} />}
                  </div>
                  <div>
                    <h4 className="font-display font-black text-lg text-foreground group-hover:text-primary transition-colors">{s.supplier_name}</h4>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{TYPES[s.supplier_type] || "Desconhecido"} {s.blocked && <span className="text-destructive ml-1">· ⛔ {s.block_reason}</span>}</p>
                  </div>
                </div>
                <Badge variant="outline" className={`font-black text-[9px] uppercase px-3 py-1 rounded-full border ${STATUS_COLORS[s.status] || ""}`}>
                  {s.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                <div className={`flex flex-col items-center justify-center p-3 rounded-2xl border ${s.documentation_ok ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-destructive/5 border-destructive/10 text-destructive'}`}>
                  <p className="text-[9px] font-black uppercase tracking-tighter mb-1">Documentação</p>
                  <p className="text-[10px] font-black">{s.documentation_ok ? "REGULAR" : "PENDENTE"}</p>
                </div>
                <div className={`flex flex-col items-center justify-center p-3 rounded-2xl border ${s.vehicle_inspection_ok ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-destructive/5 border-destructive/10 text-destructive'}`}>
                  <p className="text-[9px] font-black uppercase tracking-tighter mb-1">Inspeção</p>
                  <p className="text-[10px] font-black">{s.vehicle_inspection_ok ? "APROVADO" : "PENDENTE"}</p>
                </div>
                <div className="flex flex-col items-center justify-center p-3 rounded-2xl border border-border/50 bg-muted/30 col-span-2 sm:col-span-1">
                  <p className="text-[9px] font-black uppercase tracking-tighter mb-1 text-muted-foreground">Validade</p>
                  <p className="text-[10px] font-black text-foreground">{s.certification_expiry ? new Date(s.certification_expiry + "T12:00").toLocaleDateString("pt-BR") : "—"}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSGSFornecedores;
