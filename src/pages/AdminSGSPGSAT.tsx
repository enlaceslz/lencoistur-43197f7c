import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { FileText, Plus, Download, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
    try {
      await supabase.from("sgs_pgsat").update({ status }).eq("id", id);
    } catch {
      toast({ title: "Erro ao atualizar status", variant: "destructive" });
      return;
    }
    toast({ title: `Status atualizado para ${status}` });
    load();
  };

  return (
    <AdminLayout title="SGS — PGSAT (ICMBio)">
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="glass-card p-8 rounded-[2.5rem] border border-border/50 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-primary/10 transition-all duration-700" />
          
          <div className="flex items-center gap-6 relative z-10">
            <div className="p-4 rounded-3xl bg-primary/10 text-primary shadow-inner">
              <Shield size={32} strokeWidth={2.5} />
            </div>
            <div className="max-w-xl">
              <h2 className="text-xl md:text-2xl font-black text-foreground tracking-tight">Plano de Gestão de Segurança (PGSAT)</h2>
              <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mt-2 leading-relaxed opacity-70">
                Compilado oficial para o ICMBio contendo análise de riscos, rotas, frotas e competências.
              </p>
            </div>
          </div>
          <button 
            onClick={() => setShowForm(!showForm)} 
            className="relative z-10 w-full md:w-auto flex items-center justify-center gap-3 px-8 h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-primary/30 transition-all active:scale-95"
          >
            <Plus size={24} strokeWidth={3} /> Gerar Novo PGSAT
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
                <div key={d.id} className="bg-card border border-border rounded-[2.5rem] p-8 hover:shadow-2xl hover:border-primary/30 transition-all group admin-card-hover relative overflow-hidden">
                  <div className={`absolute top-0 left-0 w-2 h-full transition-colors ${d.status === "vigente" ? "bg-emerald-500" : "bg-primary"}`} />
                  
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h4 className="font-display font-black text-xl text-foreground group-hover:text-primary transition-colors">{d.titulo}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Versão {d.versao}</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Emitido em {new Date(d.data_emissao + "T12:00").toLocaleDateString("pt-BR")}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className={`font-black text-[10px] px-4 py-1.5 rounded-full border shadow-sm ${d.status === "vigente" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-primary/5 text-primary border-primary/20"}`}>
                      {d.status.toUpperCase()}
                    </Badge>
                  </div>

                  {content && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                      {[
                        { label: "Riscos", val: content.riscos_ativos, icon: Shield },
                        { label: "Rotas", val: content.rotas_ativas, icon: FileText },
                        { label: "Frota", val: content.veiculos_ativos, icon: FileText },
                        { label: "Condutores", val: content.condutores_ativos, icon: FileText }
                      ].map((item, i) => (
                        <div key={i} className="bg-muted/30 border border-border/50 rounded-2xl p-4 text-center group/item hover:bg-white hover:shadow-lg transition-all">
                          <p className="text-2xl font-black text-foreground font-display mb-1">{item.val || 0}</p>
                          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{item.label}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-4 pt-6 border-t border-border/50">
                    {d.status === "emitido" && (
                      <button onClick={() => updateStatus(d.id, "vigente")} className="h-10 px-6 bg-primary text-primary-foreground rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all">Ativar como Vigente</button>
                    )}
                    {d.status === "vigente" && (
                      <button onClick={() => updateStatus(d.id, "revogado")} className="h-10 px-6 bg-destructive/10 text-destructive rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-destructive hover:text-white transition-all">Revogar Documento</button>
                    )}
                    <button className="h-10 px-6 bg-muted text-muted-foreground rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-muted/80 transition-all flex items-center gap-2">
                      <Download size={14} /> Baixar PDF
                    </button>
                    {d.responsavel && (
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-auto">
                        Assinado por: <span className="text-foreground">{d.responsavel}</span>
                      </span>
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

export default AdminSGSPGSAT;
