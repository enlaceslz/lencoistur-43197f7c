import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { FileText, Plus, Download, Shield } from "lucide-react";

const AdminSGSPGSAT = () => {
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ titulo: "PGSAT - Plano de Gestão de Segurança", versao: "1.0", responsavel: "", data_validade: "", observacoes: "" });

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("sgs_pgsat").select("*").order("created_at", { ascending: false });
    setDocs(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titulo.trim()) return;

    // Build PGSAT content from existing SGS data
    const [empresa, riscos, rotas, veiculos, condutores] = await Promise.all([
      supabase.from("sgs_empresa").select("*").limit(1).maybeSingle(),
      supabase.from("sgs_risks").select("*").eq("status", "ativo"),
      supabase.from("sgs_rotas").select("*").eq("status", "ativa"),
      supabase.from("sgs_veiculos").select("*").eq("status", "ativo"),
      supabase.from("sgs_condutores").select("*").eq("status", "ativo"),
    ]);

    const conteudo_json = {
      empresa: empresa.data || {},
      riscos_ativos: riscos.data?.length || 0,
      rotas_ativas: rotas.data?.length || 0,
      veiculos_ativos: veiculos.data?.length || 0,
      condutores_ativos: condutores.data?.length || 0,
      gerado_em: new Date().toISOString(),
    };

    const { error } = await supabase.from("sgs_pgsat").insert({
      ...form,
      data_validade: form.data_validade || null,
      conteudo_json,
      status: "emitido",
      data_emissao: new Date().toISOString().split("T")[0],
    });

    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else { toast({ title: "PGSAT gerado com sucesso!" }); setShowForm(false); load(); }
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("sgs_pgsat").update({ status }).eq("id", id);
    toast({ title: `Status atualizado para ${status}` });
    load();
  };

  return (
    <AdminLayout title="SGS — PGSAT (ICMBio)">
      <div className="space-y-6">
        {/* Info card */}
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <Shield size={20} className="text-primary" />
            <h3 className="font-display font-bold text-foreground">Plano de Gestão de Segurança para Atividades Turísticas</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Documento obrigatório conforme normativa do ICMBio para empresas que operam em Unidades de Conservação.
            O PGSAT compila informações da empresa, análise de riscos, rotas, frota e condutores em um documento unificado.
          </p>
        </div>

        <div className="flex justify-end">
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90">
            <Plus size={16} /> Gerar Novo PGSAT
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h3 className="font-display font-bold text-foreground">Gerar PGSAT</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><label className="block text-xs font-medium text-muted-foreground mb-1">Título</label><input value={form.titulo} onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30" /></div>
              <div><label className="block text-xs font-medium text-muted-foreground mb-1">Versão</label><input value={form.versao} onChange={e => setForm(p => ({ ...p, versao: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30" /></div>
              <div><label className="block text-xs font-medium text-muted-foreground mb-1">Responsável</label><input value={form.responsavel} onChange={e => setForm(p => ({ ...p, responsavel: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30" /></div>
              <div><label className="block text-xs font-medium text-muted-foreground mb-1">Data Validade</label><input type="date" value={form.data_validade} onChange={e => setForm(p => ({ ...p, data_validade: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30" /></div>
            </div>
            <p className="text-xs text-muted-foreground bg-muted rounded-lg p-3">
              ⚡ O sistema compilará automaticamente os dados de empresa, riscos ativos, rotas, veículos e condutores no documento PGSAT.
            </p>
            <div className="flex gap-2">
              <button type="submit" className="px-5 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90">Gerar PGSAT</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2 border border-border rounded-xl text-sm">Cancelar</button>
            </div>
          </form>
        )}

        {loading ? <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div> : docs.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground"><FileText size={40} className="mx-auto mb-3 opacity-40" /><p>Nenhum PGSAT gerado</p></div>
        ) : (
          <div className="space-y-3">
            {docs.map(d => {
              const content = d.conteudo_json as any;
              return (
                <div key={d.id} className="bg-card border border-border rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="font-bold text-foreground text-sm">{d.titulo}</span>
                      <span className="text-xs text-muted-foreground ml-2">v{d.versao} · {d.data_emissao}</span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${d.status === "emitido" ? "bg-primary/10 text-primary" : d.status === "vigente" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {d.status}
                    </span>
                  </div>
                  {content && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                      <div className="bg-muted rounded-lg p-2 text-center">
                        <p className="text-lg font-bold text-foreground">{content.riscos_ativos || 0}</p>
                        <p className="text-[10px] text-muted-foreground">Riscos</p>
                      </div>
                      <div className="bg-muted rounded-lg p-2 text-center">
                        <p className="text-lg font-bold text-foreground">{content.rotas_ativas || 0}</p>
                        <p className="text-[10px] text-muted-foreground">Rotas</p>
                      </div>
                      <div className="bg-muted rounded-lg p-2 text-center">
                        <p className="text-lg font-bold text-foreground">{content.veiculos_ativos || 0}</p>
                        <p className="text-[10px] text-muted-foreground">Veículos</p>
                      </div>
                      <div className="bg-muted rounded-lg p-2 text-center">
                        <p className="text-lg font-bold text-foreground">{content.condutores_ativos || 0}</p>
                        <p className="text-[10px] text-muted-foreground">Condutores</p>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2">
                    {d.status === "emitido" && <button onClick={() => updateStatus(d.id, "vigente")} className="text-xs px-3 py-1 bg-primary/10 text-primary rounded-lg hover:bg-primary/20">Marcar como Vigente</button>}
                    {d.status === "vigente" && <button onClick={() => updateStatus(d.id, "revogado")} className="text-xs px-3 py-1 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20">Revogar</button>}
                    {d.responsavel && <span className="text-xs text-muted-foreground ml-auto">Resp.: {d.responsavel}</span>}
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

export default AdminSGSPGSAT;
