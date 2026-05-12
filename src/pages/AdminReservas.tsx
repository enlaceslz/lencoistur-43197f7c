import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Calendar, DollarSign, Clock, CheckCircle, XCircle, ChevronRight, FileDown, LayoutGrid, List, Loader2, User, Phone, Mail, MapPin, CreditCard, Trash2, Printer, Download, Eye, MoreHorizontal } from "lucide-react";
import { useBookings, BookingItem } from "@/hooks/useBookings";
import { formatCurrency, cn } from "@/lib/utils";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { maskPhone } from "@/lib/masks";

const statusConfig: Record<string, { label: string; className: string }> = {
  confirmada: { label: "Confirmada", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  pendente: { label: "Pendente", className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  cancelada: { label: "Cancelada", className: "bg-rose-500/10 text-rose-600 border-rose-500/20" },
  concluida: { label: "Concluída", className: "bg-primary/10 text-primary border-primary/20" },
};

const AdminReservas = () => {
  const { bookings, loading, addBooking, updateBooking, confirmPayment, cancelBooking, deleteBooking, completeBooking } = useBookings();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<BookingItem | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const filtered = bookings.filter((b) => {
    const q = search.toLowerCase();
    return b.customerName.toLowerCase().includes(q) || b.itemName.toLowerCase().includes(q) || b.bookingCode.toLowerCase().includes(q);
  });

  const totalPago = bookings.filter((b) => b.paymentStatus === "pago").reduce((a, b) => a + b.finalTotal, 0);

  const handleAction = async (action: () => Promise<void>, msg: string) => {
    setActionLoading(true);
    try {
      await action();
      toast.success(msg);
      setSelected(null);
    } catch (err) {
      toast.error("Erro ao processar ação");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("🚨 EXCLUIR RESERVA PERMANENTEMENTE?\n\nEsta ação não pode ser desfeita e removerá todos os registros financeiros associados.")) return;
    
    setActionLoading(true);
    try {
      await deleteBooking(id);
      toast.success("Reserva excluída permanentemente.");
      setSelected(null);
    } catch (err: any) {
      toast.error(err?.message || "Erro ao excluir reserva.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return (
    <AdminLayout title="Gestão de Reservas">
      <div className="flex items-center justify-center py-32"><Loader2 className="animate-spin text-primary" size={40} /></div>
    </AdminLayout>
  );

  return (
    <AdminLayout title="Gestão de Reservas">
      <div className="flex flex-col gap-6 h-[calc(100vh-120px)]">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Operações</h1>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Calendar size={14} className="text-primary" /> {bookings.length} Reservas Registradas
            </p>
          </div>
          <Button onClick={() => setShowNewForm(true)} className="rounded-xl h-10 px-6 bg-primary font-black text-white shadow-lg shadow-primary/20">
            <Plus size={18} className="mr-2" strokeWidth={3} /> Nova Reserva
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: "Total Reservas", value: bookings.length, icon: Calendar, color: "text-indigo-600", bg: "bg-indigo-500/10" },
            { label: "Confirmadas", value: bookings.filter(b => b.status === "confirmada").length, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-500/10" },
            { label: "Pendentes", value: bookings.filter(b => b.status === "pendente").length, icon: Clock, color: "text-amber-600", bg: "bg-amber-500/10" },
            { label: "Faturamento Pago", value: formatCurrency(totalPago), icon: DollarSign, color: "text-blue-600", bg: "bg-blue-500/10" },
          ].map((stat, i) => (
            <Card key={i} className="rounded-[2rem] border-white/40 shadow-xl shadow-primary/5 glass-card overflow-hidden group">
              <CardContent className="p-7 relative">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all" />
                <div className="flex items-center gap-4 mb-4">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm", stat.bg, stat.color, "border-white/20")}>
                    <stat.icon size={22} strokeWidth={2.5} />
                  </div>
                </div>
                <p className="text-3xl font-black text-foreground tracking-tighter">{stat.value}</p>
                <p className="text-[10px] font-black text-muted-foreground mt-1 uppercase tracking-[0.2em]">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex-1 flex gap-6 overflow-hidden">
          <div className="flex-1 bg-white rounded-[2.5rem] border border-white/40 flex flex-col overflow-hidden shadow-xl shadow-primary/5 glass-card">
            <div className="p-6 border-b border-border/40 flex gap-4 items-center bg-slate-50/30">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input 
                  placeholder="Buscar por código, cliente ou serviço..." 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)} 
                  className="w-full pl-11 pr-4 h-12 rounded-2xl border border-border/60 outline-none focus:ring-4 focus:ring-primary/5 text-sm font-semibold bg-white transition-all" 
                />
              </div>
            </div>
            <div className="overflow-auto flex-1">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="hover:bg-transparent border-b border-border/40">
                    <th className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-6 py-5 text-left">Reserva / ID</th>
                    <th className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-6 py-5 text-left">Cliente</th>
                    <th className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-6 py-5 text-left">Valor Total</th>
                    <th className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-6 py-5 text-center">Status</th>
                    <th className="px-6"></th>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((b) => (
                    <TableRow 
                      key={b.id} 
                      className={cn(
                        "cursor-pointer border-b border-border/20 transition-all group", 
                        selected?.id === b.id ? "bg-primary/[0.03]" : "hover:bg-primary/[0.01]"
                      )} 
                      onClick={() => setSelected(b)}
                    >
                      <TableCell className="px-6 py-5">
                        <div>
                          <p className="text-xs font-black text-foreground leading-tight">{b.itemName}</p>
                          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-tighter mt-1">#{b.bookingCode}</p>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-primary/5 flex items-center justify-center text-primary font-black text-[10px] border border-primary/10 group-hover:bg-primary/10 transition-colors">
                            {b.customerName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-foreground leading-tight">{b.customerName}</p>
                            <p className="text-[9px] font-medium text-muted-foreground mt-0.5">{b.date}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-5">
                        <p className="text-sm font-black text-foreground">{formatCurrency(b.finalTotal)}</p>
                      </TableCell>
                      <TableCell className="px-6 py-5 text-center">
                        <Badge 
                          className={cn("rounded-xl px-3 py-1 font-black text-[9px] uppercase border shadow-sm", statusConfig[b.status]?.className)} 
                          variant="outline"
                        >
                          {statusConfig[b.status]?.label || b.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-5 text-right">
                        <ChevronRight size={18} className={cn("inline transition-all", selected?.id === b.id ? "translate-x-1 text-primary opacity-100" : "text-slate-300 opacity-0 group-hover:opacity-100")} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="w-[450px] flex flex-col gap-6 h-full">
            {selected ? (
              <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm overflow-auto flex-1 flex flex-col animate-in slide-in-from-right-4 duration-300">
                <div className="flex items-center justify-between mb-8">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Detalhes da Reserva</p>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">{selected.bookingCode}</h2>
                  </div>
                  <Badge className={cn("rounded-xl px-4 py-1.5 font-black text-[11px] uppercase border-2", statusConfig[selected.status]?.className)} variant="outline">{statusConfig[selected.status]?.label}</Badge>
                </div>

                <div className="space-y-8 flex-1">
                  <section className="space-y-4">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <User size={14} className="text-slate-300" /> Informações do Cliente
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-primary shadow-sm font-black text-xl">
                          {selected.customerName[0]}
                        </div>
                        <div className="space-y-1">
                          <p className="font-black text-slate-900 leading-none">{selected.customerName}</p>
                          <p className="text-xs font-bold text-slate-500 flex items-center gap-1"><Mail size={12} /> {selected.customerEmail}</p>
                          <p className="text-xs font-bold text-slate-500 flex items-center gap-1"><Phone size={12} /> {selected.customerPhone}</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-4">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <List size={14} className="text-slate-300" /> Dados do Serviço
                    </h3>
                    <div className="p-6 bg-slate-900 rounded-3xl text-white space-y-4 shadow-xl shadow-slate-200 relative overflow-hidden">
                      <div className="relative z-10">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{selected.type === 'tour' ? 'Passeio' : selected.type === 'transfer' ? 'Translado' : 'Pacote'}</p>
                        <p className="text-xl font-black leading-tight mb-4">{selected.itemName}</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <p className="text-[9px] font-black text-slate-500 uppercase">Data</p>
                            <p className="text-sm font-bold flex items-center gap-2"><Calendar size={14} /> {selected.date}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[9px] font-black text-slate-500 uppercase">Hóspedes</p>
                            <p className="text-sm font-bold flex items-center gap-2"><Plus size={14} /> {selected.guests} PAX</p>
                          </div>
                        </div>
                      </div>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl rounded-full -mr-16 -mt-16" />
                    </div>
                  </section>

                  <section className="space-y-4">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <DollarSign size={14} className="text-slate-300" /> Resumo Financeiro
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm font-bold text-slate-500">
                        <span>Subtotal</span>
                        <span>{formatCurrency(selected.total)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-bold text-rose-500">
                        <span>Desconto</span>
                        <span>- {formatCurrency(selected.discount)}</span>
                      </div>
                      <div className="pt-2 border-t border-dashed border-slate-200 flex justify-between items-center">
                        <span className="text-sm font-black text-slate-900">Total Final</span>
                        <span className="text-xl font-black text-primary">{formatCurrency(selected.finalTotal)}</span>
                      </div>
                    </div>
                  </section>
                </div>

                <div className="mt-8 pt-8 border-t border-slate-100 grid grid-cols-2 gap-3">
                  {selected.status === 'pendente' && (
                    <Button onClick={() => handleAction(() => confirmPayment(selected.id), "Pagamento confirmado!")} className="rounded-xl h-11 bg-emerald-600 font-black text-white hover:bg-emerald-700 shadow-lg shadow-emerald-100">Confirmar Pagamento</Button>
                  )}
                  {selected.status === 'confirmada' && (
                    <Button onClick={() => handleAction(() => completeBooking(selected.id), "Reserva concluída!")} className="rounded-xl h-11 bg-blue-600 font-black text-white hover:bg-blue-700 shadow-lg shadow-blue-100">Concluir Serviço</Button>
                  )}
                  <Button onClick={() => handleAction(() => cancelBooking(selected.id), "Reserva cancelada!")} variant="outline" className="rounded-xl h-11 border-rose-100 text-rose-600 font-black hover:bg-rose-50">Cancelar Reserva</Button>
                  <Button onClick={() => handleDelete(selected.id)} variant="ghost" className="rounded-xl h-11 text-slate-400 font-bold hover:text-rose-600 hover:bg-rose-50 col-span-2"><Trash2 size={16} className="mr-2" /> Excluir Registro</Button>
                </div>
              </div>
            ) : (
              <div className="h-full bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 p-12 text-center">
                <div className="w-20 h-20 rounded-[2rem] bg-white border border-slate-100 flex items-center justify-center mb-6 shadow-sm">
                  <Calendar size={32} className="text-slate-200" />
                </div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest leading-tight">Selecione uma<br />reserva</h3>
                <p className="text-xs font-bold mt-2 text-slate-500">Para visualizar os detalhes operacionais e financeiros completos</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={showNewForm} onOpenChange={setShowNewForm}>
        <DialogContent className="max-w-2xl rounded-[2.5rem] p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">Nova Reserva</DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-6">
            <p className="text-sm font-medium text-slate-500">O formulário completo de reserva está sendo otimizado. Por favor, utilize o fluxo de venda direta no site ou entre em contato com o suporte para reservas manuais avançadas.</p>
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" onClick={() => setShowNewForm(false)} className="rounded-xl h-11 font-bold">Cancelar</Button>
              <Button className="rounded-xl h-11 font-black" onClick={() => toast.info("Funcionalidade em desenvolvimento")}>Criar via Site</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminReservas;
