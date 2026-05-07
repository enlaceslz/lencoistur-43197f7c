import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Car, MapPin, Clock, Users, Plus, Pencil, Trash2, Search, Loader2, Percent, Eye, ArrowRight, X, Save, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { NumericFormat } from "react-number-format";

const fmt = (v: number) => `R$ ${(v / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const maskCurrency = (v: string) => {
  const n = v.replace(/\D/g, "");
  return (Number(n) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
};

const parseCurrency = (v: string) => {
  return Number(v.replace(/\D/g, ""));
};

const emptyForm = {
  origin: "", destination: "", duration: "", distance: "",
  price: 0, vehicle_type: "Van Executiva", seats: 10,
  departures: "", active: true, pix_discount: 0,
};

const AdminTranslados = () => {
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [detailRoute, setDetailRoute] = useState<any | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("transfer_routes").select("*").order("origin");
    setRoutes(data || []);
    setLoading(false);
  };

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (r: any) => {
    setEditingId(r.id);
    setForm({
      origin: r.origin, destination: r.destination,
      duration: r.duration || "", distance: r.distance || "",
      price: r.price,
      vehicle_type: r.vehicle_type || "",
      seats: r.seats || 10,
      departures: (r.departures || []).join(", "),
      active: r.active,
      pix_discount: r.pix_discount || 0,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = form.price;
    if (!form.origin.trim() || !form.destination.trim() || priceNum <= 0) {
      toast.error("Preencha origem, destino e preço válido.");
      return;
    }
    setSaving(true);
    const payload = {
      origin: form.origin.trim(),
      destination: form.destination.trim(),
      duration: form.duration.trim(),
      distance: form.distance.trim(),
      price: priceNum,
      vehicle_type: form.vehicle_type.trim(),
      seats: Number(form.seats) || 10,
      departures: form.departures.split(",").map(d => d.trim()).filter(Boolean),
      active: form.active,
      pix_discount: Math.max(0, Math.min(50, Number(form.pix_discount) || 0)),
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from("transfer_routes").update(payload).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("transfer_routes").insert(payload));
    }

    if (error) {
      toast.error("Erro ao salvar rota: " + error.message);
    } else {
      toast.success(editingId ? "Rota atualizada!" : "Rota criada!");
      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
      load();
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("transfer_routes").delete().eq("id", deleteId);
    if (error) {
      toast.error("Erro ao excluir rota.");
    } else {
      toast.success("Rota excluída.");
      load();
    }
    setDeleteId(null);
  };

  const activeRoutes = routes.filter(r => r.active);
  const filtered = routes.filter(r => {
    const q = search.toLowerCase();
    return r.origin.toLowerCase().includes(q) || r.destination.toLowerCase().includes(q) || (r.vehicle_type || "").toLowerCase().includes(q);
  });

  return (
    <AdminLayout title="Translados">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-in-fade" style={{ animationDelay: '0.1s' }}>
        {[
          { label: "Total de Rotas", value: routes.length, icon: Car, color: "from-blue-500 to-indigo-600", desc: "Rede de logística" },
          { label: "Rotas Ativas", value: activeRoutes.length, icon: MapPin, color: "from-emerald-500 to-teal-600", desc: "Em operação" },
          { label: "Destinos", value: new Set(routes.flatMap(t => [t.origin, t.destination])).size, icon: MapPin, color: "from-amber-500 to-orange-600", desc: "Cidades atendidas" },
          { label: "Tipos Veículo", value: new Set(routes.map(t => t.vehicle_type)).size, icon: Users, color: "from-purple-500 to-pink-600", desc: "Diversidade frota" },
        ].map((stat, i) => (
          <div key={i} className="glass-card admin-card-hover rounded-[2rem] p-6 relative overflow-hidden group">
            <div className={`absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br ${stat.color} opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity`} />
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white shadow-lg shadow-primary/10 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                <stat.icon size={22} strokeWidth={2.5} />
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">{stat.desc}</div>
            </div>
            <p className="text-2xl font-black text-foreground tracking-tighter group-hover:translate-x-1 transition-transform">{stat.value}</p>
            <p className="text-[10px] font-black text-muted-foreground mt-1 uppercase tracking-[0.2em]">{stat.label}</p>
          </div>
        ))}
      </div>

      <Card className="mb-8 border-none shadow-2xl shadow-primary/5 overflow-hidden glass-card rounded-[2.5rem] animate-in-fade border border-white/20" style={{ animationDelay: '0.2s' }}>
        <CardContent className="p-8">
          <div className="flex flex-col xl:flex-row gap-8 items-center justify-between">
            <div className="relative flex-1 w-full group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-primary transition-colors" size={20} />
              <Input 
                placeholder="Buscar por origem, destino ou veículo..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                className="pl-14 h-14 rounded-[1.5rem] border-white/40 dark:border-white/10 bg-white/40 dark:bg-black/20 backdrop-blur-xl focus:bg-white/80 dark:focus:bg-black/40 focus:ring-4 focus:ring-primary/10 transition-all font-semibold" 
              />
            </div>
            
            <Button 
              onClick={openNew}
              className="w-full xl:w-auto h-14 px-8 rounded-[1.5rem] bg-gradient-to-r from-primary to-indigo-600 hover:shadow-2xl hover:shadow-primary/30 transition-all font-black text-[11px] uppercase tracking-[0.2em]"
            >
              <Plus size={20} className="mr-2" strokeWidth={3} /> Nova Rota
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Grid of Routes */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <Loader2 className="animate-spin text-primary" size={40} />
          <p className="text-muted-foreground animate-pulse font-bold uppercase tracking-widest text-xs">Carregando rotas...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in-fade" style={{ animationDelay: '0.3s' }}>
          {filtered.map((route, index) => (
            <div 
              key={route.id}
              className="glass-card admin-card-hover rounded-[2.5rem] overflow-hidden border border-white/20 group animate-in-slide-up bg-white/40 dark:bg-black/20 backdrop-blur-xl shadow-2xl shadow-black/5"
              style={{ animationDelay: `${0.05 * (index % 10)}s` }}
            >
              <div className="p-8">
                {/* Card Header - Route */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4 bg-primary/5 p-3 rounded-2xl flex-1 group-hover:bg-primary/10 transition-colors duration-500">
                    <div className="flex flex-col items-center">
                      <p className="text-xs font-black text-primary/40 uppercase tracking-tighter leading-none mb-1">DE</p>
                      <p className="font-black text-base text-foreground tracking-tight">{route.origin}</p>
                    </div>
                    <ArrowRight className="text-primary/30 mx-auto" size={16} strokeWidth={3} />
                    <div className="flex flex-col items-center text-right">
                      <p className="text-xs font-black text-primary/40 uppercase tracking-tighter leading-none mb-1">PARA</p>
                      <p className="font-black text-base text-foreground tracking-tight">{route.destination}</p>
                    </div>
                  </div>
                  <Badge 
                    className={cn(
                      "ml-4 rounded-xl px-3 py-1.5 font-black text-[9px] uppercase tracking-widest border-none shadow-sm",
                      route.active 
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" 
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {route.active ? "Ativa" : "Inativa"}
                  </Badge>
                </div>

                {/* Route Details */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/40 dark:bg-black/20 border border-white/40 dark:border-white/10 group/item">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover/item:scale-110 transition-transform">
                      <Car size={14} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 leading-none mb-1">Veículo</p>
                      <p className="text-xs font-bold text-foreground line-clamp-1">{route.vehicle_type}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/40 dark:bg-black/20 border border-white/40 dark:border-white/10 group/item">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover/item:scale-110 transition-transform">
                      <Clock size={14} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 leading-none mb-1">Duração</p>
                      <p className="text-xs font-bold text-foreground">{route.duration || "—"}</p>
                    </div>
                  </div>
                </div>

                {/* Price and Actions */}
                <div className="flex items-center justify-between pt-6 border-t border-border/40">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 block mb-1">Valor por Vaga</span>
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-black text-foreground tracking-tighter">{fmt(route.price)}</p>
                      {route.pix_discount > 0 && (
                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-none font-black text-[9px] px-1.5 h-4">
                          -{route.pix_discount}% PIX
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setDetailRoute(route)}
                            className="h-11 w-11 rounded-2xl bg-white/50 dark:bg-white/5 hover:bg-primary hover:text-white transition-all duration-500 border border-white/40 dark:border-white/10 shadow-lg active:scale-95"
                          >
                            <Eye size={18} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-primary text-white font-black text-[10px] px-4 py-2 rounded-xl shadow-2xl">Detalhes</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => openEdit(route)}
                            className="h-11 w-11 rounded-2xl bg-white/50 dark:bg-white/5 hover:bg-amber-500 hover:text-white transition-all duration-500 border border-white/40 dark:border-white/10 shadow-lg active:scale-95"
                          >
                            <Pencil size={18} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-amber-500 text-white font-black text-[10px] px-4 py-2 rounded-xl shadow-2xl">Editar</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setDeleteId(route.id)}
                            className="h-11 w-11 rounded-2xl bg-white/50 dark:bg-white/5 hover:bg-rose-500 hover:text-white transition-all duration-500 border border-white/40 dark:border-white/10 shadow-lg active:scale-95 text-rose-500/60"
                          >
                            <Trash2 size={18} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-rose-500 text-white font-black text-[10px] px-4 py-2 rounded-xl shadow-2xl">Excluir</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-full h-80 flex flex-col items-center justify-center space-y-6 bg-white/40 dark:bg-black/20 backdrop-blur-xl rounded-[3rem] border-2 border-dashed border-white/40 dark:border-white/10 animate-pulse">
              <div className="w-20 h-20 rounded-[2rem] bg-muted/20 flex items-center justify-center text-muted-foreground/40 shadow-inner">
                <Car size={40} />
              </div>
              <div className="text-center">
                <p className="text-xl font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-2">Nenhuma rota encontrada</p>
                <p className="text-sm font-bold text-muted-foreground/40">Tente ajustar seus termos de busca ou filtros</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl rounded-3xl overflow-hidden bg-[#F8FAFC]">
          <div className="bg-white border-b border-slate-100 p-4 md:p-6 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <Car size={20} className="md:w-6 md:h-6" />
              </div>
              <div>
                <DialogTitle className="text-lg md:text-xl font-black text-slate-900 leading-none mb-1">
                  {editingId ? "Editar Rota" : "Nova Rota de Translado"}
                </DialogTitle>
                <p className="text-[11px] md:text-sm text-slate-500 font-medium line-clamp-1">Configure os detalhes da logística e valores</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setShowForm(false)} className="rounded-full hover:bg-slate-100 transition-colors">
              <X size={20} className="text-slate-400" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col h-[calc(90vh-80px)]">
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-8">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 mb-2 block ml-1">Origem *</label>
                <Input required value={form.origin} onChange={e => setForm({ ...form, origin: e.target.value })} placeholder="Ex: São Luís" className="h-12 rounded-xl bg-muted/30" />
              </div>
              <div>
                <label className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 mb-2 block ml-1">Destino *</label>
                <Input required value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} placeholder="Ex: Barreirinhas" className="h-12 rounded-xl bg-muted/30" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Preço (R$) *</Label>
                <NumericFormat
                  value={form.price / 100}
                  onValueChange={(values) => setForm({ ...form, price: Math.round(Number(values.floatValue) * 100) })}
                  thousandSeparator="."
                  decimalSeparator=","
                  prefix="R$ "
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 h-12 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 mb-2 block ml-1">Desconto PIX (%)</label>
                <div className="relative">
                  <Input type="number" min={0} max={50} value={form.pix_discount} onChange={e => setForm({ ...form, pix_discount: Number(e.target.value) })} className="h-12 rounded-xl bg-muted/30" />
                  <Percent size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>
              <div>
                <label className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 mb-2 block ml-1">Duração</label>
                <Input value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} placeholder="Ex: 4h30" className="h-12 rounded-xl bg-muted/30" />
              </div>
              <div>
                <label className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 mb-2 block ml-1">Distância</label>
                <Input value={form.distance} onChange={e => setForm({ ...form, distance: e.target.value })} placeholder="Ex: 260 km" className="h-12 rounded-xl bg-muted/30" />
              </div>
              <div>
                <label className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 mb-2 block ml-1">Tipo de Veículo</label>
                <Input value={form.vehicle_type} onChange={e => setForm({ ...form, vehicle_type: e.target.value })} placeholder="Van Executiva" className="h-12 rounded-xl bg-muted/30" />
              </div>
              <div>
                <label className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 mb-2 block ml-1">Vagas</label>
                <Input type="number" min={1} value={form.seats} onChange={e => setForm({ ...form, seats: Number(e.target.value) })} className="h-12 rounded-xl bg-muted/30" />
              </div>
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 mb-2 block ml-1">Horários (vírgula)</label>
                <Input value={form.departures} onChange={e => setForm({ ...form, departures: e.target.value })} placeholder="06:00, 08:00, 12:00" className="h-12 rounded-xl bg-muted/30" />
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-dashed border-border">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} className="rounded w-5 h-5 accent-primary" />
                <span className="text-sm font-bold text-foreground">Disponibilizar rota no site</span>
              </label>
            </div>

            </div>

            <div className="bg-white border-t border-slate-100 p-4 md:p-6 flex gap-3 sticky bottom-0 z-10">
              <Button type="submit" disabled={saving} className="flex-1 h-12 rounded-xl font-black uppercase tracking-widest">
                {saving ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                {editingId ? "Salvar Alterações" : "Criar Nova Rota"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="h-12 rounded-xl font-bold">Cancelar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-500">
              <Trash2 size={20} /> Confirmar Exclusão
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Tem certeza que deseja remover esta rota? Esta ação é irreversível e afetará os cálculos de disponibilidade.
            </p>
          </div>
          <div className="flex gap-3 mt-2">
            <Button variant="destructive" onClick={handleDelete} className="flex-1 font-bold">Excluir Permanente</Button>
            <Button variant="outline" onClick={() => setDeleteId(null)} className="flex-1 font-bold">Manter Rota</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!detailRoute} onOpenChange={() => setDetailRoute(null)}>
        <DialogContent className="sm:max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl rounded-3xl overflow-hidden bg-[#F8FAFC]">
          <div className="bg-white border-b border-slate-100 p-4 md:p-6 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <Car size={20} className="md:w-6 md:h-6" />
              </div>
              <div>
                <DialogTitle className="text-lg md:text-xl font-black text-slate-900 leading-none mb-1">
                  Detalhes da Rota
                </DialogTitle>
                <p className="text-[11px] md:text-sm text-slate-500 font-medium line-clamp-1">Logística, horários e tarifação</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setDetailRoute(null)} className="rounded-full hover:bg-slate-100 transition-colors">
              <X size={20} className="text-slate-400" />
            </Button>
          </div>
          {detailRoute && (
            <div className="p-4 md:p-8 space-y-6 md:space-y-8">
              <div className="flex items-center gap-4 bg-primary/5 rounded-[2rem] p-6 border border-primary/10">
                <div className="text-center flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary/40 mb-1">Origem</p>
                  <p className="font-black text-foreground text-xl tracking-tight">{detailRoute.origin}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-white dark:bg-black/40 flex items-center justify-center shadow-lg">
                  <ArrowRight size={24} className="text-primary" strokeWidth={3} />
                </div>
                <div className="text-center flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary/40 mb-1">Destino</p>
                  <p className="font-black text-foreground text-xl tracking-tight">{detailRoute.destination}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/30 rounded-2xl p-4 border border-border/50">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mb-2 flex items-center gap-1.5"><Clock size={12} /> Duração Estimada</p>
                  <p className="font-bold text-foreground text-base">{detailRoute.duration || "—"}</p>
                </div>
                <div className="bg-muted/30 rounded-2xl p-4 border border-border/50">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mb-2 flex items-center gap-1.5"><MapPin size={12} /> Distância Total</p>
                  <p className="font-bold text-foreground text-base">{detailRoute.distance || "—"}</p>
                </div>
                <div className="bg-muted/30 rounded-2xl p-4 border border-border/50">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mb-2 flex items-center gap-1.5"><Car size={12} /> Modelo Veículo</p>
                  <p className="font-bold text-foreground text-base line-clamp-1">{detailRoute.vehicle_type || "—"}</p>
                </div>
                <div className="bg-muted/30 rounded-2xl p-4 border border-border/50">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mb-2 flex items-center gap-1.5"><Users size={12} /> Capacidade</p>
                  <p className="font-bold text-foreground text-base">{detailRoute.seats} vagas</p>
                </div>
              </div>

              <div className="flex items-center justify-between bg-gradient-to-r from-primary to-indigo-600 rounded-[2rem] p-6 text-white shadow-xl shadow-primary/20">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Tarifa por Vaga</p>
                  <p className="font-black text-3xl tracking-tighter">{fmt(detailRoute.price)}</p>
                </div>
                {detailRoute.pix_discount > 0 && (
                  <div className="text-right">
                    <Badge variant="secondary" className="bg-white/20 text-white border-none font-black text-[10px] px-3 py-1 mb-2 backdrop-blur-md uppercase tracking-widest">
                      -{detailRoute.pix_discount}% NO PIX
                    </Badge>
                    <p className="text-lg font-black tracking-tight">
                      {fmt(Math.round(detailRoute.price * (1 - detailRoute.pix_discount / 100)))}
                    </p>
                  </div>
                )}
              </div>

              {(detailRoute.departures || []).length > 0 && (
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 ml-1">Horários de Partida</p>
                  <div className="flex flex-wrap gap-2">
                    {detailRoute.departures.map((dep: string) => (
                      <span key={dep} className="text-xs bg-muted border border-border/50 text-foreground px-4 py-2 rounded-xl font-black shadow-sm tracking-widest">{dep}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-border/50">
                <Badge className={cn(
                  "rounded-full px-4 py-1.5 font-black text-[10px] uppercase tracking-widest border-none",
                  detailRoute.active ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
                )}>
                  {detailRoute.active ? "Rota em Operação" : "Rota Suspensa"}
                </Badge>
                <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">
                  Criada em {new Date(detailRoute.created_at).toLocaleDateString("pt-BR")}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminTranslados;
