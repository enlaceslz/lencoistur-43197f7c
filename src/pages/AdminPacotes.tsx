import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Search, Plus, Pencil, Package as PackageIcon, X, CheckCircle, GripVertical, Eye, Share2, Car, Compass, Trash2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

const SortableItem = ({ item, type, index, onRemove }: { item: any, type: 'tour' | 'transfer', index: number, onRemove: () => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: `${type}-${item.id}` });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-blue-100 shadow-sm">
      <div {...attributes} {...listeners} className="cursor-grab p-1 text-slate-400"><GripVertical size={16} /></div>
      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">{index + 1}</span>
      <span className="text-sm font-bold text-slate-700 flex-1 truncate">{type === 'tour' ? item.name : `${item.origin} → ${item.destination}`}</span>
      <button type="button" onClick={onRemove} className="p-1 hover:text-red-600 text-red-400"><X size={16} /></button>
    </div>
  );
};

const fmt = (v: number) => `R$ ${(v / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

const AdminPacotes = () => {
  const [packages, setPackages] = useState<any[]>([]);
  const [tours, setTours] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", description: "", days: 1, nights: 0, original_price: 0, discount_price: 0, banner_url: "", active: true });
  const [items, setItems] = useState<{tour: any[], transfer: any[]}>({tour: [], transfer: []});

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [pkg, tour, transfer] = await Promise.all([
      supabase.from("packages").select("*, package_tours(tour_id), package_transfers(transfer_route_id)"),
      supabase.from("tours").select("id, name").eq("active", true),
      supabase.from("transfer_routes").select("id, origin, destination").eq("active", true)
    ]);
    setPackages(pkg.data || []); setTours(tour.data || []); setTransfers(transfer.data || []);
  };

  const sensors = useSensors(useSensor(PointerSensor));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = editingId 
      ? await supabase.from("packages").update(form).eq("id", editingId).select().single()
      : await supabase.from("packages").insert(form).select().single();
    
    if (res.error) { toast.error("Erro!"); return; }
    const pid = res.data.id;
    await supabase.from("package_tours").delete().eq("package_id", pid);
    await supabase.from("package_transfers").delete().eq("package_id", pid);
    await supabase.from("package_tours").insert(items.tour.map((t, i) => ({ package_id: pid, tour_id: t.id, sort_order: i })));
    await supabase.from("package_transfers").insert(items.transfer.map((t, i) => ({ package_id: pid, transfer_route_id: t.id, sort_order: i })));
    toast.success("Salvo!"); setShowForm(false); loadData();
  };

  return (
    <AdminLayout title="Pacotes">
      <div className="flex justify-between mb-8">
        <Button onClick={() => { setEditingId(null); setShowForm(true); }}><Plus className="mr-2" /> Novo Pacote</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.map(p => (
          <Card key={p.id} className="rounded-3xl shadow-sm border overflow-hidden">
            {p.banner_url && <img src={p.banner_url} className="w-full h-40 object-cover" />}
            <CardContent className="p-6">
              <h3 className="font-bold text-lg mb-2">{p.name}</h3>
              <div className="flex items-center justify-between mt-4 border-t pt-4">
                <span className="font-bold text-primary">{fmt(p.discount_price)}</span>
                <Button variant="ghost" size="icon" onClick={() => { setEditingId(p.id); setForm(p); setShowForm(true); }}><Pencil size={16} /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "Editar Pacote" : "Novo Pacote"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Nome" />
            <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Descrição" />
            <div className="grid grid-cols-2 gap-4">
              <Input type="number" value={form.days} onChange={e => setForm({...form, days: Number(e.target.value)})} placeholder="Dias" />
              <Input type="number" value={form.discount_price} onChange={e => setForm({...form, discount_price: Number(e.target.value)})} placeholder="Preço" />
            </div>
            <Input value={form.banner_url} onChange={e => setForm({...form, banner_url: e.target.value})} placeholder="Banner URL" />
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <Label>Adicionar Passeios</Label>
                <div className="grid grid-cols-2 gap-2">
                  {tours.map(t => <Button key={t.id} type="button" variant="outline" onClick={() => setItems({...items, tour: [...items.tour, t]})}>{t.name}</Button>)}
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <Label>Adicionar Translados</Label>
                <div className="grid grid-cols-2 gap-2">
                  {transfers.map(t => <Button key={t.id} type="button" variant="outline" onClick={() => setItems({...items, transfer: [...items.transfer, t]})}>{t.origin} → {t.destination}</Button>)}
                </div>
              </div>
            </div>
            <Button type="submit" className="w-full">Salvar Pacote</Button>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminPacotes;
