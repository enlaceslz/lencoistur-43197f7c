import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Search, Plus, Pencil, Package as PackageIcon, X, CheckCircle, GripVertical, Eye, Share2, Car, Compass, Trash2, Calendar, Target, Loader2, Clock, Upload, Moon
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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: `${type}-${item.id}-${index}` });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : 0, opacity: isDragging ? 0.6 : 1 };
  
  return (
    <div ref={setNodeRef} style={style} className={cn(
      "flex items-center gap-3 bg-white p-3 rounded-xl border border-border shadow-sm group transition-all",
      isDragging && "shadow-lg border-primary ring-2 ring-primary/10"
    )}>
      <div {...attributes} {...listeners} className="cursor-grab p-1 text-muted-foreground/30 hover:text-primary transition-colors"><GripVertical size={16} /></div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <Badge variant="secondary" className={cn("text-[8px] uppercase font-black px-1.5 h-4", type === 'tour' ? "text-amber-600 bg-amber-50" : "text-blue-600 bg-blue-50")}>
            {type === 'tour' ? 'Passeio' : 'Translado'}
          </Badge>
          <span className="text-[10px] font-bold text-muted-foreground">Item {index + 1}</span>
        </div>
        <p className="text-sm font-bold text-foreground truncate">
          {type === 'tour' ? item.name : `${item.origin} → ${item.destination}`}
        </p>
      </div>
      <Button type="button" variant="ghost" size="icon" onClick={onRemove} className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"><X size={16} /></Button>
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
  const [uploading, setUploading] = useState(false);

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

    if (pkgRes.data) setPackages(pkgRes.data);
    setTours(tourRes.data || []);
    setTransfers(transRes.data || []);
    setLoading(false);
  };

  const generateSlug = (name: string) => name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `package-banners/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      setForm(prev => ({ ...prev, banner_url: publicUrl }));
      toast.success("Banner enviado com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao enviar imagem: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const openForm = (pkg?: any) => {
    if (pkg) {
      setEditingId(pkg.id);
      setForm({ ...pkg, highlights: pkg.highlights || [] });
      
      const pkgTours = (pkg.package_tours || []).map((pt: any) => ({
        id: pt.tour_id, type: 'tour' as const, data: tours.find(t => t.id === pt.tour_id)
      })).filter((i: any) => i.data);
      
      const pkgTrans = (pkg.package_transfers || []).map((pt: any) => ({
        id: pt.transfer_route_id, type: 'transfer' as const, data: transfers.find(t => t.id === pt.transfer_route_id)
      })).filter((i: any) => i.data);

      setSelectedItems([...pkgTours, ...pkgTrans]);
    } else {
      setEditingId(null);
      setForm({ name: "", slug: "", description: "", days: 1, nights: 0, original_price: 0, discount_price: 0, banner_url: "", tag: "", active: true, highlights: [] });
      setSelectedItems([]);
    }
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este pacote permanentemente?")) return;
    const { error } = await supabase.from("packages").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir!");
    else { toast.success("Excluído!"); loadData(); }
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

      toast.success("Salvo!"); setShowForm(false); loadData();
    } catch (err: any) {
      toast.error("Erro!");
    } finally {
      setSaving(false);
    }
  };

  const sharePackage = (pkg: any) => {
    const shareText = `💎 *CAMPANHA: ${pkg.name.toUpperCase()}*\n\n📍 ${pkg.description || 'Roteiro completo'}\n\n💰 De: ${fmt(pkg.original_price)} por *${fmt(pkg.discount_price)}*\n\n🔗 ${window.location.origin}/pacote/${pkg.slug}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  return (
    <AdminLayout title="Pacotes & Campanhas">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-in-fade">
        {[
          { label: "Pacotes Ativos", value: packages.filter(p => p.active).length, icon: PackageIcon, color: "text-blue-500", bg: "bg-blue-500/10", desc: "Total em catálogo" },
          { label: "Passeios Cadastrados", value: tours.length, icon: Compass, color: "text-emerald-500", bg: "bg-emerald-500/10", desc: "Opções de roteiro" },
          { label: "Rotas de Transfer", value: transfers.length, icon: Car, color: "text-amber-500", bg: "bg-amber-500/10", desc: "Logística ativa" },
          { label: "Preço Médio", value: fmt(packages.reduce((a, b) => a + (b.discount_price || 0), 0) / (packages.length || 1)), icon: Target, color: "text-purple-500", bg: "bg-purple-500/10", desc: "Valor promocional" }
        ].map((stat, i) => (
          <div key={i} className="bg-white border border-border shadow-sm rounded-2xl p-6 relative overflow-hidden group hover:border-primary/50 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shadow-sm", stat.bg, stat.color)}>
                <stat.icon size={22} />
              </div>
              <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">{stat.desc}</div>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-black text-foreground">{stat.value}</p>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8 items-center">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-primary transition-colors" size={18} />
          <Input placeholder="Pesquisar pacotes pelo nome..." value={search} onChange={e => setSearch(e.target.value)} className="pl-11 h-12 rounded-xl bg-white shadow-sm border-border focus:ring-2 focus:ring-primary/20" />
        </div>
        <Button onClick={() => openForm()} className="h-12 px-6 rounded-xl bg-primary hover:bg-primary/90 font-bold text-sm shadow-sm transition-all">
          <Plus size={18} className="mr-2" /> Novo Pacote
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).map((pkg, idx) => (
          <Card key={pkg.id} className="overflow-hidden border border-border shadow-sm rounded-2xl group hover:shadow-md transition-all duration-300">
            <div className="relative h-44 overflow-hidden">
              <img 
                src={pkg.banner_url || "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80"} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                alt={pkg.name} 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute top-3 left-3">
                <Badge className={cn("text-[9px] uppercase font-black", pkg.active ? "bg-green-500" : "bg-slate-500")}>
                  {pkg.active ? "Ativo" : "Inativo"}
                </Badge>
              </div>
              <div className="absolute bottom-3 left-4 right-4">
                <h3 className="text-lg font-bold text-white line-clamp-1">{pkg.name}</h3>
              </div>
            </div>
            <CardContent className="p-5">
              <div className="flex justify-between items-center mb-5">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock size={14} className="text-primary" />
                    <span className="text-xs font-bold">{pkg.days} {pkg.days === 1 ? 'Dia' : 'Dias'}</span>
                  </div>
                  {pkg.nights > 0 && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Moon size={14} className="text-blue-500" />
                      <span className="text-xs font-bold">{pkg.nights} {pkg.nights === 1 ? 'Noite' : 'Noites'}</span>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground uppercase font-black leading-none mb-1">Preço Especial</p>
                  <p className="text-lg font-black text-primary">{fmt(pkg.discount_price)}</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => sharePackage(pkg)} 
                  className="flex-1 min-w-[120px] rounded-xl h-10 text-[10px] font-black uppercase tracking-widest"
                >
                  <Share2 size={14} className="mr-2 text-primary" /> Campanha
                </Button>
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    size="icon"
                    onClick={() => openForm(pkg)} 
                    className="h-10 w-10 rounded-xl"
                  >
                    <Eye size={16} />
                  </Button>
                  <Button 
                    variant="secondary"
                    size="icon"
                    onClick={() => openForm(pkg)} 
                    className="h-10 w-10 rounded-xl"
                  >
                    <Pencil size={16} />
                  </Button>
                  <Button 
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(pkg.id)} 
                    className="h-10 w-10 rounded-xl text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl rounded-3xl overflow-hidden bg-[#F8FAFC]">
          <div className="bg-white border-b border-slate-100 p-4 md:p-6 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <PackageIcon size={20} className="md:w-6 md:h-6" />
              </div>
              <div>
                <DialogTitle className="text-lg md:text-xl font-black text-slate-900 leading-none mb-1">
                  {editingId ? "Editar Pacote" : "Novo Pacote Turístico"}
                </DialogTitle>
                <p className="text-[11px] md:text-sm text-slate-500 font-medium line-clamp-1">Configure os detalhes e o itinerário da campanha</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setShowForm(false)} className="rounded-full hover:bg-slate-100 transition-colors">
              <X size={20} className="text-slate-400" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 md:p-8 space-y-6 md:space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
              {/* Coluna Principal: Informações Básicas */}
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-6 bg-primary rounded-full" />
                    <h3 className="font-black text-slate-800 uppercase tracking-wider text-xs">Informações Gerais</h3>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pkg-name" className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Nome do Pacote Comercial</Label>
                    <Input 
                      id="pkg-name" 
                      value={form.name} 
                      onChange={e => setForm({...form, name: e.target.value})} 
                      placeholder="Ex: Bonito Master Experience" 
                      className="h-12 px-4 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all font-bold" 
                      required 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pkg-desc" className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Descrição para Marketing (WhatsApp/Site)</Label>
                    <Textarea 
                      id="pkg-desc" 
                      value={form.description} 
                      onChange={e => setForm({...form, description: e.target.value})} 
                      placeholder="Descreva o que torna este pacote único..."
                      className="min-h-[120px] p-4 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all font-medium leading-relaxed" 
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pkg-price" className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Preço Final (R$)</Label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">R$</span>
                        <Input 
                          id="pkg-price" 
                          type="number" 
                          value={form.discount_price} 
                          onChange={e => setForm({...form, discount_price: Number(e.target.value)})} 
                          className="h-12 pl-10 pr-4 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all font-black text-primary" 
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor="pkg-days" className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Dias</Label>
                        <div className="relative">
                          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <Input 
                            id="pkg-days" 
                            type="number" 
                            value={form.days} 
                            onChange={e => setForm({...form, days: Number(e.target.value)})} 
                            className="h-12 pl-10 pr-4 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all font-bold text-xs" 
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pkg-nights" className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Noites</Label>
                        <div className="relative">
                          <Moon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <Input 
                            id="pkg-nights" 
                            type="number" 
                            value={form.nights} 
                            onChange={e => setForm({...form, nights: Number(e.target.value)})} 
                            className="h-12 pl-10 pr-4 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all font-bold text-xs" 
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pkg-banner" className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Banner do Pacote (Upload ou URL)</Label>
                    <div className="flex gap-2">
                      <div className="relative group flex-1">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                          <Eye size={16} />
                        </div>
                        <Input 
                          id="pkg-banner" 
                          value={form.banner_url} 
                          onChange={e => setForm({...form, banner_url: e.target.value})} 
                          placeholder="Cole o link ou use o botão de upload"
                          className="h-12 pl-10 pr-4 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all" 
                        />
                      </div>
                      <div className="relative">
                        <input
                          type="file"
                          id="banner-upload"
                          className="hidden"
                          accept="image/*"
                          onChange={handleBannerUpload}
                          disabled={uploading}
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          className="h-12 w-12 rounded-xl p-0 border-slate-200"
                          onClick={() => document.getElementById('banner-upload')?.click()}
                          disabled={uploading}
                        >
                          {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                        </Button>
                      </div>
                    </div>
                    {form.banner_url && (
                      <div className="mt-3 rounded-2xl overflow-hidden border border-slate-100 shadow-sm aspect-[21/9]">
                        <img src={form.banner_url} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Coluna Lateral: Itinerário e Configurações */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm space-y-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
                      <h3 className="font-black text-slate-800 uppercase tracking-wider text-xs">Itinerário do Pacote</h3>
                    </div>
                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-bold border-none h-6">
                      {selectedItems.length} Itens
                    </Badge>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="relative">
                      <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">Adicionar Itens</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <select 
                          className="h-11 rounded-xl bg-slate-50 border border-slate-200 px-3 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer" 
                          onChange={e => { 
                            const t = tours.find(x => x.id === e.target.value); 
                            if(t) setSelectedItems([...selectedItems, {id:t.id, type:'tour', data:t}]); 
                            e.target.value=""; 
                          }}
                        >
                          <option value="" className="font-medium text-slate-400">+ Passeio</option>
                          {tours.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                        <select 
                          className="h-11 rounded-xl bg-slate-50 border border-slate-200 px-3 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer" 
                          onChange={e => { 
                            const t = transfers.find(x => x.id === e.target.value); 
                            if(t) setSelectedItems([...selectedItems, {id:t.id, type:'transfer', data:t}]); 
                            e.target.value=""; 
                          }}
                        >
                          <option value="" className="font-medium text-slate-400">+ Translado</option>
                          {transfers.map(t => <option key={t.id} value={t.id}>{t.origin} → {t.destination}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="min-h-[250px] max-h-[400px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                      {selectedItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-slate-100 rounded-2xl p-6 text-center">
                          <PackageIcon className="text-slate-200 mb-3" size={32} />
                          <p className="text-xs font-bold text-slate-400">O itinerário está vazio.<br/>Selecione passeios ou translados acima.</p>
                        </div>
                      ) : (
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis]}>
                          <SortableContext items={selectedItems.map((i,idx) => `${i.type}-${i.id}-${idx}`)} strategy={verticalListSortingStrategy}>
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
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-black text-slate-800 text-sm">Status do Pacote</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Exibir no catálogo público</p>
                    </div>
                    <Switch checked={form.active} onCheckedChange={(val) => setForm({...form, active: val})} />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
              <p className="text-[11px] font-bold text-slate-400 max-w-xs text-center sm:text-left">
                * Campos obrigatórios. O pacote será salvo e poderá ser compartilhado imediatamente como campanha.
              </p>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setShowForm(false)} 
                  className="flex-1 sm:flex-none h-12 px-6 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={saving} 
                  className="flex-1 sm:flex-none h-12 px-10 rounded-xl bg-primary hover:bg-primary/90 text-white font-black shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                >
                  {saving ? (
                    <Loader2 className="animate-spin mr-2" size={18} />
                  ) : (
                    <CheckCircle size={18} className="mr-2" />
                  )}
                  {editingId ? "Salvar Alterações" : "Criar Pacote Completo"}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminPacotes;
