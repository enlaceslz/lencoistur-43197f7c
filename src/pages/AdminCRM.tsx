import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Search, Phone, Mail, Globe, MapPin, Eye, Filter, Download, ChevronDown } from "lucide-react";

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  country: string;
  language: string;
  totalBookings: number;
  totalSpent: number;
  lastBooking: string;
  segment: string;
  status: string;
}

const clients: Client[] = [
  { id: "C-001", name: "Maria Silva", email: "maria@email.com", phone: "+55 98 99999-1111", whatsapp: "+55 98 99999-1111", country: "Brasil", language: "Português", totalBookings: 5, totalSpent: 2800, lastBooking: "2026-03-20", segment: "VIP", status: "ativo" },
  { id: "C-002", name: "John Smith", email: "john@email.com", phone: "+1 555 123-4567", whatsapp: "+1 555 123-4567", country: "EUA", language: "English", totalBookings: 2, totalSpent: 1520, lastBooking: "2026-03-15", segment: "Frequente", status: "ativo" },
  { id: "C-003", name: "Sophie Martin", email: "sophie@email.com", phone: "+33 6 12 34 56 78", whatsapp: "+33 6 12 34 56 78", country: "França", language: "Français", totalBookings: 1, totalSpent: 220, lastBooking: "2026-02-20", segment: "Novo", status: "ativo" },
  { id: "C-004", name: "Pedro Santos", email: "pedro@email.com", phone: "+55 11 98888-2222", whatsapp: "+55 11 98888-2222", country: "Brasil", language: "Português", totalBookings: 8, totalSpent: 4200, lastBooking: "2026-03-22", segment: "VIP", status: "ativo" },
  { id: "C-005", name: "Ana Costa", email: "ana@email.com", phone: "+55 21 97777-3333", whatsapp: "+55 21 97777-3333", country: "Brasil", language: "Português", totalBookings: 3, totalSpent: 960, lastBooking: "2026-03-05", segment: "Frequente", status: "ativo" },
  { id: "C-006", name: "Carlos Mendes", email: "carlos@email.com", phone: "+55 98 96666-4444", whatsapp: "+55 98 96666-4444", country: "Brasil", language: "Português", totalBookings: 1, totalSpent: 380, lastBooking: "2026-02-15", segment: "Novo", status: "inativo" },
  { id: "C-007", name: "Emma Wilson", email: "emma@email.com", phone: "+44 7911 123456", whatsapp: "+44 7911 123456", country: "Reino Unido", language: "English", totalBookings: 4, totalSpent: 3100, lastBooking: "2026-03-18", segment: "VIP", status: "ativo" },
  { id: "C-008", name: "Hans Mueller", email: "hans@email.com", phone: "+49 151 12345678", whatsapp: "+49 151 12345678", country: "Alemanha", language: "Deutsch", totalBookings: 2, totalSpent: 700, lastBooking: "2026-01-10", segment: "Frequente", status: "inativo" },
];

const bookingHistory = [
  { clientId: "C-001", tour: "Lagoa Azul", date: "20/03/2026", guests: 2, total: 360, status: "realizada" },
  { clientId: "C-001", tour: "Atins & Caburé", date: "18/03/2026", guests: 2, total: 440, status: "realizada" },
  { clientId: "C-001", tour: "Santo Amaro", date: "15/03/2026", guests: 2, total: 760, status: "realizada" },
  { clientId: "C-001", tour: "Lagoa Bonita", date: "10/03/2026", guests: 3, total: 480, status: "realizada" },
  { clientId: "C-001", tour: "Lagoa Azul", date: "05/03/2026", guests: 4, total: 720, status: "realizada" },
];

const segmentColors: Record<string, string> = {
  VIP: "bg-secondary/10 text-secondary",
  Frequente: "bg-primary/10 text-primary",
  Novo: "bg-ocean-light text-ocean",
};

const AdminCRM = () => {
  const [search, setSearch] = useState("");
  const [segmentFilter, setSegmentFilter] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const filtered = clients.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()) || c.country.toLowerCase().includes(search.toLowerCase());
    const matchSegment = !segmentFilter || c.segment === segmentFilter;
    return matchSearch && matchSegment;
  });

  const segments = [...new Set(clients.map((c) => c.segment))];

  const clientStats = [
    { label: "Total de Clientes", value: clients.length.toString() },
    { label: "Clientes VIP", value: clients.filter((c) => c.segment === "VIP").length.toString() },
    { label: "Países", value: [...new Set(clients.map((c) => c.country))].length.toString() },
    { label: "Receita Total", value: `R$ ${clients.reduce((sum, c) => sum + c.totalSpent, 0).toLocaleString("pt-BR")}` },
  ];

  return (
    <AdminLayout title="CRM - Clientes">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {clientStats.map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-2xl p-5">
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
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
              <div className="relative">
                <select
                  value={segmentFilter}
                  onChange={(e) => setSegmentFilter(e.target.value)}
                  className="bg-muted border border-border rounded-xl px-4 py-2.5 text-sm text-foreground outline-none appearance-none pr-8"
                >
                  <option value="">Todos segmentos</option>
                  {segments.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-3.5 text-muted-foreground pointer-events-none" />
              </div>
              <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-semibold">
                <Download size={16} /> Exportar
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left py-3 font-medium">Cliente</th>
                    <th className="text-left py-3 font-medium">País</th>
                    <th className="text-left py-3 font-medium">Segmento</th>
                    <th className="text-right py-3 font-medium">Reservas</th>
                    <th className="text-right py-3 font-medium">Total Gasto</th>
                    <th className="text-right py-3 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.id} className={`border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-pointer ${selectedClient?.id === c.id ? "bg-muted/80" : ""}`} onClick={() => setSelectedClient(c)}>
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                            {c.name.split(" ").map((n) => n[0]).join("")}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{c.name}</p>
                            <p className="text-xs text-muted-foreground">{c.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Globe size={14} />{c.country}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${segmentColors[c.segment] || "bg-muted text-foreground"}`}>
                          {c.segment}
                        </span>
                      </td>
                      <td className="py-3 text-right text-foreground font-medium">{c.totalBookings}</td>
                      <td className="py-3 text-right font-semibold text-foreground">R$ {c.totalSpent.toLocaleString("pt-BR")}</td>
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
          </div>

          {/* Client Detail */}
          <div className="bg-card border border-border rounded-2xl p-6">
            {selectedClient ? (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xl font-bold mx-auto mb-3">
                    {selectedClient.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <h3 className="font-display text-lg font-bold text-foreground">{selectedClient.name}</h3>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-2 ${segmentColors[selectedClient.segment]}`}>
                    {selectedClient.segment}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail size={16} className="text-primary shrink-0" />
                    <span className="text-muted-foreground">{selectedClient.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Phone size={16} className="text-primary shrink-0" />
                    <span className="text-muted-foreground">{selectedClient.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Globe size={16} className="text-primary shrink-0" />
                    <span className="text-muted-foreground">{selectedClient.country} · {selectedClient.language}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin size={16} className="text-primary shrink-0" />
                    <span className="text-muted-foreground">Última reserva: {new Date(selectedClient.lastBooking).toLocaleDateString("pt-BR")}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-foreground">{selectedClient.totalBookings}</p>
                    <p className="text-xs text-muted-foreground">Reservas</p>
                  </div>
                  <div className="bg-muted rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-primary">R$ {selectedClient.totalSpent.toLocaleString("pt-BR")}</p>
                    <p className="text-xs text-muted-foreground">Total Gasto</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-display font-bold text-foreground mb-3">Histórico de Reservas</h4>
                  <div className="space-y-2">
                    {bookingHistory.filter((b) => b.clientId === selectedClient.id).map((b, i) => (
                      <div key={i} className="flex items-center justify-between bg-muted rounded-xl px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{b.tour}</p>
                          <p className="text-xs text-muted-foreground">{b.date} · {b.guests} pessoas</p>
                        </div>
                        <p className="text-sm font-bold text-primary">R$ {b.total}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-semibold">
                    WhatsApp
                  </button>
                  <button className="flex-1 border border-border text-foreground py-2.5 rounded-xl text-sm font-semibold hover:bg-muted transition-colors">
                    E-mail
                  </button>
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
