import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Search, Calendar, MapPin, Users, Eye, Filter, ChevronDown } from "lucide-react";

interface Booking {
  id: string;
  tour: string;
  date: string;
  guests: number;
  total: number;
  status: "confirmada" | "pendente" | "cancelada" | "concluida";
  paymentStatus: "pago" | "pendente";
  createdAt: string;
}

const mockBookings: Booking[] = [
  { id: "RES-2026-001", tour: "Lagoas Azuis", date: "2026-04-05", guests: 2, total: 300, status: "confirmada", paymentStatus: "pago", createdAt: "2026-03-25" },
  { id: "RES-2026-002", tour: "Passeio de Barco - Rio Preguiças", date: "2026-04-06", guests: 3, total: 660, status: "pendente", paymentStatus: "pendente", createdAt: "2026-03-26" },
  { id: "RES-2026-003", tour: "Descida de Caiaque", date: "2026-03-20", guests: 2, total: 500, status: "concluida", paymentStatus: "pago", createdAt: "2026-03-15" },
  { id: "RES-2026-004", tour: "Passeio de Quadriciclo", date: "2026-03-15", guests: 1, total: 280, status: "cancelada", paymentStatus: "pendente", createdAt: "2026-03-10" },
];

const statusConfig: Record<string, { label: string; className: string }> = {
  confirmada: { label: "Confirmada", className: "bg-primary/10 text-primary" },
  pendente: { label: "Pendente", className: "bg-secondary/10 text-secondary" },
  cancelada: { label: "Cancelada", className: "bg-destructive/10 text-destructive" },
  concluida: { label: "Concluída", className: "bg-muted text-muted-foreground" },
};

const MinhasReservas = () => {
  const [filter, setFilter] = useState("todas");

  const filtered = filter === "todas" ? mockBookings : mockBookings.filter((b) => b.status === filter);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-28 pb-20 container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">Minhas Reservas</h1>
          <p className="text-muted-foreground mb-8">Acompanhe o status das suas reservas e passeios.</p>

          {/* Filters */}
          <div className="flex gap-2 mb-6 overflow-x-auto">
            {["todas", "confirmada", "pendente", "concluida", "cancelada"].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${
                  filter === s ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {s === "todas" ? "Todas" : statusConfig[s]?.label || s}
              </button>
            ))}
          </div>

          {/* Bookings */}
          <div className="space-y-4">
            {filtered.map((b) => {
              const st = statusConfig[b.status];
              return (
                <div key={b.id} className="bg-card border border-border rounded-2xl p-5 hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-display text-lg font-bold text-foreground">{b.tour}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${st.className}`}>
                          {st.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} className="text-primary" />
                          {new Date(b.date + "T12:00").toLocaleDateString("pt-BR")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users size={14} className="text-primary" />
                          {b.guests} pessoa{b.guests > 1 ? "s" : ""}
                        </span>
                        <span className="font-mono text-xs">{b.id}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-xl font-bold text-primary">R$ {b.total}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {b.paymentStatus === "pago" ? "✓ Pago" : "Aguardando pagamento"}
                      </p>
                    </div>
                  </div>

                  {b.status === "pendente" && (
                    <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-3">
                      <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2 rounded-xl text-sm font-semibold transition-colors">
                        Pagar Agora
                      </button>
                      <button className="border border-border text-foreground px-5 py-2 rounded-xl text-sm font-semibold hover:bg-muted transition-colors">
                        Cancelar Reserva
                      </button>
                      <a
                        href={`https://wa.me/5598985880954?text=Olá! Preciso de ajuda com minha reserva ${b.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary text-sm font-semibold hover:underline flex items-center gap-1"
                      >
                        Falar no WhatsApp
                      </a>
                    </div>
                  )}

                  {b.status === "concluida" && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <button className="text-secondary text-sm font-semibold hover:underline">
                        ★ Deixar Avaliação
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <p className="text-lg mb-4">Nenhuma reserva encontrada</p>
                <Link to="/passeios" className="text-primary hover:underline font-semibold">
                  Explorar passeios →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default MinhasReservas;
