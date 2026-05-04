import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Search, ShoppingCart, CheckCircle, Clock, XCircle, Eye,
  DollarSign, Ban, Loader2, Users, Calendar, CreditCard, FileText,
  MapPin, Phone, Mail, CheckCircle2, MessageSquare, Download, Printer,
  Plus, Copy, Pencil, Car, Compass, LayoutGrid, List
} from "lucide-react";
import { useBookings, BookingItem } from "@/hooks/useBookings";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { PrintReceiptButton, type ReceiptData } from "@/components/BookingReceipt";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { maskCPF } from "@/lib/masks";
import { BookingCalendar } from "@/components/admin/BookingCalendar";

const statusConfig: Record<string, { label: string; className: string; icon: typeof CheckCircle }> = {
  confirmada: { label: "Confirmada", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200", icon: CheckCircle },
  pendente: { label: "Pendente", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200", icon: Clock },
  cancelada: { label: "Cancelada", className: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200", icon: XCircle },
  concluida: { label: "Concluída", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200", icon: CheckCircle2 },
};

const paymentConfig: Record<string, { label: string; className: string }> = {
  pago: { label: "Pago", className: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" },
  pendente: { label: "Pendente", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  reembolsado: { label: "Reembolsado", className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
};


const fmt = (v: number) => formatCurrency(v);
const fmtDate = (d: string) => {

  if (!d) return "—";
  try { return new Date(d + "T12:00").toLocaleDateString("pt-BR"); } catch { return d; }
};
const fmtDateTime = (d: string) => {
  if (!d) return "—";
  try { return new Date(d).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }); } catch { return d; }
};

interface TourOption { id: string; name: string; price: number; private_price?: number; pix_discount?: number; }
interface TransferOption { id: string; label: string; price: number; pix_discount?: number; }

const formatPhone = (v: string) => {
  const n = v.replace(/\D/g, "");
  if (n.startsWith("55") && n.length >= 12) {
    const ddd = n.substring(2, 4);
    const rest = n.substring(4);
    if (rest.length === 9) return `+55 (${ddd}) ${rest.substring(0, 5)}-${rest.substring(5)}`;
    if (rest.length === 8) return `+55 (${ddd}) ${rest.substring(0, 4)}-${rest.substring(4)}`;
  }
  if (n.length <= 10) return n.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  if (n.length === 11) return n.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  return v.startsWith("+") ? v : `+${v}`;
};

const formatCPF = (v: string) => {
  const n = v.replace(/\D/g, "");
  if (n.length <= 11) return n.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  return n;
};

const AdminReservas = () => {
  const { bookings, loading, addBooking, updateBooking, confirmPayment, cancelBooking, completeBooking, updateBookingNotes } = useBookings();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [selected, setSelected] = useState<BookingItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [editNotes, setEditNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  // New booking form state
  const [showNewForm, setShowNewForm] = useState(false);
  const [newLoading, setNewLoading] = useState(false);
  const [tours, setTours] = useState<TourOption[]>([]);
  const [transfers, setTransfers] = useState<TransferOption[]>([]);
  const [existingCustomers, setExistingCustomers] = useState<{ id: string; name: string; email: string; phone: string | null; cpf?: string; passport?: string; country?: string; birth_date?: string }[]>([]);
  const [collaborators, setCollaborators] = useState<{ id: string; name: string }[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [newForm, setNewForm] = useState({
    type: "tour" as "tour" | "transfer",
    tourMode: "coletivo" as "coletivo" | "privativo",
    itemName: "",
    date: "",
    guests: 2,
    payMethod: "pix" as "pix" | "card",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    cpf: "",
    passport: "",
    country: "Brasil",
    birthDate: "",
    notes: "",
    collaboratorId: "",
  });

  useEffect(() => {
    if (!showNewForm) return;
    const loadOptions = async () => {
      const [{ data: t }, { data: tr }, { data: cust }, { data: collabs }] = await Promise.all([
        supabase.from("tours").select("id, name, price, private_price, pix_discount").eq("active", true).order("name"),
        supabase.from("transfer_routes").select("id, origin, destination, price, pix_discount").eq("active", true).order("origin"),
        supabase.from("customers").select("id, name, email, phone, cpf, passport, country, birth_date").order("name"),
        supabase.from("collaborators").select("id, name").eq("status", "active").order("name"),
      ]);
      if (t) setTours(t.map(r => ({ id: r.id, name: r.name, price: r.price, private_price: r.private_price, pix_discount: r.pix_discount })));
      if (tr) setTransfers(tr.map(r => ({ id: r.id, label: `${r.origin} → ${r.destination}`, price: r.price, pix_discount: r.pix_discount })));
      if (cust) setExistingCustomers(cust);
      if (collabs) setCollaborators(collabs);
    };
    loadOptions();
  }, [showNewForm]);

  const openEdit = (b: BookingItem) => {
    setEditingId(b.id);
    const mode = b.itemName.includes("(Privativo)") ? "privativo" : "coletivo";
    const cleanName = b.itemName.replace(/\s*\((Coletivo|Privativo)\)$/, "");
    
    setNewForm({
      type: b.type === "transfer" ? "transfer" : "tour",
      tourMode: mode as "coletivo" | "privativo",
      itemName: b.type === "transfer" ? b.itemName : cleanName,
      date: b.date,
      guests: b.guests,
      payMethod: b.payMethod === "info" ? "pix" : b.payMethod as "pix" | "card",
      customerName: b.customerName,
      customerEmail: b.customerEmail,
      customerPhone: b.customerPhone,
      cpf: b.cpf || "",
      passport: b.passport || "",
      country: b.country || "Brasil",
      birthDate: b.birthDate || "",
      notes: b.notes || "",
      collaboratorId: b.collaboratorId || "",
    });
    setSelectedCustomerId(b.customerId || "");
    setShowNewForm(true);
  };

  const resetNewForm = () => {
    setNewForm({
      type: "tour", tourMode: "coletivo", itemName: "", date: "", guests: 2, payMethod: "pix",
      customerName: "", customerEmail: "", customerPhone: "",
      cpf: "", passport: "", country: "Brasil", birthDate: "", notes: "", collaboratorId: ""
    });
    setSelectedCustomerId("");
    setCustomerSearch("");
    setEditingId(null);
  };

  // Calculate prices for the new form
  const selectedTour = newForm.type === "tour" ? tours.find(t => t.name === newForm.itemName) : null;
  const selectedTransfer = newForm.type === "transfer" ? transfers.find(t => t.label === newForm.itemName) : null;
  
  const unitPrice = newForm.type === "tour" 
    ? (newForm.tourMode === "privativo" ? (selectedTour?.private_price || 0) : (selectedTour?.price || 0))
    : (selectedTransfer?.price || 0);
  const total = newForm.type === "tour" && newForm.tourMode === "privativo" ? unitPrice : unitPrice * newForm.guests;
  const pixDiscountPercent = (selectedTour?.pix_discount || selectedTransfer?.pix_discount || 0);
  const discount = (newForm.payMethod === "pix" && pixDiscountPercent > 0) 
    ? Math.round(total * pixDiscountPercent / 100) 
    : 0;
  const finalTotal = total - discount;

  const handleNewBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.itemName || !newForm.customerName || !newForm.customerEmail) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newForm.customerEmail.trim())) {
      toast.error("E-mail inválido.");
      return;
    }
    if (newForm.guests < 1 || newForm.guests > 50) {
      toast.error("Quantidade de pessoas deve ser entre 1 e 50.");
      return;
    }
    setNewLoading(true);
    try {
      const bookingData = {
        type: newForm.type === "transfer" ? "transfer" : "tour",
        itemName: newForm.type === "tour" ? `${newForm.itemName} (${newForm.tourMode === "privativo" ? "Privativo" : "Coletivo"})` : newForm.itemName,
        date: newForm.date || "",
        guests: newForm.guests,
        payMethod: newForm.payMethod,
        customerName: newForm.customerName.trim(),
        customerEmail: newForm.customerEmail.trim().toLowerCase(),
        customerPhone: newForm.customerPhone.trim(),
        cpf: newForm.cpf.trim() || undefined,
        passport: newForm.passport.trim() || undefined,
        country: newForm.country.trim(),
        birthDate: newForm.birthDate || undefined,
        notes: newForm.notes.trim() || undefined,
        unitPrice,
        total,
        discount,
        finalTotal,
        collaboratorId: newForm.collaboratorId || undefined,
      };

      if (editingId) {
        const original = bookings.find(b => b.id === editingId);
        if (original && original.customerId) {
          await updateBooking(editingId, original.customerId, bookingData);
          toast.success("Reserva atualizada com sucesso!");
        }
      } else {
        await addBooking(bookingData as any);
        toast.success("Reserva criada com sucesso!");
      }
      setShowNewForm(false);
      resetNewForm();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao processar reserva.");
    }
    setNewLoading(false);
  };

  const filtered = bookings.filter((b) => {
    const q = search.toLowerCase();
    const matchSearch =
      b.customerName.toLowerCase().includes(q) ||
      b.itemName.toLowerCase().includes(q) ||
      b.bookingCode.toLowerCase().includes(q) ||
      b.customerEmail.toLowerCase().includes(q) ||
      (b.customerPhone && b.customerPhone.includes(q)) ||
      (b.cpf && b.cpf.includes(q));
    const matchStatus = statusFilter === "todos" || b.status === statusFilter;
    
    let matchDate = true;
    if (dateStart) matchDate = matchDate && b.date >= dateStart;
    if (dateEnd) matchDate = matchDate && b.date <= dateEnd;
    
    return matchSearch && matchStatus && matchDate;
  });

  const totalPago = bookings
    .filter((b) => b.paymentStatus === "pago")
    .reduce((a, b) => a + b.finalTotal, 0);

  const stats = [
    { icon: ShoppingCart, label: "Total Reservas", value: bookings.length, color: "text-indigo-600" },
    { icon: CheckCircle, label: "Confirmadas", value: bookings.filter((b) => b.status === "confirmada").length, color: "text-emerald-600" },
    { icon: Clock, label: "Pendentes", value: bookings.filter((b) => b.status === "pendente").length, color: "text-amber-600" },
    { icon: DollarSign, label: "Faturamento Pago", value: fmt(totalPago), color: "text-blue-600" },
  ];

  const handleAction = async (action: () => Promise<void>, successMsg: string, isCancellation = false) => {
    if (isCancellation) {
      const confirm = window.confirm("⚠️ Tem certeza que deseja cancelar esta reserva?\n\nEsta ação excluirá permanentemente a reserva do histórico.");
      if (!confirm) return;
    }
    setActionLoading(true);
    try {
      await action();
      toast.success(successMsg);
      setSelected(null);
    } catch {
      toast.error("Erro ao executar ação.");
    }
    setActionLoading(false);
  };

  const handleSaveNotes = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      await updateBookingNotes(selected.id, editNotes);
      toast.success("Observações salvas!");
      setShowNotes(false);
    } catch {
      toast.error("Erro ao salvar observações.");
    }
    setActionLoading(false);
  };

  const exportCSV = () => {
    const header = "Código,Cliente,Email,Telefone,Passeio,Data,Pax,Subtotal,Desconto,Total,Pagamento,Status,Criado em\n";
    const rows = filtered.map((b) =>
      `"${b.bookingCode}","${b.customerName}","${b.customerEmail}","${b.customerPhone}","${b.itemName}","${fmtDate(b.date)}",${b.guests},${(b.total / 100).toFixed(2)},${(b.discount / 100).toFixed(2)},${(b.finalTotal / 100).toFixed(2)},"${paymentConfig[b.paymentStatus]?.label || b.paymentStatus}","${statusConfig[b.status]?.label || b.status}","${fmtDateTime(b.createdAt)}"`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reservas_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <AdminLayout title="Reservas">
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <Loader2 className="animate-spin text-primary" size={40} />
          <p className="text-muted-foreground animate-pulse">Carregando reservas...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Reservas">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-in-fade" style={{ animationDelay: '0.1s' }}>
        {[
          { label: "Total Reservas", value: bookings.length, icon: ShoppingCart, color: "from-blue-500 to-indigo-600", desc: "Histórico geral" },
          { label: "Confirmadas", value: bookings.filter((b) => b.status === "confirmada").length, icon: CheckCircle, color: "from-emerald-500 to-teal-600", desc: "Vendas firmes" },
          { label: "Pendentes", value: bookings.filter((b) => b.status === "pendente").length, icon: Clock, color: "from-amber-500 to-orange-600", desc: "Aguardando" },
          { label: "Receita Paga", value: fmt(totalPago), icon: DollarSign, color: "from-purple-500 to-pink-600", desc: "LTV Financeiro" },
        ].map((stat, i) => (
          <div key={i} className="glass-card admin-card-hover rounded-[2rem] p-6 relative overflow-hidden group">
            <div className={`absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br ${stat.color} opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity`} />
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white shadow-lg shadow-primary/10 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                <stat.icon size={22} strokeWidth={2.5} />
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">{stat.desc}</div>
            </div>
            <p className="text-2xl font-black text-foreground tracking-tighter group-hover:translate-x-1 transition-transform">{stat.value}</p>
            <p className="text-[10px] font-black text-muted-foreground mt-1 uppercase tracking-[0.2em]">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <Card className="mb-8 border-none shadow-sm overflow-hidden glass-card rounded-[2.5rem] animate-in-fade" style={{ animationDelay: '0.2s' }}>
        <CardContent className="p-8 space-y-6">
          <div className="flex flex-col xl:flex-row gap-6 items-center">
            <div className="relative flex-1 w-full group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-primary transition-colors" size={20} />
              <input 
                placeholder="Buscar por cliente, passeio ou código de reserva..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                className="w-full pl-14 h-14 rounded-2xl border border-border/40 focus:ring-4 focus:ring-primary/10 bg-muted/20 transition-all font-medium text-sm outline-none placeholder:text-muted-foreground/40" 
              />
            </div>
            
            <div className="flex gap-1.5 w-full xl:w-auto overflow-x-auto no-scrollbar pb-1">
              {["todos", "confirmada", "pendente", "cancelada", "concluida"].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                    statusFilter === s
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {s === "todos" ? `Todos` : statusConfig[s]?.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 w-full xl:w-auto">
              <Button variant="outline" size="lg" onClick={exportCSV} className="rounded-2xl h-12 px-6 border-border font-black text-xs uppercase tracking-widest flex-1 xl:flex-none">
                <Download size={16} className="mr-2" /> Exportar
              </Button>
              <Button size="lg" onClick={() => { resetNewForm(); setShowNewForm(true); }} className="bg-primary hover:bg-primary/90 text-primary-foreground h-12 px-8 rounded-2xl text-sm font-black uppercase tracking-widest flex-1 xl:flex-none shadow-lg shadow-primary/20 transition-all active:scale-95">
                <Plus size={18} strokeWidth={3} className="mr-2" /> Nova Reserva
              </Button>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-border/50">
            <div className="flex items-center gap-3 bg-muted/50 px-4 py-2 rounded-xl border border-border/50">
              <Calendar size={14} className="text-primary" />
              <div className="flex items-center gap-2">
                <input type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)} className="bg-transparent text-[10px] font-bold uppercase tracking-widest outline-none w-28" />
                <span className="text-muted-foreground text-[10px] font-black">ATÉ</span>
                <input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} className="bg-transparent text-[10px] font-bold uppercase tracking-widest outline-none w-28" />
              </div>
              {(dateStart || dateEnd) && (
                <button onClick={() => { setDateStart(""); setDateEnd(""); }} className="ml-2 text-[10px] font-black text-destructive uppercase tracking-widest hover:underline">
                  Limpar
                </button>
              )}
            </div>
            <div className="ml-auto">
              <Badge variant="secondary" className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-muted text-muted-foreground border-none">
                Mostrando {filtered.length} de {bookings.length} reservas
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-none shadow-sm overflow-hidden glass-card rounded-[2.5rem] animate-in-fade" style={{ animationDelay: '0.3s' }}>
        {filtered.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground bg-muted/10">
            <ShoppingCart className="mx-auto mb-4 opacity-20" size={64} />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Vazio</p>
            <p className="text-xs font-medium text-muted-foreground/60 mt-2">Nenhuma reserva encontrada com os filtros atuais.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-border/20">
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground py-4">Código</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground py-4">Cliente</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground py-4">Serviço</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground py-4 text-center">Data</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground py-4 text-center">Pax</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground py-4 text-right">Valor Total</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground py-4 text-center">Pagamento</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground py-4 text-center">Status</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground py-4">Solicitação</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((b) => {
                  const sc = statusConfig[b.status] || statusConfig.pendente;
                  const pc = paymentConfig[b.paymentStatus] || paymentConfig.pendente;
                  return (
                    <TableRow 
                      key={b.id} 
                      className="cursor-pointer hover:bg-primary/5 transition-colors border-b border-border/50 group" 
                      onClick={() => { setSelected(b); setEditNotes(b.notes || ""); setShowNotes(false); }}
                    >
                      <TableCell className="font-mono text-[11px] text-foreground py-5">
                        <div className="flex items-center gap-1">
                          <span className="bg-muted px-2 py-1 rounded-lg font-black text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors border border-border/30">
                            {b.bookingCode}
                          </span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" 
                            onClick={(e) => { 
                              e.stopPropagation();
                              navigator.clipboard.writeText(b.bookingCode);
                              toast.success("Código copiado!");
                            }}
                          >
                            <Copy size={12} />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground group-hover:text-primary transition-colors">{b.customerName}</span>
                          <span className="text-[10px] text-muted-foreground">{b.customerEmail}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-foreground">{b.itemName}</span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase font-bold tracking-wider">
                            {b.type === 'transfer' ? <Car size={10} className="text-primary" /> : <Compass size={10} className="text-primary" />}
                            {b.type === 'transfer' ? 'Translado' : b.type === 'package' ? 'Pacote' : 'Passeio'}
                          </span>
                          {b.collaboratorName && (
                            <span className="text-[9px] text-blue-600 font-bold uppercase mt-0.5">
                              Vendedor: {b.collaboratorName}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        <div className="flex flex-col items-center">
                          <span className="text-sm">{fmtDate(b.date)}</span>
                          {b.date && new Date(b.date) < new Date() && b.status !== 'concluida' && (
                            <span className="text-[9px] text-amber-600 font-bold uppercase tracking-tighter">Data Passada</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="font-bold">{b.guests}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-black text-foreground">{fmt(b.finalTotal)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={`${pc.className} border rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase`}>
                          {pc.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={`${sc.className} border rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase`}>
                          {sc.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{fmtDateTime(b.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full group-hover:bg-primary group-hover:text-white transition-all">
                              <Eye size={14} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Ver Detalhes</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Detail Modal */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText size={20} />
              Reserva {selected?.bookingCode}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              {/* Customer */}
              <div className="bg-muted rounded-xl p-4 space-y-2">
                <h4 className="font-semibold text-sm text-foreground">Cliente</h4>
                <div className="grid grid-cols-1 gap-1.5 text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Users size={14} /> {selected.customerName}
                  </span>
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Mail size={14} /> {selected.customerEmail}
                  </span>
                  {selected.customerPhone && (
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Phone size={14} /> {selected.customerPhone}
                    </span>
                  )}
                  {selected.cpf && (
                    <span className="flex items-center gap-2 text-muted-foreground text-xs">
                      <FileText size={12} /> CPF: {formatCPF(selected.cpf)}
                    </span>
                  )}
                  {selected.passport && (
                    <span className="flex items-center gap-2 text-muted-foreground text-xs">
                      <FileText size={12} /> Passaporte: {selected.passport}
                    </span>
                  )}
                </div>
                {selected.collaboratorName && (
                  <div className="mt-2 pt-2 border-t border-border/50">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Colaborador / Vendedor</p>
                    <p className="text-sm font-medium text-blue-600">{selected.collaboratorName}</p>
                  </div>
                )}
              </div>

              {/* Booking details */}
              <div className="bg-muted rounded-xl p-4 space-y-2">
                <h4 className="font-semibold text-sm text-foreground">Detalhes</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <MapPin size={14} /> {selected.itemName}
                  </span>
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Calendar size={14} /> {fmtDate(selected.date)}
                  </span>
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Users size={14} /> {selected.guests} pessoa(s)
                  </span>
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <CreditCard size={14} /> {selected.payMethod === "pix" ? "PIX" : selected.payMethod === "card" ? "Cartão" : selected.payMethod}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Criado em: {fmtDateTime(selected.createdAt)}
                </p>
              </div>

              {/* Financials */}
              <div className="bg-muted rounded-xl p-4">
                <h4 className="font-semibold text-sm text-foreground mb-2">Financeiro</h4>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Subtotal ({selected.guests}x {fmt(selected.unitPrice)})</span>
                  <span>{fmt(selected.total)}</span>
                </div>
                {selected.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Desconto PIX</span>
                    <span>-{fmt(selected.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-foreground border-t border-border mt-2 pt-2">
                  <span>Total</span>
                  <span>{fmt(selected.finalTotal)}</span>
                </div>
              </div>

              {/* Notes */}
              <div className="bg-muted rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm text-foreground flex items-center gap-1">
                    <MessageSquare size={14} /> Observações
                  </h4>
                  {!showNotes && (
                    <Button variant="ghost" size="sm" onClick={() => setShowNotes(true)} className="text-xs h-7">
                      Editar
                    </Button>
                  )}
                </div>
                {showNotes ? (
                  <div className="space-y-2">
                    <Textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Adicionar observações..." rows={3} />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveNotes} disabled={actionLoading}>
                        {actionLoading ? <Loader2 className="animate-spin mr-1" size={14} /> : null} Salvar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setShowNotes(false)}>Cancelar</Button>
                {/* Links */}
                {(selected.invoiceUrl || selected.voucherUrl) && (
                  <div className="flex gap-2 w-full">
                    {selected.invoiceUrl && (
                      <Button variant="outline" size="sm" className="flex-1" asChild>
                        <a href={selected.invoiceUrl} target="_blank" rel="noopener noreferrer">
                          <FileText size={14} className="mr-1" /> Nota Fiscal
                        </a>
                      </Button>
                    )}
                    {selected.voucherUrl && (
                      <Button variant="outline" size="sm" className="flex-1" asChild>
                        <a href={selected.voucherUrl} target="_blank" rel="noopener noreferrer">
                          <FileText size={14} className="mr-1" /> Voucher
                        </a>
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{selected.notes || "Nenhuma observação."}</p>
                )}
              </div>

              {/* Status badges */}
              <div className="flex gap-2">
                <Badge className={statusConfig[selected.status]?.className}>
                  {statusConfig[selected.status]?.label || selected.status}
                </Badge>
                <Badge className={paymentConfig[selected.paymentStatus]?.className}>
                  {paymentConfig[selected.paymentStatus]?.label || selected.paymentStatus}
                </Badge>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2 flex-wrap">
                <Button variant="outline" onClick={() => { setSelected(null); openEdit(selected); }} disabled={actionLoading} className="flex-1 min-w-[140px]">
                  <Pencil size={16} className="mr-2" /> Editar Reserva
                </Button>
                {selected.status === "pendente" && selected.paymentStatus === "pendente" && (
                  <Button onClick={() => handleAction(() => confirmPayment(selected.id), "Pagamento confirmado!")} disabled={actionLoading} className="flex-1 min-w-[140px]">
                    {actionLoading ? <Loader2 className="animate-spin mr-2" size={16} /> : <CheckCircle size={16} className="mr-2" />}
                    Confirmar Pagamento
                  </Button>
                )}
                {selected.status === "confirmada" && (
                  <Button variant="secondary" onClick={() => handleAction(() => completeBooking(selected.id), "Reserva concluída!")} disabled={actionLoading} className="flex-1 min-w-[140px]">
                    {actionLoading ? <Loader2 className="animate-spin mr-2" size={16} /> : <CheckCircle2 size={16} className="mr-2" />}
                    Marcar Concluída
                  </Button>
                )}
                <Button variant="destructive" onClick={() => handleAction(() => cancelBooking(selected.id), "Reserva cancelada e removida.", true)} disabled={actionLoading} className="flex-1 min-w-[140px]">
                  {actionLoading ? <Loader2 className="animate-spin mr-2" size={16} /> : <Ban size={16} className="mr-2" />}
                  Cancelar e Excluir
                </Button>
                {/* Print Receipt */}
                {selected.payMethod !== "info" && (
                  <PrintReceiptButton
                    data={{
                      bookingCode: selected.bookingCode,
                      customerName: selected.customerName,
                      customerEmail: selected.customerEmail,
                      customerPhone: selected.customerPhone,
                      itemName: selected.itemName,
                      type: selected.type,
                      date: selected.date,
                      guests: selected.guests,
                      unitPrice: selected.unitPrice,
                      total: selected.total,
                      discount: selected.discount,
                      finalTotal: selected.finalTotal,
                      payMethod: selected.payMethod,
                      paymentStatus: selected.paymentStatus,
                      status: selected.status,
                      pixCode: selected.pixCode,
                      createdAt: selected.createdAt,
                      notes: selected.notes,
                      cpf: selected.cpf,
                      passport: selected.passport,
                    }}
                    className="flex-1 min-w-[140px]"
                    label="Imprimir Recibo"
                  />
                )}
                {/* WhatsApp */}
                {selected.customerPhone && (
                  <a
                    href={`https://wa.me/${selected.customerPhone.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá ${selected.customerName}! Sobre sua reserva ${selected.bookingCode} - ${selected.itemName}.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex"
                  >
                    <Button variant="outline" size="sm" className="text-green-600">
                      📱 WhatsApp
                    </Button>
                  </a>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* New Booking Dialog */}
      <Dialog open={showNewForm} onOpenChange={setShowNewForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingId ? <Pencil size={20} /> : <Plus size={20} />} 
              {editingId ? "Editar Reserva" : "Nova Reserva"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleNewBooking} className="space-y-4">
            {/* Type */}
            <div>
              <label className="text-sm font-semibold text-foreground mb-1.5 block">Tipo</label>
              <div className="flex gap-2">
                <Button type="button" variant={newForm.type === "tour" ? "default" : "outline"} size="sm" onClick={() => setNewForm(f => ({ ...f, type: "tour", itemName: "" }))}>
                  Passeio
                </Button>
                <Button type="button" variant={newForm.type === "transfer" ? "default" : "outline"} size="sm" onClick={() => setNewForm(f => ({ ...f, type: "transfer", itemName: "" }))}>
                  Translado
                </Button>
              </div>
            </div>

            {/* Item selection */}
            <div className="space-y-4">
              {newForm.type === "tour" && (
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1.5 block">Modalidade</label>
                  <div className="flex gap-2">
                    <Button type="button" variant={newForm.tourMode === "coletivo" ? "default" : "outline"} size="sm" onClick={() => setNewForm(f => ({ ...f, tourMode: "coletivo" }))} className="flex-1">
                      Coletivo (por pessoa)
                    </Button>
                    <Button type="button" variant={newForm.tourMode === "privativo" ? "default" : "outline"} size="sm" onClick={() => setNewForm(f => ({ ...f, tourMode: "privativo" }))} className="flex-1">
                      Privativo (veículo)
                    </Button>
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">
                  {newForm.type === "tour" ? "Passeio" : "Rota"} *
                </label>
                <select
                  value={newForm.itemName}
                  onChange={(e) => setNewForm(f => ({ ...f, itemName: e.target.value }))}
                  className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                  required
                >
                  <option value="">Selecione...</option>
                  {newForm.type === "tour"
                    ? tours.map(t => <option key={t.id} value={t.name}>{t.name} — {fmt(newForm.tourMode === "privativo" ? t.private_price : t.price)}</option>)
                    : transfers.map(t => <option key={t.id} value={t.label}>{t.label} — {fmt(t.price)}</option>)
                  }
                </select>
              </div>
            </div>

            {/* Date & Guests */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">Data</label>
                <Input type="date" value={newForm.date} onChange={(e) => setNewForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">Pessoas *</label>
                <Input type="number" min={1} max={50} value={newForm.guests} onChange={(e) => setNewForm(f => ({ ...f, guests: parseInt(e.target.value) || 1 }))} required />
              </div>
            </div>

            {/* Payment method */}
            <div>
              <label className="text-sm font-semibold text-foreground mb-1.5 block">Pagamento</label>
              <div className="flex gap-2">
                <Button type="button" variant={newForm.payMethod === "pix" ? "default" : "outline"} size="sm" onClick={() => setNewForm(f => ({ ...f, payMethod: "pix" }))}>
                  PIX
                </Button>
                <Button type="button" variant={newForm.payMethod === "card" ? "default" : "outline"} size="sm" onClick={() => setNewForm(f => ({ ...f, payMethod: "card" }))}>
                  Cartão
                </Button>
              </div>
            </div>
            
            {/* Collaborator */}
            <div>
              <label className="text-sm font-semibold text-foreground mb-1.5 block">Vendedor / Colaborador</label>
              <select
                value={newForm.collaboratorId}
                onChange={(e) => setNewForm(f => ({ ...f, collaboratorId: e.target.value }))}
                className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground"
              >
                <option value="">Nenhum</option>
                {collaborators.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Customer info */}
            <div className="border-t border-border pt-4">
              <h4 className="font-semibold text-sm text-foreground mb-3">Dados do Cliente</h4>
              
              {/* Existing customer selector */}
              <div className="mb-3">
                <label className="text-sm text-muted-foreground mb-1 block">Pesquisar cliente existente</label>
                <div className="space-y-2">
                  <Input 
                    placeholder="Nome ou e-mail..." 
                    value={customerSearch} 
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="h-9"
                  />
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => {
                      const custId = e.target.value;
                      setSelectedCustomerId(custId);
                      if (custId) {
                        const cust = existingCustomers.find(c => c.id === custId);
                        if (cust) {
                          setNewForm(f => ({
                            ...f,
                            customerName: cust.name,
                            customerEmail: cust.email,
                            customerPhone: cust.phone || "",
                            cpf: cust.cpf || "",
                            passport: cust.passport || "",
                            country: cust.country || "Brasil",
                            birthDate: cust.birth_date || "",
                          }));
                        }
                      } else {
                        setNewForm(f => ({ ...f, customerName: "", customerEmail: "", customerPhone: "", cpf: "", passport: "", country: "Brasil", birthDate: "" }));
                      }
                    }}
                    className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                  >
                    <option value="">— Novo cliente —</option>
                    {existingCustomers
                      .filter(c => !customerSearch || c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.email.toLowerCase().includes(customerSearch.toLowerCase()))
                      .slice(0, 100) // Limit to avoid performance issues
                      .map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                      ))
                    }
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Nome *</label>
                  <Input value={newForm.customerName} onChange={(e) => setNewForm(f => ({ ...f, customerName: e.target.value }))} placeholder="Nome completo" required maxLength={255} disabled={!!selectedCustomerId && !editingId} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">E-mail *</label>
                    <Input type="email" value={newForm.customerEmail} onChange={(e) => setNewForm(f => ({ ...f, customerEmail: e.target.value }))} placeholder="email@exemplo.com" required maxLength={255} disabled={!!selectedCustomerId && !editingId} />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Telefone</label>
                    <Input value={newForm.customerPhone} onChange={(e) => setNewForm(f => ({ ...f, customerPhone: formatPhone(e.target.value) }))} placeholder="(99) 99999-9999" maxLength={15} disabled={!!selectedCustomerId && !editingId} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">CPF</label>
                    <Input 
                      value={newForm.cpf} 
                      onChange={(e) => setNewForm(f => ({ ...f, cpf: maskCPF(e.target.value) }))} 
                      placeholder="000.000.000-00" 
                      disabled={!!selectedCustomerId && !editingId} 
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Passaporte</label>
                    <Input value={newForm.passport} onChange={(e) => setNewForm(f => ({ ...f, passport: e.target.value }))} placeholder="Para estrangeiros" disabled={!!selectedCustomerId && !editingId} />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Data de Nascimento</label>
                    <Input type="date" value={newForm.birthDate} onChange={(e) => setNewForm(f => ({ ...f, birthDate: e.target.value }))} disabled={!!selectedCustomerId && !editingId} />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">País</label>
                    <Input value={newForm.country} onChange={(e) => setNewForm(f => ({ ...f, country: e.target.value }))} placeholder="Ex: Brasil" disabled={!!selectedCustomerId && !editingId} />
                  </div>
                </div>
              </div>


              <div className="mt-3">
                <label className="text-sm font-semibold text-foreground mb-1.5 block">Observações Internas</label>
                <Textarea 
                  value={newForm.notes} 
                  onChange={(e) => setNewForm(f => ({ ...f, notes: e.target.value }))} 
                  placeholder="Instruções para a equipe, restrições alimentares, etc." 
                  rows={2}
                  className="text-sm"
                />
              </div>
            </div>

            {/* Summary */}
            {unitPrice > 0 && (
              <div className="bg-muted p-3 rounded-lg space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Subtotal ({newForm.type === "tour" && newForm.tourMode === "privativo" ? "Veículo Privativo" : `${newForm.guests}x ${fmt(unitPrice)}`})</span>
                  <span>{fmt(total)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-xs text-green-600 dark:text-green-400">
                    <span>Desconto PIX ({pixDiscountPercent}%)</span>
                    <span>-{fmt(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-foreground border-t border-border mt-1 pt-1">
                  <span>Total</span>
                  <span>{fmt(finalTotal)}</span>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={newLoading || !newForm.itemName}>
              {newLoading ? <Loader2 className="animate-spin mr-2" size={16} /> : (editingId ? <Pencil size={16} className="mr-2" /> : <Plus size={16} className="mr-2" />)}
              {editingId ? "Salvar Alterações" : "Criar Reserva"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminReservas;
