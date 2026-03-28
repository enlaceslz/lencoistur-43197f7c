import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Calendar, Users, Copy, QrCode, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useBookings } from "@/hooks/useBookings";
import { toast } from "@/hooks/use-toast";

const statusConfig: Record<string, { label: string; className: string; icon: typeof CheckCircle }> = {
  confirmada: { label: "Confirmada", className: "bg-primary/10 text-primary", icon: CheckCircle },
  pendente: { label: "Aguardando Pagamento", className: "bg-secondary/10 text-secondary", icon: Clock },
  cancelada: { label: "Cancelada", className: "bg-destructive/10 text-destructive", icon: XCircle },
  concluida: { label: "Concluída", className: "bg-muted text-muted-foreground", icon: CheckCircle },
};

const MinhasReservas = () => {
  const { bookings, confirmPayment, cancelBooking } = useBookings();
  const [filter, setFilter] = useState("todas");

  const filtered = filter === "todas" ? bookings : bookings.filter((b) => b.status === filter);

  const copyPix = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Código PIX copiado!", description: "Cole no app do seu banco." });
  };

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
                {s === "todas" ? `Todas (${bookings.length})` : statusConfig[s]?.label || s}
              </button>
            ))}
          </div>

          {/* Bookings */}
          <div className="space-y-4">
            {filtered.map((b) => {
              const st = statusConfig[b.status];
              const StatusIcon = st.icon;
              return (
                <div key={b.id} className="bg-card border border-border rounded-2xl p-5 hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-display text-lg font-bold text-foreground">{b.itemName}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${st.className}`}>
                          <StatusIcon size={12} />
                          {st.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} className="text-primary" />
                          {b.date ? new Date(b.date + "T12:00").toLocaleDateString("pt-BR") : "A definir"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users size={14} className="text-primary" />
                          {b.guests} pessoa{b.guests > 1 ? "s" : ""}
                        </span>
                        <span className="font-mono text-xs">{b.id}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-xl font-bold text-primary">R$ {b.finalTotal}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {b.paymentStatus === "pago" ? (
                          <span className="text-green-600 font-medium">✓ Pago</span>
                        ) : (
                          <span className="text-secondary font-medium">Aguardando pagamento</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* PIX pending payment */}
                  {b.status === "pendente" && b.pixCode && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="bg-muted rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="flex items-center gap-2">
                          <QrCode size={20} className="text-primary shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-foreground">Pagamento PIX pendente</p>
                            <p className="text-xs text-muted-foreground">Pague para confirmar sua reserva</p>
                          </div>
                        </div>
                        <div className="flex gap-2 sm:ml-auto">
                          <button
                            onClick={() => copyPix(b.pixCode!)}
                            className="bg-card border border-border text-foreground px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-1 hover:bg-muted transition-colors"
                          >
                            <Copy size={14} /> Copiar PIX
                          </button>
                          <button
                            onClick={() => confirmPayment(b.id)}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                          >
                            Simular Pagamento
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 flex gap-3">
                        <button
                          onClick={() => cancelBooking(b.id)}
                          className="text-destructive text-sm font-semibold hover:underline"
                        >
                          Cancelar Reserva
                        </button>
                        <a
                          href={`https://wa.me/5598985880954?text=${encodeURIComponent(`Olá! Preciso de ajuda com minha reserva ${b.id}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary text-sm font-semibold hover:underline"
                        >
                          Falar no WhatsApp
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Confirmed - show actions */}
                  {b.status === "confirmada" && (
                    <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-3">
                      <a
                        href={`https://wa.me/5598985880954?text=${encodeURIComponent(`Olá! Tenho a reserva ${b.id} confirmada para ${b.itemName}.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary text-sm font-semibold hover:underline flex items-center gap-1"
                      >
                        📱 Falar no WhatsApp
                      </a>
                      <button
                        onClick={() => cancelBooking(b.id)}
                        className="text-destructive text-sm font-semibold hover:underline"
                      >
                        Cancelar
                      </button>
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
              <div className="text-center py-16">
                <AlertCircle size={48} className="mx-auto text-muted-foreground/40 mb-4" />
                <p className="text-lg text-muted-foreground mb-4">
                  {bookings.length === 0 ? "Você ainda não tem reservas" : "Nenhuma reserva neste filtro"}
                </p>
                <Link to="/passeios" className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl font-semibold transition-colors inline-block">
                  Explorar Passeios
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
