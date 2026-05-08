import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Calendar, Users, Copy, QrCode, Clock, CheckCircle, XCircle, AlertCircle, Printer, LogIn, Shield, FileText } from "lucide-react";
import { useBookings } from "@/hooks/useBookings";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { PrintReceiptButton } from "@/components/BookingReceipt";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";

const statusConfig: Record<string, { label: string; className: string; icon: typeof CheckCircle }> = {
  confirmada: { label: "Confirmada", className: "bg-primary/10 text-primary", icon: CheckCircle },
  pendente: { label: "Aguardando Pagamento", className: "bg-secondary/10 text-secondary", icon: Clock },
  cancelada: { label: "Cancelada", className: "bg-destructive/10 text-destructive", icon: XCircle },
  concluida: { label: "Concluída", className: "bg-muted text-muted-foreground", icon: CheckCircle },
};

const formatPhone = (v: string) => {
  const n = v.replace(/\D/g, "");
  if (n.length <= 10) return n.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  return n.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
};

const MinhasReservas = () => {
  const { user, loading: authLoading } = useAuth();
  const { bookings, loading: bookingsLoading, confirmPayment, cancelBooking } = useBookings();
  const [filter, setFilter] = useState("todas");
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const navigate = useNavigate();

  const filtered = filter === "todas" ? bookings : bookings.filter((b) => b.status === filter);

  const copyPix = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Código PIX copiado!", description: "Cole no app do seu banco." });
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Tem certeza que deseja cancelar esta reserva?")) return;
    
    setIsProcessing(id);
    try {
      await cancelBooking(id);
      toast({ 
        title: "Reserva cancelada", 
        description: "Sua reserva foi cancelada com sucesso." 
      });
    } catch (error) {
      console.error("Erro ao cancelar reserva:", error);
      toast({ 
        title: "Erro ao cancelar", 
        description: "Não foi possível cancelar sua reserva. Entre em contato pelo WhatsApp.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleSimulatePayment = async (id: string) => {
    setIsProcessing(id);
    try {
      await confirmPayment(id);
      toast({ 
        title: "Pagamento confirmado", 
        description: "Pagamento simulado com sucesso!" 
      });
    } catch (error) {
      toast({ 
        title: "Erro ao processar", 
        description: "Ocorreu um erro ao simular o pagamento.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(null);
    }
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
                        <span className="font-mono text-xs">{b.bookingCode}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-xl font-bold text-primary">
                        {(b.finalTotal / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </p>
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
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => copyPix(b.pixCode!)}
                                className="bg-card border border-border text-foreground px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-1 hover:bg-muted transition-colors"
                              >
                                <Copy size={14} /> Copiar PIX
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Copiar código PIX Copia e Cola</p>
                            </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => handleSimulatePayment(b.id)}
                                disabled={isProcessing === b.id}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                              >
                                {isProcessing === b.id ? "Processando..." : "Simular Pagamento"}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Simular confirmação de pagamento (Apenas Teste)</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                      <div className="mt-3 flex gap-3">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => handleCancel(b.id)}
                              disabled={isProcessing === b.id}
                              className="text-destructive text-sm font-semibold hover:underline disabled:opacity-50"
                            >
                              Cancelar Reserva
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Solicitar cancelamento desta reserva</p>
                          </TooltipContent>
                        </Tooltip>
                        <a
                          href={`https://wa.me/5598985880954?text=${encodeURIComponent(`Olá! Preciso de ajuda com minha reserva ${b.bookingCode}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary text-sm font-semibold hover:underline"
                        >
                          Falar no WhatsApp
                        </a>
                        {b.payMethod !== "info" && (
                          <PrintReceiptButton 
                            data={{
                              ...b,
                              customerName: b.customerName || "",
                              customerEmail: b.customerEmail || "",
                              type: b.type || "tour",
                            }} 
                            variant="ghost"
                            size="sm"
                            className="text-primary h-auto p-0 font-semibold hover:underline hover:bg-transparent"
                            label="Ver Detalhes"
                          />
                        )}
                        {b.termStatus === "assinado" ? (
                          <a
                            href={supabase.storage.from("customer-documents").getPublicUrl(b.termPdfUrl!).data.publicUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-green-500/10 text-green-600 px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-green-500/20 transition-colors flex items-center gap-1"
                          >
                            <Shield size={14} /> Termo Assinado
                          </a>
                        ) : (
                          <Link
                            to={`/assinatura-termo?booking=${encodeURIComponent(b.bookingCode)}`}
                            className="bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-primary/20 transition-colors flex items-center gap-1"
                          >
                            <Shield size={14} /> Assinar Termo de Risco
                          </Link>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Confirmed - show actions */}
                  {b.status === "confirmada" && (
                    <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-3">
                      <a
                        href={`https://wa.me/5598985880954?text=${encodeURIComponent(`Olá! Tenho a reserva ${b.bookingCode} confirmada para ${b.itemName}.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary text-sm font-semibold hover:underline flex items-center gap-1"
                      >
                        📱 Falar no WhatsApp
                      </a>
                      {b.payMethod !== "info" && (
                        <PrintReceiptButton 
                          data={{
                            ...b,
                            customerName: b.customerName || "",
                            customerEmail: b.customerEmail || "",
                            type: b.type || "tour",
                          }} 
                          variant="ghost"
                          size="sm"
                          className="text-primary h-auto p-0 font-semibold hover:underline hover:bg-transparent"
                          label="Imprimir Comprovante"
                        />
                      )}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => handleCancel(b.id)}
                            disabled={isProcessing === b.id}
                            className="text-destructive text-sm font-semibold hover:underline disabled:opacity-50"
                          >
                            {isProcessing === b.id ? "Processando..." : "Cancelar"}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Cancelar reserva confirmada</p>
                        </TooltipContent>
                      </Tooltip>
                      {b.termStatus === "assinado" ? (
                        <a
                          href={supabase.storage.from("customer-documents").getPublicUrl(b.termPdfUrl!).data.publicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-green-500/10 text-green-600 px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-green-500/20 transition-colors flex items-center gap-1"
                        >
                          <Shield size={14} /> Termo Assinado
                        </a>
                      ) : (
                        <Link
                          to={`/assinatura-termo?booking=${b.bookingCode}`}
                          className="bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-primary/20 transition-colors flex items-center gap-1"
                        >
                          <Shield size={14} /> Assinar Termo de Risco
                        </Link>
                      )}
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

            {(authLoading || bookingsLoading) ? (
              <div className="text-center py-20">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Carregando suas reservas...</p>
              </div>
            ) : !user ? (
              <div className="text-center py-16 bg-card border border-border rounded-2xl">
                <LogIn size={48} className="mx-auto text-primary/40 mb-4" />
                <h2 className="text-xl font-bold text-foreground mb-2">Acesse sua conta</h2>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  Faça login para visualizar e gerenciar suas reservas.
                </p>
                <button 
                  onClick={() => navigate("/admin/login")}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl font-semibold transition-colors inline-block"
                >
                  Entrar na Conta
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16">
                <AlertCircle size={48} className="mx-auto text-muted-foreground/40 mb-4" />
                <p className="text-lg text-muted-foreground mb-4">
                  {bookings.length === 0 ? "Você ainda não tem reservas" : "Nenhuma reserva neste filtro"}
                </p>
                <Link to="/passeios" className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl font-semibold transition-colors inline-block">
                  Explorar Passeios
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default MinhasReservas;
