import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Search, AlertCircle, Pencil, Trash2, MapPin, Clock, Calendar, Shield, Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

const SEVERITY: Record<string, { label: string; color: string }> = {
  baixa: { label: "Baixa", color: "bg-muted text-muted-foreground" },
  media: { label: "Média", color: "bg-secondary/10 text-secondary" },
  alta: { label: "Alta", color: "bg-destructive/10 text-destructive" },
  critica: { label: "Crítica", color: "bg-destructive text-destructive-foreground" },
};

const TYPE_LABELS: Record<string, string> = {
  sem_ocorrencia: "Sem Ocorrência",
  incidente: "Incidente",
  quase_incidente: "Quase Incidente",
  acidente: "Acidente",
  outras_anomalias: "Outras Anomalias",
};

const STATUS_COLORS: Record<string, string> = {
  aberto: "bg-secondary/10 text-secondary",
  investigando: "bg-primary/10 text-primary",
  resolvido: "bg-muted text-muted-foreground",
  fechado: "bg-muted text-muted-foreground",
};

const emptyForm = {
  type: "incidente", location: "", guide_name: "", description: "", severity: "media",
  people_involved: "", action_taken: "", tour_id: "" as string, booking_id: "" as string,
  date: new Date().toISOString().slice(0, 16),
  lessons_learned: "", pre_activated: false,
};

interface TourOpt { id: string; name: string; }
interface BookingOpt { id: string; booking_code: string; item_name: string; }

const AdminSGSIncidentes = () => {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [tours, setTours] = useState<TourOpt[]>([]);
  const [bookings, setBookings] = useState<BookingOpt[]>([]);

  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (!showForm) return;
    Promise.all([
      supabase.from("tours").select("id, name").eq("active", true).order("name"),
      supabase.from("bookings").select("id, booking_code, item_name").order("created_at", { ascending: false }).limit(50)
    ]).then(([{ data: tData }, { data: bData }]) => {
      if (tData) setTours(tData);
      if (bData) setBookings(bData.map(b => ({ id: b.id, booking_code: b.booking_code, item_name: b.item_name })));
    });
  }, [showForm]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("sgs_incidents").select("*, tours(name), bookings(booking_code)").order("date", { ascending: false });
    setIncidents(data || []);
    setLoading(false);
  };

  const openEdit = (inc: any) => {
    setEditing(inc);
    setForm({
      type: inc.type, location: inc.location, guide_name: inc.guide_name || "",
      description: inc.description, severity: inc.severity,
      people_involved: inc.people_involved || "", action_taken: inc.action_taken || "",
      tour_id: inc.tour_id || "",
      booking_id: inc.booking_id || "",
      date: new Date(inc.date).toISOString().slice(0, 16),
      lessons_learned: inc.lessons_learned || "",
      pre_activated: !!inc.pre_activated,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este incidente?")) return;
    await supabase.from("sgs_incidents").delete().eq("id", id);
    toast({ title: "Incidente excluído." });
    load();
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("sgs_incidents").update({ status }).eq("id", id);
    toast({ title: `Status atualizado para: ${status}` });
    load();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const submitData: any = { ...form };
    if (!submitData.tour_id) delete submitData.tour_id;
    if (!submitData.booking_id) delete submitData.booking_id;

    if (editing) {
      const { error } = await supabase.from("sgs_incidents").update(submitData).eq("id", editing.id);
      if (error) { toast({ title: "Erro ao atualizar", variant: "destructive" }); return; }
      toast({ title: "Incidente atualizado!" });
    } else {
      const code = `INC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, "0")}`;
      const { error } = await supabase.from("sgs_incidents").insert({ incident_code: code, ...submitData });
      if (error) { toast({ title: "Erro ao registrar incidente", variant: "destructive" }); return; }
      toast({ title: "Incidente registrado!" });

      // Auto corrective action for alta/critica (P3 link)
      if (form.severity === "alta" || form.severity === "critica") {
        await supabase.from("sgs_corrective_actions").insert({
          action_code: `AC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, "0")}`,
          description: `Ação corretiva para ${form.severity === "critica" ? "ACIDENTE CRÍTICO" : "incidente grave"}: ${form.description.slice(0, 100)}`,
          responsible: form.guide_name || "A definir",
          due_date: new Date(Date.now() + (form.severity === "critica" ? 3 : 7) * 86400000).toISOString().split("T")[0],
        });
        toast({ title: "⚠️ Ação corretiva gerada automaticamente (P3)" });
      }
    }

    setShowForm(false);
    setEditing(null);
    setForm(emptyForm);
    load();
  };

  const filtered = incidents.filter((i) => {
    const matchSearch = !search || i.description?.toLowerCase().includes(search.toLowerCase()) || i.location?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "todos" || i.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const summary = {
    total: incidents.length,
    abertos: incidents.filter(i => i.status === "aberto" || i.status === "investigando").length,
    graves: incidents.filter(i => i.severity === "alta" || i.severity === "critica").length,
    preventivos: incidents.filter(i => i.type === "quase_incidente" || i.type === "sem_ocorrencia").length,
  };

  return (
    <AdminLayout title="SGS - Relatos de Ocorrências">
      <div className="space-y-6">
        {/* Modern Summary Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[
            { label: "Histórico Total", value: summary.total, icon: AlertCircle, color: "from-slate-500 to-slate-700", desc: "Banco de dados" },
            { label: "Em Tratamento", value: summary.abertos, icon: Clock, color: "from-amber-500 to-orange-600", desc: "Ação necessária" },
            { label: "Eventos Críticos", value: summary.graves, icon: Shield, color: "from-rose-500 to-pink-600", desc: "Alta severidade" },
            { label: "Relatos Preventivos", value: summary.preventivos, icon: Activity, color: "from-emerald-500 to-teal-600", desc: "Quase incidentes" },
          ].map((stat, i) => (
            <div key={i} className="glass-card admin-card-hover rounded-[2rem] p-6 relative overflow-hidden group">
              <div className={`absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br ${stat.color} opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity`} />
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white shadow-lg`}>
                  <stat.icon size={22} strokeWidth={2.5} />
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">{stat.desc}</div>
              </div>
              <p className="text-2xl font-black text-foreground tracking-tighter">{stat.value}</p>
              <p className="text-[10px] font-black text-muted-foreground mt-1 uppercase tracking-[0.2em]">{stat.label}</p>
            </div>
          ))}
        </div>


        <div className="flex flex-col xl:flex-row gap-6 items-center justify-between glass-card p-8 rounded-[2.5rem] mb-10 animate-in-fade border border-white/20 shadow-xl shadow-black/5" style={{ animationDelay: '0.1s' }}>
          <div className="flex flex-col md:flex-row gap-3 flex-1 w-full">
            <div className="relative flex-1 group">
              <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-primary transition-colors" />
              <input 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                placeholder="Buscar incidentes por descrição ou local..."
                className="w-full pl-14 pr-4 h-14 bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-2xl text-sm font-semibold outline-none focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-muted-foreground/40" 
              />
            </div>
            
            <select 
              value={filterStatus} 
              onChange={e => setFilterStatus(e.target.value)}
              className="h-14 px-6 bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-2xl text-sm font-bold text-foreground outline-none focus:ring-4 focus:ring-primary/10 transition-all"
            >
              <option value="todos">Todos status</option>
              <option value="aberto">Aberto</option>
              <option value="investigando">Investigando</option>

              <option value="resolvido">Resolvido</option>
              <option value="fechado">Fechado</option>
            </select>
          </div>
          <button 
            onClick={() => { setEditing(null); setForm(emptyForm); setShowForm(!showForm); }}
            className="bg-destructive hover:bg-destructive/90 text-white px-8 h-14 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-destructive/20 transition-all active:scale-95 flex items-center gap-3"
          >
            <Plus size={18} strokeWidth={3} /> Registrar Ocorrência
          </button>

        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="glass-card border-none rounded-[2.5rem] p-8 space-y-8 animate-in-slide-down mb-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5"><Activity size={120} className="text-destructive" /></div>
            
            <div>
              <h3 className="text-xl font-black text-foreground uppercase tracking-tight flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive shadow-inner">
                  <Activity size={20} strokeWidth={3} />
                </div>
                {editing ? "Editar" : "Registrar"} Relato de Ocorrência
              </h3>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-2 ml-13">Padrão ABNT ISO 21101 (Seção P5)</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Tipo de Ocorrência *</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full h-12 bg-muted/30 border border-border/40 rounded-xl px-4 text-sm font-bold text-foreground outline-none focus:ring-4 focus:ring-primary/10 transition-all">
                  {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Data e Hora *</label>
                <input required type="datetime-local" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full h-12 bg-muted/30 border border-border/40 rounded-xl px-4 text-sm font-bold text-foreground outline-none focus:ring-4 focus:ring-primary/10 transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Passeio Relacionado</label>
                <select value={form.tour_id} onChange={(e) => setForm({ ...form, tour_id: e.target.value })}
                  className="w-full h-12 bg-muted/30 border border-border/40 rounded-xl px-4 text-sm font-bold text-foreground outline-none focus:ring-4 focus:ring-primary/10 transition-all">
                  <option value="">Nenhum</option>
                  {tours.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Reserva Relacionada</label>
                <select value={form.booking_id} onChange={(e) => setForm({ ...form, booking_id: e.target.value })}
                  className="w-full h-12 bg-muted/30 border border-border/40 rounded-xl px-4 text-sm font-bold text-foreground outline-none focus:ring-4 focus:ring-primary/10 transition-all">
                  <option value="">Nenhuma</option>
                  {bookings.map(b => <option key={b.id} value={b.id}>{b.booking_code} - {b.item_name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Local do Incidente *</label>
                <input required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full h-12 bg-muted/30 border border-border/40 rounded-xl px-4 text-sm font-bold text-foreground outline-none focus:ring-4 focus:ring-primary/10 transition-all" placeholder="Ex: Lagoa Azul, Dunas" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Gravidade *</label>
                <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}
                  className="w-full h-12 bg-muted/30 border border-border/40 rounded-xl px-4 text-sm font-bold text-foreground outline-none focus:ring-4 focus:ring-primary/10 transition-all">
                  {Object.entries(SEVERITY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Condutor Responsável</label>
                <input value={form.guide_name} onChange={(e) => setForm({ ...form, guide_name: e.target.value })}
                  className="w-full h-12 bg-muted/30 border border-border/40 rounded-xl px-4 text-sm font-bold text-foreground outline-none focus:ring-4 focus:ring-primary/10 transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Pessoas Envolvidas (Vítimas)</label>
                <input value={form.people_involved} onChange={(e) => setForm({ ...form, people_involved: e.target.value })}
                  className="w-full h-12 bg-muted/30 border border-border/40 rounded-xl px-4 text-sm font-bold text-foreground outline-none focus:ring-4 focus:ring-primary/10 transition-all" placeholder="Nomes e idades" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Ação Tomada / Resposta</label>
                <input value={form.action_taken} onChange={(e) => setForm({ ...form, action_taken: e.target.value })}
                  className="w-full h-12 bg-muted/30 border border-border/40 rounded-xl px-4 text-sm font-bold text-foreground outline-none focus:ring-4 focus:ring-primary/10 transition-all" placeholder="Primeiros socorros, resgate..." />
              </div>

              <div className="flex items-center gap-3 pt-6 bg-destructive/5 p-4 rounded-xl border border-destructive/10">
                <input type="checkbox" id="pre_activated" checked={form.pre_activated} onChange={(e) => setForm({ ...form, pre_activated: e.target.checked })}
                  className="w-5 h-5 rounded border-border text-destructive focus:ring-destructive/30" />
                <label htmlFor="pre_activated" className="text-sm font-black text-destructive uppercase tracking-widest cursor-pointer select-none flex items-center gap-2">
                  🚨 PRE Ativado (Protocolo de Resposta a Emergência)
                </label>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Descrição (Fatos e Circunstâncias) *</label>
                <textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4}
                  className="w-full bg-muted/30 border border-border/40 rounded-xl px-4 py-3 text-sm font-bold text-foreground outline-none resize-none focus:ring-4 focus:ring-primary/10 transition-all" 
                  placeholder="Relato detalhado do que aconteceu..." />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Lições Aprendidas (Prevenção)</label>
                <textarea value={form.lessons_learned} onChange={(e) => setForm({ ...form, lessons_learned: e.target.value })} rows={4}
                  className="w-full bg-muted/30 border border-border/40 rounded-xl px-4 py-3 text-sm font-bold text-foreground outline-none resize-none focus:ring-4 focus:ring-primary/10 transition-all" 
                  placeholder="O que aprendemos para evitar reincidência?" />
              </div>
            </div>
            <div className="flex gap-4 pt-6 border-t border-border/50">

              <button type="submit" className="flex-1 h-14 bg-destructive hover:bg-destructive/90 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-destructive/20 transition-all active:scale-95">
                {editing ? "Salvar Alterações" : "Registrar Ocorrência Agora"}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="px-10 h-14 bg-muted text-muted-foreground rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all">
                Cancelar
              </button>
            </div>
          </form>
        )}


        {/* List */}
        <div className="space-y-3">
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Carregando...</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <AlertCircle size={48} className="mx-auto text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground">Nenhum incidente registrado</p>
            </div>
          ) : filtered.map((inc) => (
            <div key={inc.id} className="glass-card admin-card-hover rounded-[2.5rem] p-8 group relative overflow-hidden flex flex-col border border-border/50 transition-all">
              <div className={`absolute top-0 left-0 w-2 h-full transition-colors ${inc.severity === 'critica' || inc.severity === 'alta' ? 'bg-destructive' : 'bg-primary'}`} />
              
              <div className="flex flex-col lg:flex-row justify-between gap-6">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono text-[10px] font-black text-muted-foreground tracking-tighter uppercase px-2 py-0.5 bg-muted/50 rounded-lg border border-border/40">{inc.incident_code}</span>
                    <Badge variant="outline" className={`font-black text-[9px] uppercase px-3 py-1 rounded-full border shadow-sm ${SEVERITY[inc.severity]?.color}`}>
                      Gravidade {SEVERITY[inc.severity]?.label}
                    </Badge>
                    <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-muted/50 text-muted-foreground border border-border/40">{TYPE_LABELS[inc.type] || inc.type}</span>
                    <Badge variant="secondary" className={`font-black text-[9px] uppercase px-3 py-1 rounded-full border ${STATUS_COLORS[inc.status] || ""}`}>
                      {inc.status}
                    </Badge>
                    {inc.pre_activated && <span className="px-3 py-1 rounded-full text-[9px] font-black bg-destructive text-white animate-pulse shadow-lg shadow-destructive/20">🚨 PRE ATIVADO</span>}
                  </div>

                  <div>
                    <p className="text-lg font-black text-foreground group-hover:text-primary transition-colors leading-tight mb-2">{inc.description}</p>
                    <div className="flex items-center gap-4 flex-wrap text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      <span className="flex items-center gap-1.5"><Calendar size={12} className="text-primary" /> {new Date(inc.date).toLocaleDateString("pt-BR")}</span>
                      <span className="flex items-center gap-1.5"><MapPin size={12} className="text-primary" /> {inc.location}</span>
                      {inc.guide_name && <span className="flex items-center gap-1.5"><Shield size={12} className="text-primary" /> Condutor: {inc.guide_name}</span>}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    {inc.tours?.name && (
                      <div className="bg-muted/30 p-3 rounded-2xl border border-border/50">
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Passeio</p>
                        <p className="text-xs font-black text-foreground">{inc.tours.name}</p>
                      </div>
                    )}
                    {inc.bookings?.booking_code && (
                      <div className="bg-primary/5 p-3 rounded-2xl border border-primary/10">
                        <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">Reserva Relacionada</p>
                        <p className="text-xs font-black text-primary">{inc.bookings.booking_code}</p>
                      </div>
                    )}
                  </div>

                  {inc.people_involved && (
                    <div className="bg-muted/30 p-4 rounded-2xl border border-border/50">
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">👥 Envolvidos / Vítimas</p>
                      <p className="text-xs font-medium text-foreground">{inc.people_involved}</p>
                    </div>
                  )}

                  {inc.action_taken && (
                    <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                      <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-2 flex items-center gap-2">✅ Resposta Imediata</p>
                      <p className="text-xs font-black text-emerald-900 leading-relaxed">{inc.action_taken}</p>
                    </div>
                  )}

                  {inc.lessons_learned && (
                    <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100">
                      <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-2 flex items-center gap-2">💡 Lições Aprendidas</p>
                      <p className="text-xs font-medium text-amber-900 italic leading-relaxed">"{inc.lessons_learned}"</p>
                    </div>
                  )}
                </div>

                <div className="lg:w-48 flex flex-col gap-3 pt-4 lg:pt-0 lg:border-l border-border/40 lg:pl-6 justify-center">
                  {inc.status === "aberto" && (
                    <button onClick={() => updateStatus(inc.id, "investigando")} className="w-full h-10 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all">Investigar</button>
                  )}
                  {(inc.status === "aberto" || inc.status === "investigando") && (
                    <button onClick={() => updateStatus(inc.id, "resolvido")} className="w-full h-10 rounded-xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all">Resolver</button>
                  )}
                  <div className="flex gap-2 w-full mt-2">
                    <button onClick={() => openEdit(inc)} className="flex-1 h-10 rounded-xl bg-muted text-muted-foreground flex items-center justify-center hover:bg-muted/80 transition-all">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => handleDelete(inc.id)} className="flex-1 h-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive hover:text-white transition-all">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSGSIncidentes;
