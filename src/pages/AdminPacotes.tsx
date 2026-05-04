import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Search, Plus, Pencil, Trash2, Package as PackageIcon, Clock, Tag, PlusCircle, X, CheckCircle, GripVertical, Eye
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

const SortableTourItem = ({ tour, index, onRemove }: { tour: any, index: number, onRemove: () => void }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: tour.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`flex items-center gap-3 bg-white p-3 rounded-xl border border-blue-100 shadow-sm transition-shadow ${isDragging ? 'shadow-lg border-primary' : ''}`}
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 hover:bg-slate-100 rounded shrink-0">
        <GripVertical size={16} className="text-slate-400" />
      </div>
      <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
        {index + 1}
      </span>
      <span className="text-sm font-bold text-slate-700 flex-1 truncate">{tour.name}</span>
      <button 
        type="button"
        onClick={onRemove}
        className="p-1.5 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
};
const fmt = (v: number) => (Number(v) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const maskCurrency = (v: string) => {
  const n = v.replace(/\D/g, "");
  return (Number(n) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
};

const parseCurrency = (v: string) => {
  return Number(v.replace(/\D/g, ""));
};

const AdminPacotes = () => {
  const [packages, setPackages] = useState<any[]>([]);
  const [tours, setTours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    days: 1,
    nights: 0,
    original_price: 0,
    discount_price: 0,
    tag: "",
    highlights: [] as string[],
    active: true,
  });

  const [selectedTours, setSelectedTours] = useState<any[]>([]);
  const [highlightInput, setHighlightInput] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setSelectedTours((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [pkgRes, tourRes] = await Promise.all([
      supabase.from("packages").select("*, package_tours(tour_id)").order("created_at", { ascending: false }),
      supabase.from("tours").select("id, name, slug").eq("active", true).order("name"),
    ]);

    setPackages(pkgRes.data || []);
    setTours(tourRes.data || []);
    setLoading(false);
  };

  const generateSlug = (name: string) =>
    name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const openNew = () => {
    setEditingId(null);
    setIsViewMode(false);
    setForm({
      name: "", slug: "", description: "", days: 1, nights: 0,
      original_price: 0, discount_price: 0, tag: "", highlights: [], active: true
    });
    setSelectedTours([]);
    setShowForm(true);
  };

  const openView = (pkg: any) => {
    setEditingId(pkg.id);
    setIsViewMode(true);
    setForm({
      name: pkg.name,
      slug: pkg.slug,
      description: pkg.description || "",
      days: pkg.days,
      nights: pkg.nights || 0,
      original_price: pkg.original_price,
      discount_price: pkg.discount_price,
      tag: pkg.tag || "",
      highlights: pkg.highlights || [],
      active: pkg.active,
    });
    
    const pkgTours = (pkg.package_tours || [])
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
      .map((pt: any) => tours.find(t => t.id === pt.tour_id))
      .filter(Boolean);
      
    setSelectedTours(pkgTours);
    setShowForm(true);
  };

  const openEdit = (pkg: any) => {
    setEditingId(pkg.id);
    setIsViewMode(false);
    setForm({
      name: pkg.name,
      slug: pkg.slug,
      description: pkg.description || "",
      days: pkg.days,
      nights: pkg.nights || 0,
      original_price: pkg.original_price,
      discount_price: pkg.discount_price,
      tag: pkg.tag || "",
      highlights: pkg.highlights || [],
      active: pkg.active,
    });
    
    // Map existing tours in correct order
    const pkgTours = (pkg.package_tours || [])
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
      .map((pt: any) => tours.find(t => t.id === pt.tour_id))
      .filter(Boolean);
      
    setSelectedTours(pkgTours);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = form.slug || generateSlug(form.name);
    
    const payload = { ...form, slug };

    let res;
    if (editingId) {
      res = await supabase
        .from("packages")
        .update(payload)
        .eq("id", editingId)
        .select()
        .single();
    } else {
      res = await supabase
        .from("packages")
        .insert(payload)
        .select()
        .single();
    }

    if (res.error) {
      toast.error("Erro ao salvar pacote: " + res.error.message);
      return;
    }

    const packageId = res.data.id;

    // Update package_tours
    await supabase.from("package_tours").delete().eq("package_id", packageId);
    
    if (selectedTours.length > 0) {
      const tourInserts = selectedTours.map((t, idx) => ({
        package_id: packageId,
        tour_id: t.id,
        sort_order: idx
      }));
      await supabase.from("package_tours").insert(tourInserts);
    }

    toast.success(editingId ? "Pacote atualizado!" : "Pacote criado!");
    setShowForm(false);
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este pacote permanentemente?")) return;
    const { error } = await supabase.from("packages").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir: " + error.message);
    else { toast.success("Pacote excluído"); loadData(); }
  };

  const addHighlight = () => {
    if (!highlightInput.trim()) return;
    setForm({ ...form, highlights: [...form.highlights, highlightInput.trim()] });
    setHighlightInput("");
  };

  const removeHighlight = (idx: number) => {
    setForm({ ...form, highlights: form.highlights.filter((_, i) => i !== idx) });
  };

  const toggleTour = (tour: any) => {
    if (selectedTours.some(t => t.id === tour.id)) {
      setSelectedTours(selectedTours.filter(t => t.id !== tour.id));
    } else {
      setSelectedTours([...selectedTours, tour]);
    }
  };

  const filtered = packages.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.tag?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout title="Gestão de Pacotes">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8 p-6 bg-card border border-border rounded-3xl shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input 
            placeholder="Buscar pacotes..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="pl-12 h-12 rounded-2xl border-muted-foreground/20 focus:ring-primary/20 bg-muted/30" 
          />
        </div>
        <Button onClick={openNew} className="h-12 px-8 rounded-2xl font-bold flex items-center gap-2">
          <Plus size={20} strokeWidth={3} /> Novo Pacote
        </Button>
      </div>

      <Card className="border-none shadow-sm overflow-hidden rounded-3xl">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-bold">Pacote</TableHead>
              <TableHead className="font-bold">Duração</TableHead>
              <TableHead className="font-bold">Preço</TableHead>
              <TableHead className="font-bold">Status</TableHead>
              <TableHead className="text-right font-bold">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-10">Carregando...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">Nenhum pacote encontrado.</TableCell></TableRow>
            ) : (
              filtered.map((pkg) => (
                <TableRow key={pkg.id} className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => openView(pkg)}>
                  <TableCell className="font-medium">
                    <div>
                      <p className="font-bold text-foreground">{pkg.name}</p>
                      <p className="text-xs text-muted-foreground">{pkg.slug}</p>
                      {pkg.tag && <Badge variant="secondary" className="mt-1">{pkg.tag}</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-sm">
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} className="text-muted-foreground" />
                        {pkg.days} {pkg.days === 1 ? 'dia' : 'dias'}
                      </div>
                      {pkg.nights > 0 && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground ml-5">
                          {pkg.nights} {pkg.nights === 1 ? 'noite' : 'noites'}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <p className="text-sm font-bold text-primary">{fmt(pkg.discount_price)}</p>
                      <p className="text-xs text-muted-foreground line-through">{fmt(pkg.original_price)}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={pkg.active ? "default" : "outline"} className={pkg.active ? "bg-green-100 text-green-700 hover:bg-green-100" : ""}>
                      {pkg.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openView(pkg)} title="Visualizar" className="h-8 w-8 rounded-lg text-slate-600 hover:text-slate-700 hover:bg-slate-50">
                        <Eye size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(pkg)} title="Editar" className="h-8 w-8 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                        <Pencil size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(pkg.id)} title="Excluir" className="h-8 w-8 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50">
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <PackageIcon className="text-primary" />
              {isViewMode ? "Visualizar Pacote" : editingId ? "Editar Pacote" : "Novo Pacote"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold">Nome do Pacote</label>
                <Input required disabled={isViewMode} value={form.name} onChange={e => setForm({ ...form, name: e.target.value, slug: generateSlug(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold">Slug (URL)</label>
                <Input disabled={isViewMode} value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold">Descrição</label>
              <Textarea disabled={isViewMode} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold">Duração (dias)</label>
              <Input disabled={isViewMode} type="number" min={1} value={form.days} onChange={e => setForm({ ...form, days: parseInt(e.target.value) })} />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold">Preço Original</label>
                <Input 
                  disabled={isViewMode}
                  value={maskCurrency(String(form.original_price))} 
                  onChange={e => setForm({ ...form, original_price: parseCurrency(e.target.value) })} 
                />
                <p className="text-[10px] text-muted-foreground">{fmt(form.original_price)}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold">Preço Promocional</label>
                <Input 
                  disabled={isViewMode}
                  value={maskCurrency(String(form.discount_price))} 
                  onChange={e => setForm({ ...form, discount_price: parseCurrency(e.target.value) })} 
                />
                <p className="text-[10px] text-muted-foreground">{fmt(form.discount_price)}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 bg-muted/50 p-4 rounded-xl">
              <Switch 
                id="active" 
                disabled={isViewMode}
                checked={form.active} 
                onCheckedChange={(checked) => setForm({ ...form, active: checked })} 
              />
              <Label htmlFor="active" className="font-bold cursor-pointer">Pacote Ativo (visível no site)</Label>
            </div>

            <div className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold block">Passeios Inclusos (Clique para selecionar)</label>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                    {selectedTours.length} selecionados
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 p-4 bg-muted/30 rounded-2xl border border-dashed border-border min-h-[100px]">
                  {tours.map(tour => {
                    const isSelected = selectedTours.some(t => t.id === tour.id);
                    return (
                      <button
                        key={tour.id}
                        type="button"
                        onClick={() => !isViewMode && toggleTour(tour)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border-2 ${
                          isSelected 
                          ? "bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105" 
                          : "bg-background border-transparent text-muted-foreground hover:border-primary/30"
                        } ${isViewMode ? 'cursor-default' : 'cursor-pointer'}`}
                      >
                        {isSelected ? <CheckCircle size={14} strokeWidth={3} /> : <PlusCircle size={14} />}
                        {tour.name}
                      </button>
                    );
                  })}
                </div>
                {selectedTours.length > 0 && (
                  <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 mt-2">
                    <p className="text-[10px] font-black uppercase text-blue-600 mb-4 tracking-widest">Ordem no Roteiro (Arraste para reordenar)</p>
                    
                    <DndContext 
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                      modifiers={[restrictToVerticalAxis]}
                    >
                      <SortableContext 
                        items={selectedTours.map(t => t.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="flex flex-col gap-3">
                          {selectedTours.map((t, i) => (
                            <SortableTourItem 
                              key={t.id} 
                              tour={t} 
                              index={i} 
                               onRemove={() => !isViewMode && toggleTour(t)}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-bold block">Destaques (Highlights)</label>
              <div className="flex gap-2">
                <Input disabled={isViewMode} value={highlightInput} onChange={e => setHighlightInput(e.target.value)} placeholder="Ex: Guia bilíngue incluso" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addHighlight())} />
                <Button disabled={isViewMode} type="button" onClick={addHighlight} variant="secondary">Adicionar</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.highlights.map((h, i) => (
                  <Badge key={i} className="pl-3 pr-1 py-1 gap-1 flex items-center bg-blue-50 text-blue-700 border-blue-200">
                    {h}
                    {!isViewMode && <button type="button" onClick={() => removeHighlight(i)} className="hover:bg-blue-200 rounded-full p-0.5"><X size={12} /></button>}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t">
              {!isViewMode ? (
                <>
                  <Button type="submit" className="flex-1 h-12 rounded-xl font-bold">
                    {editingId ? "Salvar Alterações" : "Criar Pacote"}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setShowForm(false)} className="h-12 rounded-xl font-bold">
                    Cancelar
                  </Button>
                </>
              ) : (
                <Button type="button" onClick={() => setShowForm(false)} className="flex-1 h-12 rounded-xl font-bold">
                  Fechar
                </Button>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminPacotes;
