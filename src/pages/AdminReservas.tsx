import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Calendar, DollarSign, Clock, CheckCircle, XCircle, ChevronRight, FileDown, LayoutGrid, List, Loader2, User, Phone, Mail, MapPin, CreditCard, Trash2, Printer, Download, Eye, MoreHorizontal, Users, Tag, Briefcase, UserCheck, Pencil, Shield, Smartphone, FileText, Activity, Building2, LayoutDashboard } from "lucide-react";
import { useBookings, BookingItem } from "@/hooks/useBookings";
import { formatCurrency, cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { maskPhone, maskCurrency, parseCurrencyToNumber, maskDate } from "@/lib/masks";
import { Separator } from "@/components/ui/separator";

const statusConfig: Record<string, { label: string; className: string }> = {
  confirmada: { label: "Confirmada", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  pendente: { label: "Pendente", className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  cancelada: { label: "Cancelada", className: "bg-rose-500/10 text-rose-600 border-rose-500/20" },
  concluida: { label: "Concluída", className: "bg-primary/10 text-primary border-primary/20" },
};

const DependentList = ({ customerId }: { customerId: string }) => {
  const [dependents, setDependents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDeps = async () => {
      if (!customerId) return;
      const { data } = await supabase
        .from("dependents")
        .select("*")
        .eq("customer_id", customerId);
      if (data) setDependents(data);
      setLoading(false);
    };
    fetchDeps();
  }, [customerId]);

  if (loading) return <div className="text-[10px] text-slate-400">Carregando dependentes...</div>;
  if (dependents.length === 0) return <div className="text-[10px] text-slate-400 italic">Nenhum dependente vinculado a este cliente.</div>;

  return (
    <div className="space-y-2">
      {dependents.map((dep) => (
        <div key={dep.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
          <p className="text-[11px] font-black text-slate-700 uppercase">{dep.name}</p>
          <div className="flex gap-2 mt-1">
            {dep.cpf && (
              <Badge variant="outline" className="text-[8px] font-bold py-0 h-4 bg-white">
                CPF: {dep.cpf}
              </Badge>
            )}
            {dep.birth_date && (
              <Badge variant="outline" className="text-[8px] font-bold py-0 h-4 bg-white">
                Nasc: {format(new Date(dep.birth_date), "dd/MM/yyyy")}
              </Badge>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

const AdminReservas = () => {
  const { bookings, loading, addBooking, updateBooking, confirmPayment, cancelBooking, deleteBooking, completeBooking, markTermAsSignedAtCounter } = useBookings();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<BookingItem | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showWideView, setShowWideView] = useState(false);
  const [isWideViewNewWindow, setIsWideViewNewWindow] = useState(false);
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [tours, setTours] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  const [customerSearch, setCustomerSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    customerId: "",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    cpf: "",
    notes: "",
    collaboratorId: "",
    partnerId: "",
    payMethod: "pix" as "pix" | "card" | "info",
    paid: false,
    birthDate: "",
    companions: [] as { name: string; cpf?: string; birthDate?: string; relationship?: string }[],
    items: [{
      id: Math.random().toString(36).substr(2, 9),
      type: "tour" as "tour" | "transfer" | "package",
      itemName: "",
      date: "",
      guests: 1,
      unitPrice: "0",
      discount: "0",
      publicUnitPrice: "0",
      partnerNetPrice: "0",
    }]
  });

  const [companionForm, setCompanionForm] = useState({
    name: "",
    cpf: "",
    birthDate: "",
    relationship: "Acompanhante",
  });

  useEffect(() => {
    const fetchData = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const wideViewId = urlParams.get('wide_view_id');
      if (wideViewId) {
        setIsWideViewNewWindow(true);
      }

      const [collabsRes, partnersRes, toursRes, pkgsRes, transfersRes, customersRes] = await Promise.all([
        supabase.from("collaborators").select("id, name").eq("status", "active"),
        supabase.from("partners").select("id, name").eq("active", true),
        supabase.from("tours").select("id, name, price, private_price, partner_price").eq("active", true),
        supabase.from("packages").select("id, name, discount_price, original_price, partner_price").eq("active", true),
        supabase.from("transfer_routes").select("id, origin, destination, price, partner_price").eq("active", true),
        supabase.from("customers").select("id, name, email, phone, birth_date, cpf").order("name").limit(10)
      ]);

      if (collabsRes.data) setCollaborators(collabsRes.data);
      if (partnersRes.data) setPartners(partnersRes.data);
      if (toursRes.data) setTours(toursRes.data);
      if (pkgsRes.data) setPackages(pkgsRes.data);
      if (transfersRes.data) setTransfers(transfersRes.data);
      if (customersRes.data) setCustomers(customersRes.data);

    };

    fetchData();
  }, []);

  const searchCustomers = async (query: string) => {
    setCustomerSearch(query);
    if (query.length < 2) return;

    const { data } = await supabase
      .from("customers")
      .select("id, name, email, phone, birth_date, cpf")
      .ilike("name", `%${query}%`)
      .limit(5);

    if (data) setCustomers(data);
  };

  const handleSelectCustomer = (customer: any) => {
    setForm(prev => ({
      ...prev,
      customerId: customer.id,
      customerName: customer.name,
      customerEmail: customer.email || "",
      customerPhone: customer.phone || "",
      birthDate: customer.birth_date || "",
      cpf: customer.cpf || "",
    }));
    setCustomerSearch("");
  };

  const filtered = bookings.filter((b) => {
    const q = search.toLowerCase();
    return b.customerName.toLowerCase().includes(q) || b.itemName.toLowerCase().includes(q) || b.bookingCode.toLowerCase().includes(q);
  });

  const totalPago = bookings.filter((b) => b.paymentStatus === "pago" && b.status !== "cancelada").reduce((a, b) => a + b.finalTotal, 0);

  const handleAction = async (action: () => Promise<void>, msg: string) => {
    setActionLoading(true);
    try {
      await action();
      toast({ title: "Sucesso", description: msg });
      setSelected(null);
    } catch (err) {
      toast({ title: "Erro", description: "Erro ao processar ação", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("🚨 EXCLUIR RESERVA PERMANENTEMENTE?\n\nEsta ação não pode ser desfeita e removerá todos os registros financeiros associados.")) return;
    
    setActionLoading(true);
    try {
      await deleteBooking(id);
      toast({ title: "Reserva excluída", description: "Reserva excluída permanentemente." });
      setSelected(null);
    } catch (err: any) {
      toast({ title: "Erro", description: err?.message || "Erro ao excluir reserva.", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const updateItem = (id: string, field: string, value: any) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.map(i => i.id === id ? { ...i, [field]: value } : i)
    }));
  };

  const handleItemChange = (itemId: string, itemIndex: number) => {
    let selectedItem: any;
    const itemInForm = form.items[itemIndex];
    
    if (itemInForm.type === "tour") {
      selectedItem = tours.find(t => t.id === itemId);
      if (selectedItem) {
        updateItem(itemInForm.id, "itemName", selectedItem.name);
        updateItem(itemInForm.id, "unitPrice", selectedItem.price.toString());
        updateItem(itemInForm.id, "publicUnitPrice", selectedItem.private_price?.toString() || selectedItem.price.toString());
        updateItem(itemInForm.id, "partnerNetPrice", selectedItem.partner_price ? selectedItem.partner_price.toString() : "0");
      }
    } else if (itemInForm.type === "package") {
      selectedItem = packages.find(p => p.id === itemId);
      if (selectedItem) {
        updateItem(itemInForm.id, "itemName", selectedItem.name);
        updateItem(itemInForm.id, "unitPrice", (selectedItem.discount_price || selectedItem.original_price).toString());
        updateItem(itemInForm.id, "publicUnitPrice", (selectedItem.original_price).toString());
        updateItem(itemInForm.id, "partnerNetPrice", selectedItem.partner_price ? selectedItem.partner_price.toString() : "0");
      }
    } else if (itemInForm.type === "transfer") {
      selectedItem = transfers.find(t => t.id === itemId);
      if (selectedItem) {
        updateItem(itemInForm.id, "itemName", `${selectedItem.origin} → ${selectedItem.destination}`);
        updateItem(itemInForm.id, "unitPrice", selectedItem.price.toString());
        updateItem(itemInForm.id, "publicUnitPrice", selectedItem.price.toString());
        updateItem(itemInForm.id, "partnerNetPrice", selectedItem.partner_price ? selectedItem.partner_price.toString() : "0");
      }
    }
  };

  const addItem = () => {
    setForm(prev => ({
      ...prev,
      items: [...prev.items, {
        id: Math.random().toString(36).substr(2, 9),
        type: "tour",
        itemName: "",
        date: "",
        guests: 1,
        unitPrice: "0",
        discount: "0",
        publicUnitPrice: "0",
        partnerNetPrice: "0",
      }]
    }));
  };

  const removeItem = (id: string) => {
    if (form.items.length === 1) return;
    setForm(prev => ({
      ...prev,
      items: prev.items.filter(i => i.id !== id)
    }));
  };

  const handleSave = async () => {
    if (!form.customerName || form.items.some(i => !i.itemName || !i.date)) {
      toast({ title: "Atenção", description: "Preencha o nome do cliente e todos os passeios/datas", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      if (!isEditing) {
        for (const item of form.items) {
          const isDuplicate = bookings.some(b => 
            (b.customerId === form.customerId || b.customerName.toLowerCase() === form.customerName.toLowerCase()) && 
            b.date === item.date && 
            b.itemName.toLowerCase() === item.itemName.toLowerCase() &&
            b.status !== 'cancelada'
          );

          if (isDuplicate) {
            toast({ 
              title: "Reserva Duplicada", 
              description: `Atenção: O cliente já possui uma reserva para ${item.itemName} em ${item.date}.`, 
              variant: "destructive" 
            });
            setSaving(false);
            return;
          }
        }
      }

      const processedItems = form.items.map(item => {
        return {
          ...item,
          unitPrice: parseCurrencyToNumber(item.unitPrice),
          discount: parseCurrencyToNumber(item.discount),
          publicUnitPrice: parseCurrencyToNumber(item.publicUnitPrice),
          partnerNetPrice: parseCurrencyToNumber(item.partnerNetPrice),
        };
      });

      const payload = {
        ...form,
        isPaid: form.paid,
        items: processedItems,
        collaboratorId: form.collaboratorId === "none" ? undefined : form.collaboratorId || undefined,
        partnerId: form.partnerId === "none" ? undefined : form.partnerId || undefined,
      };

      if (isEditing && selected) {
        await updateBooking(selected.id, selected.customerId || "", payload);
        toast({ title: "Sucesso", description: "Reserva atualizada com sucesso!" });
      } else {

        await addBooking(payload as any);
        toast({ title: "Sucesso", description: "Reserva(s) criada(s) com sucesso!" });
      }

      setShowNewForm(false);
      setIsEditing(false);
      setForm({
        customerId: "",
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        notes: "",
        collaboratorId: "",
        partnerId: "",
        payMethod: "pix",
        paid: false,
        birthDate: "",
        cpf: "",
        companions: [],
        items: [{
          id: Math.random().toString(36).substr(2, 9),
          type: "tour",
          itemName: "",
          date: "",
          guests: 1,
          unitPrice: "0",
          discount: "0",
          publicUnitPrice: "0",
          partnerNetPrice: "0",
        }]
      });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message || "Erro ao salvar reserva", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (booking: BookingItem) => {
    setSelected(booking);
    
    let itemsToEdit = [booking];
    if (booking.groupId) {
      itemsToEdit = bookings.filter(b => b.groupId === booking.groupId);
    }
    
    setForm({
      customerId: booking.customerId || "",
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      customerPhone: booking.customerPhone,
      notes: booking.notes || "",
      collaboratorId: booking.collaboratorId || "",
      partnerId: booking.partnerId || "",
      payMethod: booking.payMethod,
      paid: booking.paymentStatus === 'pago',
      birthDate: booking.birthDate || "",
      cpf: booking.cpf || "",
      companions: [],
      items: itemsToEdit.map(item => ({
        id: item.id,
        type: item.type,
        itemName: item.itemName,
        date: item.date,
        guests: item.guests,
        unitPrice: item.unitPrice.toString(),
        discount: item.discount.toString(),
        publicUnitPrice: (item.publicUnitPrice || 0).toString(),
        partnerNetPrice: (item.partnerNetPrice || 0).toString(),
      }))
    });
    
    setIsEditing(true);
    setShowNewForm(true);
  };


  const addCompanion = () => {
    if (!companionForm.name) {
      toast({ title: "Erro", description: "Nome do dependente é obrigatório", variant: "destructive" });
      return;
    }
    setForm(prev => ({
      ...prev,
      companions: [...prev.companions, { ...companionForm }]
    }));
    setCompanionForm({
      name: "",
      cpf: "",
      birthDate: "",
      relationship: "Acompanhante",
    });
  };

  const removeCompanion = (index: number) => {
    setForm(prev => ({
      ...prev,
      companions: prev.companions.filter((_, i) => i !== index)
    }));
  };

  const handleSendRiskTerm = () => {
    if (!selected) return;
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/assinatura-termo?booking_id=${selected.id}`;
    
    navigator.clipboard.writeText(link);
    toast({ title: "Copiado", description: "Link do termo copiado!" });
    
    const message = encodeURIComponent(`Olá ${selected.customerName}, aqui está o link para assinatura do Termo de Responsabilidade da sua reserva ${selected.bookingCode}: ${link}`);
    const whatsappUrl = `https://wa.me/${selected.customerPhone.replace(/\D/g, '')}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  if (loading) return (
    <AdminLayout title="Gestão de Reservas">
      <div className="flex items-center justify-center py-32"><Loader2 className="animate-spin text-primary" size={40} /></div>
    </AdminLayout>
  );

  return (
    <AdminLayout title="Gestão de Reservas">
      <div className="flex flex-col gap-8 pb-10">
        <div className="bg-white rounded-lg p-8 border border-border shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Painel de Operações</h1>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/5 border border-primary/10">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest">{bookings.length} Registros Encontrados</span>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => setShowNewForm(true)} 
              className="bg-primary hover:bg-primary/90 text-white px-8 h-14 rounded-lg text-[11px] font-black uppercase tracking-widest shadow-sm transition-none flex items-center gap-3"
            >
              <Plus size={18} /> Nova Reserva
            </button>
          </div>
        </div>

        <div className="flex-1 bg-white rounded-lg border border-border flex flex-col overflow-hidden shadow-sm">
          <div className="overflow-auto flex-1">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Cód/Data</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Cliente</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Serviço</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Valor</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Status</TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(b => (
                  <TableRow key={b.id} className={cn(b.groupId && "border-l-4 border-l-primary/20")}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-black text-slate-900">{b.bookingCode}</span>
                        <span className="text-[10px] text-slate-400">{format(new Date(b.date + 'T12:00'), 'dd/MM/yy')}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-slate-700 uppercase">{b.customerName}</span>
                        <span className="text-[10px] text-slate-400">{b.customerPhone}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[9px] h-5 bg-slate-100 border-none capitalize">{b.type}</Badge>
                        <span className="text-[11px] font-medium text-slate-600">{b.itemName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-[12px] font-black text-slate-900">{formatCurrency(b.finalTotal)}</span>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("text-[9px] font-bold uppercase py-0.5", statusConfig[b.status]?.className)}>
                        {statusConfig[b.status]?.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button onClick={() => handleEdit(b)} variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary transition-colors">
                          <Pencil size={14} />
                        </Button>
                        <Button onClick={() => { setSelected(b); }} variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900 transition-colors">
                          <Eye size={14} />
                        </Button>
                        <Button onClick={() => window.open(`/voucher?id=${b.id}`, '_blank')} variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-emerald-500 transition-colors">
                          <Printer size={14} />
                        </Button>
                      </div>

                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

          </div>
        </div>
      </div>
      
      <Dialog open={showNewForm} onOpenChange={setShowNewForm}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto p-0 gap-0 border-none bg-slate-50/50 backdrop-blur-xl">
          <DialogHeader className="p-8 bg-white border-b sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                  {isEditing ? "Editar Reserva" : "Nova Reserva"}
                </DialogTitle>
                <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest mt-1">
                  Preencha os detalhes da operação
                </p>
              </div>
              <Badge variant="outline" className="h-8 px-4 bg-primary/5 text-primary border-primary/10 text-[10px] font-black uppercase tracking-widest">
                CRM v3.0
              </Badge>
            </div>
          </DialogHeader>

          <div className="p-8 space-y-8 pb-32">
            {/* Seção Cliente */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-slate-400">
                <User size={16} />
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em]">Dados do Passageiro</h3>
              </div>
              <Card className="border-slate-200/60 shadow-sm overflow-hidden">
                <CardContent className="p-6 space-y-4 bg-white">
                  <div className="relative">
                    <Label className="text-[10px] font-black uppercase text-slate-400 mb-1.5 block">Nome do Cliente</Label>
                    <div className="relative">
                      <Input 
                        placeholder="Buscar ou digitar nome..." 
                        value={form.customerName} 
                        onChange={e => {
                          setForm({...form, customerName: e.target.value});
                          searchCustomers(e.target.value);
                        }}
                        className="h-12 border-slate-200 focus:ring-primary/20 transition-all pl-10"
                      />
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    </div>
                    {customerSearch && customers.length > 0 && (
                      <div className="absolute z-20 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {customers.map(c => (
                          <button
                            key={c.id}
                            className="w-full px-5 py-4 text-left hover:bg-slate-50 flex items-center justify-between transition-colors border-b border-slate-50 last:border-0"
                            onClick={() => handleSelectCustomer(c)}
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center text-primary font-black text-xs uppercase">
                                {c.name.slice(0, 2)}
                              </div>
                              <div>
                                <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{c.name}</p>
                                <p className="text-[10px] text-slate-400 font-medium">{c.email || 'Sem e-mail'}</p>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-[8px] font-black uppercase">Selecionar</Badge>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase text-slate-400">E-mail</Label>
                      <Input 
                        placeholder="email@exemplo.com" 
                        value={form.customerEmail} 
                        onChange={e => setForm({...form, customerEmail: e.target.value})}
                        className="h-11 bg-slate-50/50"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase text-slate-400">WhatsApp</Label>
                      <Input 
                        placeholder="(00) 00000-0000" 
                        value={form.customerPhone} 
                        onChange={e => setForm({...form, customerPhone: maskPhone(e.target.value)})}
                        className="h-11 bg-slate-50/50"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase text-slate-400">CPF</Label>
                      <Input 
                        placeholder="000.000.000-00" 
                        value={form.cpf} 
                        onChange={e => setForm({...form, cpf: e.target.value})}
                        className="h-11 bg-slate-50/50"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase text-slate-400">Nascimento</Label>
                      <Input 
                        type="date"
                        value={form.birthDate} 
                        onChange={e => setForm({...form, birthDate: e.target.value})}
                        className="h-11 bg-slate-50/50"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Seção Itinerário */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-400">
                  <MapPin size={16} />
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em]">Itinerário / Serviços</h3>
                </div>
                <Button 
                  onClick={addItem} 
                  variant="outline" 
                  size="sm" 
                  className="h-8 border-primary/20 text-primary hover:bg-primary/5 text-[10px] font-black uppercase tracking-widest"
                >
                  <Plus size={14} className="mr-1" /> Adicionar Parada
                </Button>
              </div>

              <div className="space-y-3">
                {form.items.map((item, idx) => (
                  <Card key={item.id} className="border-slate-200/60 shadow-sm relative overflow-visible group">
                    <CardContent className="p-6 bg-white">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                        <div className="md:col-span-2 space-y-1.5">
                          <Label className="text-[10px] font-black uppercase text-slate-400">Tipo</Label>
                          <Select value={item.type} onValueChange={(v: any) => updateItem(item.id, "type", v)}>
                            <SelectTrigger className="h-11">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="tour">Passeio</SelectItem>
                              <SelectItem value="transfer">Translado</SelectItem>
                              <SelectItem value="package">Pacote</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="md:col-span-4 space-y-1.5">
                          <Label className="text-[10px] font-black uppercase text-slate-400">Serviço</Label>
                          <Select 
                            value={item.itemName} 
                            onValueChange={(v) => handleItemChange(v, idx)}
                          >
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Selecione o serviço..." />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                              {item.type === "tour" && tours.map(t => (
                                <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
                              ))}
                              {item.type === "package" && packages.map(p => (
                                <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                              ))}
                              {item.type === "transfer" && transfers.map(t => (
                                <SelectItem key={t.id} value={`${t.origin} → ${t.destination}`}>{t.origin} → {t.destination}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="md:col-span-2 space-y-1.5">
                          <Label className="text-[10px] font-black uppercase text-slate-400">Data</Label>
                          <div className="relative">
                            <Input 
                              type="date" 
                              value={item.date} 
                              onChange={e => updateItem(item.id, "date", e.target.value)}
                              className="h-11 pl-9"
                            />
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                          </div>
                        </div>

                        <div className="md:col-span-1 space-y-1.5">
                          <Label className="text-[10px] font-black uppercase text-slate-400">Qtd</Label>
                          <Input 
                            type="number" 
                            min="1" 
                            value={item.guests} 
                            onChange={e => updateItem(item.id, "guests", Number(e.target.value))}
                            className="h-11"
                          />
                        </div>

                        <div className="md:col-span-2 space-y-1.5">
                          <Label className="text-[10px] font-black uppercase text-slate-400">Valor Unit.</Label>
                          <Input 
                            value={item.unitPrice} 
                            onChange={e => updateItem(item.id, "unitPrice", maskCurrency(e.target.value))}
                            className="h-11 font-bold text-slate-900"
                          />
                        </div>

                        <div className="md:col-span-1 flex justify-end pb-1.5">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => removeItem(item.id)}
                            className="text-slate-300 hover:text-rose-500 transition-colors"
                            disabled={form.items.length === 1}
                          >
                            <Trash2 size={18} />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Seção Operacional e Financeira */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-400">
                  <Briefcase size={16} />
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em]">Operacional</h3>
                </div>
                <Card className="border-slate-200/60 shadow-sm">
                  <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase text-slate-400">Colaborador (Venda)</Label>
                        <Select value={form.collaboratorId} onValueChange={v => setForm({...form, collaboratorId: v})}>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Nenhum</SelectItem>
                            {collaborators.map(c => (
                              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase text-slate-400">Parceiro (Origem)</Label>
                        <Select value={form.partnerId} onValueChange={v => setForm({...form, partnerId: v})}>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Venda Direta</SelectItem>
                            {partners.map(p => (
                              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase text-slate-400">Observações Internas</Label>
                      <Textarea 
                        placeholder="Informações adicionais para a operação..." 
                        value={form.notes} 
                        onChange={e => setForm({...form, notes: e.target.value})}
                        className="min-h-[100px] resize-none border-slate-200 bg-slate-50/30"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-400">
                  <CreditCard size={16} />
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em]">Financeiro</h3>
                </div>
                <Card className="border-slate-200/60 shadow-sm bg-primary/[0.02]">
                  <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase text-slate-400">Forma de Pagto</Label>
                        <Select value={form.payMethod} onValueChange={(v: any) => setForm({...form, payMethod: v})}>
                          <SelectTrigger className="h-11">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pix">PIX</SelectItem>
                            <SelectItem value="card">Cartão</SelectItem>
                            <SelectItem value="info">Informações</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase text-slate-400">Status Inicial</Label>
                        <div className="flex items-center h-11 px-4 bg-white border border-slate-200 rounded-lg">
                          <label className="flex items-center gap-2 cursor-pointer w-full">
                            <input 
                              type="checkbox" 
                              checked={form.paid} 
                              onChange={e => setForm({...form, paid: e.target.checked})}
                              className="w-4 h-4 rounded text-primary focus:ring-primary border-slate-300"
                            />
                            <span className="text-[11px] font-bold text-slate-700 uppercase">Já está pago</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <Separator className="bg-slate-200/60" />

                    <div className="space-y-3 pt-2">
                      <div className="flex justify-between text-[11px] text-slate-500 uppercase font-bold tracking-wider">
                        <span>Subtotal ({form.items.length} itens)</span>
                        <span>{formatCurrency(form.items.reduce((acc, item) => {
                          const isPrivate = item.itemName.includes("(Privativo)");
                          return acc + (isPrivate ? parseCurrencyToNumber(item.unitPrice) : parseCurrencyToNumber(item.unitPrice) * item.guests);
                        }, 0))}</span>
                      </div>
                      <div className="flex justify-between text-xl font-black text-primary tracking-tight">
                        <span className="uppercase text-xs self-center">Valor Final</span>
                        <span>{formatCurrency(form.items.reduce((acc, item) => {
                          const isPrivate = item.itemName.includes("(Privativo)");
                          const total = isPrivate ? parseCurrencyToNumber(item.unitPrice) : parseCurrencyToNumber(item.unitPrice) * item.guests;
                          return acc + total - parseCurrencyToNumber(item.discount || "0");
                        }, 0))}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          <DialogFooter className="p-8 bg-white border-t sticky bottom-0 z-10 flex flex-row items-center justify-between gap-4">
            <Button 
              variant="ghost" 
              onClick={() => setShowNewForm(false)}
              className="px-8 h-12 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="px-12 h-12 bg-primary hover:bg-primary/90 text-white text-[11px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 transition-all flex items-center gap-3"
            >
              {saving ? <Loader2 className="animate-spin" size={18} /> : (isEditing ? <CheckCircle size={18} /> : <Plus size={18} />)}
              {isEditing ? "Atualizar Reserva" : "Confirmar Reserva"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </AdminLayout>
  );
};

export default AdminReservas;
