import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Search, Phone, Mail, Globe, Eye, Download, Loader2, Users, DollarSign, MapPin, Smartphone, RefreshCw, Calendar, Plus, Pencil, Trash2, X, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  cpf: string | null;
  birth_date: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  totalBookings: number;
  totalSpent: number;
  lastBooking: string | null;
}

interface BookingRow {
  id: string;
  booking_code: string;
  item_name: string;
  date: string | null;
  guests: number;
  final_total: number;
  status: string;
  payment_status: string;
  created_at: string;
  type: string;
}

interface CustomerForm {
  name: string;
  email: string;
  phone: string;
  cpf: string;
  birth_date: string;
  notes: string;
  status: string;
}

const emptyForm: CustomerForm = { 
  name: "", 
  email: "", 
  phone: "", 
  cpf: "", 
  birth_date: "", 
  notes: "", 
  status: "regular" 
};

const fmt = (v: number) => `R$ ${(v / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

const maskPhone = (v: string) => {
  v = v.replace(/\D/g, "");
  if (v.length <= 10) return v.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  return v.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
};

const maskCPF = (v: string) => {
  v = v.replace(/\D/g, "");
  return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

const payStatusConfig: Record<string, { label: string; className: string }> = {
  pago: { label: "Pago", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  pendente: { label: "Pendente", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
};

const statusConfig: Record<string, { label: string; className: string }> = {
  pendente: { label: "Pendente", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  confirmada: { label: "Confirmada", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  cancelada: { label: "Cancelada", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

const customerStatusConfig: Record<string, { label: string; className: string }> = {
  regular: { label: "Regular", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  vip: { label: "VIP", className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  bloqueado: { label: "Bloqueado", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

const validateForm = (form: CustomerForm): string | null => {
  const name = form.name.trim();
  if (!name || name.length < 2 || name.length > 120) return "Nome deve ter entre 2 e 120 caracteres.";
  const email = form.email.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255) return "E-mail inválido.";
  if (form.phone) {
    const digits = form.phone.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 11) return "Telefone deve ter 10 ou 11 dígitos.";
  }
  if (form.cpf) {
    const cpfDigits = form.cpf.replace(/\D/g, "");
    if (cpfDigits.length !== 11) return "CPF deve ter 11 dígitos.";
  }
  return null;
};

const AdminCRM = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerBookings, setCustomerBookings] = useState<BookingRow[]>([]);
  const [filter, setFilter] = useState<"all" | "with_bookings" | "no_bookings">("all");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState<CustomerForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    const { data: customersData, error } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar clientes.");
      setLoading(false);
      return;
    }

    if (customersData) {
      const { data: bookingsData } = await supabase
        .from("bookings")
        .select("customer_id, final_total, status, created_at");

      const bookingsByCustomer: Record<string, { count: number; total: number; lastDate: string | null }> = {};
      (bookingsData || []).forEach((b: any) => {
        if (!bookingsByCustomer[b.customer_id]) {
          bookingsByCustomer[b.customer_id] = { count: 0, total: 0, lastDate: null };
        }
        bookingsByCustomer[b.customer_id].count++;
        if (b.status !== "cancelada") {
          bookingsByCustomer[b.customer_id].total += b.final_total;
        }
        if (!bookingsByCustomer[b.customer_id].lastDate || b.created_at > bookingsByCustomer[b.customer_id].lastDate!) {
          bookingsByCustomer[b.customer_id].lastDate = b.created_at;
        }
      });

      setCustomers(customersData.map((c: any) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        cpf: c.cpf,
        birth_date: c.birth_date,
        notes: c.notes,
        status: c.status || "regular",
        created_at: c.created_at,
        totalBookings: bookingsByCustomer[c.id]?.count || 0,
        totalSpent: bookingsByCustomer[c.id]?.total || 0,
        lastBooking: bookingsByCustomer[c.id]?.lastDate || null,
      })));
    }
    setLoading(false);
  };

  const selectCustomer = async (c: Customer) => {
    setSelectedCustomer(c);
    const { data } = await supabase
      .from("bookings")
      .select("id, booking_code, item_name, date, guests, final_total, status, payment_status, created_at, type")
      .eq("customer_id", c.id)
      .order("created_at", { ascending: false });
    setCustomerBookings(data || []);
  };

  const openCreateModal = () => {
    setEditingCustomer(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setForm({ 
      name: c.name, 
      email: c.email, 
      phone: c.phone || "", 
      cpf: c.cpf || "",
      birth_date: c.birth_date || "",
      notes: c.notes || "",
      status: c.status || "regular"
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const validationError = validateForm(form);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.replace(/\D/g, "") || null,
      cpf: form.cpf.replace(/\D/g, "") || null,
      birth_date: form.birth_date || null,
      notes: form.notes || null,
      status: form.status
    };

    if (editingCustomer) {
      const { error } = await supabase
        .from("customers")
        .update(payload)
        .eq("id", editingCustomer.id);
      if (error) {
        toast.error(error.message.includes("customers_email_unique") ? "E-mail já cadastrado." : "Erro ao atualizar cliente.");
        setSaving(false);
        return;
      }
      toast.success("Cliente atualizado!");
      if (selectedCustomer?.id === editingCustomer.id) {
        setSelectedCustomer({ ...selectedCustomer, ...payload });
      }
    } else {
      const { error } = await supabase.from("customers").insert(payload);
      if (error) {
        toast.error(error.message.includes("customers_email_unique") ? "E-mail já cadastrado." : "Erro ao cadastrar cliente.");
        setSaving(false);
        return;
      }
      toast.success("Cliente cadastrado!");
    }

    setSaving(false);
    setModalOpen(false);
    fetchCustomers();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("customers").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir. Pode ter reservas vinculadas.");
      setDeleteConfirm(null);
      return;
    }
    toast.success("Cliente excluído!");
    setDeleteConfirm(null);
    if (selectedCustomer?.id === id) {
      setSelectedCustomer(null);
      setCustomerBookings([]);
    }
    fetchCustomers();
  };

  const exportCSV = () => {
    if (filtered.length === 0) {
      toast.error("Nenhum cliente para exportar.");
      return;
    }
    const header = "Nome,Email,Telefone,CPF,Reservas,Total Gasto,Cadastro\n";
    const rows = filtered.map(c =>
      `"${c.name}","${c.email}","${c.phone || ""}","${c.cpf || ""}",${c.totalBookings},"${fmt(c.totalSpent)}","${new Date(c.created_at).toLocaleDateString("pt-BR")}"`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clientes_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${filtered.length} clientes exportados!`);
  };

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    const matchesSearch = c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || (c.phone || "").includes(q) || (c.cpf || "").includes(q);
    if (filter === "with_bookings") return matchesSearch && c.totalBookings > 0;
    if (filter === "no_bookings") return matchesSearch && c.totalBookings === 0;
    return matchesSearch;
  });

  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
  const withBookings = customers.filter((c) => c.totalBookings > 0).length;

  const clientStats = [
    { label: "Total de Clientes", value: customers.length.toString(), icon: Users, color: "text-primary" },
    { label: "Com Reservas", value: withBookings.toString(), icon: MapPin, color: "text-green-600" },
    { label: "Receita Total", value: fmt(totalRevenue), icon: DollarSign, color: "text-blue-600" },
    { label: "Ticket Médio", value: withBookings > 0 ? fmt(Math.round(totalRevenue / withBookings)) : "R$ 0", icon: DollarSign, color: "text-amber-600" },
  ];

  if (loading) {
    return (
      <AdminLayout title="CRM - Clientes">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="CRM - Clientes">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {clientStats.map((s) => (
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

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Client List */}
          <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="flex items-center gap-2 flex-1 bg-muted rounded-xl px-4 py-2.5">
                <Search size={16} className="text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar por nome, email, telefone ou CPF..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-transparent w-full outline-none text-foreground text-sm placeholder:text-muted-foreground"
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="rounded-xl" onClick={openCreateModal}>
                  <Plus size={14} /> Novo Cliente
                </Button>
                <Button variant="outline" size="sm" className="rounded-xl" onClick={() => fetchCustomers()}>
                  <RefreshCw size={14} />
                </Button>
                <Button variant="outline" size="sm" className="rounded-xl" onClick={exportCSV}>
                  <Download size={14} /> CSV
                </Button>
              </div>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 mb-4">
              {([
                { key: "all" as const, label: "Todos", count: customers.length },
                { key: "with_bookings" as const, label: "Com Reservas", count: withBookings },
                { key: "no_bookings" as const, label: "Sem Reservas", count: customers.length - withBookings },
              ]).map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    filter === f.key
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f.label} ({f.count})
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="mx-auto mb-3 opacity-40" size={40} />
                <p className="font-medium">Nenhum cliente encontrado</p>
                <p className="text-sm mt-1">Clique em "Novo Cliente" para cadastrar.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="text-left py-3 font-medium">Cliente</th>
                      <th className="text-left py-3 font-medium hidden sm:table-cell">Telefone</th>
                      <th className="text-right py-3 font-medium">Reservas</th>
                      <th className="text-right py-3 font-medium hidden sm:table-cell">Total Gasto</th>
                      <th className="text-right py-3 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((c) => (
                      <tr
                        key={c.id}
                        className={`border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-pointer ${selectedCustomer?.id === c.id ? "bg-muted/80" : ""}`}
                        onClick={() => selectCustomer(c)}
                      >
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
                              {c.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground truncate">{c.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-muted-foreground hidden sm:table-cell">{c.phone || "—"}</td>
                        <td className="py-3 text-right text-foreground font-medium">{c.totalBookings}</td>
                        <td className="py-3 text-right font-semibold text-foreground hidden sm:table-cell">{fmt(c.totalSpent)}</td>
                        <td className="py-3 text-right">
                          <div className="flex gap-1 justify-end">
                            {c.phone && (
                              <a
                                href={`https://wa.me/55${c.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá ${c.name.split(" ")[0]}! Tudo bem?`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-green-100 dark:hover:bg-green-900/30">
                                  <Smartphone size={14} className="text-green-600" />
                                </Button>
                              </a>
                            )}
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); openEditModal(c); }}>
                              <Pencil size={14} className="text-muted-foreground" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); setDeleteConfirm(c.id); }}>
                              <Trash2 size={14} className="text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-xs text-muted-foreground mt-3 text-right">{filtered.length} cliente(s)</p>
              </div>
            )}
          </div>

          {/* Client Detail */}
          <div className="bg-card border border-border rounded-2xl p-6">
            {selectedCustomer ? (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xl font-bold mx-auto mb-3">
                    {selectedCustomer.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <h3 className="font-display text-lg font-bold text-foreground">{selectedCustomer.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Cliente desde {new Date(selectedCustomer.created_at).toLocaleDateString("pt-BR")}
                  </p>
                  <div className="flex gap-2 justify-center mt-3">
                    <Button variant="outline" size="sm" className="rounded-xl" onClick={() => openEditModal(selectedCustomer)}>
                      <Pencil size={12} /> Editar
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail size={16} className="text-primary shrink-0" />
                    <span className="text-muted-foreground truncate">{selectedCustomer.email}</span>
                  </div>
                  {selectedCustomer.phone && (
                    <div className="flex items-center gap-3 text-sm">
                      <Phone size={16} className="text-primary shrink-0" />
                      <span className="text-muted-foreground">{selectedCustomer.phone}</span>
                    </div>
                  )}
                  {selectedCustomer.cpf && (
                    <div className="flex items-center gap-3 text-sm">
                      <Globe size={16} className="text-primary shrink-0" />
                      <span className="text-muted-foreground">CPF: {selectedCustomer.cpf}</span>
                    </div>
                  )}
                  {selectedCustomer.lastBooking && (
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar size={16} className="text-primary shrink-0" />
                      <span className="text-muted-foreground">Última reserva: {new Date(selectedCustomer.lastBooking).toLocaleDateString("pt-BR")}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-foreground">{selectedCustomer.totalBookings}</p>
                    <p className="text-xs text-muted-foreground">Reservas</p>
                  </div>
                  <div className="bg-muted rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-primary">{fmt(selectedCustomer.totalSpent)}</p>
                    <p className="text-xs text-muted-foreground">Total Gasto</p>
                  </div>
                </div>

                {selectedCustomer.phone && (
                  <a
                    href={`https://wa.me/55${selectedCustomer.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá ${selectedCustomer.name.split(" ")[0]}! Tudo bem?`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button className="w-full rounded-xl bg-green-600 hover:bg-green-700 text-white">
                      <Smartphone size={16} /> WhatsApp
                    </Button>
                  </a>
                )}

                <div>
                  <h4 className="font-display font-bold text-foreground mb-3">Histórico de Reservas</h4>
                  {customerBookings.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma reserva encontrada.</p>
                  ) : (
                    <div className="space-y-2">
                      {customerBookings.map((b) => (
                        <div key={b.id} className="bg-muted rounded-xl px-4 py-3">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="text-[10px] font-mono text-muted-foreground">{b.booking_code}</span>
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0">{b.type === "passeio" ? "Passeio" : "Translado"}</Badge>
                            </div>
                            <p className="text-sm font-bold text-primary ml-2">{fmt(b.final_total)}</p>
                          </div>
                          <p className="text-sm font-semibold text-foreground truncate">{b.item_name}</p>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-xs text-muted-foreground">
                              {b.date || new Date(b.created_at).toLocaleDateString("pt-BR")} · {b.guests} pessoa(s)
                            </p>
                            <div className="flex gap-1">
                              <Badge variant="outline" className={`text-[10px] ${statusConfig[b.status]?.className || ""}`}>
                                {statusConfig[b.status]?.label || b.status}
                              </Badge>
                              <Badge variant="outline" className={`text-[10px] ${payStatusConfig[b.payment_status]?.className || ""}`}>
                                {payStatusConfig[b.payment_status]?.label || b.payment_status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground text-sm">
                <Users className="mb-3 opacity-30" size={40} />
                Selecione um cliente para ver detalhes
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCustomer ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="customer-name">Nome *</Label>
              <Input
                id="customer-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nome completo"
                maxLength={120}
                required
              />
            </div>
            <div>
              <Label htmlFor="customer-email">E-mail *</Label>
              <Input
                id="customer-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="email@exemplo.com"
                maxLength={255}
                required
              />
            </div>
            <div>
              <Label htmlFor="customer-phone">Telefone</Label>
              <Input
                id="customer-phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="(99) 99999-9999"
                maxLength={15}
              />
            </div>
            <div>
              <Label htmlFor="customer-cpf">CPF</Label>
              <Input
                id="customer-cpf"
                value={form.cpf}
                onChange={(e) => setForm({ ...form, cpf: e.target.value })}
                placeholder="000.000.000-00"
                maxLength={14}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 size={14} className="animate-spin mr-1" /> : <Save size={14} className="mr-1" />}
              {editingCustomer ? "Salvar" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir Cliente</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita. Clientes com reservas vinculadas não podem ser excluídos.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>
              <Trash2 size={14} className="mr-1" /> Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminCRM;
