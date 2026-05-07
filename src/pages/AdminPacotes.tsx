import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Search, Plus, Pencil, Package as PackageIcon, X, CheckCircle, GripVertical, Eye, Share2, Car, Compass, Trash2, Calendar, Target, Loader2, Clock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, KeyboardSensor } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

const SortableItem = ({ item, type, index, onRemove }: { item: any, type: 'tour' | 'transfer', index: number, onRemove: () => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: `${type}-${item.id}` });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : 0, opacity: isDragging ? 0.6 : 1 };
  
  return (
    <div ref={setNodeRef} style={style} className={cn(
      "flex items-center gap-3 bg-white p-4 rounded-2xl border border-blue-100/50 shadow-sm group transition-all",
      isDragging && "shadow-xl border-primary ring-2 ring-primary/10"
    )}>
      <div {...attributes} {...listeners} className="cursor-grab p-1 text-slate-300 hover:text-primary transition-colors"><GripVertical size={18} /></div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <Badge variant="outline" className={cn("text-[8px] uppercase font-black px-1.5 h-4", type === 'tour' ? "text-amber-600 bg-amber-50" : "text-blue-600 bg-blue-50")}>
            {type === 'tour' ? 'Passeio' : 'Translado'}
          </Badge>
          <span className="text-xs font-black text-slate-400">Dia {index + 1}</span>
        </div>
        <p className="text-sm font-bold text-slate-700 truncate">
          {type === 'tour' ? item.name : `${item.origin} → ${item.destination}`}
        </p>
      </div>
      <button type="button" onClick={onRemove} className="p-2 hover:bg-red-50 text-red-300 hover:text-red-500 rounded-xl transition-all"><X size={18} /></button>
    </div>
  );
};

const fmt = (v: number) => (Number(v) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const AdminPacotes = () => {
  const [packages, setPackages] = useState<any[]>([]);
  const [tours, setTours] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "", slug: "", description: "", days: 1, nights: 0,
    original_price: 0, discount_price: 0, banner_url: "", tag: "", active: true,
    highlights: [] as string[]
  });

  const [selectedItems, setSelectedItems] = useState<{id: string, type: 'tour' | 'transfer', data: any}[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [pkgRes, tourRes, transRes] = await Promise.all([
      supabase.from("packages").select("*, package_tours(tour_id), package_transfers(transfer_route_id)").order("created_at", { ascending: false }),
      supabase.from("tours").select("id, name").eq("active", true).order("name"),
      supabase.from("transfer_routes").select("id, origin, destination").eq("active", true).order("origin")
    ]);

    if (pkgRes.data) {
      setPackages(pkgRes.data);
    }
    setTours(tourRes.data || []);
    setTransfers(transRes.data || []);
    setLoading(false);
  };

  const generateSlug = (name: string) => name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const openForm = (pkg?: any) => {
    if (pkg) {
      setEditingId(pkg.id);
      setForm({ ...pkg });
      
      const pkgTours = (pkg.package_tours || []).map((pt: any) => ({
        id: pt.tour_id, type: 'tour' as const, data: tours.find(t => t.id === pt.tour_id)
      })).filter((i: any) => i.data);
      
      const pkgTrans = (pkg.package_transfers || []).map((pt: any) => ({
        id: pt.transfer_route_id, type: 'transfer' as const, data: transfers.find(t => t.id === pt.transfer_route_id)
      })).filter((i: any) => i.data);

      setSelectedItems([...pkgTours, ...pkgTrans]);
    } else {
      setEditingId(null);
      setForm({ name: "", slug: "", description: "", days: 1, nights: 0, original_price: 0, discount_price: 0, banner_url: "", tag: "", active: true });
      setSelectedItems([]);
    }
    setShowForm(true);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = selectedItems.findIndex(i => `${i.type}-${i.id}` === active.id);
      const newIndex = selectedItems.findIndex(i => `${i.type}-${i.id}` === over.id);
      setSelectedItems(arrayMove(selectedItems, oldIndex, newIndex));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const slug = form.slug || generateSlug(form.name);
    const payload = { ...form, slug };
    
    try {
      let packageId = editingId;
      if (editingId) {
        await supabase.from("packages").update(payload).eq("id", editingId);
      } else {
        const { data, error } = await supabase.from("packages").insert([payload]).select().single();
        if (error) throw error;
        packageId = data.id;
      }

      await supabase.from("package_tours").delete().eq("package_id", packageId);
      await supabase.from("package_transfers").delete().eq("package_id", packageId);

      const tourItems = selectedItems.filter(i => i.type === 'tour').map((item, idx) => ({
        package_id: packageId, tour_id: item.id, sort_order: idx
      }));
      const transferItems = selectedItems.filter(i => i.type === 'transfer').map((item, idx) => ({
        package_id: packageId, transfer_route_id: item.id, sort_order: idx
      }));

      if (tourItems.length > 0) await supabase.from("package_tours").insert(tourItems);
      if (transferItems.length > 0) await supabase.from("package_transfers").insert(transferItems);

      toast.success("Pacote configurado com sucesso!");
      setShowForm(false);
      loadData();
    } catch (err: any) {
      toast.error("Erro ao salvar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const sharePackage = (pkg: any) => {
    const shareText = `💎 *CAMPANHA EXCLUSIVA: ${pkg.name.toUpperCase()}*\n\n📍 ${pkg.description || 'Roteiro completo pelos Lençóis Maranhenses'}\n\n✨ Destaques:\n• ${pkg.days} dias de pura aventura\n• Roteiro VIP selecionado\n\n💰 De: ${fmt(pkg.original_price)} por apenas *${fmt(pkg.discount_price)}*\n\n🔗 Reserve agora: ${window.location.origin}/pacote/${pkg.slug}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  return (
    <AdminLayout title="Pacotes & Campanhas">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-in-fade">
        {[
          { label: "Pacotes Ativos", value: packages.filter(p => p.active).length, icon: PackageIcon, color: "from-blue-500 to-indigo-600", desc: "No ar agora" },
          { label: "Passeios Linkados", value: tours.length, icon: Compass, color: "from-emerald-500 to-teal-600", desc: "Inventário disponível" },
          { label: "Rotas de Translado", value: transfers.length, icon: Car, color: "from-amber-500 to-orange-600", desc: "Conexões logísticas" },
          { label: "Tickets Médio", value: fmt(packages.reduce((a, b) => a + (b.discount_price || 0), 0) / (packages.length || 1)), icon: Target, color: "from-purple-500 to-pink-600", desc: "Valor por pacote" }
        ].map((stat, i) => (
          <div key={i} className="glass-card admin-card-hover rounded-[2rem] p-6 relative overflow-hidden group">
            <div className={`absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br ${stat.color} opacity-5 rounded-full blur-2xl`} />
            <div className="flex items-center justify-between mb-4">
              <div className={cn("w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white shadow-lg", stat.color)}>
                <stat.icon size={22} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30">{stat.desc}</span>
            </div>
            <p className="text-2xl font-black text-foreground">{stat.value}</p>
            <p className="text-[10px] font-black text-muted-foreground mt-1 uppercase tracking-[0.2em]">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-6 mb-8 items-center">
        <div className="relative flex-1 group w-full">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-primary transition-colors" size={20} />
          <Input 
            placeholder="Buscar pacotes por nome ou tag..." 
            value={search} onChange={e => setSearch(e.target.value)}
            className="pl-14 h-14 rounded-[1.5rem] border-white/40 dark:border-white/10 bg-white/40 dark:bg-black/20 backdrop-blur-xl shadow-xl shadow-black/5"
          />
        </div>
        <Button onClick={() => openForm()} className="h-14 px-8 rounded-[1.5rem] bg-gradient-to-r from-primary to-indigo-600 font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all">
          <Plus size={20} className="mr-2" strokeWidth={3} /> Criar Novo Pacote
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="animate-spin text-primary" size={40} />
          <p className="text-muted-foreground font-black uppercase tracking-widest text-xs">Carregando Campanhas...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {packages.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).map((pkg, idx) => (
            <div key={pkg.id} className="glass-card admin-card-hover rounded-[2.5rem] overflow-hidden border border-white/20 bg-white/40 dark:bg-black/20 backdrop-blur-xl shadow-2xl shadow-black/5 group animate-in-slide-up" style={{ animationDelay: `${idx * 0.05}s` }}>
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={pkg.banner_url || "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80"} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                  alt={pkg.name}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <Badge className="absolute top-4 right-4 bg-white/90 backdrop-blur-md text-slate-900 border-none font-black text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-xl">
                  {pkg.tag || "Pacote"}
                </Badge>
                <div className="absolute bottom-4 left-6 right-6">
                  <h3 className="text-xl font-black text-white tracking-tight line-clamp-1">{pkg.name}</h3>
                </div>
              </div>
              <div className="p-8 space-y-6">
                <div className="flex gap-4">
                  <div className="flex-1 space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Duração</p>
                    <div className="flex items-center gap-2 text-sm font-bold text-foreground/80">
                      <Clock size={14} className="text-primary" /> {pkg.days} Dias / {pkg.nights} Noites
                    </div>
                  </div>
                  <div className="flex-1 space-y-1 text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Valor</p>
                    <p className="text-lg font-black text-primary tracking-tighter">{fmt(pkg.discount_price)}</p>
                  </div>
                </div>

                <div className="flex gap-3 pt-6 border-t border-border/40">
                  <Button variant="outline" onClick={() => sharePackage(pkg)} className="flex-1 h-12 rounded-2xl border-white/40 dark:border-white/10 hover:bg-green-500 hover:text-white hover:border-green-500 transition-all font-black text-[10px] uppercase tracking-widest shadow-lg">
                    <Share2 size={16} className="mr-2" /> Campanha
                  </Button>
                  <Button onClick={() => openForm(pkg)} className="h-12 w-12 rounded-2xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all shadow-lg">
                    <Pencil size={18} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto rounded-[2.5rem] border-none shadow-2xl glass-card bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl">
          <DialogHeader className="border-b border-border/40 pb-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                <PackageIcon size={28} />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black tracking-tight">{editingId ? "Ajustar Campanha" : "Nova Campanha de Pacote"}</DialogTitle>
                <p className="text-sm text-muted-foreground font-medium">Configure roteiro, logística e mídia visual.</p>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-8 pb-4">
            <div className="grid md:grid-cols-5 gap-8">
              <div className="md:col-span-2 space-y-6">
                <div className="space-y-2">
                  <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Nome do Pacote</Label>
                  <Input value={form.name} onChange={e => setForm({...form, name: e.target.value, slug: generateSlug(e.target.value)})} placeholder="Ex: Rota das Emoções VIP" className="h-12 rounded-xl bg-muted/30 font-bold" required />
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Descrição Comercial</Label>
                  <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Destaque os principais benefícios..." className="min-h-[120px] rounded-2xl bg-muted/30 border-none focus:ring-primary/20 text-sm leading-relaxed" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Preço Promo (R$)</Label>
                    <Input type="number" value={form.discount_price} onChange={e => setForm({...form, discount_price: Number(e.target.value)})} className="h-12 rounded-xl bg-muted/30 font-black text-primary text-lg" required />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Duração (Dias)</Label>
                    <Input type="number" value={form.days} onChange={e => setForm({...form, days: Number(e.target.value)})} className="h-12 rounded-xl bg-muted/30 font-bold" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">URL da Imagem de Banner</Label>
                  <Input value={form.banner_url} onChange={e => setForm({...form, banner_url: e.target.value})} placeholder="https://..." className="h-12 rounded-xl bg-muted/30" />
                  {form.banner_url && <div className="mt-2 rounded-2xl overflow-hidden h-32 border border-border shadow-inner"><img src={form.banner_url} className="w-full h-full object-cover" alt="Preview" /></div>}
                </div>
              </div>

              <div className="md:col-span-3 space-y-6">
                <div className="bg-primary/5 rounded-[2rem] p-8 border border-primary/10 space-y-6">
                  <div className="flex items-center justify-between">
                    <Label className="text-[11px] font-black uppercase tracking-widest text-primary flex items-center gap-2"><Calendar size={14} strokeWidth={3} /> Roteiro e Logística (Timeline)</Label>
                    <Badge variant="outline" className="text-[10px] font-bold border-primary/20 text-primary">
                      {selectedItems.length} itens no roteiro
                    </Badge>
                  </div>
                  
                  <div className="flex flex-col gap-4">
                    {/* Item Selectors */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Adicionar Passeio</Label>
                        <select 
                          className="w-full h-10 rounded-xl bg-white border border-amber-200 text-xs font-bold px-3 outline-none focus:ring-2 focus:ring-amber-500/20"
                          onChange={(e) => {
                            const tour = tours.find(t => t.id === e.target.value);
                            if (tour) setSelectedItems([...selectedItems, { id: tour.id, type: 'tour', data: tour }]);
                            e.target.value = "";
                          }}
                        >
                          <option value="">Selecione...</option>
                          {tours.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Adicionar Translado</Label>
                        <select 
                          className="w-full h-10 rounded-xl bg-white border border-blue-200 text-xs font-bold px-3 outline-none focus:ring-2 focus:ring-blue-500/20"
                          onChange={(e) => {
                            const trans = transfers.find(t => t.id === e.target.value);
                            if (trans) setSelectedItems([...selectedItems, { id: trans.id, type: 'transfer', data: trans }]);
                            e.target.value = "";
                          }}
                        >
                          <option value="">Selecione...</option>
                          {transfers.map(t => <option key={t.id} value={t.id}>{t.origin} → {t.destination}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Timeline List */}
                    <div className="min-h-[200px] space-y-3">
                      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis]}>
                        <SortableContext items={selectedItems.map(i => `${i.type}-${i.id}`)} strategy={verticalListSortingStrategy}>
                          {selectedItems.map((item, idx) => (
                            <SortableItem 
                              key={`${item.type}-${item.id}-${idx}`} 
                              item={item.data} 
                              type={item.type} 
                              index={idx} 
                              onRemove={() => setSelectedItems(selectedItems.filter((_, i) => i !== idx))}
                            />
                          ))}
                        </SortableContext>
                      </DndContext>
                      {selectedItems.length === 0 && (
                        <div className="h-40 flex flex-col items-center justify-center border-2 border-dashed border-primary/20 rounded-[2rem] bg-white/50">
                          <PackageIcon className="text-primary/20 mb-2" size={32} />
                          <p className="text-[10px] font-black uppercase tracking-widest text-primary/40">Roteiro vazio</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-6 border-t border-border/40 gap-4">
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)} className="h-14 px-8 rounded-2xl font-black text-[11px] uppercase tracking-widest text-muted-foreground">Cancelar</Button>
              <Button type="submit" disabled={saving} className="flex-1 h-14 rounded-2xl bg-gradient-to-r from-primary to-indigo-600 font-black text-[11px] uppercase tracking-widest shadow-xl shadow-primary/20">
                {saving ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle size={18} className="mr-2" />}
                {editingId ? "Atualizar Pacote" : "Criar Pacote Agora"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminPacotes;
