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
          ...
        </div>

        <div className={cn("hidden lg:block w-[380px] space-y-6 animate-in-fade shrink-0", !selected && "opacity-50 pointer-events-none")}>
          {selected ? (
            <div className="glass-card rounded-[2.5rem] p-8 sticky top-24 overflow-hidden flex flex-col max-h-[calc(100vh-120px)] border border-border">
              ...
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground/20 p-12 text-center border-2 border-dashed border-border/40 rounded-[3rem]">
              <div className="w-24 h-24 rounded-[2.5rem] bg-muted/5 flex items-center justify-center mb-6">
                <Calendar size={48} />
              </div>
              <h3 className="text-xl font-black uppercase tracking-widest leading-tight">Selecione uma<br />reserva</h3>
              <p className="text-xs font-bold mt-2">Para visualizar o checkout completo</p>
            </div>
          )}
        </div>
      </div>

    </AdminLayout>
  );
};

export default AdminReservas;
