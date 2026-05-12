import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Calendar, DollarSign, Clock, CheckCircle, XCircle, ChevronRight, FileDown, LayoutGrid, List, Loader2, User, Phone, Mail, MapPin, CreditCard, Trash2, Printer, Download, Eye, MoreHorizontal, Users, Tag, Briefcase } from "lucide-react";
import { useBookings, BookingItem } from "@/hooks/useBookings";
import { formatCurrency, cn } from "@/lib/utils";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { maskPhone, maskCurrency, parseCurrencyToNumber } from "@/lib/masks";

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
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [tours, setTours] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    type: "tour" as "tour" | "transfer" | "package",
    itemName: "",
    date: "",
    guests: 1,
    payMethod: "pix" as "pix" | "card" | "info",
    unitPrice: "0",
    discount: "0",
    publicUnitPrice: "0",
    notes: "",
    collaboratorId: "",
    partnerId: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      const [collabsRes, partnersRes, toursRes] = await Promise.all([
        supabase.from("collaborators").select("id, name").eq("status", "active"),
        supabase.from("partners").select("id, name").eq("active", true),
        supabase.from("tours").select("id, name, price, private_price").eq("active", true)
      ]);

      if (collabsRes.data) setCollaborators(collabsRes.data);
      if (partnersRes.data) setPartners(partnersRes.data);
      if (toursRes.data) setTours(toursRes.data);
    };

    fetchData();
  }, []);

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

  const handleSave = async () => {
    if (!form.customerName || !form.itemName || !form.date) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    setSaving(true);
    try {
      const unitPriceNum = parseCurrencyToNumber(form.unitPrice);
      const discountNum = parseCurrencyToNumber(form.discount);
      const publicUnitPriceNum = parseCurrencyToNumber(form.publicUnitPrice);
      
      const total = (unitPriceNum * form.guests);
      const publicTotal = (publicUnitPriceNum * form.guests);
      const finalTotal = total - discountNum;

      await addBooking({
        ...form,
        unitPrice: unitPriceNum,
        total,
        discount: discountNum,
        finalTotal,
        publicUnitPrice: publicUnitPriceNum,
        publicTotal,
        collaboratorId: form.collaboratorId === "none" ? undefined : form.collaboratorId || undefined,
        partnerId: form.partnerId === "none" ? undefined : form.partnerId || undefined,
      });

      toast.success("Reserva criada com sucesso!");
      setShowNewForm(false);
      setForm({
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        type: "tour",
        itemName: "",
        date: "",
        guests: 1,
        payMethod: "pix",
        unitPrice: "0",
        discount: "0",
        publicUnitPrice: "0",
        notes: "",
        collaboratorId: "",
        partnerId: "",
      });
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar reserva");
    } finally {
      setSaving(false);
    }
  };

  const handleTourChange = (tourId: string) => {
    const tour = tours.find(t => t.id === tourId);
    if (tour) {
      setForm(prev => ({
        ...prev,
        itemName: tour.name,
        unitPrice: tour.price.toString(),
        publicUnitPrice: tour.private_price.toString(),
      }));
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
              <div className="bg-white rounded-[2.5rem] border border-white/40 p-8 shadow-xl shadow-primary/5 overflow-auto flex-1 flex flex-col animate-in slide-in-from-right-8 duration-500 glass-card">
                <div className="flex items-center justify-between mb-10">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Gestão Operacional</p>
                    <h2 className="text-3xl font-black text-foreground tracking-tighter leading-none">{selected.bookingCode}</h2>
                  </div>
                  <Badge 
                    className={cn("rounded-2xl px-5 py-2 font-black text-[10px] uppercase border shadow-sm", statusConfig[selected.status]?.className)} 
                    variant="outline"
                  >
                    {statusConfig[selected.status]?.label}
                  </Badge>
                </div>

                <div className="space-y-10 flex-1">
                  <section className="space-y-5">
                    <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" /> Informações do Cliente
                    </h3>
                    <div className="p-6 bg-slate-50/50 rounded-[2rem] border border-border/40 flex items-start gap-5 group hover:bg-white hover:shadow-lg hover:shadow-primary/5 transition-all">
                      <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 font-black text-xl border-2 border-white/20">
                        {selected.customerName[0]}
                      </div>
                      <div className="space-y-1.5">
                        <p className="font-black text-lg text-foreground tracking-tight leading-none">{selected.customerName}</p>
                        <p className="text-[11px] font-bold text-muted-foreground flex items-center gap-2 tracking-tight">
                          <Mail size={13} className="text-primary/60" /> {selected.customerEmail}
                        </p>
                        <p className="text-[11px] font-bold text-muted-foreground flex items-center gap-2 tracking-tight">
                          <Phone size={13} className="text-primary/60" /> {selected.customerPhone}
                        </p>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-5">
                    <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" /> Resumo do Serviço
                    </h3>
                    <div className="p-8 bg-foreground rounded-[2.5rem] text-white space-y-6 shadow-2xl shadow-foreground/20 relative overflow-hidden group">
                      <div className="absolute right-0 top-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/20 transition-all" />
                      <div className="relative z-10">
                        <p className="text-[9px] font-black text-primary uppercase tracking-[0.3em] mb-2">{selected.type === 'tour' ? 'Expedição' : selected.type === 'transfer' ? 'Translado Premium' : 'Pacote Exclusivo'}</p>
                        <p className="text-2xl font-black leading-tight tracking-tight mb-6 pr-8">{selected.itemName}</p>
                        <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/10">
                          <div className="space-y-1.5">
                            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Data agendada</p>
                            <p className="text-xs font-black flex items-center gap-2.5 uppercase tracking-tighter"><Calendar size={14} className="text-primary" /> {selected.date}</p>
                          </div>
                          <div className="space-y-1.5">
                            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Ocupação</p>
                            <p className="text-xs font-black flex items-center gap-2.5 uppercase tracking-tighter"><Users size={14} className="text-primary" /> {selected.guests} PAX</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-5">
                    <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" /> Demonstrativo Financeiro
                    </h3>
                    <div className="p-6 rounded-[2rem] border border-border/40 bg-slate-50/30 space-y-4">
                      <div className="flex justify-between items-center text-[11px] font-black text-muted-foreground uppercase tracking-widest">
                        <span>Valor Base</span>
                        <span className="text-foreground">{formatCurrency(selected.total)}</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] font-black text-rose-500 uppercase tracking-widest">
                        <span>Descontos / Isenções</span>
                        <span>- {formatCurrency(selected.discount)}</span>
                      </div>
                      <div className="pt-4 border-t border-dashed border-border flex justify-between items-center">
                        <span className="text-xs font-black text-foreground uppercase tracking-[0.2em]">Total Líquido</span>
                        <span className="text-2xl font-black text-primary tracking-tighter">{formatCurrency(selected.finalTotal)}</span>
                      </div>
                    </div>
                  </section>
                </div>

                <div className="mt-10 pt-8 border-t border-border/40 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    {selected.status === 'pendente' && (
                      <Button 
                        onClick={() => handleAction(() => confirmPayment(selected.id), "Pagamento processado com sucesso!")} 
                        className="rounded-2xl h-14 bg-emerald-600 font-black text-[10px] uppercase tracking-widest text-white hover:bg-emerald-700 shadow-xl shadow-emerald-500/10 transition-all active:scale-95"
                      >
                        Validar Pagamento
                      </Button>
                    )}
                    {selected.status === 'confirmada' && (
                      <Button 
                        onClick={() => handleAction(() => completeBooking(selected.id), "Operação finalizada!")} 
                        className="rounded-2xl h-14 bg-primary font-black text-[10px] uppercase tracking-widest text-white hover:bg-primary/90 shadow-xl shadow-primary/10 transition-all active:scale-95"
                      >
                        Concluir Checklist
                      </Button>
                    )}
                    <Button 
                      onClick={() => handleAction(() => cancelBooking(selected.id), "Reserva estornada e cancelada.")} 
                      variant="outline" 
                      className="rounded-2xl h-14 border-rose-500/20 text-rose-600 font-black text-[10px] uppercase tracking-widest hover:bg-rose-500/5 transition-all active:scale-95"
                    >
                      Solicitar Cancelamento
                    </Button>
                  </div>
                  <Button 
                    onClick={() => handleDelete(selected.id)} 
                    variant="ghost" 
                    className="w-full rounded-2xl h-12 text-muted-foreground hover:text-rose-600 font-black text-[9px] uppercase tracking-[0.2em] hover:bg-rose-500/5 transition-all"
                  >
                    <Trash2 size={14} className="mr-2" /> Eliminar Registro do Sistema
                  </Button>
                </div>
              </div>
            ) : (
              <div className="h-full bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground p-12 text-center shadow-inner glass-card">
                <div className="w-24 h-24 rounded-[2.5rem] bg-white border border-border flex items-center justify-center mb-8 shadow-xl shadow-primary/5">
                  <Calendar size={40} className="text-primary/20" />
                </div>
                <h3 className="text-xl font-black text-foreground uppercase tracking-widest leading-tight">Análise<br />Estratégica</h3>
                <p className="text-[10px] font-bold mt-3 text-muted-foreground max-w-[200px] leading-relaxed uppercase tracking-widest">Selecione uma operação para detalhamento operacional completo</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={showNewForm} onOpenChange={setShowNewForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto rounded-[2.5rem] p-0 border-none shadow-2xl">
          <div className="bg-slate-50/50 p-8 border-b border-border/40">
            <DialogHeader>
              <DialogTitle className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                  <Plus size={24} strokeWidth={3} />
                </div>
                Nova Reserva Operacional
              </DialogTitle>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mt-2">Preencha os detalhes estratégicos para o registro da nova expedição</p>
            </DialogHeader>
          </div>

          <div className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Seção: Cliente */}
              <div className="space-y-6">
                <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                  <User size={14} /> Dados do Cliente
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nome Completo</Label>
                    <Input 
                      placeholder="Ex: João Silva" 
                      value={form.customerName} 
                      onChange={e => setForm({...form, customerName: e.target.value})}
                      className="rounded-xl h-12 font-semibold border-slate-200 focus:ring-primary/10"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">WhatsApp</Label>
                      <Input 
                        placeholder="(00) 00000-0000" 
                        value={form.customerPhone} 
                        onChange={e => setForm({...form, customerPhone: maskPhone(e.target.value)})}
                        className="rounded-xl h-12 font-semibold border-slate-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">E-mail</Label>
                      <Input 
                        type="email" 
                        placeholder="email@exemplo.com" 
                        value={form.customerEmail} 
                        onChange={e => setForm({...form, customerEmail: e.target.value})}
                        className="rounded-xl h-12 font-semibold border-slate-200"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Seção: Reserva */}
              <div className="space-y-6">
                <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                  <Calendar size={14} /> Detalhes da Reserva
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tipo de Serviço</Label>
                      <Select value={form.type} onValueChange={(v: any) => setForm({...form, type: v})}>
                        <SelectTrigger className="rounded-xl h-12 font-semibold border-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-200">
                          <SelectItem value="tour">Expedição (Tour)</SelectItem>
                          <SelectItem value="transfer">Translado</SelectItem>
                          <SelectItem value="package">Pacote</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Data da Operação</Label>
                      <Input 
                        type="date" 
                        value={form.date} 
                        onChange={e => setForm({...form, date: e.target.value})}
                        className="rounded-xl h-12 font-semibold border-slate-200"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Serviço / Item</Label>
                    <Select onValueChange={handleTourChange}>
                      <SelectTrigger className="rounded-xl h-12 font-semibold border-slate-200">
                        <SelectValue placeholder="Selecione um serviço cadastrado..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-200">
                        {tours.map(t => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input 
                      placeholder="Ou digite o nome manualmente..." 
                      value={form.itemName} 
                      onChange={e => setForm({...form, itemName: e.target.value})}
                      className="rounded-xl h-10 text-xs font-semibold border-slate-200 mt-2"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-8 border-t border-slate-100">
              {/* Seção: Financeiro */}
              <div className="space-y-6">
                <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                  <DollarSign size={14} /> Financeiro
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Qtd. PAX</Label>
                    <Input 
                      type="number" 
                      min="1" 
                      value={form.guests} 
                      onChange={e => setForm({...form, guests: parseInt(e.target.value) || 1})}
                      className="rounded-xl h-12 font-semibold border-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Método de Pagto</Label>
                    <Select value={form.payMethod} onValueChange={(v: any) => setForm({...form, payMethod: v})}>
                      <SelectTrigger className="rounded-xl h-12 font-semibold border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-200">
                        <SelectItem value="pix">PIX</SelectItem>
                        <SelectItem value="card">Cartão de Crédito</SelectItem>
                        <SelectItem value="info">Informar depois</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Valor Unit.</Label>
                    <Input 
                      value={form.unitPrice} 
                      onChange={e => setForm({...form, unitPrice: maskCurrency(e.target.value)})}
                      className="rounded-xl h-12 font-semibold border-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Desconto</Label>
                    <Input 
                      value={form.discount} 
                      onChange={e => setForm({...form, discount: maskCurrency(e.target.value)})}
                      className="rounded-xl h-12 font-semibold border-slate-200 text-rose-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Valor Público</Label>
                    <Input 
                      value={form.publicUnitPrice} 
                      onChange={e => setForm({...form, publicUnitPrice: maskCurrency(e.target.value)})}
                      className="rounded-xl h-12 font-semibold border-slate-200"
                    />
                  </div>
                </div>
              </div>

              {/* Seção: Alocação */}
              <div className="space-y-6">
                <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                  <Briefcase size={14} /> Alocação & Notas
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Colaborador / Guia</Label>
                      <Select value={form.collaboratorId} onValueChange={v => setForm({...form, collaboratorId: v})}>
                        <SelectTrigger className="rounded-xl h-12 font-semibold border-slate-200 text-left">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-200">
                          <SelectItem value="none">Nenhum</SelectItem>
                          {collaborators.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Parceiro / Origem</Label>
                      <Select value={form.partnerId} onValueChange={v => setForm({...form, partnerId: v})}>
                        <SelectTrigger className="rounded-xl h-12 font-semibold border-slate-200">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-200">
                          <SelectItem value="none">Venda Direta</SelectItem>
                          {partners.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Observações Operacionais</Label>
                    <Textarea 
                      placeholder="Detalhes sobre restrições, preferências ou logísticas especiais..." 
                      value={form.notes} 
                      onChange={e => setForm({...form, notes: e.target.value})}
                      className="rounded-xl min-h-[100px] font-semibold border-slate-200"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 bg-slate-50 border-t border-border/40 flex justify-end gap-4 rounded-b-[2.5rem]">
            <Button variant="ghost" onClick={() => setShowNewForm(false)} className="rounded-xl h-14 px-8 font-bold text-slate-500 hover:bg-slate-200 transition-all">
              Descartar
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="rounded-2xl h-14 px-12 bg-primary font-black text-white shadow-xl shadow-primary/20 hover:scale-105 transition-all active:scale-95 disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin mr-2" /> : <Plus className="mr-2" strokeWidth={3} />}
              Efetivar Reserva no Sistema
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminReservas;
