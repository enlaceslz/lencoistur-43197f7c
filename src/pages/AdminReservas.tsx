import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Search, ShoppingCart, CheckCircle, Clock, XCircle, Eye,
  DollarSign, Ban, Loader2, Users, Calendar, CreditCard, FileText,
  MapPin, Phone, Mail, CheckCircle2, MessageSquare, Download, Printer,
  Plus, Copy, Pencil, Car, Compass, LayoutGrid, List, X, XCircle as XCircleIcon,
  ChevronRight, ArrowRight, User, Hash, Info, Moon, Save, Package as PackageIcon,
  Shield, ExternalLink, Trash2, CalendarDays, Smartphone
} from "lucide-react";
import { useBookings, BookingItem } from "@/hooks/useBookings";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { maskCPF, maskPhone, maskDate, maskCEP } from "@/lib/masks";
import { PrintReceiptButton, type ReceiptData } from "@/components/BookingReceipt";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, cn } from "@/lib/utils";
import { BookingCalendar } from "@/components/admin/BookingCalendar";
import { NumericFormat } from "react-number-format";

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

interface TourOption { id: string; name: string; price: number; private_price?: number; partner_price?: number; partner_private_price?: number; pix_discount?: number; }
interface PackageOption { id: string; name: string; original_price: number; discount_price: number; partner_price?: number; }
interface TransferOption { id: string; label: string; price: number; partner_price?: number; pix_discount?: number; }

// Utilizando máscaras de @/lib/masks.ts

const AdminReservas = () => {
  const { bookings, loading, addBooking, updateBooking, confirmPayment, cancelBooking, deleteBooking, completeBooking, updateBookingNotes } = useBookings();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [selected, setSelected] = useState<BookingItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [editNotes, setEditNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "calendar" | "table">("list");

  // New booking form state
  const [showNewForm, setShowNewForm] = useState(false);
  const [newLoading, setNewLoading] = useState(false);
  const [tours, setTours] = useState<TourOption[]>([]);
  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [transfers, setTransfers] = useState<TransferOption[]>([]);
  const [existingCustomers, setExistingCustomers] = useState<{ id: string; name: string; email: string; phone: string | null; cpf?: string; passport?: string; country?: string; birth_date?: string }[]>([]);
  const [collaborators, setCollaborators] = useState<{ id: string; name: string }[]>([]);
  const [partners, setPartners] = useState<{ id: string; name: string; commission_rate: number | null; remuneration_type: string | null; remuneration_value: number | null }[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [newForm, setNewForm] = useState({
    type: "tour" as "tour" | "transfer" | "package",
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
    partnerId: "",
  });

  useEffect(() => {
    if (!showNewForm) return;
    const loadOptions = async () => {
      const [{ data: t }, { data: tr }, { data: cust }, { data: collabs }, { data: parts }, { data: pkgs }] = await Promise.all([
        supabase.from("tours").select("id, name, price, private_price, partner_price, partner_private_price, pix_discount").eq("active", true).order("name"),
        supabase.from("transfer_routes").select("id, origin, destination, price, partner_price, pix_discount").eq("active", true).order("origin"),
        supabase.from("customers").select("id, name, email, phone, cpf, passport, country, birth_date").order("name"),
        supabase.from("collaborators").select("id, name").eq("status", "active").order("name"),
        supabase.from("partners").select("id, name, commission_rate, remuneration_type, remuneration_value").eq("active", true).order("name"),
        supabase.from("packages").select("id, name, original_price, discount_price, partner_price").eq("active", true).order("name"),
      ]);
      if (t) setTours(t.map(r => ({ id: r.id, name: r.name, price: r.price, private_price: r.private_price, partner_price: r.partner_price, partner_private_price: r.partner_private_price, pix_discount: r.pix_discount })));
      if (tr) setTransfers(tr.map(r => ({ id: r.id, label: `${r.origin} → ${r.destination}`, price: r.price, partner_price: r.partner_price, pix_discount: r.pix_discount })));
      if (cust) setExistingCustomers(cust);
      if (collabs) setCollaborators(collabs);
      if (parts) setPartners(parts as any);
      if (pkgs) setPackages(pkgs);
    };
    loadOptions();
  }, [showNewForm]);

  const openEdit = (b: BookingItem) => {
    setEditingId(b.id);
    const mode = b.itemName.includes("(Privativo)") ? "privativo" : "coletivo";
    const cleanName = b.itemName.replace(/\s*\((Coletivo|Privativo)\)$/, "");
    
    setNewForm({
      type: b.type === "transfer" ? "transfer" : b.type === "package" ? "package" : "tour",
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
      partnerId: b.partnerId || "",
    });
    setSelectedCustomerId(b.customerId || "");
    setShowNewForm(true);
  };

  const resetNewForm = () => {
    setNewForm({
      type: "tour", tourMode: "coletivo", itemName: "", date: "", guests: 2, payMethod: "pix",
      customerName: "", customerEmail: "", customerPhone: "",
      cpf: "", passport: "", country: "Brasil", birthDate: "", notes: "", collaboratorId: "", partnerId: ""
    });
    setSelectedCustomerId("");
    setCustomerSearch("");
    setEditingId(null);
  };

  const openNew = () => {
    resetNewForm();
    setShowNewForm(true);
  };

  // Calculate prices for the new form
  const selectedTour = newForm.type === "tour" ? tours.find(t => t.name === newForm.itemName) : null;
  const selectedTransfer = newForm.type === "transfer" ? transfers.find(t => t.label === newForm.itemName) : null;
  const selectedPackage = newForm.type === "package" ? packages.find(t => t.name === newForm.itemName) : null;
  const selectedPartner = partners.find(p => p.id === newForm.partnerId);

  const calculatePartnerPrice = (basePrice: number, partnerPriceDefined: number | undefined | null) => {
    if (!selectedPartner) return basePrice;
    
    // If a specific partner price is defined for this item, use it
    if (partnerPriceDefined && partnerPriceDefined > 0) return partnerPriceDefined;
    
    // Otherwise, apply the partner's commission or remuneration
    if (selectedPartner.remuneration_type === "comissao_percent") {
      const rate = selectedPartner.remuneration_value || selectedPartner.commission_rate || 0;
      return Math.round(basePrice * (1 - rate / 100));
    } else if (selectedPartner.remuneration_type === "valor_por_passeio") {
      const discountValue = (selectedPartner.remuneration_value || 0) * 100; // Assuming it's in BRL, convert to cents
      return Math.max(0, basePrice - discountValue);
    }
    
    // Default to commission_rate if remuneration_type is not set but rate is
    if (selectedPartner.commission_rate) {
      return Math.round(basePrice * (1 - selectedPartner.commission_rate / 100));
    }
    
    return basePrice;
  };

  const publicUnitPrice = newForm.type === "tour" 
    ? (newForm.tourMode === "privativo" 
        ? (selectedTour?.private_price || 0)
        : (selectedTour?.price || 0)
      )
    : newForm.type === "package"
      ? (selectedPackage?.discount_price || selectedPackage?.original_price || 0)
      : (selectedTransfer?.price || 0);

  const unitPrice = newForm.type === "tour" 
    ? (newForm.tourMode === "privativo" 
        ? calculatePartnerPrice(selectedTour?.private_price || 0, selectedTour?.partner_private_price)
        : calculatePartnerPrice(selectedTour?.price || 0, selectedTour?.partner_price)
      )
    : newForm.type === "package"
      ? calculatePartnerPrice(selectedPackage?.discount_price || selectedPackage?.original_price || 0, selectedPackage?.partner_price)
      : calculatePartnerPrice(selectedTransfer?.price || 0, selectedTransfer?.partner_price);

  const total = (newForm.type === "tour" && newForm.tourMode === "privativo") ? unitPrice : unitPrice * newForm.guests;
  const publicTotal = (newForm.type === "tour" && newForm.tourMode === "privativo") ? publicUnitPrice : publicUnitPrice * newForm.guests;
  
  const pixDiscountPercent = (selectedTour?.pix_discount || selectedTransfer?.pix_discount || 0);
  const discount = (newForm.payMethod === "pix" && pixDiscountPercent > 0 && !newForm.partnerId) 
    ? Math.round(total * pixDiscountPercent / 100) 
    : 0;
  const finalTotal = total - discount;

  const handleNewBooking = async (e: any) => {
    if (e?.preventDefault) e.preventDefault();
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
        type: newForm.type,
        itemName: newForm.type === "tour" ? `${newForm.itemName} (${newForm.tourMode === "privativo" ? "Privativo" : "Coletivo"})` : newForm.itemName,
        date: newForm.date || "",
        guests: newForm.guests,
        payMethod: newForm.payMethod,
        customerName: newForm.customerName.trim(),
        customerEmail: newForm.customerEmail.trim().toLowerCase(),
        customerPhone: maskPhone(newForm.customerPhone),
        cpf: newForm.cpf.replace(/\D/g, "") || undefined,
        passport: newForm.passport.trim() || undefined,
        country: newForm.country.trim(),
        birthDate: newForm.birthDate || undefined,
        notes: newForm.notes.trim() || undefined,
        unitPrice,
        total,
        discount,
        finalTotal,
        publicUnitPrice,
        publicTotal,
        collaboratorId: newForm.collaboratorId || undefined,
        partnerId: newForm.partnerId || undefined,
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
      const confirm = window.confirm("⚠️ CANCELAR E EXCLUIR?\n\nO cliente deseja cancelar? Esta ação removerá a reserva da lista principal e ajustará o financeiro.");
      if (!confirm) return;
      
      setActionLoading(true);
      try {
        // Find the booking ID from some context or pass it?
        // Actually, let's just use the action passed which might already be cancelBooking.
        // But if the user wants to EXCLUDE too, we should call deleteBooking after or instead.
        await action();
        toast.success(successMsg);
        setSelected(null);
      } catch {
        toast.error("Erro ao executar ação.");
      }
      setActionLoading(false);
      return;
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

  const handleDelete = async (id: string) => {
    const confirm = window.confirm("🚨 EXCLUIR RESERVA PERMANENTEMENTE?\n\nEsta ação não pode ser desfeita e removerá todos os registros financeiros associados.");
    if (!confirm) return;
    
    setActionLoading(true);
    try {
      await deleteBooking(id);
      toast.success("Reserva excluída permanentemente.");
      setSelected(null);
    } catch (err: any) {
      toast.error(err?.message || "Erro ao excluir reserva.");
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
      <AdminLayout title="Gestão de Reservas & Operações">
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <Loader2 className="animate-spin text-primary" size={40} />
          <p className="text-muted-foreground animate-pulse">Carregando reservas...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Gestão de Reservas">
      <div className="flex flex-col lg:flex-row gap-6 h-full items-stretch">
        <div className="flex-1 min-w-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Total Reservas", value: bookings.length, icon: ShoppingCart, color: "from-blue-500 to-indigo-600", desc: "Histórico" },
              { label: "Confirmadas", value: bookings.filter((b) => b.status === "confirmada").length, icon: CheckCircle, color: "from-emerald-500 to-teal-600", desc: "Vendas" },
              { label: "Pendentes", value: bookings.filter((b) => b.status === "pendente").length, icon: Clock, color: "from-amber-500 to-orange-600", desc: "Aguardando" },
              { label: "Receita Paga", value: fmt(totalPago), icon: DollarSign, color: "from-purple-500 to-pink-600", desc: "Financeiro" },
            ].map((stat, i) => (
              <div key={i} className="glass-card rounded-3xl p-4 relative overflow-hidden group">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white shadow-lg`}>
                    <stat.icon size={18} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-xl font-black text-foreground tracking-tighter">{stat.value}</p>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Card className="mb-6 border-none shadow-sm glass-card rounded-3xl overflow-hidden border border-white/20">
            <CardContent className="p-4 md:p-6 space-y-4">
              <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
                <div className="flex bg-muted/30 p-1 rounded-2xl border border-border/40 w-full md:w-auto">
                  <Button 
                    variant={viewMode === "list" ? "default" : "ghost"} 
                    onClick={() => setViewMode("list")}
                    className={cn("flex-1 md:flex-none h-10 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest", viewMode === "list" ? "shadow-md" : "text-muted-foreground")}
                  >
                    <LayoutGrid size={14} className="mr-2" /> Cards
                  </Button>
                  <Button 
                    variant={viewMode === "table" ? "default" : "ghost"} 
                    onClick={() => setViewMode("table")}
                    className={cn("flex-1 md:flex-none h-10 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest", viewMode === "table" ? "shadow-md" : "text-muted-foreground")}
                  >
                    <List size={14} className="mr-2" /> Tabela
                  </Button>
                  <Button 
                    variant={viewMode === "calendar" ? "default" : "ghost"} 
                    onClick={() => setViewMode("calendar")}
                    className={cn("flex-1 md:flex-none h-10 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest", viewMode === "calendar" ? "shadow-md" : "text-muted-foreground")}
                  >
                    <CalendarDays size={14} className="mr-2" /> Agenda
                  </Button>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
                  <div className="relative flex-1 md:w-[280px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40" size={16} />
                    <Input
                      placeholder="Busca..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10 h-11 rounded-xl border-border/40 bg-muted/20 focus:bg-white transition-all font-semibold text-xs"
                    />
                  </div>
                  <Button onClick={openNew} className="h-11 px-6 rounded-xl bg-primary hover:bg-primary/90 font-black text-[10px] uppercase tracking-widest">
                    <Plus size={16} className="mr-2" /> Reserva
                  </Button>
                  <Button variant="outline" onClick={exportCSV} className="h-11 px-6 rounded-xl border-border/40 hover:bg-muted font-black text-[10px] uppercase tracking-widest">
                    <Download size={16} className="mr-2" /> CSV
                  </Button>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 pt-4 border-t border-border/40">
                <div className="flex overflow-x-auto pb-2 md:pb-0 gap-2 no-scrollbar">
                  {["todos", "confirmada", "pendente", "cancelada", "concluida"].map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={`text-[9px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all whitespace-nowrap border ${
                        statusFilter === s
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted/30 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {s === "todos" ? `Status: Todos` : statusConfig[s]?.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3 bg-muted/20 px-4 py-2 rounded-xl border border-border/40 ml-auto">
                  <Calendar size={12} className="text-primary" />
                  <div className="flex items-center gap-2">
                    <input type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)} className="bg-transparent text-[9px] font-black uppercase tracking-widest outline-none w-24" />
                    <span className="text-muted-foreground text-[8px] font-black opacity-40">→</span>
                    <input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} className="bg-transparent text-[9px] font-black uppercase tracking-widest outline-none w-24" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="min-h-0">
          {viewMode === "calendar" ? (
            <div className="animate-in-fade" style={{ animationDelay: '0.3s' }}>
              <BookingCalendar 
                bookings={bookings} 
                onSelectBooking={(b) => {
                  setSelected(b);
                  setEditNotes(b.notes || "");
                  setShowNotes(false);
                }}
              />
            </div>
          ) : viewMode === "table" ? (
        <Card className="border-none shadow-2xl shadow-primary/5 overflow-hidden glass-card rounded-[1.5rem] md:rounded-[2.5rem] animate-in-fade border border-white/20">
          <Table>
            <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
              <TableRow className="border-b border-border/40 hover:bg-transparent">
                <TableHead className="text-[10px] font-black uppercase tracking-widest h-14">Código</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest h-14">Cliente</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest h-14">Serviço</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest h-14 text-center">Data</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest h-14 text-center">Pax</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest h-14 text-right">Valor</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest h-14 text-center">Status</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest h-14 text-right pr-8">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((booking) => (
                <TableRow 
                  key={booking.id} 
                  onClick={() => setSelected(booking)}
                  className={cn(
                    "border-b border-border/40 hover:bg-primary/5 transition-all cursor-pointer group",
                    selected?.id === booking.id && "bg-primary/5"
                  )}
                >
                  <TableCell className="py-4">
                    <span className="text-[10px] font-black text-primary bg-primary/5 px-2 py-1 rounded-md">#{booking.bookingCode}</span>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{booking.customerName}</span>
                      <span className="text-[10px] text-muted-foreground font-medium">{booking.customerEmail}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                        {booking.type === 'tour' ? <Compass size={14} /> : <Car size={14} />}
                      </div>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400 max-w-[150px] truncate">{booking.itemName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 text-center">
                    <span className="text-xs font-black text-slate-500">{fmtDate(booking.date)}</span>
                  </TableCell>
                  <TableCell className="py-4 text-center">
                    <span className="text-xs font-black text-slate-500">{booking.guests}</span>
                  </TableCell>
                  <TableCell className="py-4 text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-black text-slate-900 dark:text-slate-100">{fmt(booking.finalTotal)}</span>
                      {booking.partnerId && <Badge className="text-[8px] h-4 bg-primary/10 text-primary border-none">NET</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="py-4 text-center">
                    <Badge className={cn("text-[8px] font-black uppercase tracking-widest", statusConfig[booking.status]?.className)}>
                      {statusConfig[booking.status]?.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4 text-right pr-8">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" onClick={() => setSelected(booking)} className="h-8 w-8 rounded-lg hover:bg-primary hover:text-white">
                        <Eye size={14} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(booking)} className="h-8 w-8 rounded-lg hover:bg-amber-500 hover:text-white">
                        <Pencil size={14} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(booking.id)} className="h-8 w-8 rounded-lg hover:bg-rose-600 hover:text-white">
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filtered.length === 0 && (
             <div className="h-60 flex flex-col items-center justify-center text-muted-foreground/40">
               <Calendar size={40} className="mb-4" />
               <p className="font-bold">Nenhuma reserva encontrada</p>
             </div>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 animate-in-fade" style={{ animationDelay: '0.3s' }}>
          {filtered.map((booking, index) => (
            <div 
              key={booking.id}
              onClick={() => setSelected(booking)}
              className={cn(
                "glass-card admin-card-hover rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden border border-white/20 group animate-in-slide-up bg-white/40 dark:bg-black/20 backdrop-blur-xl shadow-xl shadow-black/5 cursor-pointer transition-all",
                selected?.id === booking.id && "ring-4 ring-primary/20 bg-white dark:bg-black/40 scale-[1.02]"
              )}
              style={{ animationDelay: `${0.05 * (index % 10)}s` }}
            >
              <div className="p-6 md:p-8">

                {/* Card Header */}
                <div className="flex justify-between items-start mb-4 md:mb-6">
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 mb-1.5 md:mb-2 bg-primary/5 px-2 py-1 rounded-lg self-start">
                      #{booking.bookingCode}
                    </span>
                    <h3 className="text-lg md:text-xl font-black text-foreground tracking-tight truncate group-hover:text-primary transition-colors duration-300">
                      {booking.customerName}
                    </h3>
                  </div>
                  <Badge className={cn(
                    "rounded-2xl px-3 md:px-4 py-1 md:py-1.5 font-black text-[9px] md:text-[10px] uppercase tracking-widest border-none shadow-xl shrink-0",
                    statusConfig[booking.status]?.className
                  )}>
                    {statusConfig[booking.status]?.label}
                  </Badge>
                  {booking.partnerId && (
                    <Badge variant="outline" className="ml-2 bg-primary/5 text-primary border-primary/20 text-[8px] font-bold">
                      NET
                    </Badge>
                  )}
                </div>


                {/* Tour Info */}
                <div className="space-y-3 md:space-y-4 mb-6 md:mb-8">
                  <div className="flex items-center gap-3 md:gap-4 group/item">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover/item:scale-110 group-hover/item:rotate-3 transition-all duration-500">
                      {booking.type === 'tour' ? <Compass size={16} className="md:w-[18px]" /> : booking.type === 'package' ? <PackageIcon size={16} className="md:w-[18px]" /> : <Car size={16} className="md:w-[18px]" />}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 leading-none mb-1">Serviço</span>
                      <span className="text-xs md:text-sm font-bold text-foreground/80 truncate">{booking.itemName}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 md:gap-4 group/item">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover/item:scale-110 group-hover/item:rotate-3 transition-all duration-500">
                      <Calendar size={16} className="md:w-[18px]" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 leading-none mb-1">Data Agendada</span>
                      <span className="text-xs md:text-sm font-bold text-foreground/80">{fmtDate(booking.date)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 md:gap-4 group/item">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover/item:scale-110 group-hover/item:rotate-3 transition-all duration-500">
                      <Users size={16} className="md:w-[18px]" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 leading-none mb-1">Capacidade</span>
                      <span className="text-xs md:text-sm font-bold text-foreground/80">{booking.guests} {booking.guests === 1 ? 'passageiro' : 'passageiros'}</span>
                    </div>
                  </div>
                </div>


                {/* Footer with Price and Actions */}
                <div className="flex flex-col gap-4 pt-4 md:pt-6 border-t border-border/40">
                  <div className="flex items-center justify-between w-full">
                    <div>
                      <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 block mb-0.5 md:mb-1">
                        {booking.publicTotal && booking.publicTotal !== booking.finalTotal ? "Valor Líquido (NET)" : "Valor Total"}
                      </span>
                      <div className="flex flex-col">
                        <p className="text-xl md:text-2xl font-black text-foreground tracking-tighter leading-none">
                          {fmt(booking.finalTotal)}
                        </p>
                        {booking.publicTotal && booking.publicTotal !== booking.finalTotal && (
                          <span className="text-[8px] font-bold text-muted-foreground/40 uppercase mt-1">Venda Site: {fmt(booking.publicTotal)}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-1.5 md:gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => setSelected(booking)}
                              className="h-9 w-9 md:h-10 md:w-10 rounded-lg md:rounded-xl bg-white/50 dark:bg-white/5 hover:bg-primary hover:text-white transition-all duration-300 border border-white/40 dark:border-white/10"
                            >
                              <Eye size={16} className="md:w-[18px]" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Ver Detalhes</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              asChild
                              className="h-9 w-9 md:h-10 md:w-10 rounded-lg md:rounded-xl bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-500 hover:text-white transition-all duration-300 border border-emerald-100 dark:border-emerald-800"
                            >
                              <a 
                                href={`https://wa.me/${booking.customerPhone?.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá ${booking.customerName}! Por favor, assine o Termo de Ciência de Risco para o passeio ${booking.itemName}: ${window.location.origin}/assinatura-termo?booking=${encodeURIComponent(booking.bookingCode.trim())}`)}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                              >
                                <Smartphone size={16} className="md:w-[18px] text-emerald-600" />
                              </a>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Enviar Termo via WhatsApp</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => openEdit(booking)}
                              className="h-9 w-9 md:h-10 md:w-10 rounded-lg md:rounded-xl bg-white/50 dark:bg-white/5 hover:bg-amber-500 hover:text-white transition-all duration-300 border border-white/40 dark:border-white/10"
                            >
                              <Pencil size={16} className="md:w-[18px]" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Editar</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 w-full">
                    {booking.status !== "cancelada" && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleAction(() => deleteBooking(booking.id), "Reserva cancelada e removida.", true)}
                        className="h-9 md:h-10 rounded-xl border-rose-100 text-rose-500 hover:bg-rose-500 hover:text-white transition-all duration-300 font-bold text-[10px] uppercase tracking-widest"
                      >
                        <Ban size={14} className="mr-2" /> Cancelar/Excluir
                      </Button>
                    )}
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDelete(booking.id)}
                      className={cn(
                        "h-9 md:h-10 rounded-xl border-slate-200 text-slate-400 hover:bg-rose-600 hover:text-white hover:border-transparent transition-all duration-300 font-bold text-[10px] uppercase tracking-widest",
                        booking.status === "cancelada" && "col-span-2"
                      )}
                    >
                      <Trash2 size={14} className="mr-2" /> Excluir
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-full h-80 flex flex-col items-center justify-center space-y-6 bg-white/40 dark:bg-black/20 backdrop-blur-xl rounded-[3rem] border-2 border-dashed border-white/40 dark:border-white/10 animate-pulse">
              <div className="w-20 h-20 rounded-[2rem] bg-muted/20 flex items-center justify-center text-muted-foreground/40 shadow-inner">
                <Calendar size={40} />
              </div>
              <div className="text-center">
                <p className="text-xl font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-2">Nenhuma reserva encontrada</p>
                <p className="text-sm font-bold text-muted-foreground/40">Tente ajustar seus filtros ou termos de busca</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>

        {/* Detail View (Right Column on Desktop, Modal on Mobile) */}
        <div className={cn("hidden lg:block space-y-6 animate-in-fade", !selected && "opacity-50 pointer-events-none")}>
          {selected ? (
            <div className="glass-card rounded-[2.5rem] p-8 admin-card-hover sticky top-24 overflow-hidden flex flex-col max-h-[calc(100vh-120px)]">
              <div className="text-center bg-primary/[0.02] p-8 rounded-[2rem] border border-primary/5 mb-8">
                <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-primary to-ocean flex items-center justify-center text-white text-3xl font-black mx-auto mb-6 shadow-2xl shadow-primary/20 transition-transform duration-500 hover:rotate-6">
                  {selected.customerName.trim() ? selected.customerName.trim().split(" ").filter(Boolean).map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "C"}
                </div>
                <h3 className="font-display text-xl font-black text-foreground">{selected.customerName}</h3>
                <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
                  <Badge className={cn("rounded-2xl px-3 py-1 font-black text-[10px] uppercase tracking-widest border-none shadow-sm", statusConfig[selected.status]?.className)}>
                    {statusConfig[selected.status]?.label}
                  </Badge>
                  <Badge className={cn("rounded-2xl px-3 py-1 font-black text-[10px] uppercase tracking-widest border-none shadow-sm", paymentConfig[selected.paymentStatus]?.className)}>
                    {paymentConfig[selected.paymentStatus]?.label}
                  </Badge>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">
                  Reserva #{selected.bookingCode}
                </p>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
                {/* Financial Overview */}
                <div className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-2xl shadow-slate-900/20">
                  <div className="flex items-center gap-2 mb-4 text-emerald-400">
                    <DollarSign size={18} />
                    <h4 className="font-black text-[11px] uppercase tracking-widest leading-none">Resumo Financeiro</h4>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs text-white/60">
                      <span className="font-medium">Subtotal</span>
                      <span className="font-bold">{fmt(selected.total)}</span>
                    </div>
                    {selected.discount > 0 && (
                      <div className="flex justify-between text-xs text-emerald-400">
                        <span className="font-medium">Desconto</span>
                        <span className="font-bold">-{fmt(selected.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center font-black pt-3 border-t border-white/10">
                      <span className="text-xs uppercase tracking-widest text-white/40">Total Final</span>
                      <span className="text-2xl text-emerald-400">{fmt(selected.finalTotal)}</span>
                    </div>
                  </div>
                </div>

                {/* Service Details */}
                <div className="bg-muted/30 border border-border/50 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Compass size={16} className="text-primary" />
                    <h4 className="font-black text-[10px] text-muted-foreground uppercase tracking-widest leading-none">Serviço</h4>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-foreground">{selected.itemName}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground font-medium uppercase tracking-tight">
                        <span className="flex items-center gap-1.5"><Calendar size={12} /> {fmtDate(selected.date)}</span>
                        <span className="flex items-center gap-1.5"><Users size={12} /> {selected.guests} Pax</span>
                        <span className="flex items-center gap-1.5"><CreditCard size={12} /> {selected.payMethod === "pix" ? "PIX" : "Cartão"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Internal Notes */}
                <div className="bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200/50 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-600">
                      <MessageSquare size={16} />
                      <h4 className="font-black text-[10px] uppercase tracking-widest leading-none">Notas Internas</h4>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setShowNotes(true)} className="h-6 px-2 text-[10px] font-black uppercase text-amber-600 hover:bg-amber-100">
                      Editar
                    </Button>
                  </div>
                  {showNotes ? (
                    <div className="space-y-2">
                      <Textarea 
                        value={editNotes} 
                        onChange={(e) => setEditNotes(e.target.value)} 
                        className="min-h-[80px] text-xs bg-white border-amber-200"
                        rows={3} 
                      />
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="outline" onClick={() => setShowNotes(false)}>Sair</Button>
                        <Button size="sm" onClick={handleSaveNotes} disabled={actionLoading}>Salvar</Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-amber-900/70 italic leading-relaxed">
                      {selected.notes || "Sem observações registradas."}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="grid grid-cols-1 gap-2 pt-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" className="h-10 rounded-xl font-bold text-[10px] uppercase tracking-widest" onClick={() => openEdit(selected)}>
                      <Pencil size={14} className="mr-2" /> Editar
                    </Button>
                    <PrintReceiptButton
                      data={selected as any}
                      className="h-10"
                      label="Recibo"
                    />
                  </div>
                  {selected.customerPhone && (
                    <Button 
                      className="h-10 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-[10px] uppercase tracking-widest"
                      asChild
                    >
                      <a 
                        href={`https://wa.me/${selected.customerPhone.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá ${selected.customerName}!`)}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <Smartphone size={14} className="mr-2" /> WhatsApp
                      </a>
                    </Button>
                  )}
                  {selected.status === "pendente" && (
                    <Button onClick={() => handleAction(() => confirmPayment(selected.id), "Pago!")} className="h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold text-[10px] uppercase tracking-widest text-white shadow-lg shadow-emerald-200">
                      Confirmar Pagamento
                    </Button>
                  )}
                  <Button variant="ghost" onClick={() => setSelected(null)} className="h-10 text-[10px] font-black uppercase text-muted-foreground hover:bg-muted mt-2">
                    Fechar Detalhes
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card rounded-[2.5rem] p-12 text-center sticky top-24 border border-dashed border-border/50">
              <div className="w-20 h-20 rounded-[2rem] bg-muted/20 flex items-center justify-center text-muted-foreground/30 mx-auto mb-6">
                <LayoutGrid size={32} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mb-2">Painel de Detalhes</p>
              <p className="text-xs font-bold text-muted-foreground/30 leading-relaxed">
                Selecione uma reserva na lista ao lado para visualizar informações completas e ações rápidas.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* New Booking Dialog */}
      <Dialog open={showNewForm} onOpenChange={setShowNewForm}>
        <DialogContent className="max-w-[100vw] w-full h-[100dvh] sm:max-w-4xl sm:w-[95vw] sm:h-[95vh] overflow-hidden p-0 border-none shadow-3xl sm:rounded-[2.5rem] bg-slate-50 flex flex-col focus-visible:outline-none">
          <div className="bg-white border-b border-slate-100 p-4 md:p-8 flex items-center justify-between sticky top-0 z-20 shrink-0">
            <div className="flex items-center gap-3 md:gap-5">
              <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-[1.5rem] bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                {editingId ? <Pencil size={20} className="md:w-7 md:h-7" /> : <Plus size={20} className="md:w-7 md:h-7" />}
              </div>
              <div>
                <DialogTitle className="text-lg md:text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">
                  {editingId ? "Editar Reserva" : "Nova Reserva"}
                </DialogTitle>
                <p className="text-[10px] md:text-sm text-slate-400 font-bold uppercase tracking-widest">{editingId ? "Atualize os dados da reserva" : "Preencha para confirmar"}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setShowNewForm(false)} className="rounded-full hover:bg-slate-100 transition-colors">
              <X size={20} className="text-slate-400" />
            </Button>
          </div>

          <form onSubmit={handleNewBooking} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10 overflow-y-auto flex-1 custom-scrollbar">

              {/* Coluna 1: Dados do Serviço */}
              <div className="lg:col-span-6 space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-6 bg-primary rounded-full" />
                    <h3 className="font-black text-slate-800 uppercase tracking-wider text-xs">Informações do Serviço</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Tipo de Serviço</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <Button 
                          type="button" 
                          variant={newForm.type === "tour" ? "default" : "outline"} 
                          onClick={() => setNewForm(f => ({ ...f, type: "tour", itemName: "" }))}
                          className={cn("h-11 rounded-xl font-bold px-1", newForm.type === "tour" && "shadow-lg shadow-primary/20")}
                        >
                          <Compass size={16} className="mr-1 hidden sm:inline" /> Passeio
                        </Button>
                        <Button 
                          type="button" 
                          variant={newForm.type === "transfer" ? "default" : "outline"} 
                          onClick={() => setNewForm(f => ({ ...f, type: "transfer", itemName: "" }))}
                          className={cn("h-11 rounded-xl font-bold px-1", newForm.type === "transfer" && "shadow-lg shadow-primary/20")}
                        >
                          <Car size={16} className="mr-1 hidden sm:inline" /> Transf.
                        </Button>
                        <Button 
                          type="button" 
                          variant={newForm.type === "package" ? "default" : "outline"} 
                          onClick={() => setNewForm(f => ({ ...f, type: "package", itemName: "" }))}
                          className={cn("h-11 rounded-xl font-bold px-1", newForm.type === "package" && "shadow-lg shadow-primary/20")}
                        >
                          <PackageIcon size={16} className="mr-1 hidden sm:inline" /> Pacote
                        </Button>
                      </div>
                    </div>

                    {newForm.type === "tour" && (
                      <div className="space-y-2 animate-in-fade">
                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Modalidade</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <Button 
                            type="button" 
                            variant={newForm.tourMode === "coletivo" ? "default" : "outline"} 
                            onClick={() => setNewForm(f => ({ ...f, tourMode: "coletivo" }))}
                            className={cn("h-11 rounded-xl font-bold", newForm.tourMode === "coletivo" && "shadow-lg shadow-primary/20")}
                          >
                            <Users size={16} className="mr-2" /> Coletivo
                          </Button>
                          <Button 
                            type="button" 
                            variant={newForm.tourMode === "privativo" ? "default" : "outline"} 
                            onClick={() => setNewForm(f => ({ ...f, tourMode: "privativo" }))}
                            className={cn("h-11 rounded-xl font-bold", newForm.tourMode === "privativo" && "shadow-lg shadow-primary/20")}
                          >
                            <User size={16} className="mr-2" /> Privativo
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                        {newForm.type === "tour" ? "Selecionar Passeio" : newForm.type === "package" ? "Selecionar Pacote" : "Selecionar Rota"}
                      </Label>
                      <select
                        value={newForm.itemName}
                        onChange={(e) => setNewForm(f => ({ ...f, itemName: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 h-12 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                        required
                      >
                        <option value="">Selecione um item...</option>
                        {newForm.type === "tour"
                          ? tours.map(t => <option key={t.id} value={t.name}>{t.name} — {fmt(newForm.tourMode === "privativo" ? t.private_price : t.price)}</option>)
                          : newForm.type === "package"
                            ? packages.map(p => <option key={p.id} value={p.name}>{p.name} — {fmt(p.discount_price || p.original_price)}</option>)
                            : transfers.map(t => <option key={t.id} value={t.label}>{t.label} — {fmt(t.price)}</option>)
                        }
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Data</Label>
                        <div className="relative">
                          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <Input type="date" value={newForm.date} onChange={(e) => setNewForm(f => ({ ...f, date: e.target.value }))} className="pl-11 h-12 rounded-xl border-slate-200 font-bold" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Passageiros</Label>
                        <div className="relative">
                          <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <Input type="number" min={1} max={50} value={newForm.guests} onChange={(e) => setNewForm(f => ({ ...f, guests: parseInt(e.target.value) || 1 }))} className="pl-11 h-12 rounded-xl border-slate-200 font-bold" required />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
                    <h3 className="font-black text-slate-800 uppercase tracking-wider text-xs">Pagamento e Vendas</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Método de Pagamento</Label>
                      <div className="flex gap-2">
                        <Button 
                          type="button" 
                          variant={newForm.payMethod === "pix" ? "default" : "outline"} 
                          onClick={() => setNewForm(f => ({ ...f, payMethod: "pix" }))}
                          className={cn("flex-1 h-11 rounded-xl font-bold", newForm.payMethod === "pix" && "bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20")}
                        >
                          PIX
                        </Button>
                        <Button 
                          type="button" 
                          variant={newForm.payMethod === "card" ? "default" : "outline"} 
                          onClick={() => setNewForm(f => ({ ...f, payMethod: "card" }))}
                          className={cn("flex-1 h-11 rounded-xl font-bold")}
                        >
                          Cartão
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Parceiro (Tarifa Net)</Label>
                      <select
                        value={newForm.partnerId}
                        onChange={(e) => setNewForm(f => ({ ...f, partnerId: e.target.value }))}
                        className="w-full bg-primary/5 border border-primary/20 rounded-xl px-4 h-12 text-sm font-bold text-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                      >
                        <option value="">Nenhum (Preço Público)</option>
                        {partners.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Vendedor</Label>
                      <select
                        value={newForm.collaboratorId}
                        onChange={(e) => setNewForm(f => ({ ...f, collaboratorId: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 h-12 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                      >
                        <option value="">Nenhum</option>
                        {collaborators.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Coluna 2: Dados do Cliente */}
              <div className="lg:col-span-6 space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
                    <h3 className="font-black text-slate-800 uppercase tracking-wider text-xs">Dados do Cliente</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Buscar Cliente Cadastrado</Label>
                      <div className="flex flex-col gap-2">
                        <div className="relative">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <Input 
                            placeholder="Nome ou e-mail..." 
                            value={customerSearch} 
                            onChange={(e) => setCustomerSearch(e.target.value)}
                            className="pl-11 h-11 rounded-xl border-slate-100 bg-slate-50 focus:bg-white transition-all"
                          />
                        </div>
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
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 h-12 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                        >
                          <option value="">— Novo cliente / Digitar manual —</option>
                          {existingCustomers
                            .filter(c => !customerSearch || c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.email.toLowerCase().includes(customerSearch.toLowerCase()))
                            .slice(0, 100)
                            .map(c => (
                              <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                            ))
                          }
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Nome Completo *</Label>
                      <Input value={newForm.customerName} onChange={(e) => setNewForm(f => ({ ...f, customerName: e.target.value }))} placeholder="Ex: João da Silva" className="h-12 rounded-xl border-slate-200 font-bold" required disabled={!!selectedCustomerId && !editingId} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">E-mail *</Label>
                        <Input type="email" value={newForm.customerEmail} onChange={(e) => setNewForm(f => ({ ...f, customerEmail: e.target.value }))} placeholder="email@exemplo.com" className="h-12 rounded-xl border-slate-200 font-bold" required disabled={!!selectedCustomerId && !editingId} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Telefone</Label>
                        <Input value={newForm.customerPhone} onChange={(e) => setNewForm(f => ({ ...f, customerPhone: maskPhone(e.target.value) }))} placeholder="(99) 99999-9999" className="h-12 rounded-xl border-slate-200 font-bold" disabled={!!selectedCustomerId && !editingId} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">CPF</Label>
                        <Input value={newForm.cpf} onChange={(e) => setNewForm(f => ({ ...f, cpf: maskCPF(e.target.value) }))} placeholder="000.000.000-00" className="h-12 rounded-xl border-slate-200 font-bold" disabled={!!selectedCustomerId && !editingId} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Nascimento</Label>
                        <Input type="date" value={newForm.birthDate} onChange={(e) => setNewForm(f => ({ ...f, birthDate: e.target.value }))} className="h-12 rounded-xl border-slate-200 font-bold" disabled={!!selectedCustomerId && !editingId} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Observações da Reserva</Label>
                      <Textarea value={newForm.notes} onChange={(e) => setNewForm(f => ({ ...f, notes: e.target.value }))} placeholder="Ex: Alergias, preferências, horários específicos..." rows={3} className="rounded-2xl border-slate-200 font-medium text-sm" />
                    </div>
                  </div>
                </div>

                {/* Resumo Financeiro no Form */}
                {unitPrice > 0 && (
                  <div className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-2xl shadow-slate-900/20 animate-in-slide-up">
                    <div className="flex items-center gap-2 mb-4">
                      <DollarSign className="text-emerald-400" size={18} />
                      <h3 className="font-black uppercase tracking-widest text-[11px]">Resumo do Checkout</h3>
                    </div>

                    {newForm.partnerId && (
                      <div className="space-y-2 mb-4 p-3 bg-white/5 rounded-2xl border border-white/10">
                        <div className="flex justify-between text-[9px] font-black uppercase text-white/40 tracking-widest">
                          <span>Valor para o Cliente (Site)</span>
                          <span>{fmt(publicTotal)}</span>
                        </div>
                        <p className="text-[10px] text-emerald-400 font-bold leading-tight">
                          O cliente verá o preço do site no recibo. O financeiro registrará o valor NET a receber.
                        </p>
                      </div>
                    )}

                    <div className="space-y-2 border-b border-white/10 pb-4 mb-4">
                      <div className="flex justify-between text-[11px] font-bold text-white/60 uppercase tracking-wider">
                        <span>{newForm.type === "tour" && newForm.tourMode === "privativo" ? "Veículo Privativo" : `${newForm.guests} Passageiro(s)`}</span>
                        <span>{fmt(total)}</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                          <span>Desconto PIX ({pixDiscountPercent}%)</span>
                          <span>-{fmt(discount)}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em]">
                        {newForm.partnerId ? "A Receber (NET)" : "Total a Pagar"}
                      </span>
                      <span className="text-3xl font-black text-white tracking-tighter">{fmt(finalTotal)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex gap-4 sticky bottom-0 bg-white border-t border-slate-100 p-4 md:p-8 z-20 shrink-0">
              <Button type="button" variant="ghost" onClick={() => setShowNewForm(false)} className="flex-1 h-12 md:h-14 rounded-xl md:rounded-2xl font-black uppercase text-[10px] md:text-[12px] tracking-widest hover:bg-slate-50">
                Descartar
              </Button>
              <Button type="submit" className="flex-[2] h-12 md:h-14 rounded-xl md:rounded-2xl bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/20 font-black uppercase text-[10px] md:text-[12px] tracking-widest transition-all hover:scale-[1.02]" disabled={newLoading || !newForm.itemName}>
                {newLoading ? <Loader2 className="animate-spin mr-2" size={18} /> : (editingId ? <Save size={18} className="mr-2" /> : <Plus size={18} className="mr-2" />)}
                {editingId ? "Salvar" : "Confirmar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

    </AdminLayout>
  );
};

export default AdminReservas;
