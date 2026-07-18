import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { useLocalizedPath } from "@/lib/useLocalizedPath";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Shield, CreditCard, QrCode, Banknote, Users, CalendarDays, MapPin, CheckCircle, Copy, Clock, Printer, Building2, Loader2 } from "lucide-react";
import { printReceipt } from "@/components/BookingReceipt";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import { useState, useEffect } from "react";
import { useBookings, type BookingItem } from "@/hooks/useBookings";
import { toast } from "@/hooks/use-toast";
import { maskCPF, maskPhone } from "@/lib/masks";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { fetchPartnerCatalogPricing } from "@/lib/catalogPricing";

const CheckoutPage = () => {
  const loc = useLocalizedPath();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { addBooking } = useBookings();

  const type = (params.get("type") || "tour") as "tour" | "transfer" | "package";
  const slug = params.get("tour") || "";
  const transferId = params.get("transfer") || "";
  const packageSlug = params.get("package") || "";
  const packageId = params.get("id") || "";
  const guests = Number(params.get("pax")) || 2;
  const date = params.get("date") || "";
  const tourMode = (params.get("mode") || "coletivo") as "coletivo" | "privativo";

  const [tour, setTour] = useState<any>(null);
  const [transfer, setTransfer] = useState<any>(null);
  const [pkg, setPkg] = useState<any>(null);
  const [loadingItem, setLoadingItem] = useState(true);

  const [partner, setPartner] = useState<{ id: string; name: string } | null>(null);
  const [partnerPricing, setPartnerPricing] = useState<{ effectivePrice: number; effectivePrivatePrice?: number | null } | null>(null);
  const partnerId = params.get("partner_id");

  useEffect(() => {
    const load = async () => {
      try {
        if (type === "tour" && slug) {
          const { data, error } = await supabase.from("public_tours" as "tours").select("*").eq("slug", slug).single();
          if (error) throw error;
          setTour(data);
          if (partnerId && data?.id) {
            try {
              const pricing = await fetchPartnerCatalogPricing(partnerId, [{ key: data.id, type: "tour", id: data.id }]);
              setPartner(pricing.partner);
              const item = pricing.items[data.id];
              setPartnerPricing(item ? { effectivePrice: item.effectivePrice, effectivePrivatePrice: item.effectivePrivatePrice } : null);
            } catch {
              setPartner(null);
              setPartnerPricing(null);
            }
          } else {
            setPartner(null);
            setPartnerPricing(null);
          }
        } else if (type === "transfer" && transferId) {
          const { data, error } = await supabase.from("public_transfer_routes" as "transfer_routes").select("*").eq("id", transferId).single();
          if (error) throw error;
          setTransfer(data);
          if (partnerId && data?.id) {
            try {
              const pricing = await fetchPartnerCatalogPricing(partnerId, [{ key: data.id, type: "transfer", id: data.id }]);
              setPartner(pricing.partner);
              const item = pricing.items[data.id];
              setPartnerPricing(item ? { effectivePrice: item.effectivePrice } : null);
            } catch {
              setPartner(null);
              setPartnerPricing(null);
            }
          } else {
            setPartner(null);
            setPartnerPricing(null);
          }
        } else if (type === "package" && (packageSlug || packageId)) {
          let query = supabase.from("public_packages" as "packages").select("*");
          if (packageId) {
            query = query.eq("id", packageId);
          } else {
            query = query.eq("slug", packageSlug);
          }
          
          const { data, error } = await query.maybeSingle();
          if (error) throw error;
          
          if (data) {
            setPkg({
              id: data.id,
              name: data.name,
              slug: data.slug,
              price: data.discount_price,
            });

            if (partnerId) {
              try {
                const pricing = await fetchPartnerCatalogPricing(partnerId, [{ key: data.id, type: "package", id: data.id }]);
                setPartner(pricing.partner);
                const item = pricing.items[data.id];
                setPartnerPricing(item ? { effectivePrice: item.effectivePrice } : null);
              } catch {
                setPartner(null);
                setPartnerPricing(null);
              }
            } else {
              setPartner(null);
              setPartnerPricing(null);
            }
          }
        }
      } catch (err) {
        console.error("Erro ao carregar dados do checkout:", err);
        toast({ title: "Erro ao carregar", description: "Não foi possível carregar os dados do serviço.", variant: "destructive" });
      }
      setLoadingItem(false);
    };
    load();
  }, [type, slug, transferId, packageSlug, packageId, partnerId]);

  const isPrivate = tourMode === "privativo";
  const itemName = tour ? `${tour.name}${isPrivate ? " (Privativo)" : " (Coletivo)"}` : (pkg ? pkg.name : (transfer ? `${transfer.origin} → ${transfer.destination}` : ""));
  
  let unitPrice = 0;
  if (tour) {
    const basePublicPrice = isPrivate ? (tour.private_price || 130000) : tour.price;
    unitPrice = partnerPricing
      ? (isPrivate ? (partnerPricing.effectivePrivatePrice || basePublicPrice) : partnerPricing.effectivePrice)
      : basePublicPrice;
  } else if (pkg) {
    const basePublicPrice = pkg.price;
    unitPrice = partnerPricing?.effectivePrice ?? basePublicPrice;
  } else if (transfer) {
    const basePublicPrice = transfer.price || 0;
    unitPrice = partnerPricing?.effectivePrice ?? basePublicPrice;
  }

  const pixDiscountPercent = partner ? 0 : (tour?.pix_discount || transfer?.pix_discount || (pkg ? 5 : 0));
  const image = tour?.images?.[0] || "";
  const location = tour?.location || (pkg ? "Santo Amaro" : (transfer ? `${transfer.origin} → ${transfer.destination}` : ""));

  const [payMethod, setPayMethod] = useState<"pix" | "card" | "info">("pix");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");
  const [notes, setNotes] = useState("");
  const [nationality, setNationality] = useState<"br" | "foreign">("br");
  const [passport, setPassport] = useState("");
  const [country, setCountry] = useState("Brasil");
  const [birthDate, setBirthDate] = useState("");
  const [companions, setCompanions] = useState<{ name: string; cpf: string; birthDate: string }[]>([]);
  const [confirmedBooking, setConfirmedBooking] = useState<BookingItem | null>(null);
  const [pixCopied, setPixCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (guests > 1) {
      const count = guests - 1;
      setCompanions(prev => {
        const newCompanions = [...prev];
        if (newCompanions.length < count) {
          for (let i = newCompanions.length; i < count; i++) {
            newCompanions.push({ name: "", cpf: "", birthDate: "" });
          }
        }
        return newCompanions.slice(0, count);
      });
    } else {
      setCompanions([]);
    }
  }, [guests]);

  if (loadingItem) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Helmet>
          <title>Finalizar Reserva | Lençóis Tour</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!tour && !transfer && !pkg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Helmet>
          <title>Item não encontrado | Lençóis Tour</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold text-foreground mb-4">Item não encontrado</h1>
          <Link to={loc("/passeios")} className="text-primary hover:underline">Ver passeios</Link>
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

    const errors: string[] = [];
    if (!name.trim()) errors.push("Nome completo é obrigatório");
    if (!email.trim()) errors.push("E-mail é obrigatório");
    if (!phone.trim()) errors.push("Telefone é obrigatório");
    if (nationality === "br" && cpf && cpf.replace(/\D/g, "").length !== 11)
      errors.push("CPF deve ter 11 dígitos");
    if (nationality === "foreign" && !passport.trim())
      errors.push("Passaporte é obrigatório para estrangeiros");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      errors.push("E-mail inválido");
    if (phone.replace(/\D/g, "").length < 10)
      errors.push("Telefone deve ter pelo menos 10 dígitos");

    if (errors.length > 0) {
      toast({ title: "Verifique os dados", description: errors.join(". "), variant: "destructive" });
      setSubmitting(false);
      return;
    }

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
        customerName: name.trim(),
        customerEmail: email.trim(),
        customerPhone: phone.trim(),
        cpf: nationality === "br" ? cpf : undefined,
        passport: nationality === "foreign" ? passport : undefined,
        country: nationality === "foreign" ? country : "Brasil",
        birthDate: birthDate || undefined,
        companions: companions.filter(c => c.name.trim() !== ""),
        partnerId: partnerId || undefined,
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
        <Helmet>
          <title>Reserva Confirmada | Lençóis Tour</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <Navbar />
        <div className="pt-32 pb-20 container mx-auto px-4 max-w-lg">
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-green-600" />
            </div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">
              {confirmedBooking.payMethod === "pix" ? "Reserva Registrada!" : confirmedBooking.payMethod === "info" ? "Solicitação Enviada!" : "Reserva Confirmada!"}
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
                <p className="text-lg font-bold text-primary font-display">{formatCurrency(confirmedBooking.finalTotal)}</p>
              </div>
            </div>
          )}

          {/* Info Payment / Contact */}
          {confirmedBooking.payMethod === "info" && (
            <div className="bg-card border-2 border-primary/20 rounded-2xl p-6 mb-6">
              <div className="text-center mb-4">
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-3">
                  <Users size={16} /> Solicitação de Informações
                </div>
                <p className="text-sm text-muted-foreground">
                  Seus dados e os detalhes do serviço foram enviados para nossa agência. Um consultor entrará em contato em breve.
                </p>
              </div>
              <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
                <p className="text-xs text-green-700 font-medium">
                  ✅ PDF profissional enviado para o e-mail da agência com sucesso.
                </p>
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
              <span className="font-semibold text-foreground">{payMethod === "pix" ? "PIX" : payMethod === "info" ? "Solicitação de Informações" : "Cartão de Crédito"}</span>
            </div>
            {displayDiscount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Desconto PIX ({pixDiscountPercent}%)</span>
                <span className="font-semibold">-{formatCurrency(displayDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg border-t border-border pt-3">
              <span className="text-foreground">Total</span>
              <span className="text-primary">{formatCurrency(confirmedBooking.finalTotal)}</span>
            </div>
          </div>

          {/* Info */}
          <div className="bg-muted rounded-xl p-4 mb-8 text-sm text-muted-foreground space-y-2">

            <p>📧 Enviamos a confirmação para <strong className="text-foreground">{confirmedBooking.customerEmail}</strong></p>
            <p>📱 Você receberá lembretes por WhatsApp no número informado</p>
            <p>🔄 Cancelamento grátis até 24h antes do passeio</p>
          </div>

          <div className="flex flex-col gap-3 justify-center mb-8">
            {confirmedBooking.payMethod !== "info" && (
              <Link 
                to={`/assinatura-termo?booking=${encodeURIComponent(confirmedBooking.bookingCode)}`}
                className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-4 rounded-xl font-bold transition-all text-center flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02]"
              >
                <Shield size={20} />
                Assinar Termo de Risco (Obrigatório)
              </Link>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to={loc("/minhas-reservas")} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl font-semibold transition-colors text-center">
                Ver Minhas Reservas
              </Link>
              {confirmedBooking.payMethod !== "info" && (
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
                  className="flex-1 border border-border hover:bg-muted text-foreground px-6 py-3 rounded-xl font-semibold transition-colors text-center flex items-center justify-center gap-2"
                >
                  <Printer size={18} /> Recibo
                </button>
              )}
              <a
                href={confirmedBooking.payMethod === "info" 
                  ? `https://wa.me/5598985880954?text=Olá! Solicitei mais informações sobre a reserva ${confirmedBooking.bookingCode} - ${confirmedBooking.itemName}. Gostaria de tirar algumas dúvidas.`
                  : `https://wa.me/5598985880954?text=Olá! Acabei de fazer a reserva ${confirmedBooking.bookingCode} - ${confirmedBooking.itemName} para ${guests} pessoas.`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-whatsapp hover:bg-whatsapp-hover text-primary-foreground px-6 py-3 rounded-xl font-semibold transition-colors text-center flex items-center justify-center gap-2"
              >
                WhatsApp
              </a>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Finalizar Reserva | Lençóis Tour</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
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
            {partner && (
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center gap-3 animate-in-fade">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Building2 size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 leading-none mb-1">Reserva via Parceiro</p>
                  <p className="text-sm font-bold text-slate-800">{partner.name}</p>
                </div>
                <Badge className="ml-auto bg-primary text-white font-bold border-none">Tarifa Líquida</Badge>
              </div>
            )}
            
            {/* Personal info */}
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <h2 className="font-display text-lg font-bold text-foreground">Dados Pessoais</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className={nationality === "br" ? "" : "sm:col-span-2"}>
                  <label className="text-sm font-semibold text-foreground mb-1.5 block">Nome completo *</label>
                  <input
                    type="text" required value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="Seu nome completo"
                  />
                </div>
                {nationality === "br" && (
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-1.5 block">CPF</label>
                    <input
                      type="text" value={cpf} onChange={(e) => setCpf(maskCPF(e.target.value))} maxLength={14}
                      className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/30"
                      placeholder="000.000.000-00"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">Nacionalidade</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="nationality"
                      checked={nationality === "br"} 
                      onChange={() => setNationality("br")}
                      className="w-4 h-4 text-primary focus:ring-primary border-border bg-muted"
                    />
                    <span className="text-sm text-foreground">Brasileiro</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="nationality"
                      checked={nationality === "foreign"} 
                      onChange={() => setNationality("foreign")}
                      className="w-4 h-4 text-primary focus:ring-primary border-border bg-muted"
                    />
                    <span className="text-sm text-foreground">Estrangeiro</span>
                  </label>
                </div>
              </div>

              {nationality === "foreign" && (
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-1.5 block">Passaporte / ID *</label>
                    <input
                      type="text" required={nationality === "foreign"} value={passport} onChange={(e) => setPassport(e.target.value)}
                      className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/30"
                      placeholder="Número do documento"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-1.5 block">País *</label>
                    <input
                      type="text" required={nationality === "foreign"} value={country} onChange={(e) => setCountry(e.target.value)}
                      className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/30"
                      placeholder="Seu país"
                    />
                  </div>
                </div>
              )}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1.5 block">Telefone / WhatsApp *</label>
                  <input
                    type="tel" required value={phone} onChange={(e) => setPhone(maskPhone(e.target.value))} maxLength={15}
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
                <label className="text-sm font-semibold text-foreground mb-1.5 block">Data de Nascimento (opcional)</label>
                <input
                  type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/30"
                />
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

            {/* Companions */}
            {guests > 1 && (
              <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
                    <Users size={20} className="text-primary" />
                    Dados dos Acompanhantes
                  </h2>
                  <Badge variant="outline" className="text-[10px] uppercase font-black">{companions.length} pessoa(s)</Badge>
                </div>
                <p className="text-xs text-muted-foreground italic">Informe os dados dos outros participantes para agilizar o seguro e os termos de risco.</p>
                
                <div className="space-y-6">
                  {companions.map((comp, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-muted/30 border border-border/50 space-y-3">
                      <p className="text-xs font-bold text-primary uppercase tracking-widest">Acompanhante {idx + 1}</p>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="sm:col-span-2">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Nome Completo</label>
                          <input 
                            type="text" 
                            value={comp.name} 
                            onChange={(e) => {
                              const newComps = [...companions];
                              newComps[idx].name = e.target.value;
                              setCompanions(newComps);
                            }}
                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" 
                            placeholder="Nome do acompanhante"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">CPF (opcional)</label>
                          <input 
                            type="text" 
                            value={comp.cpf} 
                            onChange={(e) => {
                              const newComps = [...companions];
                              newComps[idx].cpf = maskCPF(e.target.value);
                              setCompanions(newComps);
                            }}
                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" 
                            placeholder="000.000.000-00"
                            maxLength={14}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Nascimento</label>
                          <input 
                            type="date" 
                            value={comp.birthDate} 
                            onChange={(e) => {
                              const newComps = [...companions];
                              newComps[idx].birthDate = e.target.value;
                              setCompanions(newComps);
                            }}
                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" 
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment */}
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <h2 className="font-display text-lg font-bold text-foreground">Forma de Pagamento</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setPayMethod("pix")}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-colors ${payMethod === "pix" ? "border-primary bg-primary/5" : "border-border"}`}
                >
                  <QrCode size={24} className={payMethod === "pix" ? "text-primary" : "text-muted-foreground"} />
                   <div className="text-left">
                    <p className="font-semibold text-foreground text-sm">PIX</p>
                    <p className="text-xs text-green-600 font-medium">
                      {pixDiscountPercent > 0 ? `${pixDiscountPercent}% desc.` : "Instantâneo"}
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
                    <p className="text-xs text-muted-foreground">Até 3x s/ juros</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setPayMethod("info")}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-colors ${payMethod === "info" ? "border-primary bg-primary/5" : "border-border"}`}
                >
                  <Users size={24} className={payMethod === "info" ? "text-primary" : "text-muted-foreground"} />
                  <div className="text-left">
                    <p className="font-semibold text-foreground text-sm">Info</p>
                    <p className="text-xs text-muted-foreground">Falar c/ agência</p>
                  </div>
                </button>
              </div>

              {payMethod === "pix" && (
                <div className="bg-muted rounded-xl p-4 flex items-center gap-3">
                  <Banknote size={20} className="text-green-600 shrink-0" />
                   <p className="text-sm text-muted-foreground">
                    Ao confirmar, você receberá o QR Code PIX para pagamento imediato.
                    {displayDiscount > 0 && <> Economia de <strong className="text-green-600">{formatCurrency(displayDiscount)}</strong>!</>}
                  </p>
                </div>
              )}

              {payMethod === "info" && (
                <div className="bg-muted rounded-xl p-4 flex items-center gap-3">
                  <Users size={20} className="text-primary shrink-0" />
                   <p className="text-sm text-muted-foreground">
                    Ao confirmar, sua solicitação será enviada para a agência. Entraremos em contato via WhatsApp para finalizar sua reserva.
                  </p>
                </div>
              )}

              {payMethod === "card" && (
                <div className="space-y-4">
                  <div className="bg-muted rounded-xl p-4 flex items-center gap-3">
                    <CreditCard size={20} className="text-primary shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      Pagamento via cartão de crédito processado com segurança pela agência.
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-1.5 block">Parcelas</label>
                    <select className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground text-sm outline-none appearance-none">
                      <option>1x de {formatCurrency(finalTotal)} (sem juros)</option>
                      <option>2x de {formatCurrency(Math.ceil(finalTotal / 2))} (sem juros)</option>
                      <option>3x de {formatCurrency(Math.ceil(finalTotal / 3))} (sem juros)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-4 rounded-xl font-semibold text-lg transition-colors"
              disabled={submitting}
            >
              {submitting ? "Processando..." : (payMethod === "pix" ? `Gerar PIX — ${formatCurrency(finalTotal)}` : payMethod === "info" ? "Solicitar Informações" : `Pagar ${formatCurrency(finalTotal)}`)}
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
                    <span className="text-muted-foreground">{formatCurrency(unitPrice)} × {guests}</span>
                    <span className="text-foreground font-semibold">{formatCurrency(total)}</span>
                  </div>
                  {displayDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Desconto PIX ({pixDiscountPercent}%)</span>
                      <span className="font-semibold">-{formatCurrency(displayDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg border-t border-border pt-3">
                    <span className="text-foreground">Total</span>
                    <span className="text-primary">{formatCurrency(finalTotal)}</span>
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
