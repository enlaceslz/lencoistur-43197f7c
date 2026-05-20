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
import { maskPhone, maskCurrency, parseCurrencyToNumber } from "@/lib/masks";
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
    partnerNetPrice: "0",
    paid: false,
    companions: [] as { name: string; cpf?: string; birthDate?: string; relationship?: string }[],
  });

  const [companionForm, setCompanionForm] = useState({
    name: "",
    cpf: "",
    birthDate: "",
    relationship: "Acompanhante",
  });

  useEffect(() => {
    const fetchData = async () => {
      // Check for booking_id in URL for wide view new window
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
        supabase.from("customers").select("id, name, email, phone").order("name").limit(10)
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
      .select("id, name, email, phone")
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

  const handleSave = async () => {
    if (!form.customerName || !form.itemName || !form.date) {
      toast({ title: "Atenção", description: "Preencha os campos obrigatórios", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      // Validar Duplicidade (apenas para novas reservas)
      if (!isEditing) {
        const isDuplicate = bookings.some(b => 
          (b.customerId === form.customerId || b.customerName.toLowerCase() === form.customerName.toLowerCase()) && 
          b.date === form.date && 
          b.itemName.toLowerCase() === form.itemName.toLowerCase() &&
          b.status !== 'cancelada'
        );

        if (isDuplicate) {
          toast({ 
            title: "Reserva Duplicada", 
            description: "Atenção: Este cliente já possui uma reserva para este passeio nesta data.", 
            variant: "destructive" 
          });
          setSaving(false);
          return;
        }
      }

      const unitPriceNum = parseCurrencyToNumber(form.unitPrice);
      const discountNum = parseCurrencyToNumber(form.discount);
      const publicUnitPriceNum = parseCurrencyToNumber(form.publicUnitPrice);
      const partnerNetPriceNum = parseCurrencyToNumber(form.partnerNetPrice);
      
      const total = (unitPriceNum * form.guests);
      const publicTotal = (publicUnitPriceNum * form.guests);
      const partnerTotal = (partnerNetPriceNum * form.guests);
      const finalTotal = total - discountNum;

      const payload = {
        ...form,
        isPaid: form.paid,
        companions: form.companions,
        unitPrice: unitPriceNum,
        total,
        discount: discountNum,
        finalTotal,
        publicUnitPrice: publicUnitPriceNum,
        publicTotal,
        partnerNetPrice: partnerNetPriceNum,
        collaboratorId: form.collaboratorId === "none" ? undefined : form.collaboratorId || undefined,
        partnerId: form.partnerId === "none" ? undefined : form.partnerId || undefined,
      };

      if (isEditing && selected) {
        await updateBooking(selected.id, selected.customerId || "", payload);
        toast({ title: "Sucesso", description: "Reserva atualizada com sucesso!" });
      } else {
        await addBooking(payload);
        toast({ title: "Sucesso", description: "Reserva criada com sucesso!" });
      }

      setShowNewForm(false);
      setIsEditing(false);
      setForm({
        customerId: "",
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
        partnerNetPrice: "0",
        paid: false,
        companions: [],
      });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message || "Erro ao salvar reserva", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = () => {
    if (!selected) return;
    
    setForm({
      customerId: selected.customerId || "",
      customerName: selected.customerName,
      customerEmail: selected.customerEmail,
      customerPhone: selected.customerPhone,
      type: selected.type,
      itemName: selected.itemName,
      date: selected.date,
      guests: selected.guests,
      payMethod: selected.payMethod,
      unitPrice: selected.unitPrice.toString(),
      discount: selected.discount.toString(),
      publicUnitPrice: (selected.publicUnitPrice || 0).toString(),
      partnerNetPrice: (selected.partnerNetPrice || 0).toString(),
      notes: selected.notes || "",
      collaboratorId: selected.collaboratorId || "",
      partnerId: selected.partnerId || "",
      paid: selected.paymentStatus === 'pago',
      companions: [],
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

  const handleItemChange = (itemId: string) => {
    let item: any;
    if (form.type === "tour") {
      item = tours.find(t => t.id === itemId);
      if (item) {
        setForm(prev => ({
          ...prev,
          itemName: item.name,
          unitPrice: item.price.toString(),
          publicUnitPrice: item.private_price?.toString() || item.price.toString(),
          partnerNetPrice: item.partner_price ? item.partner_price.toString() : "0",
        }));
      }
    } else if (form.type === "package") {
      item = packages.find(p => p.id === itemId);
      if (item) {
        setForm(prev => ({
          ...prev,
          itemName: item.name,
          unitPrice: (item.discount_price || item.original_price).toString(),
          publicUnitPrice: (item.original_price).toString(),
          partnerNetPrice: item.partner_price ? item.partner_price.toString() : "0",
        }));
      }
    } else if (form.type === "transfer") {
      item = transfers.find(t => t.id === itemId);
      if (item) {
        setForm(prev => ({
          ...prev,
          itemName: `${item.origin} → ${item.destination}`,
          unitPrice: item.price.toString(),
          publicUnitPrice: item.price.toString(),
          partnerNetPrice: item.partner_price ? item.partner_price.toString() : "0",
        }));
      }
    }
  };


  if (loading) return (
    <AdminLayout title="Gestão de Reservas">
      <div className="flex items-center justify-center py-32"><Loader2 className="animate-spin text-primary" size={40} /></div>
    </AdminLayout>
  );

  if (isWideViewNewWindow) {
    const urlParams = new URLSearchParams(window.location.search);
    const wideViewId = urlParams.get('wide_view_id');
    const wideBooking = bookings.find(b => b.id === wideViewId);

    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white border-b border-slate-200 p-6 flex items-center justify-between rounded-t-lg">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center text-slate-700 border border-slate-200">
                <Calendar size={20} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 leading-none mb-1">
                  {wideBooking?.itemName || "Detalhes da Reserva"}
                </h1>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] font-bold uppercase bg-slate-50 text-slate-600 border-slate-200">
                    {wideBooking?.bookingCode || "Reserva"}
                  </Badge>
                  <p className="text-xs text-slate-500 font-medium">Relatório Técnico</p>
                </div>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-xl font-bold h-10"
              onClick={() => window.close()}
            >
              Fechar Janela
            </Button>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-b-3xl shadow-sm">
            {wideBooking ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1 space-y-6">
                  <section className="bg-white p-6 rounded-lg border border-slate-200">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                      <Users size={14} className="text-slate-500" /> Dependentes
                    </h3>
                    <DependentList customerId={wideBooking.customerId || ""} />
                  </section>
                  <section className="bg-white p-6 rounded-lg border border-slate-200">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                      <User size={14} className="text-primary" /> Identificação do Cliente
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-xl">
                          {wideBooking.customerName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-700">{wideBooking.customerName}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">{wideBooking.customerEmail}</p>
                        </div>
                      </div>
                      <div className="pt-4 border-t border-slate-200/60">
                        <Label className="text-[10px] uppercase font-bold text-slate-400">Telefone / WhatsApp</Label>
                        <p className="text-sm font-black text-slate-700">{wideBooking.customerPhone}</p>
                      </div>
                    </div>
                  </section>

                  <section className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                      <Shield size={14} className="text-indigo-600" /> Segurança & Termos
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-indigo-50/30 border border-indigo-100/50">
                        <div className="flex items-center gap-3">
                          <Shield size={18} className="text-indigo-600" />
                          <span className="text-[10px] font-black uppercase text-indigo-900">Termo de Risco</span>
                        </div>
                        <Badge className={cn("text-[8px] font-black uppercase", 
                          wideBooking.termStatus === 'assinado' ? "bg-emerald-100 text-emerald-700" : 
                          wideBooking.termStatus === 'balcao' ? "bg-blue-100 text-blue-700" : 
                          "bg-amber-100 text-amber-700"
                        )}>
                          {wideBooking.termStatus === 'assinado' ? "Assinado" : 
                           wideBooking.termStatus === 'balcao' ? "Assinado Balcão" : 
                           "Pendente"}
                        </Badge>
                      </div>
                      
                      {wideBooking.termStatus === 'pendente' && (
                        <div className="flex flex-col gap-2">
                          <Button 
                            variant="outline"
                            className="w-full rounded-xl h-10 text-[10px] font-black uppercase tracking-widest border-blue-200 text-blue-600 hover:bg-blue-50"
                            onClick={() => handleAction(() => markTermAsSignedAtCounter(wideBooking.id), "Termo marcado como assinado no balcão!")}
                          >
                            <UserCheck size={14} className="mr-2" /> Assinado no Balcão
                          </Button>
                        </div>
                      )}
                      
                      {wideBooking.termPdfUrl && (
                        <Button variant="outline" className="w-full rounded-xl h-10 text-[10px] font-black uppercase tracking-widest border-indigo-200 text-indigo-600 hover:bg-indigo-50" onClick={() => window.open(wideBooking.termPdfUrl, '_blank')}>
                          <Download size={14} className="mr-2" /> Ver Termo Assinado
                        </Button>
                      )}
                    </div>
                  </section>
                  <section className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                      <DollarSign size={14} className="text-emerald-500" /> Financeiro
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase">
                        <span>Preço Unitário</span>
                        <span className="text-slate-700">{formatCurrency(wideBooking.unitPrice)}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase">
                        <span>Total Pax ({wideBooking.guests})</span>
                        <span className="text-slate-700">{formatCurrency(wideBooking.total)}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-black text-rose-500 uppercase">
                        <span>Descontos</span>
                        <span>- {formatCurrency(wideBooking.discount)}</span>
                      </div>
                      {wideBooking.partnerNetPrice !== undefined && wideBooking.partnerNetPrice > 0 && (
                        <div className="flex justify-between items-center text-[10px] font-black text-emerald-600 uppercase bg-emerald-50/50 p-2 rounded-lg border border-emerald-100/50">
                          <span className="flex items-center gap-1"><Briefcase size={10} /> Custo NET</span>
                          <span>{formatCurrency(wideBooking.partnerNetPrice)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-end pt-4 border-t border-dashed border-slate-200">
                        <div>
                          <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Valor Final</p>
                          <p className="text-2xl font-black text-emerald-600 tracking-tighter">{formatCurrency(wideBooking.finalTotal)}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="text-[9px] font-black uppercase px-3 py-1 bg-white">{wideBooking.payMethod}</Badge>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>

                <div className="md:col-span-2 space-y-8">
                  <section className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="relative z-10">
                      <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2">Serviço Agendado</p>
                      <h2 className="text-2xl font-black text-slate-800 leading-tight mb-6">{wideBooking.itemName}</h2>
                      
                      <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-200/60">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Data da Atividade</p>
                          <p className="text-sm font-black flex items-center gap-2 text-slate-700 uppercase"><Calendar size={16} className="text-primary" /> {wideBooking.date}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Total de Passageiros</p>
                          <p className="text-sm font-black flex items-center gap-2 text-slate-700 uppercase"><Users size={16} className="text-primary" /> {wideBooking.guests} PAX</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  {wideBooking.notes && (
                    <section className="bg-amber-50/30 p-8 rounded-[2rem] border border-amber-100 shadow-sm">
                      <h3 className="text-xs font-black uppercase tracking-widest text-amber-600 mb-4 flex items-center gap-2">
                        <Tag size={14} /> Notas Operacionais
                      </h3>
                      <p className="text-sm font-medium text-amber-800 leading-relaxed italic">
                        "{wideBooking.notes}"
                      </p>
                    </section>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Loader2 size={40} className="animate-spin mb-4 opacity-20" />
                <p className="text-sm font-bold uppercase tracking-widest">Carregando reserva...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout title="Gestão de Reservas">
      <div className="flex flex-col gap-8 pb-10">
        {/* Superior Control Panel */}
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

          <div className="mt-8 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" size={20} />
              <input 
                type="text" 
                placeholder="Pesquisar por cliente, passeio, ID ou data..." 
                className="w-full bg-slate-50 border border-border rounded-lg pl-14 pr-6 h-14 text-sm font-medium focus:ring-0 focus:border-primary transition-none outline-none"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: "Total Reservas", value: bookings.length, icon: Calendar, color: "text-indigo-600", bg: "bg-indigo-500/10" },
            { label: "Confirmadas", value: bookings.filter(b => b.status === "confirmada").length, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-500/10" },
            { label: "Pendentes", value: bookings.filter(b => b.status === "pendente").length, icon: Clock, color: "text-amber-600", bg: "bg-amber-500/10" },
            { label: "Faturamento Pago", value: formatCurrency(totalPago), icon: DollarSign, color: "text-blue-600", bg: "bg-blue-500/10" },
          ].map((stat, i) => (
            <Card key={i} className="rounded-lg border-border shadow-sm bg-white overflow-hidden group">
              <CardContent className="p-7 relative">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all" />
                <div className="flex items-center gap-4 mb-4">
                  <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center border shadow-sm", stat.bg, stat.color, "border-border")}>
                    <stat.icon size={22} strokeWidth={2.5} />
                  </div>
                </div>
                <p className="text-3xl font-black text-foreground tracking-tighter">{stat.value}</p>
                <p className="text-[10px] font-black text-muted-foreground mt-1 uppercase tracking-[0.2em]">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 bg-white rounded-lg border border-border flex flex-col overflow-hidden shadow-sm">
            <div className="p-6 border-b border-border/40 flex gap-4 items-center bg-slate-50/30">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input 
                  placeholder="Buscar por código, cliente ou serviço..." 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)} 
                  className="w-full pl-11 pr-4 h-12 rounded-lg border border-border outline-none focus:ring-0 focus:border-primary text-sm font-semibold bg-white transition-none" 
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
                      onClick={() => {
                        setSelected(b);
                        setShowWideView(true);
                      }}
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
                        {b.partnerNetPrice !== undefined && b.partnerNetPrice > 0 && (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1 text-[8px] font-black text-slate-400 uppercase">
                              <Briefcase size={8} /> NET: {formatCurrency(b.partnerNetPrice * b.guests)}
                            </div>
                            <div className="flex items-center gap-1 text-[8px] font-black text-emerald-600 uppercase">
                              <DollarSign size={8} /> Lucro: {formatCurrency(b.finalTotal - (b.partnerNetPrice * b.guests))}
                            </div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="px-6 py-5 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <Badge 
                            className={cn("rounded-xl px-3 py-1 font-black text-[9px] uppercase border shadow-sm", statusConfig[b.status]?.className)} 
                            variant="outline"
                          >
                            {statusConfig[b.status]?.label || b.status}
                          </Badge>
                          {b.termStatus === 'assinado' ? (
                            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[8px] font-black uppercase py-0 px-2 h-4">Assinado</Badge>
                          ) : b.termStatus === 'balcao' ? (
                            <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-[8px] font-black uppercase py-0 px-2 h-4">Assinado Balcão</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[8px] font-black uppercase py-0 px-2 h-4">Termo Pendente</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="Ficha Operacional"
                            className="h-9 w-9 text-primary hover:bg-primary/10 rounded-xl"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelected(b);
                              setShowWideView(true);
                            }}
                          >
                            <Eye size={18} />
                          </Button>
                          {b.paymentStatus === 'pendente' && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              title="Confirmar Pagamento"
                              className="h-9 w-9 text-emerald-500 hover:text-white hover:bg-emerald-500 transition-all rounded-xl"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAction(() => confirmPayment(b.id), "Pagamento confirmado");
                              }}
                            >
                              <DollarSign size={16} />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="Voucher / Recibo"
                            className="h-9 w-9 text-indigo-500 hover:bg-indigo-50 rounded-xl"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`${window.location.origin}/voucher?id=${b.id}`, '_blank');
                            }}
                          >
                            <FileText size={18} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="Enviar Voucher (WhatsApp)"
                            className="h-9 w-9 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                            onClick={(e) => {
                              e.stopPropagation();
                              const url = `${window.location.origin}/voucher?id=${b.id}`;
                              const message = encodeURIComponent(`Olá ${b.customerName}, segue o voucher da sua reserva: ${url}`);
                              window.open(`https://wa.me/${b.customerPhone.replace(/\D/g, '')}?text=${message}`, '_blank');
                            }}
                          >
                            <Building2 size={16} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="Enviar Termo de Risco (WhatsApp)"
                            className={cn(
                              "h-9 w-9 rounded-lg",
                              (b.termStatus === 'assinado' || b.termStatus === 'balcao') ? "text-emerald-500 hover:bg-emerald-50" : "text-amber-500 hover:bg-amber-50 animate-pulse-subtle"
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              const link = `${window.location.origin}/assinatura-termo?booking_id=${b.id}`;
                              const message = encodeURIComponent(`Olá ${b.customerName}, por favor assine o termo de risco: ${link}`);
                              window.open(`https://wa.me/${b.customerPhone.replace(/\D/g, '')}?text=${message}`, '_blank');
                            }}
                          >
                            <Smartphone size={16} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="Editar"
                            className="h-9 w-9 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelected(b);
                              handleEdit();
                            }}
                          >
                            <Pencil size={16} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="EXCLUIR"
                            className="h-9 w-9 text-rose-400 hover:text-white hover:bg-rose-500 transition-all rounded-xl"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(b.id);
                            }}
                          >
                            <Trash2 size={16} />
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
      </div>

      <Dialog open={showNewForm} onOpenChange={(open) => {
        setShowNewForm(open);
        if (!open) setIsEditing(false);
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto rounded-lg p-0 border-none shadow-2xl">
          <div className="bg-slate-50 p-8 border-b border-border">
            <DialogHeader>
              <DialogTitle className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center text-white shadow-sm">
                  {isEditing ? <Pencil size={24} strokeWidth={3} /> : <Plus size={24} strokeWidth={3} />}
                </div>
                {isEditing ? "Editar Reserva Operacional" : "Nova Reserva Operacional"}
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
                  <div className="space-y-2 relative">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Buscar no CRM ou Nome Completo</Label>
                    <div className="relative">
                      <Input 
                        placeholder="Ex: João Silva..." 
                        value={form.customerName || customerSearch} 
                        onChange={e => {
                          const val = e.target.value;
                          setForm({...form, customerName: val, customerId: ""});
                          searchCustomers(val);
                        }}
                        className="rounded-xl h-12 font-semibold border-slate-200 focus:ring-primary/10 pl-10"
                      />
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    </div>

                    {customerSearch && customers.length > 0 && (
                      <div className="absolute z-[100] left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {customers.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => handleSelectCustomer(c)}
                            className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 flex items-center justify-between group"
                          >
                            <div>
                              <p className="text-xs font-black text-slate-900 group-hover:text-primary transition-colors">{c.name}</p>
                              <p className="text-[10px] text-slate-500 font-bold tracking-tight">{c.email || "Sem e-mail"} • {c.phone || "Sem telefone"}</p>
                            </div>
                            <UserCheck size={14} className="text-slate-300 group-hover:text-primary opacity-0 group-hover:opacity-100 transition-all" />
                          </button>
                        ))}
                      </div>
                    )}
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
                    <Select onValueChange={handleItemChange}>
                      <SelectTrigger className="rounded-xl h-12 font-semibold border-slate-200">
                        <SelectValue placeholder="Selecione um serviço cadastrado..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-200">
                        {form.type === "tour" && tours.map(t => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                        {form.type === "package" && packages.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                        {form.type === "transfer" && transfers.map(t => (
                          <SelectItem key={t.id} value={t.id}>{`${t.origin} → ${t.destination}`}</SelectItem>
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
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                    <DollarSign size={14} /> Financeiro
                  </h3>
                  <Badge variant="outline" className="text-[9px] font-bold bg-primary/5 text-primary border-primary/10">
                    Cálculo Automático Ativo
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Qtd. PAX</Label>
                    <Input 
                      type="number" 
                      min="1" 
                      value={form.guests} 
                      onChange={e => setForm({...form, guests: parseInt(e.target.value) || 1})}
                      className="rounded-lg h-12 font-semibold border-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Método de Pagto</Label>
                    <Select value={form.payMethod} onValueChange={(v: any) => setForm({...form, payMethod: v})}>
                      <SelectTrigger className="rounded-lg h-12 font-semibold border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg border-slate-200">
                        <SelectItem value="pix">PIX</SelectItem>
                        <SelectItem value="card">Cartão de Crédito</SelectItem>
                        <SelectItem value="info">Informar depois</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Valor Unit.</Label>
                    <Input 
                      value={form.unitPrice} 
                      onChange={e => setForm({...form, unitPrice: maskCurrency(e.target.value)})}
                      className="rounded-lg h-12 font-semibold border-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-1">
                      <Briefcase size={12} /> Valor NET Parceiro
                    </Label>
                    <Input 
                      value={form.partnerNetPrice} 
                      onChange={e => setForm({...form, partnerNetPrice: maskCurrency(e.target.value)})}
                      className="rounded-lg h-12 font-bold border-emerald-100 bg-emerald-50/30 text-emerald-700"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Desconto</Label>
                    <Input 
                      value={form.discount} 
                      onChange={e => setForm({...form, discount: maskCurrency(e.target.value)})}
                      className="rounded-lg h-12 font-semibold border-slate-200 text-rose-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Valor Público</Label>
                    <Input 
                      value={form.publicUnitPrice} 
                      onChange={e => setForm({...form, publicUnitPrice: maskCurrency(e.target.value)})}
                      className="rounded-lg h-12 font-semibold border-slate-200"
                    />
                  </div>
                </div>
                
                {/* Visualização de Cálculos em Tempo Real */}
                <div className="mt-6 p-4 bg-slate-50 border border-slate-100 rounded-lg space-y-3">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    <span>Resumo Financeiro</span>
                    <Badge variant="outline" className="bg-white text-[9px]">Cálculo Automático</Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-600 font-medium">Subtotal ({form.guests} PAX × {form.unitPrice})</span>
                      <span className="text-xs font-bold text-slate-900">
                        {formatCurrency(parseCurrencyToNumber(form.unitPrice) * form.guests)}
                      </span>
                    </div>
                    
                    {parseCurrencyToNumber(form.discount) > 0 && (
                      <div className="flex justify-between items-center text-rose-500">
                        <span className="text-xs font-medium">Desconto Aplicado</span>
                        <span className="text-xs font-bold">
                          - {formatCurrency(parseCurrencyToNumber(form.discount))}
                        </span>
                      </div>
                    )}

                    {parseCurrencyToNumber(form.publicUnitPrice) > parseCurrencyToNumber(form.unitPrice) && (
                      <div className="flex justify-between items-center text-emerald-600">
                        <span className="text-[10px] font-bold uppercase">Abaixo do Valor Público</span>
                        <span className="text-xs font-bold">
                          {formatCurrency((parseCurrencyToNumber(form.publicUnitPrice) - parseCurrencyToNumber(form.unitPrice)) * form.guests)} economia
                        </span>
                      </div>
                    )}
                    
                    <Separator className="bg-slate-200" />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-black text-slate-900 uppercase tracking-tight">Total Final</span>
                      <span className="text-lg font-black text-primary">
                        {formatCurrency((parseCurrencyToNumber(form.unitPrice) * form.guests) - parseCurrencyToNumber(form.discount))}
                      </span>
                    </div>

                    {parseCurrencyToNumber(form.partnerNetPrice) > 0 && (
                      <div className="pt-2 mt-2 border-t border-dashed border-slate-200 space-y-1">
                        <div className="flex justify-between items-center text-emerald-600">
                          <span className="text-[10px] font-black uppercase tracking-wider">Margem de Lucro (Bruto)</span>
                          <span className="text-xs font-extrabold">
                            {formatCurrency(((parseCurrencyToNumber(form.unitPrice) * form.guests) - parseCurrencyToNumber(form.discount)) - (parseCurrencyToNumber(form.partnerNetPrice) * form.guests))}
                          </span>
                        </div>
                        {((parseCurrencyToNumber(form.unitPrice) * form.guests) - parseCurrencyToNumber(form.discount)) > 0 && (
                          <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold uppercase">
                            <span>Markup Sugerido</span>
                            <span>
                              {Math.round(((((parseCurrencyToNumber(form.unitPrice) * form.guests) - parseCurrencyToNumber(form.discount)) - (parseCurrencyToNumber(form.partnerNetPrice) * form.guests)) / (parseCurrencyToNumber(form.partnerNetPrice) * form.guests)) * 100) || 0}%
                            </span>
                          </div>
                        )}
                        <p className="text-[9px] text-slate-400 font-medium italic mt-1">
                          * Cálculo baseado no Valor Unitário - Valor NET Parceiro × Qtd. PAX
                        </p>
                      </div>
                    )}
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
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                      <Users size={14} /> Dependentes / Acompanhantes
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                      <div className="space-y-1">
                        <Label className="text-[9px] font-black uppercase text-slate-400">Nome</Label>
                        <Input 
                          placeholder="Nome"
                          value={companionForm.name}
                          onChange={(e) => setCompanionForm({ ...companionForm, name: e.target.value })}
                          className="h-9 text-xs rounded-lg font-semibold"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] font-black uppercase text-slate-400">CPF</Label>
                        <Input 
                          placeholder="000.000.000-00"
                          value={companionForm.cpf}
                          onChange={(e) => setCompanionForm({ ...companionForm, cpf: e.target.value })}
                          className="h-9 text-xs rounded-lg font-semibold"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] font-black uppercase text-slate-400">Nascimento</Label>
                        <Input 
                          type="date"
                          value={companionForm.birthDate}
                          onChange={(e) => setCompanionForm({ ...companionForm, birthDate: e.target.value })}
                          className="h-9 text-xs rounded-lg font-semibold"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button 
                          type="button"
                          variant="outline"
                          className="w-full h-9 text-[10px] font-black uppercase gap-2 rounded-lg border-primary/20 text-primary hover:bg-primary/5"
                          onClick={addCompanion}
                        >
                          <Plus size={14} strokeWidth={3} /> Adicionar
                        </Button>
                      </div>
                    </div>

                    {form.companions.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {form.companions.map((comp, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl">
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center font-black text-[10px] text-primary">
                                {idx + 1}
                              </div>
                              <div className="leading-none">
                                <p className="text-[11px] font-black text-slate-700 uppercase tracking-tight">{comp.name}</p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">
                                  {comp.cpf ? comp.cpf : 'S/ CPF'} • {comp.birthDate ? comp.birthDate : 'S/ DATA'}
                                </p>
                              </div>
                            </div>
                            <Button 
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                              onClick={() => removeCompanion(idx)}
                            >
                              <Trash2 size={12} />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Observações Operacionais</Label>
                    <Textarea 
                      placeholder="Detalhes sobre restrições, preferências ou logísticas especiais..." 
                      value={form.notes} 
                      onChange={e => setForm({...form, notes: e.target.value})}
                      className="rounded-lg min-h-[100px] font-semibold border-slate-200 shadow-inner bg-slate-50"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 bg-slate-50 border-t border-border flex flex-col md:flex-row justify-between items-center gap-6 rounded-b-lg">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex flex-col gap-1">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Líquido Estimado</p>
                 <div className="flex items-baseline gap-2">
                   <span className="text-3xl font-black text-primary tracking-tighter">
                     {formatCurrency((parseCurrencyToNumber(form.unitPrice) * form.guests) - parseCurrencyToNumber(form.discount))}
                   </span>
                   {parseCurrencyToNumber(form.partnerNetPrice) > 0 && (
                     <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-black uppercase py-0.5 px-2">
                       Lucro: {formatCurrency(((parseCurrencyToNumber(form.unitPrice) * form.guests) - parseCurrencyToNumber(form.discount)) - (parseCurrencyToNumber(form.partnerNetPrice) * form.guests))}
                     </Badge>
                   )}
                 </div>
            </div>
              
              {!isEditing && (
                <div 
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer select-none",
                    form.paid 
                      ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-lg shadow-emerald-100" 
                      : "bg-white border-slate-100 text-slate-400 hover:border-emerald-200"
                  )}
                  onClick={() => setForm(prev => ({ ...prev, paid: !prev.paid }))}
                >
                  <div className={cn(
                    "w-6 h-6 rounded-lg flex items-center justify-center transition-colors",
                    form.paid ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-300"
                  )}>
                    <CheckCircle size={14} strokeWidth={3} />
                  </div>
                  <div className="leading-tight">
                    <p className="text-[10px] font-black uppercase tracking-tight">Confirmar Pagamento</p>
                    <p className="text-[9px] font-bold opacity-70">Liquidado no ato do cadastro</p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-4 w-full md:w-auto">
              <Button variant="ghost" onClick={() => setShowNewForm(false)} className="flex-1 md:flex-none rounded-xl h-14 px-8 font-bold text-slate-500 hover:bg-slate-200 transition-all">
                Descartar
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={saving}
                className="flex-1 md:flex-none rounded-2xl h-14 px-12 bg-primary font-black text-white shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50"
              >
                {saving ? <Loader2 className="animate-spin mr-2" /> : <Plus className="mr-2" strokeWidth={3} />}
                Efetivar Reserva no Sistema
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Reserva Full Details (Wide View) */}
      <Dialog open={showWideView} onOpenChange={setShowWideView}>
        <DialogContent className="sm:max-w-5xl w-[95vw] max-h-[95vh] overflow-y-auto p-0 border-none shadow-2xl rounded-3xl overflow-hidden bg-[#F8FAFC]">
          <div className="bg-white border-b border-slate-100 p-6 flex items-center justify-between sticky top-0 z-20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                <LayoutDashboard size={24} strokeWidth={2.5} />
              </div>
              <div>
                <DialogTitle className="text-xl font-black text-slate-900 leading-none mb-1">
                  {selected?.itemName || "Ficha Operacional"}
                </DialogTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] font-black uppercase bg-primary/5 text-primary border-primary/10">
                    Reserva #{selected?.bookingCode}
                  </Badge>
                  <p className="text-xs text-slate-500 font-medium">Ficha Técnica Detalhada</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-xl font-bold h-10 border-primary/20 text-primary hover:bg-primary/5"
                onClick={() => {
                  const url = `${window.location.origin}${window.location.pathname}?wide_view_id=${selected?.id}`;
                  window.open(url, '_blank');
                }}
              >
                Abrir em Nova Aba
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-xl font-bold h-10 border-slate-200"
                onClick={() => window.print()}
              >
                <Printer size={16} className="mr-2" /> Imprimir
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setShowWideView(false)} className="rounded-full hover:bg-slate-100 transition-colors">
                <XCircle size={24} className="text-slate-400" />
              </Button>
            </div>
          </div>

          <div className="p-8">
            {selected ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Coluna 1: Status e Operação */}
                <div className="lg:col-span-1 space-y-8">
                  <section className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden">
                    <div className={cn("absolute top-0 right-0 w-2 h-full", statusConfig[selected.status]?.className.split(' ')[1])} />
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                      <Activity size={14} className="text-primary" /> Status da Operação
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px] uppercase font-black text-slate-400">Situação</Label>
                        <Badge className={cn("rounded-xl px-4 py-1.5 font-black text-[10px] uppercase border", statusConfig[selected.status]?.className)}>
                          {statusConfig[selected.status]?.label}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px] uppercase font-black text-slate-400">Pagamento</Label>
                        <Badge variant="outline" className={cn("rounded-xl px-4 py-1.5 font-black text-[10px] uppercase border", selected.paymentStatus === 'pago' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100")}>
                          {selected.paymentStatus === 'pago' ? 'Liquidado' : 'Pendente'}
                        </Badge>
                      </div>
                      <div className="pt-4 border-t border-slate-50 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                            <Clock size={14} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase text-slate-400">Criada em</p>
                            <p className="text-xs font-bold text-slate-700">{new Date(selected.createdAt).toLocaleString('pt-BR')}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                      <Briefcase size={14} className="text-primary" /> Alocação de Recursos
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          <User size={20} />
                        </div>
                        <div className="min-w-0">
                          <Label className="text-[9px] uppercase font-black text-slate-400">Colaborador / Guia</Label>
                          <p className="text-sm font-black text-slate-700 truncate">{selected.collaboratorName || "Não alocado"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                          <Building2 size={20} />
                        </div>
                        <div className="min-w-0">
                          <Label className="text-[9px] uppercase font-black text-slate-400">Parceiro / Canal</Label>
                          <p className="text-sm font-black text-slate-700 truncate">
                            {selected.partnerId ? "Origem Parceiro" : "Venda Direta"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>

                {/* Coluna 2: Dados do Cliente e PAX */}
                <div className="lg:col-span-1 space-y-8">
                  <section className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                      <Users size={14} className="text-primary" /> Dados do Cliente (Titular)
                    </h3>
                    <div className="space-y-5">
                      <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50/50">
                        <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-lg shadow-lg">
                          {selected.customerName[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-slate-900 truncate leading-tight mb-1">{selected.customerName}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight truncate">{selected.customerEmail}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-3 px-1">
                        <div className="flex items-center gap-3 text-slate-500">
                          <Smartphone size={14} className="text-primary/60" />
                          <span className="text-xs font-bold">{selected.customerPhone}</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-500">
                          <FileText size={14} className="text-primary/60" />
                          <span className="text-xs font-bold font-mono">{selected.cpf || selected.passport || "Documento não informado"}</span>
                        </div>
                        {selected.birthDate && (
                          <div className="flex items-center gap-3 text-slate-500">
                            <Calendar size={14} className="text-primary/60" />
                            <span className="text-xs font-bold">Nascimento: {new Date(selected.birthDate + "T12:00:00").toLocaleDateString('pt-BR')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </section>

                  <section className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                      <Shield size={14} className="text-indigo-600" /> Segurança & Termos
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-indigo-50/30 border border-indigo-100/50">
                        <div className="flex items-center gap-3">
                          <Shield size={18} className="text-indigo-600" />
                          <span className="text-[10px] font-black uppercase text-indigo-900">Termo de Risco</span>
                        </div>
                        <Badge className={cn("text-[8px] font-black uppercase", 
                          selected.termStatus === 'assinado' ? "bg-emerald-100 text-emerald-700" : 
                          selected.termStatus === 'balcao' ? "bg-blue-100 text-blue-700" : 
                          "bg-amber-100 text-amber-700"
                        )}>
                          {selected.termStatus === 'assinado' ? "Assinado" : 
                           selected.termStatus === 'balcao' ? "Assinado Balcão" : 
                           "Pendente"}
                        </Badge>
                      </div>
                      {selected.termPdfUrl && (
                        <Button variant="outline" className="w-full rounded-xl h-10 text-[10px] font-black uppercase tracking-widest border-indigo-200 text-indigo-600 hover:bg-indigo-50" onClick={() => window.open(selected.termPdfUrl, '_blank')}>
                          <Download size={14} className="mr-2" /> Visualizar Documento Assinado
                        </Button>
                      )}
                      
                      {selected.termStatus === 'pendente' && (
                        <div className="flex flex-col gap-2">
                          <Button 
                            className="w-full rounded-xl h-10 text-[10px] font-black uppercase tracking-widest bg-emerald-500 hover:bg-emerald-600 text-white"
                            onClick={handleSendRiskTerm}
                          >
                            <Smartphone size={14} className="mr-2" /> Enviar Link (WhatsApp)
                          </Button>
                          <Button 
                            variant="outline"
                            className="w-full rounded-xl h-10 text-[10px] font-black uppercase tracking-widest border-primary/20 text-primary hover:bg-primary/5"
                            onClick={() => {
                              const baseUrl = window.location.origin;
                              const link = `${baseUrl}/assinatura-termo?booking_id=${selected.id}`;
                              window.open(link, '_blank');
                            }}
                          >
                            <Pencil size={14} className="mr-2" /> Assinar Agora
                          </Button>
                          <Button 
                            variant="outline"
                            className="w-full rounded-xl h-10 text-[10px] font-black uppercase tracking-widest border-blue-200 text-blue-600 hover:bg-blue-50"
                            onClick={() => handleAction(() => markTermAsSignedAtCounter(selected.id), "Termo marcado como assinado no balcão!")}
                          >
                            <UserCheck size={14} className="mr-2" /> Assinado no Balcão
                          </Button>
                        </div>
                      )}
                    </div>
                  </section>
                    <section className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                        <Users size={14} className="text-primary" /> Dependentes (CRM Externo)
                      </h3>
                      <DependentList customerId={selected.customerId || ""} />
                    </section>
                  </div>

                {/* Coluna 3: Itens e Financeiro */}
                <div className="lg:col-span-1 space-y-8">
                   <section className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                     <div className="absolute right-0 top-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                     <div className="relative z-10">
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4">Itinerário & Serviço</p>
                        <h4 className="text-2xl font-black tracking-tighter leading-tight mb-8">{selected.itemName}</h4>
                        <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/10">
                          <div className="space-y-1">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Data</p>
                            <p className="text-xs font-black uppercase tracking-tighter">{selected.date}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Ocupação</p>
                            <p className="text-xs font-black uppercase tracking-tighter">{selected.guests} Pessoas</p>
                          </div>
                        </div>
                     </div>
                   </section>

                   <section className="bg-white p-6 rounded-lg border border-slate-100 shadow-sm">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                      <DollarSign size={14} className="text-emerald-500" /> Demonstrativo Financeiro
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase">
                        <span>Preço Unitário</span>
                        <span className="text-slate-700">{formatCurrency(selected.unitPrice)}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase">
                        <span>Total Pax ({selected.guests})</span>
                        <span className="text-slate-700">{formatCurrency(selected.total)}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-black text-rose-500 uppercase">
                        <span>Descontos / Promos</span>
                        <span>- {formatCurrency(selected.discount)}</span>
                      </div>
                      <div className="flex justify-between items-end pt-4 border-t border-dashed border-slate-100">
                        <div>
                          <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Valor Final Liquidado</p>
                          <p className="text-3xl font-black text-emerald-600 tracking-tighter">{formatCurrency(selected.finalTotal)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Método</p>
                          <Badge variant="outline" className="text-[9px] font-black uppercase px-3 py-1 bg-slate-50">{selected.payMethod}</Badge>
                        </div>
                      </div>
                    </div>
                    </section>

                    {selected.partnerNetPrice !== undefined && selected.partnerNetPrice > 0 && (
                      <section className="bg-emerald-50/30 p-6 rounded-[2rem] border border-emerald-100/50">
                        <h3 className="text-xs font-black uppercase tracking-widest text-emerald-700 mb-4 flex items-center gap-2">
                          <Activity size={14} /> Análise de Rentabilidade
                        </h3>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase">
                            <span>Custo NET ({selected.guests} PAX)</span>
                            <span className="text-slate-700">{formatCurrency(selected.partnerNetPrice * selected.guests)}</span>
                          </div>
                          <Separator className="bg-emerald-100/50" />
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Lucro Bruto (Markup)</p>
                              <p className="text-2xl font-black text-emerald-700 tracking-tighter">
                                {formatCurrency(selected.finalTotal - (selected.partnerNetPrice * selected.guests))}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Margem</p>
                              <p className="text-lg font-black text-emerald-600">
                                {Math.round(((selected.finalTotal - (selected.partnerNetPrice * selected.guests)) / (selected.partnerNetPrice * selected.guests)) * 100) || 0}%
                              </p>
                            </div>
                          </div>
                        </div>
                      </section>
                    )}

                   {selected.notes && (
                     <section className="bg-amber-50/50 p-6 rounded-[2rem] border border-amber-100">
                       <h3 className="text-xs font-black uppercase tracking-widest text-amber-600 mb-2 flex items-center gap-2">
                         <Tag size={14} /> Notas Operacionais
                       </h3>
                       <p className="text-[11px] font-bold text-amber-800 leading-relaxed italic">
                         "{selected.notes}"
                       </p>
                     </section>
                   )}
                </div>
              </div>
            ) : (
              <div className="py-20 flex justify-center items-center">
                <Loader2 className="animate-spin text-primary" size={40} />
              </div>
            )}
          </div>

          <div className="bg-white border-t border-slate-100 p-6 flex flex-wrap justify-between items-center gap-4">
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                className="rounded-xl h-12 px-6 font-black uppercase text-[10px] tracking-widest text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                onClick={() => {
                  if (selected) handleDelete(selected.id);
                }}
              >
                <Trash2 size={16} className="mr-2" /> Excluir Reserva
              </Button>

              {selected?.status === 'pendente' && (
                <Button 
                  variant="outline"
                  className="rounded-xl h-12 px-6 font-black uppercase text-[10px] tracking-widest border-rose-200 text-rose-600 hover:bg-rose-50"
                  onClick={() => handleAction(() => cancelBooking(selected.id), "Reserva cancelada")}
                >
                  <XCircle size={16} className="mr-2" /> Cancelar Reserva
                </Button>
              )}
            </div>

            <div className="flex gap-3">
              {selected?.paymentStatus === 'pendente' && (
                <Button 
                  className="rounded-xl h-12 px-6 font-black uppercase text-[10px] tracking-widest bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-200"
                  onClick={() => handleAction(() => confirmPayment(selected.id), "Pagamento confirmado e reserva ativada")}
                >
                  <CheckCircle size={16} className="mr-2" /> Confirmar Pagamento
                </Button>
              )}

              {selected?.status === 'confirmada' && (
                <Button 
                  className="rounded-xl h-12 px-6 font-black uppercase text-[10px] tracking-widest bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
                  onClick={() => handleAction(() => completeBooking(selected.id), "Reserva marcada como concluída")}
                >
                  <CheckCircle size={16} className="mr-2" /> Concluir Operação
                </Button>
              )}

              <Button variant="secondary" onClick={() => setShowWideView(false)} className="rounded-xl h-12 px-8 font-black uppercase text-[10px] tracking-widest">
                Fechar Ficha Técnica
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminReservas;
