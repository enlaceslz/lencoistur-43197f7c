import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Search, Plus, Pencil, Trash2, Eye, EyeOff, Compass, Users, Clock, Star, X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR")}`;

const CATEGORIES = ["Ecoturismo", "Aventura", "Passeio de Barco", "Gastronomia", "Cultural"];
const DIFFICULTIES = ["Fácil", "Moderada", "Moderada a Difícil", "Difícil"];

const emptyForm = {
  name: "", slug: "", location: "", duration: "", price: 0,
  tag: "", description: "", category: "Ecoturismo", difficulty: "Fácil",
  group_size: "Até 10 pessoas", departure: "Santo Amaro do Maranhão",
  operator: "Lençóis Tour", includes: "", highlights: "", images: "", active: true,
};

const AdminPasseios = () => {
  const [tours, setTours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

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
    setShowForm(true);
  };

  const openEdit = (t: any) => {
    setEditingId(t.id);
    setForm({
      name: t.name, slug: t.slug, location: t.location || "",
      duration: t.duration || "", price: t.price, tag: t.tag || "",
      description: t.description || "", category: t.category || "Ecoturismo",
      difficulty: t.difficulty || "Fácil", group_size: t.group_size || "",
      departure: t.departure || "", operator: t.operator || "Lençóis Tour",
      includes: (t.includes || []).join(", "), highlights: (t.highlights || []).join(", "),
      images: (t.images || []).join(", "), active: t.active,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = form.slug || generateSlug(form.name);
    const payload = {
      name: form.name.trim(), slug,
      location: form.location.trim(), duration: form.duration.trim(),
      price: Number(form.price), tag: form.tag.trim() || null,
      description: form.description.trim(), category: form.category,
      difficulty: form.difficulty, group_size: form.group_size.trim(),
      departure: form.departure.trim(), operator: form.operator.trim(),
      includes: form.includes.split(",").map(s => s.trim()).filter(Boolean),
      highlights: form.highlights.split(",").map(s => s.trim()).filter(Boolean),
      images: form.images.split(",").map(s => s.trim()).filter(Boolean),
      active: form.active,
    };

    if (!payload.name || !payload.price) {
      toast({ title: "Preencha nome e preço", variant: "destructive" });
      return;
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
                className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">Slug</label>
              <input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })}
                className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">Preço (R$) *</label>
              <input required type="number" min={0} value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })}
                className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">Localização</label>
              <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
                className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">Duração</label>
              <input value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })}
                className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" placeholder="Meio dia" />
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
                className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" placeholder="Mais Vendido" />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">Grupo</label>
              <input value={form.group_size} onChange={e => setForm({ ...form, group_size: e.target.value })}
                className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" placeholder="Até 10 pessoas" />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">Saída</label>
              <input value={form.departure} onChange={e => setForm({ ...form, departure: e.target.value })}
                className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">Operador</label>
              <input value={form.operator} onChange={e => setForm({ ...form, operator: e.target.value })}
                className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" />
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-foreground mb-1 block">Descrição</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none h-20" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">Inclui (separados por vírgula)</label>
              <input value={form.includes} onChange={e => setForm({ ...form, includes: e.target.value })}
                className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">Destaques (separados por vírgula)</label>
              <input value={form.highlights} onChange={e => setForm({ ...form, highlights: e.target.value })}
                className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" />
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-foreground mb-1 block">URLs de Imagens (separadas por vírgula)</label>
            <input value={form.images} onChange={e => setForm({ ...form, images: e.target.value })}
              className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" />
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
              <TableHead>Avaliação</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum passeio encontrado</TableCell></TableRow>
            ) : filtered.map((t) => (
              <TableRow key={t.id} className={!t.active ? "opacity-50" : ""}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {t.images?.[0] ? (
                      <img src={t.images[0]} alt={t.name} className="w-12 h-12 rounded-lg object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center"><Compass size={20} className="text-muted-foreground" /></div>
                    )}
                    <div>
                      <p className="font-semibold text-foreground text-sm">{t.name}</p>
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
    </AdminLayout>
  );
};

export default AdminPasseios;
