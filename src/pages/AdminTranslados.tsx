import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Car, MapPin, Clock, Users } from "lucide-react";
import { transferRoutes as transfers } from "@/data/transfers";

const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR")}`;

const AdminTranslados = () => {
  return (
    <AdminLayout title="Translados">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-muted text-primary"><Car size={22} /></div>
            <div>
              <p className="text-2xl font-bold text-foreground">{transfers.length}</p>
              <p className="text-xs text-muted-foreground">Rotas Ativas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-muted text-green-600"><MapPin size={22} /></div>
            <div>
              <p className="text-2xl font-bold text-foreground">{new Set(transfers.flatMap(t => [t.origin, t.destination])).size}</p>
              <p className="text-xs text-muted-foreground">Destinos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-muted text-amber-600"><Clock size={22} /></div>
            <div>
              <p className="text-2xl font-bold text-foreground">{transfers.reduce((a, t) => a + t.departures.length, 0)}</p>
              <p className="text-xs text-muted-foreground">Horários</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-muted text-blue-600"><Users size={22} /></div>
            <div>
              <p className="text-2xl font-bold text-foreground">{new Set(transfers.map(t => t.vehicleType)).size}</p>
              <p className="text-xs text-muted-foreground">Tipos de Veículo</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rota</TableHead>
              <TableHead>Duração</TableHead>
              <TableHead>Veículos</TableHead>
              <TableHead>Horários</TableHead>
              <TableHead>Preço (a partir de)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transfers.map((t) => (
              <TableRow key={t.id}>
                <TableCell>
                  <p className="font-semibold text-foreground">{t.origin} → {t.destination}</p>
                </TableCell>
                <TableCell className="text-muted-foreground">{t.duration}</TableCell>
                <TableCell>
                  <Badge variant="outline">{t.vehicleType}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{t.departures.join(", ")}</TableCell>
                <TableCell className="font-medium text-foreground">{fmt(t.price)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </AdminLayout>
  );
};

export default AdminTranslados;
