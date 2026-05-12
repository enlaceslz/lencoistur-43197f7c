import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Calendar, DollarSign, Clock, CheckCircle, XCircle, ChevronRight, FileDown, LayoutGrid, List, Loader2 } from "lucide-react";
import { useBookings, BookingItem } from "@/hooks/useBookings";
import { formatCurrency, cn } from "@/lib/utils";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; className: string }> = {
  confirmada: { label: "Confirmada", className: "bg-emerald-100 text-emerald-700" },
  pendente: { label: "Pendente", className: "bg-amber-100 text-amber-700" },
  cancelada: { label: "Cancelada", className: "bg-rose-100 text-rose-700" },
  concluida: { label: "Concluída", className: "bg-blue-100 text-blue-700" },
};

const AdminReservas = () => {
  const { bookings, loading, addBooking, updateBooking, confirmPayment, cancelBooking, deleteBooking, completeBooking, updateBookingNotes } = useBookings();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<BookingItem | null>(null);

  const filtered = bookings.filter((b) => {
    const q = search.toLowerCase();
    return b.customerName.toLowerCase().includes(q) || b.itemName.toLowerCase().includes(q) || b.bookingCode.toLowerCase().includes(q);
  });

  const totalPago = bookings.filter((b) => b.paymentStatus === "pago").reduce((a, b) => a + b.finalTotal, 0);

  if (loading) return (
    <AdminLayout title="Gestão de Reservas">
      <div className="flex items-center justify-center py-32"><Loader2 className="animate-spin text-primary" size={40} /></div>
    </AdminLayout>
  );

  return (
    <AdminLayout title="Gestão de Reservas">
      <div className="flex flex-col gap-6 h-[calc(100vh-120px)]">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="rounded-3xl border-slate-100 shadow-sm"><CardContent className="p-6">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Reservas</p>
            <p className="text-2xl font-black text-slate-900">{bookings.length}</p>
          </CardContent></Card>
          <Card className="rounded-3xl border-slate-100 shadow-sm"><CardContent className="p-6">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Confirmadas</p>
            <p className="text-2xl font-black text-emerald-600">{bookings.filter(b => b.status === "confirmada").length}</p>
          </CardContent></Card>
          <Card className="rounded-3xl border-slate-100 shadow-sm"><CardContent className="p-6">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pendentes</p>
            <p className="text-2xl font-black text-amber-600">{bookings.filter(b => b.status === "pendente").length}</p>
          </CardContent></Card>
          <Card className="rounded-3xl border-slate-100 shadow-sm"><CardContent className="p-6">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Faturamento Pago</p>
            <p className="text-2xl font-black text-blue-600">{formatCurrency(totalPago)}</p>
          </CardContent></Card>
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
                  <TableRow><TableHead>Código</TableHead><TableHead>Cliente</TableHead><TableHead>Serviço</TableHead><TableHead>Valor</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((b) => (
                    <TableRow key={b.id} className={cn("cursor-pointer hover:bg-slate-50", selected?.id === b.id && "bg-primary/5")} onClick={() => setSelected(b)}>
                      <TableCell className="font-bold">{b.bookingCode}</TableCell>
                      <TableCell className="font-medium">{b.customerName}</TableCell>
                      <TableCell className="text-slate-600">{b.itemName}</TableCell>
                      <TableCell className="font-bold">{formatCurrency(b.finalTotal)}</TableCell>
                      <TableCell><Badge className={cn("rounded-lg font-bold", statusConfig[b.status]?.className)}>{statusConfig[b.status]?.label || b.status}</Badge></TableCell>
                      <TableCell><ChevronRight size={16} /></TableCell>
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
                  <div className="p-4 bg-slate-50 rounded-2xl"><p className="text-[10px] font-bold text-slate-500 uppercase">Cliente</p><p className="font-bold text-slate-900">{selected.customerName}</p><p className="text-sm text-slate-600">{selected.customerEmail}</p></div>
                  <div className="p-4 bg-slate-50 rounded-2xl"><p className="text-[10px] font-bold text-slate-500 uppercase">Resumo</p><p className="font-bold text-slate-900">{selected.itemName}</p><p className="text-sm text-slate-600">{selected.guests} hóspedes | {selected.date}</p></div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4"><List size={48} className="opacity-20" /><p className="font-bold">Selecione uma reserva</p></div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminReservas;