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
  Search, Plus, Pencil, Trash2, Package as PackageIcon, Clock, PlusCircle, X, CheckCircle, GripVertical, Eye, Share2, Image as ImageIcon
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatCurrency, cn } from "@/lib/utils";
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

const SortableItem = ({ item, type, index, onRemove }: { item: any, type: 'tour' | 'transfer', index: number, onRemove: () => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: `${type}-${item.id}` });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 1 : 0, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-blue-100 shadow-sm">
      <div {...attributes} {...listeners} className="cursor-grab p-1 hover:bg-slate-100 rounded shrink-0">
        <GripVertical size={16} className="text-slate-400" />
      </div>
      <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
        {index + 1}
      </span>
      <span className="text-sm font-bold text-slate-700 flex-1 truncate">
        {type === 'tour' ? item.name : `${item.origin} → ${item.destination}`}
      </span>
      <button type="button" onClick={onRemove} className="p-1.5 hover:bg-red-50 text-red-400 rounded-lg">
        <X size={16} />
      </button>
    </div>
  );
};

const fmt = (v: number) => (Number(v) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const AdminPacotes = () => {
  const [packages, setPackages] = useState<any[]>([]);
  const [tours, setTours] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "", slug: "", description: "", days: 1, nights: 0,
    original_price: 0, discount_price: 0, banner_url: "", active: true,
  });

  const [selectedTours, setSelectedTours] = useState<any[]>([]);
  const [selectedTransfers, setSelectedTransfers] = useState<any[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [pkgRes, tourRes, transferRes] = await Promise.all([
      supabase.from("packages").select("*, package_tours(tour_id), package_transfers(transfer_route_id)").order("created_at", { ascending: false }),
      supabase.from("tours").select("id, name").eq("active", true).order("name"),
      supabase.from("transfer_routes").select("id, origin, destination").eq("active", true).order("origin"),
    ]);

    setPackages(pkgRes.data || []);
    setTours(tourRes.data || []);
    setTransfers(transferRes.data || []);
    setLoading(false);
  };

  const sharePackage = (pkg: any) => {
    const text = `Confira nosso pacote: ${pkg.name}\n${pkg.description || ""}\n\nPreço especial: ${fmt(pkg.discount_price)}`;
    const url = window.location.origin + "/pacote/" + pkg.slug;
    
    if (navigator.share) {
      navigator.share({ title: pkg.name, text, url });
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text + "\n\n" + url)}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form };
    let res;
    if (editingId) {
      res = await supabase.from("packages").update(payload).eq("id", editingId).select().single();
    } else {
      res = await supabase.from("packages").insert(payload).select().single();
    }

    if (res.error) { toast.error("Erro ao salvar: " + res.error.message); return; }

    const pid = res.data.id;
    await supabase.from("package_tours").delete().eq("package_id", pid);
    await supabase.from("package_transfers").delete().eq("package_id", pid);

    if (selectedTours.length > 0) {
      await supabase.from("package_tours").insert(selectedTours.map((t, i) => ({ package_id: pid, tour_id: t.id, sort_order: i })));
    }
    if (selectedTransfers.length > 0) {
      await supabase.from("package_transfers").insert(selectedTransfers.map((t, i) => ({ package_id: pid, transfer_route_id: t.id, sort_order: i })));
    }

    toast.success("Pacote salvo com sucesso!");
    setShowForm(false);
    loadData();
  };

  return (
    <AdminLayout title="Gestão de Pacotes">
      <div className="flex flex-col md:flex-row gap-4 justify-between mb-8">
        <Input placeholder="Buscar pacotes..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
        <Button onClick={() => { setEditingId(null); setShowForm(true); }}>
          <Plus size={20} className="mr-2" /> Novo Pacote
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).map(pkg => (
          <Card key={pkg.id} className="rounded-3xl shadow-sm border overflow-hidden">
            {pkg.banner_url && <img src={pkg.banner_url} className="w-full h-40 object-cover" alt={pkg.name} />}
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">{pkg.name}</h3>
                  <Badge variant="outline">{pkg.days} dias</Badge>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => sharePackage(pkg)}><Share2 size={16} /></Button>
                  <Button variant="ghost" size="icon" onClick={() => { setEditingId(pkg.id); setForm(pkg); setShowForm(true); }}><Pencil size={16} /></Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{pkg.description}</p>
              <div className="flex items-center justify-between pt-4 border-t">
                <span className="font-bold text-primary">{fmt(pkg.discount_price)}</span>
                <Badge className={pkg.active ? "bg-green-100 text-green-700" : ""}>{pkg.active ? "Ativo" : "Inativo"}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Pacote" : "Novo Pacote"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input placeholder="Nome" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            <Textarea placeholder="Descrição" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            <div className="flex gap-4">
              <Input type="number" placeholder="Dias" value={form.days} onChange={e => setForm({...form, days: Number(e.target.value)})} />
              <Input type="number" placeholder="Preço" value={form.discount_price} onChange={e => setForm({...form, discount_price: Number(e.target.value)})} />
            </div>
            <Input placeholder="URL do Banner" value={form.banner_url} onChange={e => setForm({...form, banner_url: e.target.value})} />
            <div className="flex items-center gap-2">
              <Switch checked={form.active} onCheckedChange={v => setForm({...form, active: v})} />
              <Label>Ativo</Label>
            </div>
            <Button type="submit" className="w-full">Salvar Pacote</Button>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminPacotes;
