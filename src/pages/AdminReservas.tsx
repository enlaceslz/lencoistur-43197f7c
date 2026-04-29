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
  Plus, Copy, Pencil,
} from "lucide-react";
import { useBookings, BookingItem } from "@/hooks/useBookings";
import { toast } from "sonner";
import { PrintReceiptButton, type ReceiptData } from "@/components/BookingReceipt";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";

const statusConfig: Record<string, { label: string; className: string; icon: typeof CheckCircle }> = {
  confirmada: { label: "Confirmada", className: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300", icon: CheckCircle },
  pendente: { label: "Pendente", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300", icon: Clock },
  cancelada: { label: "Cancelada", className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300", icon: XCircle },
  concluida: { label: "Concluída", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300", icon: CheckCircle2 },
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
  if (n.length <= 10) return n.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  return n.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
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

  // New booking form state
  const [showNewForm, setShowNewForm] = useState(false);
  const [newLoading, setNewLoading] = useState(false);
  const [tours, setTours] = useState<TourOption[]>([]);
  const [transfers, setTransfers] = useState<TransferOption[]>([]);
  const [existingCustomers, setExistingCustomers] = useState<{ id: string; name: string; email: string; phone: string | null }[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [newForm, setNewForm] = useState({
    type: "tour" as "tour" | "transfer",
    tourMode: "coletivo" as "coletivo" | "privativo",
    itemName: "",
    date: "",
    guests: 1,
    payMethod: "pix" as "pix" | "card",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    cpf: "",
    passport: "",
    country: "Brasil",
    birthDate: "",
  });

  useEffect(() => {
    if (!showNewForm) return;
    const loadOptions = async () => {
      const [{ data: t }, { data: tr }, { data: cust }] = await Promise.all([
        supabase.from("tours").select("id, name, price, private_price, pix_discount").eq("active", true).order("name"),
        supabase.from("transfer_routes").select("id, origin, destination, price, pix_discount").eq("active", true).order("origin"),
        supabase.from("customers").select("id, name, email, phone").order("name"),
      ]);
      if (t) setTours(t.map(r => ({ id: r.id, name: r.name, price: r.price, private_price: r.private_price, pix_discount: r.pix_discount })));
      if (tr) setTransfers(tr.map(r => ({ id: r.id, label: `${r.origin} → ${r.destination}`, price: r.price, pix_discount: r.pix_discount })));
      if (cust) setExistingCustomers(cust);
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
    });
    setSelectedCustomerId(b.customerId || "");
    setShowNewForm(true);
  };

  const resetNewForm = () => {
    setNewForm({
      type: "tour", tourMode: "coletivo", itemName: "", date: "", guests: 1, payMethod: "pix",
      customerName: "", customerEmail: "", customerPhone: "",
      cpf: "", passport: "", country: "Brasil", birthDate: ""
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
        unitPrice,
        total,
        discount,
        finalTotal,
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
    { icon: ShoppingCart, label: "Total Reservas", value: bookings.length, color: "text-primary" },
    { icon: CheckCircle, label: "Confirmadas", value: bookings.filter((b) => b.status === "confirmada").length, color: "text-green-600" },
    { icon: Clock, label: "Pendentes", value: bookings.filter((b) => b.status === "pendente").length, color: "text-amber-600" },
    { icon: DollarSign, label: "Receita Total", value: fmt(totalPago), color: "text-blue-600" },
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
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Reservas">
      {/* Stats */}
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

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input placeholder="Buscar por cliente, passeio, email ou código..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              {["todos", "confirmada", "pendente", "cancelada", "concluida"].map((s) => (
                <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(s)} className="capitalize whitespace-nowrap">
                  {s === "todos" ? `Todos` : statusConfig[s]?.label}
                </Button>
              ))}
            </div>
            <div className="flex gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={exportCSV}>
                <Download size={14} className="mr-1" /> CSV
              </Button>
              <Button size="sm" onClick={() => { resetNewForm(); setShowNewForm(true); }}>
                <Plus size={14} className="mr-1" /> Nova Reserva
              </Button>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Filtrar por data:</span>
            </div>
            <div className="flex items-center gap-2">
              <Input type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)} className="h-8 text-xs w-32" />
              <span className="text-muted-foreground text-xs">até</span>
              <Input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} className="h-8 text-xs w-32" />
              {(dateStart || dateEnd) && (
                <Button variant="ghost" size="sm" onClick={() => { setDateStart(""); setDateEnd(""); }} className="h-7 text-xs px-2">
                  Limpar
                </Button>
              )}
            </div>
            <div className="ml-auto text-xs text-muted-foreground">
              Mostrando {filtered.length} de {bookings.length} reservas
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <ShoppingCart className="mx-auto mb-3 opacity-40" size={40} />
            <p className="font-medium">Nenhuma reserva encontrada</p>
            <p className="text-sm mt-1">As reservas feitas pelo site aparecerão aqui automaticamente.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Passeio/Translado</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Pax</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((b) => {
                  const sc = statusConfig[b.status] || statusConfig.pendente;
                  const pc = paymentConfig[b.paymentStatus] || paymentConfig.pendente;
                  return (
                    <TableRow key={b.id} className="cursor-pointer hover:bg-muted/50" onClick={() => { setSelected(b); setEditNotes(b.notes || ""); setShowNotes(false); }}>
                      <TableCell className="font-mono text-sm text-foreground">
                        <div className="flex items-center gap-1">
                          {b.bookingCode}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6" 
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
                        <div>
                          <p className="font-medium text-foreground">{b.customerName}</p>
                          <p className="text-xs text-muted-foreground">{b.customerEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate">{b.itemName}</TableCell>
                      <TableCell className="text-muted-foreground">{fmtDate(b.date)}</TableCell>
                      <TableCell className="text-foreground">{b.guests}</TableCell>
                      <TableCell className="font-medium text-foreground">{fmt(b.finalTotal)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={pc.className}>{pc.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={sc.className}>{sc.label}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{fmtDateTime(b.createdAt)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setSelected(b); setEditNotes(b.notes || ""); setShowNotes(false); }}>
                          <Eye size={14} />
                        </Button>
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
                      <FileText size={12} /> CPF: {selected.cpf}
                    </span>
                  )}
                  {selected.passport && (
                    <span className="flex items-center gap-2 text-muted-foreground text-xs">
                      <FileText size={12} /> Passaporte: {selected.passport}
                    </span>
                  )}
                </div>
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

            {/* Customer info */}
            <div className="border-t border-border pt-4">
              <h4 className="font-semibold text-sm text-foreground mb-3">Dados do Cliente</h4>
              
              {/* Existing customer selector */}
              <div className="mb-3">
                <label className="text-sm text-muted-foreground mb-1 block">Selecionar cliente existente</label>
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
                        }));
                      }
                    } else {
                      setNewForm(f => ({ ...f, customerName: "", customerEmail: "", customerPhone: "" }));
                    }
                  }}
                  className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                >
                  <option value="">— Novo cliente —</option>
                  {existingCustomers
                    .filter(c => !customerSearch || c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.email.toLowerCase().includes(customerSearch.toLowerCase()))
                    .map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                    ))
                  }
                </select>
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
                    <Input value={newForm.cpf} onChange={(e) => setNewForm(f => ({ ...f, cpf: e.target.value }))} placeholder="000.000.000-00" disabled={!!selectedCustomerId && !editingId} />
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

            <Button type="submit" className="w-full" disabled={newLoading || !newForm.itemName}>
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
