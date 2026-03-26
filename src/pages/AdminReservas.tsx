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
  Search, ShoppingCart, CheckCircle, Clock, XCircle, AlertCircle, Eye,
} from "lucide-react";

interface Booking {
  id: string;
  client: string;
  tour: string;
  date: string;
  pax: number;
  total: number;
  status: "confirmada" | "pendente" | "cancelada" | "concluida";
  paymentStatus: "pago" | "pendente" | "reembolsado";
  channel: string;
}

const bookings: Booking[] = [
  { id: "RES-001", client: "João Silva", tour: "Lagoas Azul e Bonita", date: "2024-03-15", pax: 4, total: 600, status: "confirmada", paymentStatus: "pago", channel: "Site" },
  { id: "RES-002", client: "Maria Santos", tour: "Rio Preguiças (Caburé)", date: "2024-03-16", pax: 2, total: 400, status: "confirmada", paymentStatus: "pago", channel: "WhatsApp" },
  { id: "RES-003", client: "John Smith", tour: "Trekking Lençóis", date: "2024-03-17", pax: 1, total: 350, status: "pendente", paymentStatus: "pendente", channel: "Booking" },
  { id: "RES-004", client: "Ana Costa", tour: "Quadriciclo (Lagoa Azul)", date: "2024-03-18", pax: 6, total: 1500, status: "confirmada", paymentStatus: "pago", channel: "Site" },
  { id: "RES-005", client: "Pedro Lima", tour: "Passeio de Lancha", date: "2024-03-19", pax: 3, total: 750, status: "cancelada", paymentStatus: "reembolsado", channel: "Parceiro" },
  { id: "RES-006", client: "Fernanda Reis", tour: "Circuito Lagoas + Rio", date: "2024-03-20", pax: 2, total: 500, status: "concluida", paymentStatus: "pago", channel: "Site" },
  { id: "RES-007", client: "Carlos Oliveira", tour: "Santo Amaro Completo", date: "2024-03-21", pax: 5, total: 1250, status: "pendente", paymentStatus: "pendente", channel: "WhatsApp" },
  { id: "RES-008", client: "Sophie Martin", tour: "Lagoas Azul e Bonita", date: "2024-03-22", pax: 2, total: 300, status: "confirmada", paymentStatus: "pago", channel: "Site" },
];

const statusConfig: Record<string, { label: string; className: string; icon: typeof CheckCircle }> = {
  confirmada: { label: "Confirmada", className: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300", icon: CheckCircle },
  pendente: { label: "Pendente", className: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300", icon: Clock },
  cancelada: { label: "Cancelada", className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300", icon: XCircle },
  concluida: { label: "Concluída", className: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300", icon: CheckCircle },
};

const paymentConfig: Record<string, string> = {
  pago: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  pendente: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  reembolsado: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR")}`;

const AdminReservas = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");

  const filtered = bookings.filter((b) => {
    const matchSearch = b.client.toLowerCase().includes(search.toLowerCase()) || b.tour.toLowerCase().includes(search.toLowerCase()) || b.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "todos" || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = [
    { icon: ShoppingCart, label: "Total Reservas", value: bookings.length, color: "text-primary" },
    { icon: CheckCircle, label: "Confirmadas", value: bookings.filter((b) => b.status === "confirmada").length, color: "text-green-600" },
    { icon: Clock, label: "Pendentes", value: bookings.filter((b) => b.status === "pendente").length, color: "text-amber-600" },
    { icon: AlertCircle, label: "Receita Total", value: fmt(bookings.filter((b) => b.paymentStatus === "pago").reduce((a, b2) => a + b2.total, 0)), color: "text-blue-600" },
  ];

  return (
    <AdminLayout title="Reservas">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`p-3 rounded-xl bg-muted ${s.color}`}><s.icon size={22} /></div>
              <div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mb-6">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input placeholder="Buscar por cliente, passeio ou código..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {["todos", "confirmada", "pendente", "cancelada", "concluida"].map((s) => (
              <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(s)} className="capitalize">
                {s === "todos" ? "Todos" : statusConfig[s]?.label || s}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Passeio</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Pax</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead>Canal</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((b) => {
              const sc = statusConfig[b.status];
              return (
                <TableRow key={b.id}>
                  <TableCell className="font-mono text-sm text-foreground">{b.id}</TableCell>
                  <TableCell className="font-medium text-foreground">{b.client}</TableCell>
                  <TableCell className="text-muted-foreground">{b.tour}</TableCell>
                  <TableCell className="text-muted-foreground">{new Date(b.date).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell className="text-foreground">{b.pax}</TableCell>
                  <TableCell className="font-medium text-foreground">{fmt(b.total)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={paymentConfig[b.paymentStatus]}>{b.paymentStatus}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{b.channel}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={sc.className}>{sc.label}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon"><Eye size={14} /></Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </AdminLayout>
  );
};

export default AdminReservas;
