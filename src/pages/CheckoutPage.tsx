import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Shield, CreditCard, QrCode, Banknote, Users, CalendarDays, MapPin, CheckCircle, Copy, Clock, Printer } from "lucide-react";
import { printReceipt } from "@/components/BookingReceipt";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState, useEffect } from "react";
import { useBookings, type BookingItem } from "@/hooks/useBookings";
import { toast } from "@/hooks/use-toast";

const CheckoutPage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { addBooking } = useBookings();

  const type = (params.get("type") || "tour") as "tour" | "transfer";
  const slug = params.get("tour") || "";
  const transferId = params.get("transfer") || "";
  const guests = Number(params.get("pax")) || 2;
  const date = params.get("date") || "";
  const tourMode = (params.get("mode") || "coletivo") as "coletivo" | "privativo";

  const [tour, setTour] = useState<any>(null);
  const [transfer, setTransfer] = useState<any>(null);
  const [loadingItem, setLoadingItem] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (type === "tour" && slug) {
        const { data } = await supabase.from("tours").select("*").eq("slug", slug).single();
        setTour(data);
      } else if (type === "transfer" && transferId) {
        const { data } = await supabase.from("transfer_routes").select("*").eq("id", transferId).single();
        setTransfer(data);
      }
      setLoadingItem(false);
    };
    load();
  }, [type, slug, transferId]);

  const isPrivate = tourMode === "privativo";
  const itemName = tour ? `${tour.name}${isPrivate ? " (Privativo)" : " (Coletivo)"}` : (transfer ? `${transfer.origin} → ${transfer.destination}` : "");
  const unitPrice = tour ? (isPrivate ? (tour.private_price || 1300) : tour.price) : (transfer?.price || 0);
  const pixDiscountPercent = tour?.pix_discount || transfer?.pix_discount || 0;
  const image = tour?.images?.[0] || "";
  const location = tour?.location || (transfer ? `${transfer.origin} → ${transfer.destination}` : "");

  const [payMethod, setPayMethod] = useState<"pix" | "card">("pix");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");
  const [notes, setNotes] = useState("");
  const [confirmedBooking, setConfirmedBooking] = useState<BookingItem | null>(null);
  const [pixCopied, setPixCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!tour && !transfer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold text-foreground mb-4">Item não encontrado</h1>
          <Link to="/passeios" className="text-primary hover:underline">Ver passeios</Link>
        </div>
      </div>
    );
  }

  const total = isPrivate ? unitPrice : unitPrice * guests;
  // PIX discount is calculated server-side; display only for UI feedback
  const displayDiscount = payMethod === "pix" && pixDiscountPercent > 0
    ? Math.round(total * pixDiscountPercent / 100)
    : 0;
  const finalTotal = total - displayDiscount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const booking = await addBooking({
        type,
        itemName,
        date,
        guests,
        unitPrice,
        total,
        discount: displayDiscount,
        finalTotal,
        payMethod,
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
      });
      setConfirmedBooking(booking);
    } catch (error) {
      toast({ title: "Erro ao criar reserva", description: "Tente novamente.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const copyPix = () => {
    if (confirmedBooking?.pixCode) {
      navigator.clipboard.writeText(confirmedBooking.pixCode);
      setPixCopied(true);
      toast({ title: "Código PIX copiado!", description: "Cole no app do seu banco para pagar." });
      setTimeout(() => setPixCopied(false), 3000);
    }
  };

  // Success screen
  if (confirmedBooking) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 pb-20 container mx-auto px-4 max-w-lg">
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-green-600" />
            </div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">
              {confirmedBooking.payMethod === "pix" ? "Reserva Registrada!" : "Reserva Confirmada!"}
            </h1>
            <p className="text-muted-foreground">
              Código da reserva: <strong className="text-foreground font-mono">{confirmedBooking.bookingCode}</strong>
            </p>
          </div>

          {/* PIX Payment */}
          {confirmedBooking.payMethod === "pix" && confirmedBooking.pixCode && (
            <div className="bg-card border-2 border-primary/20 rounded-2xl p-6 mb-6">
              <div className="text-center mb-4">
                <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary px-4 py-2 rounded-full text-sm font-semibold mb-3">
                  <Clock size={16} /> Aguardando pagamento PIX
                </div>
                <p className="text-sm text-muted-foreground">Pague em até 30 minutos para garantir sua reserva</p>
              </div>

              {/* QR Code placeholder */}
              <div className="w-48 h-48 mx-auto bg-muted rounded-xl flex items-center justify-center mb-4 border border-border">
                <div className="text-center">
                  <QrCode size={64} className="text-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">QR Code PIX</p>
                </div>
              </div>

              <p className="text-xs text-center text-muted-foreground mb-3">Ou copie o código PIX abaixo:</p>
              <div className="bg-muted rounded-xl p-3 flex items-center gap-2">
                <code className="flex-1 text-xs text-foreground break-all font-mono leading-relaxed">
                  {confirmedBooking.pixCode.slice(0, 60)}...
                </code>
                <button
                  onClick={copyPix}
                  className="shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <Copy size={14} />
                  {pixCopied ? "Copiado!" : "Copiar"}
                </button>
              </div>

              <div className="mt-4 text-center">
                <p className="text-lg font-bold text-primary font-display">R$ {confirmedBooking.finalTotal}</p>
              </div>
            </div>
          )}

          {/* Booking Details */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-3 mb-6">
            <h3 className="font-display font-bold text-foreground">Detalhes da Reserva</h3>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{type === "tour" ? "Passeio" : "Translado"}</span>
              <span className="font-semibold text-foreground">{confirmedBooking.itemName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Data</span>
              <span className="font-semibold text-foreground">
                {date ? new Date(date + "T12:00").toLocaleDateString("pt-BR") : "A definir"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Participantes</span>
              <span className="font-semibold text-foreground">{guests}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Pagamento</span>
              <span className="font-semibold text-foreground">{payMethod === "pix" ? "PIX" : "Cartão de Crédito"}</span>
            </div>
            {displayDiscount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Desconto PIX ({pixDiscountPercent}%)</span>
                <span className="font-semibold">-R$ {displayDiscount}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg border-t border-border pt-3">
              <span className="text-foreground">Total</span>
              <span className="text-primary">R$ {confirmedBooking.finalTotal}</span>
            </div>
          </div>

          {/* Info */}
          <div className="bg-muted rounded-xl p-4 mb-8 text-sm text-muted-foreground space-y-2">
            <p>📧 Enviamos a confirmação para <strong className="text-foreground">{confirmedBooking.customerEmail}</strong></p>
            <p>📱 Você receberá lembretes por WhatsApp no número informado</p>
            <p>🔄 Cancelamento grátis até 24h antes do passeio</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/minhas-reservas" className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl font-semibold transition-colors text-center">
              Ver Minhas Reservas
            </Link>
            <button
              onClick={() => printReceipt({
                bookingCode: confirmedBooking.bookingCode,
                customerName: confirmedBooking.customerName || name,
                customerEmail: confirmedBooking.customerEmail || email,
                customerPhone: confirmedBooking.customerPhone || phone,
                itemName: confirmedBooking.itemName,
                type: confirmedBooking.type || type,
                date: confirmedBooking.date || date,
                guests: confirmedBooking.guests || guests,
                unitPrice: confirmedBooking.unitPrice || unitPrice,
                total: confirmedBooking.total || total,
                discount: confirmedBooking.discount || displayDiscount,
                finalTotal: confirmedBooking.finalTotal || finalTotal,
                payMethod: confirmedBooking.payMethod || payMethod,
                paymentStatus: confirmedBooking.paymentStatus || "pendente",
                status: confirmedBooking.status || "pendente",
                pixCode: confirmedBooking.pixCode,
                createdAt: confirmedBooking.createdAt || new Date().toISOString(),
              })}
              className="border border-border hover:bg-muted text-foreground px-6 py-3 rounded-xl font-semibold transition-colors text-center flex items-center justify-center gap-2"
            >
              <Printer size={18} /> Imprimir Recibo
            </button>
            <a
              href={`https://wa.me/5598985880954?text=Olá! Acabei de fazer a reserva ${confirmedBooking.bookingCode} - ${confirmedBooking.itemName} para ${guests} pessoas.`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-whatsapp hover:bg-whatsapp-hover text-primary-foreground px-6 py-3 rounded-xl font-semibold transition-colors text-center"
            >
              Falar no WhatsApp
            </a>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-4 container mx-auto px-4">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm">
          <ArrowLeft size={16} /> Voltar
        </button>
      </div>

      <div className="container mx-auto px-4 pb-20">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-8">Finalizar Reserva</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form */}
          <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
            {/* Personal info */}
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <h2 className="font-display text-lg font-bold text-foreground">Dados Pessoais</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1.5 block">Nome completo *</label>
                  <input
                    type="text" required value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="Seu nome completo"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1.5 block">CPF</label>
                  <input
                    type="text" value={cpf} onChange={(e) => setCpf(e.target.value)}
                    className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="000.000.000-00"
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1.5 block">Telefone / WhatsApp *</label>
                  <input
                    type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1.5 block">E-mail *</label>
                  <input
                    type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">Observações</label>
                <textarea
                  value={notes} onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  placeholder="Alguma informação adicional? (opcional)"
                />
              </div>
            </div>

            {/* Payment */}
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <h2 className="font-display text-lg font-bold text-foreground">Forma de Pagamento</h2>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPayMethod("pix")}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-colors ${payMethod === "pix" ? "border-primary bg-primary/5" : "border-border"}`}
                >
                  <QrCode size={24} className={payMethod === "pix" ? "text-primary" : "text-muted-foreground"} />
                   <div className="text-left">
                    <p className="font-semibold text-foreground text-sm">PIX</p>
                    <p className="text-xs text-green-600 font-medium">
                      {pixDiscountPercent > 0 ? `${pixDiscountPercent}% de desconto` : "Pagamento instantâneo"}
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setPayMethod("card")}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-colors ${payMethod === "card" ? "border-primary bg-primary/5" : "border-border"}`}
                >
                  <CreditCard size={24} className={payMethod === "card" ? "text-primary" : "text-muted-foreground"} />
                  <div className="text-left">
                    <p className="font-semibold text-foreground text-sm">Cartão</p>
                    <p className="text-xs text-muted-foreground">Até 3x sem juros</p>
                  </div>
                </button>
              </div>

              {payMethod === "pix" && (
                <div className="bg-muted rounded-xl p-4 flex items-center gap-3">
                  <Banknote size={20} className="text-green-600 shrink-0" />
                   <p className="text-sm text-muted-foreground">
                    Ao confirmar, você receberá o QR Code PIX para pagamento imediato.
                    {displayDiscount > 0 && <> Economia de <strong className="text-green-600">R$ {displayDiscount}</strong>!</>}
                  </p>
                </div>
              )}

              {payMethod === "card" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-1.5 block">Número do cartão</label>
                    <input
                      type="text"
                      className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/30"
                      placeholder="0000 0000 0000 0000"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-foreground mb-1.5 block">Validade</label>
                      <input
                        type="text"
                        className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/30"
                        placeholder="MM/AA"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-foreground mb-1.5 block">CVV</label>
                      <input
                        type="text"
                        className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/30"
                        placeholder="000"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-1.5 block">Parcelas</label>
                    <select className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground text-sm outline-none appearance-none">
                      <option>1x de R$ {finalTotal} (sem juros)</option>
                      <option>2x de R$ {Math.ceil(finalTotal / 2)} (sem juros)</option>
                      <option>3x de R$ {Math.ceil(finalTotal / 3)} (sem juros)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-4 rounded-xl font-semibold text-lg transition-colors"
            >
              {payMethod === "pix" ? `Gerar PIX — R$ ${finalTotal}` : `Pagar R$ ${finalTotal}`}
            </button>

            <div className="flex items-center justify-center gap-2 text-muted-foreground text-xs">
              <Shield size={14} />
              <span>Pagamento seguro · Cancelamento grátis até 24h antes</span>
            </div>
          </form>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-card border border-border rounded-2xl overflow-hidden shadow-lg">
              {image && <img src={image} alt={itemName} className="w-full h-40 object-cover" />}
              {!image && (
                <div className="w-full h-40 bg-gradient-hero flex items-center justify-center">
                  <MapPin size={32} className="text-primary-foreground" />
                </div>
              )}
              <div className="p-6 space-y-4">
                <h3 className="font-display text-lg font-bold text-foreground">{itemName}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin size={15} className="text-primary" /> {location}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CalendarDays size={15} className="text-primary" /> {date ? new Date(date + "T12:00").toLocaleDateString("pt-BR") : "Data a definir"}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users size={15} className="text-primary" /> {guests} participante{guests > 1 ? "s" : ""}
                  </div>
                </div>

                <div className="border-t border-border pt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">R$ {unitPrice} × {guests}</span>
                    <span className="text-foreground font-semibold">R$ {total}</span>
                  </div>
                  {displayDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Desconto PIX ({pixDiscountPercent}%)</span>
                      <span className="font-semibold">-R$ {displayDiscount}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg border-t border-border pt-3">
                    <span className="text-foreground">Total</span>
                    <span className="text-primary">R$ {finalTotal}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CheckoutPage;
