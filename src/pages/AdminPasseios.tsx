import { useEffect, useState, useRef } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Search, Plus, Pencil, Trash2, Eye, EyeOff, Compass, Users, Clock, Star, X, Upload, Link as LinkIcon, Image as ImageIcon, GripVertical, Percent, MapPin, CheckCircle, Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR")}`;

const CATEGORIES = ["Ecoturismo", "Aventura", "Passeio de Barco", "Gastronomia", "Cultural"];
const DIFFICULTIES = ["Fácil", "Moderada", "Moderada a Difícil", "Difícil"];

const emptyForm = {
  name: "", slug: "", location: "", duration: "", price: 160,
  private_price: 1300, vehicle_capacity: 9,
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
      duration: t.duration || "", price: t.price, private_price: t.private_price || 1300,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = form.slug || generateSlug(form.name);
    const pixDiscount = Math.max(0, Math.min(50, Number(form.pix_discount) || 0));
    const payload = {
      name: form.name.trim(), slug,
      location: form.location.trim(), duration: form.duration.trim(),
      price: Number(form.price), private_price: Number(form.private_price) || 1300,
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

    if (!payload.name || !payload.price) {
      toast({ title: "Preencha nome e preço", variant: "destructive" });
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

  const filtered = tours.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = tours.filter(t => t.active).length;
  const avgRating = tours.length
    ? (tours.reduce((a, t) => a + (Number(t.rating) || 0), 0) / tours.length).toFixed(1)
    : "0";

  return (
    <AdminLayout title="Passeios">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-muted text-primary"><Compass size={22} /></div>
            <div>
              <p className="text-2xl font-bold text-foreground">{tours.length}</p>
              <p className="text-xs text-muted-foreground">Total Passeios</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-muted text-green-600"><Eye size={22} /></div>
            <div>
              <p className="text-2xl font-bold text-foreground">{activeCount}</p>
              <p className="text-xs text-muted-foreground">Ativos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-muted text-amber-600"><Star size={22} /></div>
            <div>
              <p className="text-2xl font-bold text-foreground">{avgRating}</p>
              <p className="text-xs text-muted-foreground">Avaliação Média</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-muted text-blue-600"><Users size={22} /></div>
            <div>
              <p className="text-2xl font-bold text-foreground">{tours.reduce((a, t) => a + (t.reviews_count || 0), 0)}</p>
              <p className="text-xs text-muted-foreground">Avaliações</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input placeholder="Buscar passeio..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <button onClick={openNew}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 whitespace-nowrap">
          <Plus size={16} /> Novo Passeio
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-4 mb-6">
          <div className="flex justify-between items-center">
            <h3 className="font-display font-bold text-foreground">{editingId ? "Editar Passeio" : "Novo Passeio"}</h3>
            <button type="button" onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">Nome *</label>
              <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value, slug: generateSlug(e.target.value) })}
                className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" maxLength={200} />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">Slug</label>
              <input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })}
                className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" maxLength={200} />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">Preço Coletivo (R$/pessoa) *</label>
              <input required type="number" min={0} max={99999} value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })}
                className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">Preço Privativo (R$/veículo) *</label>
              <input required type="number" min={0} max={99999} value={form.private_price} onChange={e => setForm({ ...form, private_price: Number(e.target.value) })}
                className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">Lotação do Veículo</label>
              <input type="number" min={1} max={50} value={form.vehicle_capacity} onChange={e => setForm({ ...form, vehicle_capacity: Number(e.target.value) })}
                className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" />
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
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none pr-8"
                  placeholder="0"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                {form.pix_discount > 0 && form.price > 0
                  ? `PIX: ${fmt(Math.round(form.price * (1 - form.pix_discount / 100)))} por pessoa`
                  : "Sem desconto para PIX"}
              </p>
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">Localização</label>
              <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
                className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" maxLength={200} />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">Duração</label>
              <input value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })}
                className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" placeholder="Meio dia" maxLength={100} />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">Categoria</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">Dificuldade</label>
              <select value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })}
                className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none">
                {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">Tag</label>
              <input value={form.tag} onChange={e => setForm({ ...form, tag: e.target.value })}
                className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" placeholder="Mais Vendido" maxLength={50} />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">Grupo</label>
              <input value={form.group_size} onChange={e => setForm({ ...form, group_size: e.target.value })}
                className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" placeholder="Até 10 pessoas" maxLength={50} />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">Saída</label>
              <input value={form.departure} onChange={e => setForm({ ...form, departure: e.target.value })}
                className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" maxLength={200} />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">Operador</label>
              <input value={form.operator} onChange={e => setForm({ ...form, operator: e.target.value })}
                className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" maxLength={100} />
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-foreground mb-1 block">Descrição</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none h-20" maxLength={2000} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">Inclui (separados por vírgula)</label>
              <input value={form.includes} onChange={e => setForm({ ...form, includes: e.target.value })}
                className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" maxLength={500} />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">Destaques (separados por vírgula)</label>
              <input value={form.highlights} onChange={e => setForm({ ...form, highlights: e.target.value })}
                className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" maxLength={500} />
            </div>
          </div>

          {/* Image Management Section */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-foreground block">Imagens do Passeio</label>

            {imageUrls.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
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

            {/* Add by URL */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                <input
                  value={newUrlInput}
                  onChange={e => setNewUrlInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addUrlImage(); } }}
                  placeholder="Cole a URL da imagem aqui..."
                  className="w-full bg-muted border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm text-foreground outline-none"
                />
              </div>
              <button type="button" onClick={addUrlImage}
                className="bg-muted hover:bg-accent text-foreground px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 border border-border whitespace-nowrap">
                <LinkIcon size={14} /> Adicionar URL
              </button>
            </div>

            {/* Upload file */}
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                className="bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 border border-primary/20 disabled:opacity-50">
                <Upload size={14} />
                {uploading ? "Enviando..." : "Upload de Imagens"}
              </button>
              <span className="text-xs text-muted-foreground self-center">JPG, PNG, WebP • Máx 5MB cada</span>
            </div>

            {imageUrls.length === 0 && (
              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center text-muted-foreground">
                <ImageIcon size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhuma imagem adicionada</p>
                <p className="text-xs mt-1">Use URL ou faça upload de arquivos</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} className="rounded w-5 h-5" />
              <span className="text-sm font-medium text-foreground">Passeio ativo</span>
            </label>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-semibold">
              {editingId ? "Atualizar" : "Criar Passeio"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="bg-muted text-muted-foreground px-6 py-2.5 rounded-xl text-sm font-semibold">Cancelar</button>
          </div>
        </form>
      )}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Passeio</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Duração</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Desc. PIX</TableHead>
              <TableHead>Avaliação</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhum passeio encontrado</TableCell></TableRow>
            ) : filtered.map((t) => (
              <TableRow key={t.id} className={!t.active ? "opacity-50" : ""}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {t.images?.[0] ? (
                      <img src={t.images[0]} alt={t.name} className="w-12 h-12 rounded-lg object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center"><Compass size={20} className="text-muted-foreground" /></div>
                    )}
                    <div className="cursor-pointer" onClick={() => setDetailTour(t)}>
                      <p className="font-semibold text-foreground text-sm hover:text-primary transition-colors">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.location}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell><Badge variant="secondary">{t.category}</Badge></TableCell>
                <TableCell className="text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock size={13} /> {t.duration}</span>
                </TableCell>
                <TableCell className="font-medium text-foreground">{fmt(t.price)}</TableCell>
                <TableCell>
                  {t.pix_discount > 0 ? (
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      {t.pix_discount}%
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="flex items-center gap-1 text-foreground">
                    <Star size={13} className="text-amber-500 fill-amber-500" /> {Number(t.rating).toFixed(1)}
                    <span className="text-xs text-muted-foreground">({t.reviews_count || 0})</span>
                  </span>
                </TableCell>
                <TableCell>
                  <button onClick={() => toggleActive(t.id, t.active)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${t.active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {t.active ? "Ativo" : "Inativo"}
                  </button>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setDetailTour(t)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors" title="Ver detalhes">
                      <Eye size={16} />
                    </button>
                    <button onClick={() => openEdit(t)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => handleDelete(t.id)} className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Tour Detail Dialog */}
      <Dialog open={!!detailTour} onOpenChange={(open) => !open && setDetailTour(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {detailTour && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-xl">{detailTour.name}</DialogTitle>
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
                <div className="bg-muted rounded-xl p-3">
                  <p className="text-xs text-muted-foreground">Preço</p>
                  <p className="text-sm font-bold text-primary mt-1">{fmt(detailTour.price)}</p>
                </div>
                <div className="bg-muted rounded-xl p-3">
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><Star size={12} /> Avaliação</p>
                  <p className="text-sm font-semibold text-foreground mt-1">{Number(detailTour.rating || 0).toFixed(1)} ({detailTour.reviews_count || 0})</p>
                </div>
                <div className="bg-muted rounded-xl p-3">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge variant={detailTour.active ? "default" : "secondary"} className="mt-1">
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
