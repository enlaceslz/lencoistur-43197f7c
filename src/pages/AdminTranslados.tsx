import { memo, useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Car, MapPin, Clock, Users, Plus, Pencil, Trash2, Search, Loader2, Percent, Eye, ArrowRight, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn, formatCurrency } from "@/lib/utils";
import { NumericFormat } from "react-number-format";

const emptyForm = {
  origin: "", destination: "", duration: "", distance: "",
  price: 0, partner_price: 0, vehicle_type: "Van Executiva", seats: 10,
  departures: "", active: true, pix_discount: 0,
};

const TransladoCard = memo(({
  id, origin, destination, active, vehicle_type, duration,
  price, pix_discount, partner_price,
  onDetail, onEdit, onDelete,
}: {
  id: string; origin: string; destination: string; active: boolean;
  vehicle_type: string; duration: string; price: number;
  pix_discount: number; partner_price: number;
  onDetail: () => void; onEdit: () => void; onDelete: () => void;
}) => (
  <div className="bg-white border border-border shadow-sm rounded-lg overflow-hidden group transition-none">
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4 bg-primary/5 p-3 rounded-lg flex-1 group-hover:bg-primary/10 transition-none">
          <div className="flex flex-col items-center">
            <p className="text-xs font-black text-primary/40 uppercase tracking-tighter leading-none mb-1">DE</p>
            <p className="font-black text-base text-foreground tracking-tight">{origin}</p>
          </div>
          <ArrowRight className="text-primary/30 mx-auto" size={16} strokeWidth={3} />
          <div className="flex flex-col items-center text-right">
            <p className="text-xs font-black text-primary/40 uppercase tracking-tighter leading-none mb-1">PARA</p>
            <p className="font-black text-base text-foreground tracking-tight">{destination}</p>
          </div>
        </div>
        <Badge
          className={cn(
            "ml-4 rounded-lg px-3 py-1.5 font-black text-[9px] uppercase tracking-widest border-none shadow-sm",
            active
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
              : "bg-muted text-muted-foreground"
          )}
        >
          {active ? "Ativa" : "Inativa"}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-border group/item">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
            <Car size={14} />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 leading-none mb-1">Veículo</p>
            <p className="text-xs font-bold text-foreground line-clamp-1">{vehicle_type}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-border group/item">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
            <Clock size={14} />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 leading-none mb-1">Duração</p>
            <p className="text-xs font-bold text-foreground">{duration || "\u2014"}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-6 border-t border-border/40">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 block mb-1">Valor por Vaga</span>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-foreground tracking-tighter">{formatCurrency(price)}</p>
            {pix_discount > 0 && (
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-none font-black text-[9px] px-1.5 h-4">
                -{pix_discount}% PIX
              </Badge>
            )}
          </div>
          {partner_price > 0 && (
            <p className="text-[10px] font-bold text-primary mt-1">Parceiro: {formatCurrency(partner_price)}</p>
          )}
        </div>
        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onDetail}
                  className="h-11 w-11 rounded-lg bg-slate-50 hover:bg-primary hover:text-white transition-none border border-border shadow-sm active:scale-95"
                >
                  <Eye size={18} />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-primary text-white font-black text-[10px] px-4 py-2 rounded-lg shadow-md">Detalhes</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onEdit}
                  className="h-11 w-11 rounded-lg bg-slate-50 hover:bg-amber-500 hover:text-white transition-none border border-border shadow-sm active:scale-95"
                >
                  <Pencil size={18} />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-amber-500 text-white font-black text-[10px] px-4 py-2 rounded-lg shadow-md">Editar</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onDelete}
                  className="h-11 w-11 rounded-lg bg-slate-50 hover:bg-rose-500 hover:text-white transition-none border border-border shadow-sm active:scale-95 text-rose-500/60"
                >
                  <Trash2 size={18} />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-rose-500 text-white font-black text-[10px] px-4 py-2 rounded-lg shadow-md">Excluir</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  </div>
));

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
    try {
      const { data, error } = await supabase.from("transfer_routes").select("id, origin, destination, duration, distance, price, partner_price, vehicle_type, seats, departures, active, pix_discount").order("origin");
      if (error) {
        console.error("Erro ao carregar translados:", error);
        toast.error("Erro ao carregar rotas");
      } else {
        setRoutes(data || []);
      }
    } catch (err) {
      toast.error("Erro ao carregar dados");
    }
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
      price: r.price, partner_price: r.partner_price || 0,
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
      partner_price: Number(form.partner_price) || 0,
      vehicle_type: form.vehicle_type.trim(),
      seats: Number(form.seats) || 10,
      departures: form.departures.split(",").map(d => d.trim()).filter(Boolean),
      active: form.active,
      pix_discount: Math.max(0, Math.min(50, Number(form.pix_discount) || 0)),
    };

    try {
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
    } catch (err) {
      toast.error("Erro ao salvar rota");
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const { error } = await supabase.from("transfer_routes").delete().eq("id", deleteId);
      if (error) {
        toast.error("Erro ao excluir rota.");
      } else {
        toast.success("Rota excluída.");
        load();
      }
    } catch (err) {
      toast.error("Erro ao excluir rota");
    }
    setDeleteId(null);
  };

  const activeRoutes = routes.filter(r => r.active);
  const filtered = routes.filter(r => {
    const q = search.toLowerCase();
    return (r.origin || "").toLowerCase().includes(q) || (r.destination || "").toLowerCase().includes(q) || (r.vehicle_type || "").toLowerCase().includes(q);
  });

  return (
    <AdminLayout title="Translados">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          label="Rede de Logística"
          value={routes.length}
          icon={Car}
          iconClassName="text-white bg-blue-500"
          blurClassName="bg-blue-500/5"
          desc="Total de rotas"
        />
        <StatCard
          label="Capacidade Operacional"
          value={routes.reduce((acc, r) => acc + (r.seats || 0), 0)}
          icon={Users}
          iconClassName="text-white bg-emerald-500"
          blurClassName="bg-emerald-500/5"
          desc="Vagas totais"
        />
        <StatCard
          label="Hubs Atendidos"
          value={new Set(routes.flatMap(t => [t.origin, t.destination])).size}
          icon={MapPin}
          iconClassName="text-white bg-amber-500"
          blurClassName="bg-amber-500/5"
          desc="Cidades/Pontos"
        />
        <StatCard
          label="Ticket Médio"
          value={formatCurrency(routes.length > 0 ? routes.reduce((acc, r) => acc + r.price, 0) / routes.length : 0)}
          icon={Percent}
          iconClassName="text-white bg-purple-500"
          blurClassName="bg-purple-500/5"
          desc="Média por vaga"
        />
      </div>

      <Card className="mb-8 border border-border shadow-sm overflow-hidden rounded-lg">
        <CardContent className="p-8">
          <div className="flex flex-col xl:flex-row gap-8 items-center justify-between">
            <div className="relative flex-1 w-full group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-primary" size={20} />
              <Input 
                placeholder="Buscar por origem, destino ou veículo..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                className="pl-14 h-14 rounded-lg border-border bg-slate-50 focus:bg-white focus:ring-0 focus:border-primary transition-none font-semibold" 
              />
            </div>
            
            <Button 
              onClick={openNew}
              className="w-full xl:w-auto h-14 px-8 rounded-lg bg-primary hover:bg-primary/90 transition-none font-black text-[11px] uppercase tracking-[0.2em]"
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
          <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">Carregando rotas...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(route => (
            <TransladoCard
              key={route.id}
              id={route.id}
              origin={route.origin}
              destination={route.destination}
              active={route.active}
              vehicle_type={route.vehicle_type}
              duration={route.duration}
              price={route.price}
              pix_discount={route.pix_discount}
              partner_price={route.partner_price}
              onDetail={() => setDetailRoute(route)}
              onEdit={() => openEdit(route)}
              onDelete={() => setDeleteId(route.id)}
            />
          ))}

          {filtered.length === 0 && (
            <div className="col-span-full h-80 flex flex-col items-center justify-center space-y-6 bg-slate-50 rounded-lg border-2 border-dashed border-border">
              <div className="w-20 h-20 rounded-lg bg-muted/20 flex items-center justify-center text-muted-foreground/40 shadow-inner">
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
        <DialogContent className="sm:max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl rounded-lg overflow-hidden bg-[#F8FAFC]">
          <div className="bg-white border-b border-slate-100 p-4 md:p-6 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Car size={20} className="md:w-6 md:h-6" />
              </div>
              <div>
                <DialogTitle className="text-lg md:text-xl font-black text-slate-900 leading-none mb-1">
                  {editingId ? "Editar Rota" : "Nova Rota de Translado"}
                </DialogTitle>
                <p className="text-[11px] md:text-sm text-slate-500 font-medium line-clamp-1">Configure os detalhes da logística e valores</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setShowForm(false)} className="rounded-full hover:bg-slate-100">
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
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Preço Site (R$) *</Label>
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
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-primary/60 tracking-widest ml-1">Preço Parceiro (R$)</Label>
                <NumericFormat
                  value={form.partner_price / 100}
                  onValueChange={(values) => setForm({ ...form, partner_price: Math.round((values.floatValue || 0) * 100) })}
                  thousandSeparator="."
                  decimalSeparator=","
                  prefix="R$ "
                  className="flex h-12 w-full px-4 rounded-xl border border-primary/20 bg-primary/5 focus:bg-white transition-all font-black text-primary outline-none focus:ring-2 focus:ring-primary/20"
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
                  <p className="font-black text-3xl tracking-tighter">{formatCurrency(detailRoute.price)}</p>
                </div>
                {detailRoute.pix_discount > 0 && (
                  <div className="text-right">
                    <Badge variant="secondary" className="bg-white/20 text-white border-none font-black text-[10px] px-3 py-1 mb-2 backdrop-blur-md uppercase tracking-widest">
                      -{detailRoute.pix_discount}% NO PIX
                    </Badge>
                    <p className="text-lg font-black tracking-tight">
                      {formatCurrency(Math.round(detailRoute.price * (1 - detailRoute.pix_discount / 100)))}
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
