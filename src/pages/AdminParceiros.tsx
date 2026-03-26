import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Building2, Compass, Car, Users, Search, Plus, Edit, Trash2, Phone, Mail, MapPin, Star, MoreHorizontal,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Partner {
  id: string;
  name: string;
  type: "hotel" | "guia" | "motorista" | "agencia";
  contact: string;
  phone: string;
  email: string;
  city: string;
  commission: number;
  rating: number;
  status: "ativo" | "inativo" | "pendente";
  totalBookings: number;
  revenue: number;
}

const partners: Partner[] = [
  { id: "1", name: "Pousada Jurará", type: "hotel", contact: "Maria Silva", phone: "(98) 99111-2233", email: "contato@jurara.com", city: "Santo Amaro", commission: 15, rating: 4.8, status: "ativo", totalBookings: 234, revenue: 45600 },
  { id: "2", name: "José Santos", type: "guia", contact: "José Santos", phone: "(98) 99222-3344", email: "jose@guia.com", city: "Barreirinhas", commission: 20, rating: 4.9, status: "ativo", totalBookings: 567, revenue: 89200 },
  { id: "3", name: "Trans Lençóis", type: "motorista", contact: "Carlos Oliveira", phone: "(98) 99333-4455", email: "carlos@trans.com", city: "São Luís", commission: 10, rating: 4.5, status: "ativo", totalBookings: 189, revenue: 34100 },
  { id: "4", name: "Aventura MA", type: "agencia", contact: "Ana Costa", phone: "(98) 99444-5566", email: "ana@aventura.com", city: "Barreirinhas", commission: 12, rating: 4.7, status: "ativo", totalBookings: 345, revenue: 67800 },
  { id: "5", name: "Pousada Rancho", type: "hotel", contact: "Pedro Lima", phone: "(98) 99555-6677", email: "rancho@pousada.com", city: "Atins", commission: 15, rating: 4.6, status: "pendente", totalBookings: 0, revenue: 0 },
  { id: "6", name: "Maria Guia", type: "guia", contact: "Maria Ferreira", phone: "(98) 99666-7788", email: "maria@guia.com", city: "Santo Amaro", commission: 20, rating: 4.3, status: "inativo", totalBookings: 78, revenue: 12300 },
  { id: "7", name: "4x4 Lençóis", type: "motorista", contact: "Raimundo Souza", phone: "(98) 99777-8899", email: "rai@4x4.com", city: "Barreirinhas", commission: 10, rating: 4.8, status: "ativo", totalBookings: 412, revenue: 56700 },
  { id: "8", name: "Eco Tours MA", type: "agencia", contact: "Fernanda Reis", phone: "(98) 99888-9900", email: "fer@ecotours.com", city: "São Luís", commission: 12, rating: 4.4, status: "ativo", totalBookings: 156, revenue: 28900 },
];

const typeConfig = {
  hotel: { icon: Building2, label: "Hotel / Pousada", color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  guia: { icon: Compass, label: "Guia Turístico", color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
  motorista: { icon: Car, label: "Motorista", color: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300" },
  agencia: { icon: Users, label: "Agência", color: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300" },
};

const statusConfig: Record<string, string> = {
  ativo: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  inativo: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  pendente: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
};

const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR")}`;

const AdminParceiros = () => {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("todos");
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const types = ["todos", ...Object.keys(typeConfig)] as const;

  const filtered = partners.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.contact.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "todos" || p.type === typeFilter;
    return matchSearch && matchType;
  });

  const stats = [
    { icon: Building2, label: "Hotéis / Pousadas", value: partners.filter((p) => p.type === "hotel").length, color: "text-blue-600" },
    { icon: Compass, label: "Guias", value: partners.filter((p) => p.type === "guia").length, color: "text-green-600" },
    { icon: Car, label: "Motoristas", value: partners.filter((p) => p.type === "motorista").length, color: "text-amber-600" },
    { icon: Users, label: "Agências", value: partners.filter((p) => p.type === "agencia").length, color: "text-purple-600" },
  ];

  const totalRevenue = partners.reduce((acc, p) => acc + p.revenue, 0);
  const totalBookings = partners.reduce((acc, p) => acc + p.totalBookings, 0);

  return (
    <AdminLayout title="Parceiros">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`p-3 rounded-xl bg-muted ${s.color}`}>
                <s.icon size={22} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground mb-1">Receita Total Parceiros</p>
            <p className="text-2xl font-bold text-foreground">{fmt(totalRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground mb-1">Reservas via Parceiros</p>
            <p className="text-2xl font-bold text-foreground">{totalBookings.toLocaleString("pt-BR")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              placeholder="Buscar parceiro..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {types.map((t) => (
              <Button
                key={t}
                variant={typeFilter === t ? "default" : "outline"}
                size="sm"
                onClick={() => setTypeFilter(t)}
                className="capitalize"
              >
                {t === "todos" ? "Todos" : typeConfig[t as keyof typeof typeConfig].label}
              </Button>
            ))}
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus size={16} className="mr-1" /> Novo Parceiro
          </Button>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Parceiro</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Cidade</TableHead>
              <TableHead>Comissão</TableHead>
              <TableHead>Avaliação</TableHead>
              <TableHead>Reservas</TableHead>
              <TableHead>Receita</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p) => {
              const tc = typeConfig[p.type];
              return (
                <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedPartner(p)}>
                  <TableCell>
                    <div>
                      <p className="font-semibold text-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.contact}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={tc.color}>
                      <tc.icon size={12} className="mr-1" />
                      {tc.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{p.city}</TableCell>
                  <TableCell className="font-medium text-foreground">{p.commission}%</TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1 text-foreground">
                      <Star size={14} className="text-amber-500 fill-amber-500" />
                      {p.rating}
                    </span>
                  </TableCell>
                  <TableCell className="text-foreground">{p.totalBookings}</TableCell>
                  <TableCell className="font-medium text-foreground">{fmt(p.revenue)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={statusConfig[p.status]}>
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); }}>
                      <MoreHorizontal size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {/* Detail Panel */}
      {selectedPartner && (
        <Card className="mt-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-foreground">{selectedPartner.name}</h3>
                <Badge variant="secondary" className={typeConfig[selectedPartner.type].color}>
                  {typeConfig[selectedPartner.type].label}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm"><Edit size={14} className="mr-1" /> Editar</Button>
                <Button variant="destructive" size="sm"><Trash2 size={14} className="mr-1" /> Remover</Button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone size={14} /> {selectedPartner.phone}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail size={14} /> {selectedPartner.email}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin size={14} /> {selectedPartner.city}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Star size={14} className="text-amber-500" /> {selectedPartner.rating} ({selectedPartner.totalBookings} reservas)
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* New Partner Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Parceiro</DialogTitle>
            <DialogDescription>Preencha os dados do novo parceiro para cadastrá-lo na plataforma.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Nome / Razão Social" />
            <div className="grid grid-cols-2 gap-4">
              <Input placeholder="Contato" />
              <Input placeholder="Telefone" />
            </div>
            <Input placeholder="Email" type="email" />
            <div className="grid grid-cols-2 gap-4">
              <Input placeholder="Cidade" />
              <Input placeholder="Comissão (%)" type="number" />
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

export default AdminParceiros;
