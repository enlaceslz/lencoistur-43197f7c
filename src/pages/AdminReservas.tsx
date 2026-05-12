import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Calendar, DollarSign, Clock, CheckCircle, XCircle, ChevronRight, FileDown, LayoutGrid, List } from "lucide-react";
import { useBookings, BookingItem } from "@/hooks/useBookings";
import { formatCurrency, cn } from "@/lib/utils";
import { toast } from "sonner";

const AdminReservas = () => {
  const { bookings, loading } = useBookings();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [selected, setSelected] = useState<BookingItem | null>(null);

  const filtered = bookings.filter((b) => {
    const q = search.toLowerCase();
    const matchSearch = b.customerName.toLowerCase().includes(q) || b.itemName.toLowerCase().includes(q) || b.bookingCode.toLowerCase().includes(q);
    const matchStatus = statusFilter === "todos" || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPago = bookings.filter((b) => b.paymentStatus === "pago").reduce((a, b) => a + b.finalTotal, 0);

  const stats = [
    { label: "Total Reservas", value: bookings.length, icon: List, color: "text-indigo-600" },
    { label: "Confirmadas", value: bookings.filter((b) => b.status === "confirmada").length, icon: CheckCircle, color: "text-emerald-600" },
    { label: "Pendentes", value: bookings.filter((b) => b.status === "pendente").length, icon: Clock, color: "text-amber-600" },
    { label: "Faturamento Pago", value: formatCurrency(totalPago), icon: DollarSign, color: "text-blue-600" },
  ];

  if (loading) return <AdminLayout title="Gestão de Reservas"><div className="flex items-center justify-center h-full">Carregando...</div></AdminLayout>;

  return (
    <AdminLayout title="Gestão de Reservas">
      <div className="flex flex-col gap-6 h-[calc(100vh-120px)]">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <Card key={i} className="rounded-3xl border-slate-100 shadow-sm">
              <CardContent className="p-6 flex items-center gap-4">
                <div className={cn("p-3 rounded-2xl bg-slate-50", s.color)}><s.icon size={24} /></div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{s.label}</p>
                  <p className="text-2xl font-black text-slate-900">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex-1 flex gap-6 overflow-hidden">
          <div className="flex-1 bg-white rounded-3xl border border-slate-200 flex flex-col overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 flex gap-4 items-center bg-slate-50/50">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-3 text-slate-400" size={18} />
                <input placeholder="Buscar reserva..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 text-sm font-medium" />
              </div>
            </div>
            <div className="overflow-auto flex-1">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Código</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((b) => (
                    <TableRow key={b.id} className={cn("cursor-pointer hover:bg-slate-50", selected?.id === b.id && "bg-primary/5")} onClick={() => setSelected(b)}>
                      <TableCell className="font-bold text-slate-900">{b.bookingCode}</TableCell>
                      <TableCell className="font-medium">{b.customerName}</TableCell>
                      <TableCell className="text-slate-600">{b.itemName}</TableCell>
                      <TableCell className="font-bold">{formatCurrency(b.finalTotal)}</TableCell>
                      <TableCell><Badge variant="outline" className="rounded-lg font-bold">{b.status}</Badge></TableCell>
                      <TableCell><ChevronRight size={16} className="text-slate-400" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="w-[400px] bg-white rounded-3xl border border-slate-200 p-6 shadow-sm overflow-auto">
            {selected ? (
              <div className="space-y-6">
                <h2 className="text-xl font-black text-slate-900">{selected.bookingCode}</h2>
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Cliente</p>
                    <p className="font-bold text-slate-900">{selected.customerName}</p>
                    <p className="text-sm text-slate-600">{selected.customerEmail}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Resumo da Reserva</p>
                    <p className="font-bold text-slate-900">{selected.itemName}</p>
                    <p className="text-sm text-slate-600">{selected.guests} hóspedes | {selected.date}</p>
                  </div>
                </div>
                <Button className="w-full rounded-xl font-bold" onClick={() => toast.info("Funcionalidade em atualização")}>Gerenciar Reserva</Button>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4">
                <List size={48} className="opacity-20" />
                <p className="font-bold">Selecione uma reserva</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminReservas;
