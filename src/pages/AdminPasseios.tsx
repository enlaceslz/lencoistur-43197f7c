import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Search, Plus, Edit, Eye, EyeOff, Compass, Users, Clock, Star, TrendingUp,
} from "lucide-react";
import { tours } from "@/data/tours";

const statusConfig: Record<string, { label: string; className: string }> = {
  ativo: { label: "Ativo", className: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
  inativo: { label: "Inativo", className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
  rascunho: { label: "Rascunho", className: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300" },
};

const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR")}`;

const AdminPasseios = () => {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const tourList = tours.map((t, i) => ({
    ...t,
    status: i < 6 ? "ativo" : i === 6 ? "rascunho" : "inativo",
    bookings: Math.floor(Math.random() * 300) + 50,
    rating: (4 + Math.random() * 0.9).toFixed(1),
    revenue: Math.floor(Math.random() * 80000) + 10000,
  }));

  const filtered = tourList.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenue = tourList.reduce((acc, t) => acc + t.revenue, 0);
  const totalBookings = tourList.reduce((acc, t) => acc + t.bookings, 0);
  const avgRating = (tourList.reduce((acc, t) => acc + parseFloat(t.rating), 0) / tourList.length).toFixed(1);

  return (
    <AdminLayout title="Passeios">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-muted text-primary"><Compass size={22} /></div>
            <div>
              <p className="text-2xl font-bold text-foreground">{tourList.length}</p>
              <p className="text-xs text-muted-foreground">Passeios Cadastrados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-muted text-green-600"><Users size={22} /></div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalBookings.toLocaleString("pt-BR")}</p>
              <p className="text-xs text-muted-foreground">Total Reservas</p>
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
            <div className="p-3 rounded-xl bg-muted text-blue-600"><TrendingUp size={22} /></div>
            <div>
              <p className="text-2xl font-bold text-foreground">{fmt(totalRevenue)}</p>
              <p className="text-xs text-muted-foreground">Receita Total</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input placeholder="Buscar passeio..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus size={16} className="mr-1" /> Novo Passeio
          </Button>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Passeio</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Duração</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Reservas</TableHead>
              <TableHead>Avaliação</TableHead>
              <TableHead>Receita</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((t) => {
              const st = statusConfig[t.status] || statusConfig.ativo;
              return (
                <TableRow key={t.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img src={t.images[0]} alt={t.name} className="w-12 h-12 rounded-lg object-cover" />
                      <div>
                        <p className="font-semibold text-foreground text-sm">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.location}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{t.category}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock size={13} /> {t.duration}</span>
                  </TableCell>
                  <TableCell className="font-medium text-foreground">{fmt(t.price)}</TableCell>
                  <TableCell className="text-foreground">{t.bookings}</TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1 text-foreground">
                      <Star size={13} className="text-amber-500 fill-amber-500" /> {t.rating}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium text-foreground">{fmt(t.revenue)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={st.className}>{st.label}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" title="Editar"><Edit size={14} /></Button>
                      <Button variant="ghost" size="icon" title={t.status === "ativo" ? "Desativar" : "Ativar"}>
                        {t.status === "ativo" ? <EyeOff size={14} /> : <Eye size={14} />}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Passeio</DialogTitle>
            <DialogDescription>Cadastre um novo passeio na plataforma.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Nome do passeio" />
            <div className="grid grid-cols-2 gap-4">
              <Input placeholder="Categoria" />
              <Input placeholder="Duração" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input placeholder="Preço (R$)" type="number" />
              <Input placeholder="Localização" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => setDialogOpen(false)}>Cadastrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminPasseios;
