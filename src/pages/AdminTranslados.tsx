import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Car, MapPin, Clock, Users, Plus, Pencil, Trash2, X, Check, Search, Loader2, Percent, Eye, ArrowRight, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("transfer_routes").update({ active: !current }).eq("id", id);
    load();
  };

  const activeRoutes = routes.filter(r => r.active);
  const filtered = routes.filter(r => {
    const q = search.toLowerCase();
    return r.origin.toLowerCase().includes(q) || r.destination.toLowerCase().includes(q) || (r.vehicle_type || "").toLowerCase().includes(q);
  });

  return (
    <AdminLayout title="Translados">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total de Rotas", value: routes.length, icon: Car, color: "text-primary", bg: "bg-primary/10" },
          { label: "Rotas Ativas", value: activeRoutes.length, icon: Check, color: "text-emerald-600", bg: "bg-emerald-100" },
          { label: "Destinos Atendidos", value: new Set(routes.flatMap(t => [t.origin, t.destination])).size, icon: MapPin, color: "text-amber-600", bg: "bg-amber-100" },
          { label: "Tipos de Veículo", value: new Set(routes.map(t => t.vehicle_type)).size, icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm bg-card hover:shadow-md transition-all">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} shadow-inner`}><stat.icon size={24} strokeWidth={2.5} /></div>
              <div>
                <p className="text-2xl font-black text-foreground leading-none">{stat.value}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-2">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col xl:flex-row gap-4 items-center justify-between mb-8 p-4 sm:p-6 bg-card border border-border rounded-3xl shadow-sm">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
          <Input 
            placeholder="Buscar por origem, destino ou veículo..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="pl-12 h-12 rounded-2xl border-muted-foreground/20 focus:ring-primary/20 bg-muted/30 transition-all text-sm font-medium" 
          />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={openNew}
                  className="flex-1 md:flex-none bg-primary hover:bg-primary/90 text-primary-foreground h-12 px-8 rounded-2xl text-sm font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-primary/20 transition-all active:scale-95"
                >
                  <Plus size={20} strokeWidth={3} /> Nova Rota
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Cadastrar novo trecho de translado</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Rota" : "Nova Rota"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Origem *</label>
                <Input required value={form.origin} onChange={e => setForm({ ...form, origin: e.target.value })} placeholder="São Luís" />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Destino *</label>
                <Input required value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} placeholder="Barreirinhas" />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Preço (R$) *</label>
                <Input 
                  required 
                  value={maskCurrency(String(form.price))} 
                  onChange={e => setForm({ ...form, price: parseCurrency(e.target.value) })} 
                  placeholder="250,00" />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Desconto PIX (%)</label>
                <div className="relative">
                  <Input type="number" min={0} max={50} value={form.pix_discount} onChange={e => setForm({ ...form, pix_discount: Number(e.target.value) })} />
                  <Percent size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                </div>
                {form.price > 0 && form.pix_discount > 0 && (
                  <p className="text-xs text-green-600 mt-1">PIX: {fmt(Math.round(form.price * (1 - form.pix_discount / 100)))}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Duração</label>
                <Input value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} placeholder="4h30" />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Distância</label>
                <Input value={form.distance} onChange={e => setForm({ ...form, distance: e.target.value })} placeholder="260 km" />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Tipo de Veículo</label>
                <Input value={form.vehicle_type} onChange={e => setForm({ ...form, vehicle_type: e.target.value })} placeholder="Van Executiva" />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Vagas</label>
                <Input type="number" min={1} value={form.seats} onChange={e => setForm({ ...form, seats: Number(e.target.value) })} />
              </div>
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="text-sm font-semibold text-foreground mb-1 block">Horários (vírgula)</label>
                <Input value={form.departures} onChange={e => setForm({ ...form, departures: e.target.value })} placeholder="06:00, 08:00, 12:00" />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} className="rounded w-5 h-5" />
              <span className="text-sm font-medium text-foreground">Rota ativa</span>
            </label>
            <div className="flex gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="submit" disabled={saving}>
                    {saving ? <Loader2 className="animate-spin mr-1" size={16} /> : null}
                    {editingId ? "Atualizar" : "Criar Rota"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{editingId ? "Salvar alterações na rota" : "Finalizar cadastro da rota"}</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Sair sem salvar</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Confirmar Exclusão</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Tem certeza que deseja excluir esta rota? Esta ação não pode ser desfeita.</p>
          <div className="flex gap-3 mt-4">
            <Button variant="destructive" onClick={handleDelete}>Excluir</Button>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!detailRoute} onOpenChange={() => setDetailRoute(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Car size={20} className="text-primary" /> Detalhes da Rota
            </DialogTitle>
          </DialogHeader>
          {detailRoute && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-muted rounded-xl p-4">
                <div className="text-center">
                  <p className="font-display font-bold text-foreground text-lg">{detailRoute.origin}</p>
                  <p className="text-xs text-muted-foreground">Origem</p>
                </div>
                <ArrowRight size={20} className="text-primary shrink-0" />
                <div className="text-center">
                  <p className="font-display font-bold text-foreground text-lg">{detailRoute.destination}</p>
                  <p className="text-xs text-muted-foreground">Destino</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Clock size={12} /> Duração</p>
                  <p className="font-semibold text-foreground">{detailRoute.duration || "—"}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><MapPin size={12} /> Distância</p>
                  <p className="font-semibold text-foreground">{detailRoute.distance || "—"}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Car size={12} /> Veículo</p>
                  <p className="font-semibold text-foreground">{detailRoute.vehicle_type || "—"}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Users size={12} /> Vagas</p>
                  <p className="font-semibold text-foreground">{detailRoute.seats}</p>
                </div>
              </div>

              <div className="flex items-center justify-between bg-primary/5 rounded-xl p-4">
                <div>
                  <p className="text-xs text-muted-foreground">Preço por pessoa</p>
                  <p className="font-display text-2xl font-bold text-primary">{fmt(detailRoute.price)}</p>
                </div>
                {detailRoute.pix_discount > 0 && (
                  <div className="text-right">
                    <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 mb-1">
                      -{detailRoute.pix_discount}% PIX
                    </Badge>
                    <p className="text-sm font-bold text-green-600">
                      {fmt(Math.round(detailRoute.price * (1 - detailRoute.pix_discount / 100)))}
                    </p>
                  </div>
                )}
              </div>

              {(detailRoute.departures || []).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Horários de Partida</p>
                  <div className="flex flex-wrap gap-2">
                    {detailRoute.departures.map((dep: string) => (
                      <span key={dep} className="text-sm bg-muted text-foreground px-3 py-1.5 rounded-full font-medium">{dep}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${detailRoute.active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {detailRoute.active ? "Ativa" : "Inativa"}
                </span>
                <span className="text-xs text-muted-foreground ml-auto">
                  Criada em {new Date(detailRoute.created_at).toLocaleDateString("pt-BR")}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Table */}
      <Card className="border-none shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="animate-spin text-primary" size={32} /></div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Car className="mx-auto mb-3 opacity-40" size={40} />
            <p className="font-medium">Nenhuma rota encontrada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rota</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Vagas</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>PIX</TableHead>
                  <TableHead>SGS</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((t) => (
                  <TableRow key={t.id} className={!t.active ? "opacity-50" : ""}>
                    <TableCell>
                      <button onClick={() => setDetailRoute(t)} className="text-left hover:underline">
                        <p className="font-semibold text-foreground">{t.origin} → {t.destination}</p>
                        <p className="text-xs text-muted-foreground">{t.distance}</p>
                      </button>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{t.duration || "—"}</TableCell>
                    <TableCell><Badge variant="outline">{t.vehicle_type || "—"}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{t.seats}</TableCell>
                    <TableCell className="font-medium text-foreground">{fmt(t.price)}</TableCell>
                    <TableCell>
                      {t.pix_discount > 0 ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                          -{t.pix_discount}%
                        </Badge>
                      ) : <span className="text-muted-foreground text-xs">—</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-primary" title="Veículo com Seguro e Licenciamento em dia">
                        <Shield size={14} />
                        <span className="text-[10px] font-bold">SAFETY OK</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button onClick={() => toggleActive(t.id, t.active)}
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${t.active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                            {t.active ? "Ativa" : "Inativa"}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t.active ? "Desativar esta rota para vendas" : "Ativar esta rota para vendas"}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => setDetailRoute(t)}><Eye size={16} /></Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Ver detalhes completos</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => openEdit(t)}><Pencil size={16} /></Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Editar informações da rota</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => setDeleteId(t.id)} className="hover:text-destructive"><Trash2 size={16} /></Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Excluir permanentemente</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </AdminLayout>
  );
};

export default AdminTranslados;
