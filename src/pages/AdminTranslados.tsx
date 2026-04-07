import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Car, MapPin, Clock, Users, Plus, Pencil, Trash2, X, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR")}`;

const emptyForm = {
  origin: "", destination: "", duration: "", distance: "",
  price: 0, vehicle_type: "Van Executiva", seats: 10,
  departures: "", active: true,
};

const AdminTranslados = () => {
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

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
      price: r.price, vehicle_type: r.vehicle_type || "",
      seats: r.seats || 10,
      departures: (r.departures || []).join(", "),
      active: r.active,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      origin: form.origin.trim(),
      destination: form.destination.trim(),
      duration: form.duration.trim(),
      distance: form.distance.trim(),
      price: Number(form.price),
      vehicle_type: form.vehicle_type.trim(),
      seats: Number(form.seats),
      departures: form.departures.split(",").map(d => d.trim()).filter(Boolean),
      active: form.active,
    };

    if (!payload.origin || !payload.destination || !payload.price) {
      toast({ title: "Preencha origem, destino e preço", variant: "destructive" });
      return;
    }

    let error;
    if (editingId) {
      ({ error } = await supabase.from("transfer_routes").update(payload).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("transfer_routes").insert(payload));
    }

    if (error) {
      toast({ title: "Erro ao salvar rota", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editingId ? "Rota atualizada!" : "Rota criada!" });
      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
      load();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta rota?")) return;
    const { error } = await supabase.from("transfer_routes").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao excluir", variant: "destructive" });
    } else {
      toast({ title: "Rota excluída" });
      load();
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("transfer_routes").update({ active: !current }).eq("id", id);
    load();
  };

  const activeRoutes = routes.filter(r => r.active);

  return (
    <AdminLayout title="Translados">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-muted text-primary"><Car size={22} /></div>
            <div>
              <p className="text-2xl font-bold text-foreground">{routes.length}</p>
              <p className="text-xs text-muted-foreground">Total de Rotas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-muted text-green-600"><Check size={22} /></div>
            <div>
              <p className="text-2xl font-bold text-foreground">{activeRoutes.length}</p>
              <p className="text-xs text-muted-foreground">Rotas Ativas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-muted text-amber-600"><MapPin size={22} /></div>
            <div>
              <p className="text-2xl font-bold text-foreground">{new Set(routes.flatMap(t => [t.origin, t.destination])).size}</p>
              <p className="text-xs text-muted-foreground">Destinos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-muted text-blue-600"><Users size={22} /></div>
            <div>
              <p className="text-2xl font-bold text-foreground">{new Set(routes.map(t => t.vehicle_type)).size}</p>
              <p className="text-xs text-muted-foreground">Tipos de Veículo</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-muted-foreground">Gerencie as rotas de translado disponíveis</p>
        <button onClick={openNew}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2">
          <Plus size={16} /> Nova Rota
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-4 mb-6">
          <div className="flex justify-between items-center">
            <h3 className="font-display font-bold text-foreground">{editingId ? "Editar Rota" : "Nova Rota"}</h3>
            <button type="button" onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">Origem *</label>
              <input required value={form.origin} onChange={e => setForm({ ...form, origin: e.target.value })}
                className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" placeholder="São Luís" />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">Destino *</label>
              <input required value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })}
                className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" placeholder="Barreirinhas" />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">Preço (R$) *</label>
              <input required type="number" min={0} value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })}
                className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">Duração</label>
              <input value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })}
                className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" placeholder="4h30" />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">Distância</label>
              <input value={form.distance} onChange={e => setForm({ ...form, distance: e.target.value })}
                className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" placeholder="260 km" />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">Tipo de Veículo</label>
              <input value={form.vehicle_type} onChange={e => setForm({ ...form, vehicle_type: e.target.value })}
                className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" placeholder="Van Executiva" />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">Vagas</label>
              <input type="number" min={1} value={form.seats} onChange={e => setForm({ ...form, seats: Number(e.target.value) })}
                className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-semibold text-foreground mb-1 block">Horários de Saída (separados por vírgula)</label>
              <input value={form.departures} onChange={e => setForm({ ...form, departures: e.target.value })}
                className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" placeholder="06:00, 08:00, 12:00, 16:00" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} className="rounded w-5 h-5" />
              <span className="text-sm font-medium text-foreground">Rota ativa</span>
            </label>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-semibold">
              {editingId ? "Atualizar" : "Criar Rota"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="bg-muted text-muted-foreground px-6 py-2.5 rounded-xl text-sm font-semibold">Cancelar</button>
          </div>
        </form>
      )}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rota</TableHead>
              <TableHead>Duração</TableHead>
              <TableHead>Veículo</TableHead>
              <TableHead>Vagas</TableHead>
              <TableHead>Horários</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : routes.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhuma rota cadastrada</TableCell></TableRow>
            ) : routes.map((t) => (
              <TableRow key={t.id} className={!t.active ? "opacity-50" : ""}>
                <TableCell>
                  <p className="font-semibold text-foreground">{t.origin} → {t.destination}</p>
                  <p className="text-xs text-muted-foreground">{t.distance}</p>
                </TableCell>
                <TableCell className="text-muted-foreground">{t.duration}</TableCell>
                <TableCell><Badge variant="outline">{t.vehicle_type}</Badge></TableCell>
                <TableCell className="text-muted-foreground">{t.seats}</TableCell>
                <TableCell className="text-muted-foreground text-xs max-w-[150px]">{(t.departures || []).join(", ")}</TableCell>
                <TableCell className="font-medium text-foreground">{fmt(t.price)}</TableCell>
                <TableCell>
                  <button onClick={() => toggleActive(t.id, t.active)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${t.active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {t.active ? "Ativa" : "Inativa"}
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

export default AdminTranslados;
