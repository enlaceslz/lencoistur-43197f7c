import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Search, Phone, Mail, Globe, Eye, Download, ChevronDown, Loader2, Users, DollarSign, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  cpf: string | null;
  created_at: string;
  totalBookings: number;
  totalSpent: number;
  lastBooking: string | null;
}

interface BookingRow {
  id: string;
  item_name: string;
  date: string | null;
  guests: number;
  final_total: number;
  status: string;
  created_at: string;
}

const fmt = (v: number) => `R$ ${(v / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

const AdminCRM = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerBookings, setCustomerBookings] = useState<BookingRow[]>([]);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    const { data: customersData } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });

    if (customersData) {
      // Fetch booking stats for each customer
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
      .select("id, item_name, date, guests, final_total, status, created_at")
      .eq("customer_id", c.id)
      .order("created_at", { ascending: false });
    setCustomerBookings(data || []);
  };

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || (c.phone || "").includes(q);
  });

  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);

  const clientStats = [
    { label: "Total de Clientes", value: customers.length.toString(), icon: Users, color: "text-primary" },
    { label: "Com Reservas", value: customers.filter((c) => c.totalBookings > 0).length.toString(), icon: MapPin, color: "text-green-600" },
    { label: "Receita Total", value: fmt(totalRevenue), icon: DollarSign, color: "text-blue-600" },
    { label: "Ticket Médio", value: customers.length > 0 ? fmt(Math.round(totalRevenue / Math.max(customers.filter(c => c.totalBookings > 0).length, 1))) : "R$ 0", icon: DollarSign, color: "text-amber-600" },
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
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="flex items-center gap-2 flex-1 bg-muted rounded-xl px-4 py-2.5">
                <Search size={16} className="text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar cliente..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-transparent w-full outline-none text-foreground text-sm placeholder:text-muted-foreground"
                />
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="mx-auto mb-3 opacity-40" size={40} />
                <p className="font-medium">Nenhum cliente encontrado</p>
                <p className="text-sm mt-1">Clientes cadastrados pelo checkout aparecerão aqui.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="text-left py-3 font-medium">Cliente</th>
                      <th className="text-left py-3 font-medium">Telefone</th>
                      <th className="text-right py-3 font-medium">Reservas</th>
                      <th className="text-right py-3 font-medium">Total Gasto</th>
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
                            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                              {c.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">{c.name}</p>
                              <p className="text-xs text-muted-foreground">{c.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-muted-foreground">{c.phone || "—"}</td>
                        <td className="py-3 text-right text-foreground font-medium">{c.totalBookings}</td>
                        <td className="py-3 text-right font-semibold text-foreground">{fmt(c.totalSpent)}</td>
                        <td className="py-3 text-right">
                          <button className="text-primary hover:text-primary/80 transition-colors">
                            <Eye size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Client Detail */}
          <div className="bg-card border border-border rounded-2xl p-6">
            {selectedCustomer ? (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xl font-bold mx-auto mb-3">
                    {selectedCustomer.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <h3 className="font-display text-lg font-bold text-foreground">{selectedCustomer.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Cliente desde {new Date(selectedCustomer.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail size={16} className="text-primary shrink-0" />
                    <span className="text-muted-foreground">{selectedCustomer.email}</span>
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

                <div>
                  <h4 className="font-display font-bold text-foreground mb-3">Histórico de Reservas</h4>
                  {customerBookings.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma reserva encontrada.</p>
                  ) : (
                    <div className="space-y-2">
                      {customerBookings.map((b) => (
                        <div key={b.id} className="flex items-center justify-between bg-muted rounded-xl px-4 py-3">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{b.item_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {b.date || new Date(b.created_at).toLocaleDateString("pt-BR")} · {b.guests} pessoa(s)
                            </p>
                          </div>
                          <p className="text-sm font-bold text-primary">{fmt(b.final_total)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
                Selecione um cliente para ver detalhes
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminCRM;
