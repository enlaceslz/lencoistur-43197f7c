import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { getTourBySlug } from "@/data/tours";
import { ArrowLeft, Shield, CreditCard, QrCode, Banknote, Users, CalendarDays, MapPin, CheckCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState } from "react";

const CheckoutPage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const slug = params.get("tour") || "";
  const guests = Number(params.get("pax")) || 2;
  const date = params.get("date") || "";
  const tour = getTourBySlug(slug);

  const [payMethod, setPayMethod] = useState<"pix" | "card">("pix");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (!tour) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold text-foreground mb-4">Passeio não encontrado</h1>
          <Link to="/passeios" className="text-primary hover:underline">Ver passeios</Link>
        </div>
      </div>
    );
  }

  const total = tour.price * guests;
  const discount = payMethod === "pix" ? Math.round(total * 0.05) : 0;
  const finalTotal = total - discount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 pb-20 container mx-auto px-4 max-w-lg text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-green-600" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-3">Reserva Confirmada!</h1>
          <p className="text-muted-foreground mb-6">
            Sua reserva para <strong>{tour.name}</strong> foi realizada com sucesso.
            Enviamos os detalhes para <strong>{email}</strong>.
          </p>
          <div className="bg-card border border-border rounded-2xl p-6 text-left space-y-3 mb-8">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Passeio</span>
              <span className="font-semibold text-foreground">{tour.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Data</span>
              <span className="font-semibold text-foreground">{date ? new Date(date + "T12:00").toLocaleDateString("pt-BR") : "A definir"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Participantes</span>
              <span className="font-semibold text-foreground">{guests}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-border pt-3">
              <span className="text-muted-foreground">Total pago</span>
              <span className="font-bold text-primary text-lg">R$ {finalTotal}</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/" className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl font-semibold transition-colors">
              Voltar ao Início
            </Link>
            <a
              href={`https://wa.me/5598985880954?text=Olá! Acabei de reservar o passeio ${tour.name} para ${guests} pessoas.`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[hsl(var(--whatsapp))] hover:bg-[hsl(var(--whatsapp-hover))] text-primary-foreground px-6 py-3 rounded-xl font-semibold transition-colors"
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
                  <label className="text-sm font-semibold text-foreground mb-1.5 block">Nome completo</label>
                  <input
                    type="text" required value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="Seu nome"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1.5 block">Telefone / WhatsApp</label>
                  <input
                    type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">E-mail</label>
                <input
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="seu@email.com"
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
                    <p className="text-xs text-green-600 font-medium">5% de desconto</p>
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
                    Ao confirmar, você receberá o QR Code PIX por e-mail e WhatsApp para pagamento imediato.
                  </p>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-4 rounded-xl font-semibold text-lg transition-colors"
            >
              Confirmar Reserva — R$ {finalTotal}
            </button>

            <div className="flex items-center justify-center gap-2 text-muted-foreground text-xs">
              <Shield size={14} />
              <span>Pagamento seguro · Cancelamento grátis até 24h antes</span>
            </div>
          </form>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-card border border-border rounded-2xl overflow-hidden shadow-lg">
              <img src={tour.images[0]} alt={tour.name} className="w-full h-40 object-cover" />
              <div className="p-6 space-y-4">
                <h3 className="font-display text-lg font-bold text-foreground">{tour.name}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin size={15} className="text-primary" /> {tour.location}
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
                    <span className="text-muted-foreground">R$ {tour.price} × {guests}</span>
                    <span className="text-foreground font-semibold">R$ {total}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Desconto PIX (5%)</span>
                      <span className="font-semibold">-R$ {discount}</span>
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
