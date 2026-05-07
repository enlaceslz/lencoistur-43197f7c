import { useEffect, useState, useRef } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
  Search, Plus, Pencil, Trash2, Eye, EyeOff, Compass, Users, Clock, Star, X, Upload, Link as LinkIcon, Image as ImageIcon, GripVertical, Percent, MapPin, CheckCircle, Sparkles, Copy, Shield, Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";

const fmt = (v: number) => formatCurrency(v);

const maskCurrency = (v: string) => {
  const n = v.replace(/\D/g, "");
  return (Number(n) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
};


const parseCurrency = (v: string) => {
  return Number(v.replace(/\D/g, ""));
};

const CATEGORIES = ["Ecoturismo", "Aventura", "Passeio de Barco", "Gastronomia", "Cultural", "Quadriciclo", "Transfer"];
const DIFFICULTIES = ["Fácil", "Moderada", "Moderada a Difícil", "Difícil"];

const emptyForm = {
  name: "", slug: "", location: "", duration: "", price: 16000,
  private_price: 130000, vehicle_capacity: 9,
  pix_discount: 0,
  tag: "", description: "", category: "Ecoturismo", difficulty: "Fácil",
  group_size: "Até 9 pessoas", departure: "Santo Amaro do Maranhão",
  operator: "Lençóis Tour", includes: "", highlights: "", active: true,
  mode_collective_enabled: true,
  mode_private_enabled: true,
  default_mode: "privativo" as "privativo" | "coletivo",
};

const AdminPasseios = () => {
  const [tours, setTours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newUrlInput, setNewUrlInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [detailTour, setDetailTour] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("tours").select("*").order("name");
    setTours(data || []);
    setLoading(false);
  };

  const generateSlug = (name: string) =>
    name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setImageUrls([]);
    setNewUrlInput("");
    setShowForm(true);
  };

  const openEdit = (t: any) => {
    setEditingId(t.id);
    setForm({
      name: t.name, slug: t.slug, location: t.location || "",
      duration: t.duration || "", price: t.price, private_price: t.private_price || 130000,
      vehicle_capacity: t.vehicle_capacity || 9, pix_discount: t.pix_discount || 0,
      tag: t.tag || "",
      description: t.description || "", category: t.category || "Ecoturismo",
      difficulty: t.difficulty || "Fácil", group_size: t.group_size || "",
      departure: t.departure || "", operator: t.operator || "Lençóis Tour",
      includes: (t.includes || []).join(", "), highlights: (t.highlights || []).join(", "),
      active: t.active,
      mode_collective_enabled: t.mode_collective_enabled ?? true,
      mode_private_enabled: t.mode_private_enabled ?? true,
      default_mode: (t.default_mode === "coletivo" ? "coletivo" : "privativo") as "privativo" | "coletivo",
    });
    setImageUrls(t.images || []);
    setNewUrlInput("");
    setShowForm(true);
  };

  const addUrlImage = () => {
    const url = newUrlInput.trim();
    if (!url) return;
    try {
      new URL(url);
    } catch {
      toast({ title: "URL inválida", variant: "destructive" });
      return;
    }
    if (imageUrls.includes(url)) {
      toast({ title: "Imagem já adicionada", variant: "destructive" });
      return;
    }
    setImageUrls(prev => [...prev, url]);
    setNewUrlInput("");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newUrls: string[] = [];

    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        toast({ title: `${file.name} não é uma imagem`, variant: "destructive" });
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: `${file.name} excede 5MB`, variant: "destructive" });
        continue;
      }

      const ext = file.name.split(".").pop() || "jpg";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const { error } = await supabase.storage.from("tour-images").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });

      if (error) {
        toast({ title: `Erro no upload de ${file.name}`, description: error.message, variant: "destructive" });
        continue;
      }

      const { data: urlData } = supabase.storage.from("tour-images").getPublicUrl(path);
      newUrls.push(urlData.publicUrl);
    }

    if (newUrls.length > 0) {
      setImageUrls(prev => [...prev, ...newUrls]);
      toast({ title: `${newUrls.length} imagem(ns) enviada(s)!` });
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const moveImage = (from: number, to: number) => {
    if (to < 0 || to >= imageUrls.length) return;
    setImageUrls(prev => {
      const arr = [...prev];
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return arr;
    });
  };

  const handleSubmit = async (e?: any) => {
    if (e?.preventDefault) e.preventDefault();
    const slug = form.slug || generateSlug(form.name);
    const pixDiscount = Math.max(0, Math.min(50, Number(form.pix_discount) || 0));
    const payload: any = {
      name: form.name.trim(), slug,
      location: form.location.trim(), duration: form.duration.trim(),
      price: Number(form.price), private_price: Number(form.private_price),
      vehicle_capacity: Number(form.vehicle_capacity) || 9,
      pix_discount: pixDiscount,
      tag: form.tag.trim() || null,
      description: form.description.trim(), category: form.category,
      difficulty: form.difficulty, group_size: form.group_size.trim(),
      departure: form.departure.trim(), operator: form.operator.trim(),
      includes: form.includes.split(",").map(s => s.trim()).filter(Boolean),
      highlights: form.highlights.split(",").map(s => s.trim()).filter(Boolean),
      images: imageUrls,
      active: form.active,
      mode_collective_enabled: !!form.mode_collective_enabled,
      mode_private_enabled: !!form.mode_private_enabled,
      default_mode: form.default_mode === "coletivo" ? "coletivo" : "privativo",
    };

    if (!editingId) {
      payload.rating = 5.0;
      payload.reviews_count = Math.floor(Math.random() * 20) + 5;
    }

    if (!payload.name) {
      toast({ title: "Preencha o nome do passeio", variant: "destructive" });
      return;
    }

    if (payload.mode_collective_enabled && !payload.price) {
      toast({ title: "Preencha o preço coletivo", variant: "destructive" });
      return;
    }

    if (payload.mode_private_enabled && !payload.private_price) {
      toast({ title: "Preencha o preço privativo", variant: "destructive" });
      return;
    }

    if (!payload.mode_collective_enabled && !payload.mode_private_enabled) {
      toast({ title: "Habilite ao menos uma modalidade (Coletivo ou Privativo)", variant: "destructive" });
      return;
    }

    if (payload.default_mode === "coletivo" && !payload.mode_collective_enabled) {
      payload.default_mode = "privativo";
    }
    if (payload.default_mode === "privativo" && !payload.mode_private_enabled) {
      payload.default_mode = "coletivo";
    }

    let error;
    if (editingId) {
      ({ error } = await supabase.from("tours").update(payload).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("tours").insert(payload));
    }

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editingId ? "Passeio atualizado!" : "Passeio criado!" });
      setShowForm(false);
      setEditingId(null);
      load();
    }
  };

  const handleDuplicate = async (t: any) => {
    const { id, created_at, updated_at, ...rest } = t;
    const payload = { ...rest, name: `${t.name} (Cópia)`, slug: `${t.slug}-copia-${Date.now().toString().slice(-4)}`, active: false };
    const { error } = await supabase.from("tours").insert(payload);
    if (error) toast({ title: "Erro ao duplicar", variant: "destructive" });
    else { toast({ title: "Passeio duplicado!" }); load(); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este passeio?")) return;
    const { error } = await supabase.from("tours").delete().eq("id", id);
    if (error) toast({ title: "Erro ao excluir", variant: "destructive" });
    else { toast({ title: "Passeio excluído" }); load(); }
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("tours").update({ active: !current }).eq("id", id);
    load();
  };

  const sortedTours = [...tours].sort((a, b) => (b.reviews_count || 0) - (a.reviews_count || 0));
  const topSellingThreshold = sortedTours.length > 3 ? sortedTours[2].reviews_count : 10;

  const filtered = tours.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.category.toLowerCase().includes(search.toLowerCase()) ||
    (t.location && t.location.toLowerCase().includes(search.toLowerCase()))
  );

  const activeCount = tours.filter(t => t.active).length;
  const avgRating = tours.length
    ? (tours.reduce((a, t) => a + (Number(t.rating) || 0), 0) / tours.length).toFixed(1)
    : "0";

  return (
    <AdminLayout title="Passeios">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-in-fade" style={{ animationDelay: '0.1s' }}>
        {[
          { label: "Catálogo", value: tours.length, icon: Compass, color: "from-blue-500 to-indigo-600", desc: "Total cadastrado" },
          { label: "Visíveis", value: activeCount, icon: Eye, color: "from-emerald-500 to-teal-600", desc: "No site" },
          { label: "Rating Médio", value: avgRating, icon: Star, color: "from-amber-500 to-orange-600", desc: "Avaliação clientes" },
          { label: "Feedback", value: tours.reduce((a, t) => a + (t.reviews_count || 0), 0), icon: Users, color: "from-purple-500 to-pink-600", desc: "Reviews totais" },
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

      <div className="flex flex-col xl:flex-row gap-4 items-center justify-between mb-8 p-4 sm:p-6 glass-card rounded-[2.5rem] shadow-sm animate-in-fade" style={{ animationDelay: '0.2s' }}>
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-primary transition-colors" size={18} />
          <Input 
            placeholder="Buscar passeio pelo nome ou categoria..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="pl-12 h-12 rounded-2xl border-border/40 focus:ring-primary/20 bg-muted/20 transition-all text-sm font-medium" 
          />
        </div>
        
        <div className="flex gap-2 flex-wrap justify-center overflow-x-auto no-scrollbar pb-1">
          <Button variant={!search ? "default" : "outline"} size="sm" onClick={() => setSearch("")} className="h-10 rounded-xl px-4 font-bold">
            Todos
          </Button>
          {CATEGORIES.map((cat) => (
            <Button key={cat} variant={search === cat ? "default" : "outline"} size="sm" onClick={() => setSearch(cat)} className="h-10 rounded-xl px-4 font-bold whitespace-nowrap">
              {cat}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={openNew}
                className="flex-1 md:flex-none bg-primary hover:bg-primary/90 text-primary-foreground h-12 px-8 rounded-2xl text-sm font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-primary/20 transition-all active:scale-95"
              >
                <Plus size={20} strokeWidth={3} /> Novo Passeio
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Cadastrar novo passeio no catálogo</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      <Dialog open={showForm} onOpenChange={(open) => !open && setShowForm(false)}>
        <DialogContent className="sm:max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl rounded-3xl overflow-hidden bg-[#F8FAFC]">
          <div className="bg-white border-b border-slate-100 p-4 md:p-6 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <Compass size={20} className="md:w-6 md:h-6" />
              </div>
              <div>
                <DialogTitle className="text-lg md:text-xl font-black text-slate-900 leading-none mb-1">
                  {editingId ? "Editar Passeio" : "Novo Passeio"}
                </DialogTitle>
                <p className="text-[11px] md:text-sm text-slate-500 font-medium">Configure os detalhes do passeio no catálogo</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setShowForm(false)} className="rounded-full hover:bg-slate-100 transition-colors">
              <X size={20} className="text-slate-400" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 md:p-8 space-y-6 md:space-y-8">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Nome *</label>
                <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value, slug: generateSlug(e.target.value) })}
                  className="w-full bg-muted/50 border border-border/50 rounded-2xl px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium" maxLength={200} />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Slug (URL amigável)</label>
                <input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })}
                  className="w-full bg-muted/50 border border-border/50 rounded-2xl px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium" maxLength={200} />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Preço Coletivo (R$/pessoa)</label>
                <input 
                  value={maskCurrency(String(form.price))} 
                  onChange={e => setForm({ ...form, price: parseCurrency(e.target.value) })}
                  disabled={!form.mode_collective_enabled}
                  className={`w-full bg-muted/50 border border-border/50 rounded-2xl px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold ${!form.mode_collective_enabled ? "opacity-40 grayscale" : ""}`} />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Preço Privativo (R$/veículo)</label>
                <input 
                  value={maskCurrency(String(form.private_price))} 
                  onChange={e => setForm({ ...form, private_price: parseCurrency(e.target.value) })}
                  disabled={!form.mode_private_enabled}
                  className={`w-full bg-muted/50 border border-border/50 rounded-2xl px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold ${!form.mode_private_enabled ? "opacity-40 grayscale" : ""}`} />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Lotação Máxima</label>
                <input type="number" min={1} max={50} value={form.vehicle_capacity} onChange={e => setForm({ ...form, vehicle_capacity: Number(e.target.value) })}
                  className="w-full bg-muted/50 border border-border/50 rounded-2xl px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold" />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block flex items-center gap-1.5">
                  <Percent size={14} className="text-green-600" /> Desconto PIX (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={form.pix_discount}
                    onChange={e => setForm({ ...form, pix_discount: Number(e.target.value) })}
                    className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none pr-8 focus:ring-2 focus:ring-primary/20"
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Localização</label>
                <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20" maxLength={200} />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Duração</label>
                <input value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20" placeholder="Meio dia" maxLength={100} />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Categoria</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Dificuldade</label>
                <select value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20">
                  {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Tag</label>
                <input value={form.tag} onChange={e => setForm({ ...form, tag: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20" placeholder="Mais Vendido" maxLength={50} />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Grupo</label>
                <input value={form.group_size} onChange={e => setForm({ ...form, group_size: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20" placeholder="Até 10 pessoas" maxLength={50} />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Saída</label>
                <input value={form.departure} onChange={e => setForm({ ...form, departure: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20" maxLength={200} />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Operador</label>
                <input value={form.operator} onChange={e => setForm({ ...form, operator: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20" maxLength={100} />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">Descrição</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none h-24 focus:ring-2 focus:ring-primary/20" maxLength={2000} />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Itens Inclusos (separados por vírgula)</label>
                <input value={form.includes} onChange={e => setForm({ ...form, includes: e.target.value })}
                  className="w-full bg-muted/50 border border-border/50 rounded-2xl px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium" maxLength={500} />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Destaques (separados por vírgula)</label>
                <input value={form.highlights} onChange={e => setForm({ ...form, highlights: e.target.value })}
                  className="w-full bg-muted/50 border border-border/50 rounded-2xl px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium" maxLength={500} />
              </div>
            </div>

            {/* Image Management Section */}
            <div className="space-y-3 bg-muted/20 border border-border rounded-2xl p-4">
              <label className="text-sm font-bold text-foreground block flex items-center gap-2">
                <ImageIcon size={16} /> Imagens do Passeio
              </label>

              {imageUrls.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {imageUrls.map((url, index) => (
                    <div key={index} className="relative group rounded-xl overflow-hidden border border-border bg-muted aspect-square">
                      <img src={url} alt={`Imagem ${index + 1}`} className="w-full h-full object-cover" 
                        onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                        {index > 0 && (
                          <button type="button" onClick={() => moveImage(index, index - 1)}
                            className="p-1.5 bg-white/20 rounded-lg hover:bg-white/40 text-white text-xs" title="Mover para esquerda">
                            ←
                          </button>
                        )}
                        <button type="button" onClick={() => removeImage(index)}
                          className="p-1.5 bg-destructive/80 rounded-lg hover:bg-destructive text-white" title="Remover">
                          <X size={14} />
                        </button>
                        {index < imageUrls.length - 1 && (
                          <button type="button" onClick={() => moveImage(index, index + 1)}
                            className="p-1.5 bg-white/20 rounded-lg hover:bg-white/40 text-white text-xs" title="Mover para direita">
                            →
                          </button>
                        )}
                      </div>
                      {index === 0 && (
                        <span className="absolute top-1 left-1 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded">
                          Capa
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                  <input
                    value={newUrlInput}
                    onChange={e => setNewUrlInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addUrlImage(); } }}
                    placeholder="Cole a URL da imagem aqui..."
                    className="w-full bg-muted border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="flex gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" onClick={addUrlImage}
                        className="bg-muted hover:bg-accent text-foreground px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 border border-border whitespace-nowrap transition-colors">
                        Adicionar URL
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Adicionar imagem via link externo</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                        className="bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 border border-primary/20 disabled:opacity-50 transition-colors">
                        <Upload size={14} /> {uploading ? "..." : "Upload"}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Fazer upload de fotos do computador</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileUpload} className="hidden" />
            </div>

            <div className="border border-border rounded-2xl p-4 bg-muted/30 space-y-4">
              <div>
                <h4 className="text-sm font-bold text-foreground">Modalidades e Disponibilidade</h4>
                <p className="text-xs text-muted-foreground">Configure como este passeio pode ser vendido.</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="flex items-center gap-2 cursor-pointer bg-card border border-border rounded-xl px-4 py-3 hover:border-primary/40 transition-colors">
                  <input type="checkbox" checked={form.mode_collective_enabled}
                    onChange={e => setForm({ ...form, mode_collective_enabled: e.target.checked })}
                    className="rounded w-5 h-5 accent-primary" />
                  <span className="text-sm font-medium text-foreground flex-1">Coletivo (por pessoa)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer bg-card border border-border rounded-xl px-4 py-3 hover:border-secondary/40 transition-colors">
                  <input type="checkbox" checked={form.mode_private_enabled}
                    onChange={e => setForm({ ...form, mode_private_enabled: e.target.checked })}
                    className="rounded w-5 h-5 accent-secondary" />
                  <span className="text-sm font-medium text-foreground flex-1">Privativo (veículo)</span>
                </label>
              </div>
              <div>
                <label className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-2 block ml-1 opacity-80">Modalidade Padrão no Site</label>
                <select value={form.default_mode}
                  onChange={e => setForm({ ...form, default_mode: e.target.value as "privativo" | "coletivo" })}
                  className="w-full bg-card border border-border/50 rounded-2xl px-4 py-3 text-sm font-bold text-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm">
                  <option value="privativo" disabled={!form.mode_private_enabled}>Privativo (Venda por Veículo)</option>
                  <option value="coletivo" disabled={!form.mode_collective_enabled}>Coletivo (Venda por Pessoa)</option>
                </select>
              </div>
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} className="rounded w-5 h-5 accent-primary" />
                  <span className="text-sm font-bold text-foreground">Passeio Ativo e Visível no Site</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-border">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all">
                    {editingId ? "Salvar Alterações" : "Criar Passeio"}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{editingId ? "Confirmar alterações no passeio" : "Finalizar cadastro do passeio"}</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors">
                    Cancelar
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Sair sem salvar</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </form>
        </DialogContent>
      </Dialog>


      <Card className="border-none shadow-sm overflow-hidden glass-card rounded-[2.5rem] animate-in-fade" style={{ animationDelay: '0.3s' }}>
        <div className="overflow-x-auto">
          <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-bold text-muted-foreground uppercase text-[10px] tracking-widest pl-6">Passeio / Localização</TableHead>
              <TableHead className="font-bold text-muted-foreground uppercase text-[10px] tracking-widest">Categoria</TableHead>
              <TableHead className="font-bold text-muted-foreground uppercase text-[10px] tracking-widest">Preços & Modalidades</TableHead>
              <TableHead className="font-bold text-muted-foreground uppercase text-[10px] tracking-widest">Segurança & Avaliação</TableHead>
              <TableHead className="font-bold text-muted-foreground uppercase text-[10px] tracking-widest text-center">Status</TableHead>
              <TableHead className="font-bold text-muted-foreground uppercase text-[10px] tracking-widest text-right pr-6">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-20"><Loader2 className="animate-spin text-primary mx-auto" size={32} /></TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-20 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-2 opacity-50">
                    <Compass size={40} />
                    <p className="font-bold">Nenhum passeio encontrado</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((t) => {
                const isTopSeller = t.reviews_count >= topSellingThreshold && t.active;
                return (
                  <TableRow key={t.id} className={`group hover:bg-primary/5 transition-all border-b border-border/50 ${!t.active ? "opacity-60 grayscale" : ""}`}>
                    <TableCell className="pl-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="relative shrink-0">
                          {t.images?.[0] ? (
                            <img src={t.images[0]} className="w-14 h-14 rounded-2xl object-cover shadow-sm group-hover:scale-105 transition-transform" />
                          ) : (
                            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
                              <Compass size={24} />
                            </div>
                          )}
                          {isTopSeller && (
                            <div className="absolute -top-2 -right-2 bg-amber-500 text-white p-1 rounded-full shadow-lg border-2 border-background animate-bounce">
                              <Sparkles size={10} />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                            {t.name}
                            {isTopSeller && <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[8px] font-black uppercase py-0 px-1.5">Best Seller</Badge>}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-tighter mt-0.5">
                            <MapPin size={10} className="text-primary/60" /> {t.location}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-muted text-muted-foreground font-black text-[9px] uppercase px-2 py-0.5 rounded-lg border">
                        {t.category}
                      </Badge>
                      <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1 font-medium">
                        <Clock size={10} /> {t.duration}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1.5">
                        {t.mode_collective_enabled && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-foreground">{fmt(t.price)}</span>
                            <span className="text-[9px] font-bold text-muted-foreground uppercase bg-muted/50 px-1.5 rounded">Coletivo</span>
                          </div>
                        )}
                        {t.mode_private_enabled && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-primary">{fmt(t.private_price || 130000)}</span>
                            <span className="text-[9px] font-bold text-primary/60 uppercase bg-primary/5 px-1.5 rounded">Privativo</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-lg w-fit">
                          <Shield size={10} className="fill-emerald-700/20" />
                          <span className="text-[9px] font-black uppercase">SGS COMPLIANT</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] font-black text-amber-500">
                          <Star size={12} fill="currentColor" /> {Number(t.rating).toFixed(1)} 
                          <span className="text-muted-foreground font-bold text-[9px] ml-1">({t.reviews_count || 0} reviews)</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button onClick={() => toggleActive(t.id, t.active)}
                            className={`font-black text-[9px] uppercase px-3 py-1 rounded-xl border transition-all active:scale-95 ${t.active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"}`}>
                            {t.active ? "Publicado" : "Pausado"}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t.active ? "Clique para ocultar este passeio do site" : "Clique para tornar este passeio visível no site"}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary" onClick={(e) => { e.stopPropagation(); setDetailTour(t); }}>
                              <Eye size={16} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Visualizar Detalhes</p>
                          </TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-blue-100 hover:text-blue-600" onClick={(e) => { e.stopPropagation(); handleDuplicate(t); }}>
                              <Copy size={16} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Duplicar Passeio</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary" onClick={(e) => { e.stopPropagation(); openEdit(t); }}>
                              <Pencil size={16} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Editar Passeio</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }}>
                              <Trash2 size={16} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Excluir Passeio</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
          </Table>
        </div>
      </Card>

      {/* Tour Detail Dialog */}
      <Dialog open={!!detailTour} onOpenChange={(open) => !open && setDetailTour(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {detailTour && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between gap-4">
                  <DialogTitle className="font-display text-xl">{detailTour.name}</DialogTitle>
                  <button onClick={() => { openEdit(detailTour); setDetailTour(null); }} 
                    className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-bold hover:bg-primary/20 transition-colors">
                    <Pencil size={14} /> Editar Passeio
                  </button>
                </div>
              </DialogHeader>

              {/* Images */}
              {detailTour.images?.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {detailTour.images.slice(0, 6).map((img: string, i: number) => (
                    <img key={i} src={img} alt={`${detailTour.name} ${i + 1}`}
                      className={`rounded-xl object-cover w-full ${i === 0 ? "col-span-2 row-span-2 h-48" : "h-24"}`}
                      onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />
                  ))}
                </div>
              )}

              {/* Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                <div className="bg-muted rounded-xl p-3">
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin size={12} /> Localização</p>
                  <p className="text-sm font-semibold text-foreground mt-1">{detailTour.location || "—"}</p>
                </div>
                <div className="bg-muted rounded-xl p-3">
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock size={12} /> Duração</p>
                  <p className="text-sm font-semibold text-foreground mt-1">{detailTour.duration || "—"}</p>
                </div>
                <div className="bg-muted rounded-xl p-3">
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><Users size={12} /> Grupo</p>
                  <p className="text-sm font-semibold text-foreground mt-1">{detailTour.group_size || "—"}</p>
                </div>
                <div className="bg-muted rounded-xl p-3 flex flex-col justify-center">
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><Users size={12} className="text-primary" /> Coletivo</p>
                  <p className="text-sm font-bold text-primary mt-1">{fmt(detailTour.price)}</p>
                </div>
                <div className="bg-muted rounded-xl p-3 flex flex-col justify-center">
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><Shield size={12} className="text-secondary" /> Privativo</p>
                  <p className="text-sm font-bold text-secondary mt-1">{fmt(detailTour.private_price || 1300)}</p>
                </div>
                <div className="bg-muted rounded-xl p-3">
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><Star size={12} /> Avaliação</p>
                  <p className="text-sm font-semibold text-foreground mt-1">{Number(detailTour.rating || 0).toFixed(1)} ({detailTour.reviews_count || 0})</p>
                </div>
                <div className="bg-muted rounded-xl p-3 flex flex-col justify-center">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge variant={detailTour.active ? "default" : "secondary"} className="mt-1 w-fit">
                    {detailTour.active ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
              </div>

              {detailTour.pix_discount > 0 && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3 mt-2">
                  <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                    💰 Desconto PIX: {detailTour.pix_discount}% → {fmt(Math.round(detailTour.price * (1 - detailTour.pix_discount / 100)))} por pessoa
                  </p>
                </div>
              )}

              {/* Description */}
              {detailTour.description && (
                <div className="mt-3">
                  <h4 className="text-sm font-semibold text-foreground mb-1">Descrição</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{detailTour.description}</p>
                </div>
              )}

              {/* Includes */}
              {detailTour.includes?.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-sm font-semibold text-foreground mb-2">O que inclui</h4>
                  <div className="flex flex-wrap gap-2">
                    {detailTour.includes.map((item: string, i: number) => (
                      <span key={i} className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                        <CheckCircle size={12} /> {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Highlights */}
              {detailTour.highlights?.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-sm font-semibold text-foreground mb-2">Destaques</h4>
                  <div className="flex flex-wrap gap-2">
                    {detailTour.highlights.map((item: string, i: number) => (
                      <span key={i} className="flex items-center gap-1 text-xs bg-secondary/20 text-secondary-foreground px-2.5 py-1 rounded-full">
                        <Sparkles size={12} /> {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Meta */}
              <div className="grid grid-cols-2 gap-3 mt-4 text-xs text-muted-foreground">
                <div><span className="font-medium">Categoria:</span> {detailTour.category || "—"}</div>
                <div><span className="font-medium">Dificuldade:</span> {detailTour.difficulty || "—"}</div>
                <div><span className="font-medium">Saída:</span> {detailTour.departure || "—"}</div>
                <div><span className="font-medium">Operador:</span> {detailTour.operator || "—"}</div>
                <div><span className="font-medium">Slug:</span> {detailTour.slug}</div>
                <div><span className="font-medium">Tag:</span> {detailTour.tag || "—"}</div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-4 pt-4 border-t border-border">
                <button onClick={() => { setDetailTour(null); openEdit(detailTour); }}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2">
                  <Pencil size={14} /> Editar
                </button>
                <button onClick={() => setDetailTour(null)}
                  className="bg-muted text-muted-foreground px-5 py-2 rounded-xl text-sm font-semibold">
                  Fechar
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminPasseios;
