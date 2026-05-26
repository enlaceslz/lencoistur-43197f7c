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
        await updateBooking(selected.id, selected.customerId || "", {
          ...payload,
          type: payload.items[0].type,
          itemName: payload.items[0].itemName,
          date: payload.items[0].date,
          guests: payload.items[0].guests,
          unitPrice: payload.items[0].unitPrice,
          discount: payload.items[0].discount,
          publicUnitPrice: payload.items[0].publicUnitPrice,
          partnerNetPrice: payload.items[0].partnerNetPrice,
        });
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
                  <TableHead>Reserva</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(b => (
                  <TableRow key={b.id}>
                    <TableCell>{b.itemName}</TableCell>
                    <TableCell>{b.customerName}</TableCell>
                    <TableCell>{formatCurrency(b.finalTotal)}</TableCell>
                    <TableCell>
                      <Button onClick={() => { setSelected(b); handleEdit(); }} variant="ghost" size="icon"><Pencil size={16} /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
      
      <Dialog open={showNewForm} onOpenChange={setShowNewForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader><DialogTitle>Nova Reserva</DialogTitle></DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Input placeholder="Nome" value={form.customerName} onChange={e => setForm({...form, customerName: e.target.value})} />
              <Input placeholder="Email" value={form.customerEmail} onChange={e => setForm({...form, customerEmail: e.target.value})} />
            </div>
            {form.items.map((item, idx) => (
              <div key={item.id} className="p-4 border rounded-lg space-y-2">
                 <Select value={item.type} onValueChange={(v: any) => updateItem(item.id, "type", v)}>
                   <SelectTrigger><SelectValue /></SelectTrigger>
                   <SelectContent>
                     <SelectItem value="tour">Tour</SelectItem>
                     <SelectItem value="transfer">Translado</SelectItem>
                     <SelectItem value="package">Pacote</SelectItem>
                   </SelectContent>
                 </Select>
                 <Input placeholder="Serviço" value={item.itemName} onChange={e => updateItem(item.id, "itemName", e.target.value)} />
                 <Input type="date" value={item.date} onChange={e => updateItem(item.id, "date", e.target.value)} />
              </div>
            ))}
            <Button onClick={addItem}>Adicionar Item</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminReservas;
