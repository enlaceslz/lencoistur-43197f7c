import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Search, Truck, AlertTriangle, ShieldCheck } from "lucide-react";
import { toast } from "@/hooks/use-toast";

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
    <AdminLayout title="SGS - Monitoramento de Fornecedores">
      <div className="space-y-6">
        <div className="flex justify-between gap-4">
          <p className="text-sm text-muted-foreground">Controle de documentação e conformidade de fornecedores</p>
          <button onClick={() => setShowForm(!showForm)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2">
            <Plus size={16} /> Novo Fornecedor
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
            <div key={s.id} className={`bg-card border rounded-2xl p-5 ${s.blocked ? "border-destructive" : "border-border"}`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${s.blocked ? "bg-destructive/10" : "bg-primary/10"}`}>
                    {s.blocked ? <AlertTriangle size={20} className="text-destructive" /> : <ShieldCheck size={20} className="text-primary" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground">{s.supplier_name}</h4>
                    <p className="text-xs text-muted-foreground">{TYPES[s.supplier_type]} {s.blocked && `• ⛔ ${s.block_reason}`}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[s.status]}`}>{s.status}</span>
              </div>
              <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                <span>📄 Doc: {s.documentation_ok ? "✅" : "❌"}</span>
                <span>🔧 Revisão: {s.vehicle_inspection_ok ? "✅" : "❌"}</span>
                {s.certification_expiry && <span>📅 Validade: {new Date(s.certification_expiry + "T12:00").toLocaleDateString("pt-BR")}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSGSFornecedores;
