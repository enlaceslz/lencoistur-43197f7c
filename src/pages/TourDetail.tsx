import { useParams, Link, useSearchParams } from "react-router-dom";
import { Star, MapPin, Clock, Users, ArrowLeft, Shield, CheckCircle, ChevronLeft, ChevronRight, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

import { formatCurrency } from "@/lib/utils";
import { ShareWithFriend } from "@/components/ShareWithFriend";

const TourDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [params] = useSearchParams();
  const [tour, setTour] = useState<any>(null);
  const [partner, setPartner] = useState<any>(null);
  const [tourReviews, setTourReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImg, setCurrentImg] = useState(0);
  const [guests, setGuests] = useState(2);
  const [selectedDate, setSelectedDate] = useState("");
  const [tourMode, setTourMode] = useState<"coletivo" | "privativo">("privativo");

  useEffect(() => {
    if (!slug) return;
    const partnerId = params.get("partner_id") || params.get("partner");
    const load = async () => {
      if (partnerId) {
        const { data: partnerData } = await supabase.from("partners").select("*").eq("id", partnerId).maybeSingle();
        if (partnerData) setPartner(partnerData);
      }
      
      const { data: t } = await supabase.from("tours").select("*").eq("slug", slug).eq("active", true).single();
      setTour(t);
      if (t) {
        // Apply admin-configured default mode
        const collectiveOn = t.mode_collective_enabled ?? true;
        const privateOn = t.mode_private_enabled ?? true;
        const adminDefault = (t.default_mode === "coletivo" || t.default_mode === "privativo") ? t.default_mode : "privativo";
        let initial: "coletivo" | "privativo" = adminDefault;
        if (initial === "privativo" && !privateOn) initial = "coletivo";
        if (initial === "coletivo" && !collectiveOn) initial = "privativo";
        setTourMode(initial);

        const { data: r } = await supabase.from("reviews").select("*").eq("tour_id", t.id).order("created_at", { ascending: false });
        setTourReviews(r || []);
      }
      setLoading(false);
    };
    load();
  }, [slug, params]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold text-foreground mb-4">Passeio não encontrado</h1>
          <Link to="/passeios" className="text-primary hover:underline">Ver todos os passeios</Link>
        </div>
      </div>
    );
  }

  const images = tour.images || [];
  const includes = tour.includes || [];
  const highlights = tour.highlights || [];
  const isBoatTour = tour.slug === "passeio-de-barco" || /barco/i.test(tour.name || "") || /barco/i.test(tour.category || "");
  const vehicleCapacity = isBoatTour ? 12 : (tour.vehicle_capacity || 9);
  const vehicleLabel = isBoatTour ? "embarcação" : "veículo";
  const collectiveOn = tour.mode_collective_enabled ?? true;
  const privateOn = tour.mode_private_enabled ?? true;
  const showModeToggle = collectiveOn && privateOn;
  const isPrivate = tourMode === "privativo";
  const unitPrice = partner
    ? (isPrivate ? (tour.partner_private_price || tour.private_price || 110000) : (tour.partner_price || tour.price))
    : (isPrivate ? (tour.private_price || 130000) : tour.price);
  const totalPrice = isPrivate ? unitPrice : unitPrice * guests;
  const maxGuests = vehicleCapacity;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-24 pb-4 container mx-auto px-4">
        <Link to="/passeios" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm">
          <ArrowLeft size={16} /> Voltar para passeios
        </Link>
      </div>

      <div className="container mx-auto px-4 pb-20">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Gallery */}
            {images.length > 0 && (
              <>
                <div className="relative rounded-2xl overflow-hidden">
                  <img src={images[currentImg]} alt={tour.name}
                    className="w-full h-[300px] md:h-[450px] object-cover" />
                  {tour.tag && (
                    <span className="absolute top-4 left-4 bg-secondary text-secondary-foreground text-sm font-bold px-4 py-2 rounded-full">
                      {tour.tag}
                    </span>
                  )}
                  {images.length > 1 && (
                    <>
                      <button onClick={() => setCurrentImg((p) => (p === 0 ? images.length - 1 : p - 1))}
                        className="absolute left-3 top-1/2 -translate-y-1/2 bg-card/80 backdrop-blur-sm hover:bg-card p-2 rounded-full transition-colors">
                        <ChevronLeft size={20} className="text-foreground" />
                      </button>
                      <button onClick={() => setCurrentImg((p) => (p === images.length - 1 ? 0 : p + 1))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-card/80 backdrop-blur-sm hover:bg-card p-2 rounded-full transition-colors">
                        <ChevronRight size={20} className="text-foreground" />
                      </button>
                    </>
                  )}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {images.map((_: string, i: number) => (
                      <button key={i} onClick={() => setCurrentImg(i)}
                        className={`w-2.5 h-2.5 rounded-full transition-colors ${i === currentImg ? "bg-primary-foreground" : "bg-primary-foreground/40"}`} />
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  {images.map((img: string, i: number) => (
                    <button key={i} onClick={() => setCurrentImg(i)}
                      className={`rounded-xl overflow-hidden border-2 transition-colors ${i === currentImg ? "border-primary" : "border-transparent"}`}>
                      <img src={img} alt="" className="w-24 h-16 object-cover" loading="lazy" />
                    </button>
                  ))}
                </div>
              </>
            )}

            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">{tour.name}</h1>
              <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin size={16} className="text-primary" />{tour.location}</span>
                <span className="flex items-center gap-1"><Clock size={16} className="text-primary" />{tour.duration}</span>
                <span className="flex items-center gap-1"><Users size={16} className="text-primary" />{tour.group_size}</span>
                <span className="flex items-center gap-1 text-secondary font-semibold">
                  <Star size={16} fill="currentColor" />{Number(tour.rating || 0).toFixed(1)} ({tour.reviews_count || 0} avaliações)
                </span>
              </div>
            </div>

            <div>
              <h2 className="font-display text-xl font-bold text-foreground mb-3">Sobre o Passeio</h2>
              <p className="text-muted-foreground leading-relaxed">{tour.description}</p>
            </div>

            {highlights.length > 0 && (
              <div>
                <h2 className="font-display text-xl font-bold text-foreground mb-3">Destaques</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {highlights.map((h: string) => (
                    <div key={h} className="flex items-center gap-3 bg-ocean-light rounded-xl px-4 py-3">
                      <CheckCircle size={18} className="text-primary shrink-0" />
                      <span className="text-foreground text-sm">{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {includes.length > 0 && (
              <div>
                <h2 className="font-display text-xl font-bold text-foreground mb-3">O que está incluso</h2>
                <div className="flex flex-wrap gap-3">
                  {includes.map((item: string) => (
                    <span key={item} className="bg-muted text-foreground px-4 py-2 rounded-full text-sm flex items-center gap-2">
                      <Shield size={14} className="text-primary" />{item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Dificuldade", value: tour.difficulty },
                { label: "Grupo", value: tour.group_size },
                { label: "Saída", value: tour.departure },
                { label: "Operador", value: tour.operator },
              ].map((item) => (
                <div key={item.label} className="bg-card border border-border rounded-xl p-4">
                  <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                  <p className="text-sm font-semibold text-foreground">{item.value}</p>
                </div>
              ))}
            </div>

            {tourReviews.length > 0 && (
              <div>
                <h2 className="font-display text-xl font-bold text-foreground mb-4">
                  Avaliações ({tourReviews.length})
                </h2>
                <div className="space-y-4">
                  {tourReviews.map((review) => (
                    <div key={review.id} className="bg-card border border-border rounded-xl p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                            {review.avatar || review.author?.substring(0, 2)}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground text-sm">{review.author}</p>
                            <p className="text-xs text-muted-foreground">{review.country} · {new Date(review.created_at).toLocaleDateString("pt-BR")}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-secondary">
                          {Array.from({ length: review.rating }).map((_, i) => (
                            <Star key={i} size={14} fill="currentColor" />
                          ))}
                        </div>
                      </div>
                      <p className="text-muted-foreground text-sm">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-card border border-border rounded-2xl p-6 shadow-lg space-y-6">
              {partner && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Building2 size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-widest text-primary/60 leading-none mb-1">Preço Parceiro</p>
                    <p className="text-xs font-bold text-slate-800 truncate">{partner.name}</p>
                  </div>
                  <Badge className="bg-primary text-[9px] text-white font-black uppercase">Ativo</Badge>
                </div>
              )}
              {/* Tour Mode Toggle */}
              {showModeToggle ? (
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">Modalidade</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setTourMode("coletivo")}
                      className={`px-4 py-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                        tourMode === "coletivo"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-muted text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <Users size={18} />
                        <span>Coletivo</span>
                      </div>
                    </button>
                    <button
                      onClick={() => setTourMode("privativo")}
                      className={`px-4 py-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                        tourMode === "privativo"
                          ? "border-secondary bg-secondary/10 text-secondary"
                          : "border-border bg-muted text-muted-foreground hover:border-secondary/40"
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <Shield size={18} />
                        <span>Privativo</span>
                      </div>
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {isPrivate
                      ? `${vehicleLabel.charAt(0).toUpperCase() + vehicleLabel.slice(1)} exclusiva para até ${vehicleCapacity} pessoas`
                      : `Valor por pessoa · ${vehicleLabel.charAt(0).toUpperCase() + vehicleLabel.slice(1)} compartilhada (até ${vehicleCapacity} pessoas)`}
                  </p>
                </div>
              ) : (
                <div className="bg-muted/50 border border-border rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                    {isPrivate ? <Shield size={16} className="text-secondary" /> : <Users size={16} className="text-primary" />}
                    Modalidade {isPrivate ? "Privativa" : "Coletiva"}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isPrivate
                      ? `${vehicleLabel.charAt(0).toUpperCase() + vehicleLabel.slice(1)} exclusiva para até ${vehicleCapacity} pessoas`
                      : `Valor por pessoa · ${vehicleLabel.charAt(0).toUpperCase() + vehicleLabel.slice(1)} compartilhada (até ${vehicleCapacity} pessoas)`}
                  </p>
                </div>
              )}

              <div>
                {isPrivate ? (
                  <>
                    <span className="text-xs text-muted-foreground">{vehicleLabel} exclusiva</span>
                    <div className="flex items-baseline gap-1">
                      <span className="font-display text-3xl font-bold text-secondary">{formatCurrency(unitPrice)}</span>
                      <span className="text-muted-foreground text-sm">/ até {vehicleCapacity} pessoas</span>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="text-xs text-muted-foreground">a partir de</span>
                    <div className="flex items-baseline gap-1">
                      <span className="font-display text-3xl font-bold text-primary">{formatCurrency(unitPrice)}</span>
                      <span className="text-muted-foreground text-sm">/ pessoa</span>
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1.5 block">Data do passeio</label>
                  <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1.5 block">
                    {isPrivate ? "Passageiros (inclusos no preço)" : "Participantes"}
                  </label>
                  <div className="flex items-center gap-4 bg-muted border border-border rounded-xl px-4 py-3">
                    <button onClick={() => setGuests(Math.max(1, guests - 1))}
                      className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-colors font-bold">-</button>
                    <span className="flex-1 text-center font-semibold text-foreground">{guests}</span>
                    <button onClick={() => setGuests(Math.min(maxGuests, guests + 1))}
                      className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-colors font-bold">+</button>
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-4 space-y-2">
                {isPrivate ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{isBoatTour ? "Embarcação privativa" : "Veículo privativo"} ({guests} passageiros)</span>
                    <span className="text-foreground font-semibold">{formatCurrency(totalPrice)}</span>
                  </div>
                ) : (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{formatCurrency(unitPrice)} × {guests} pessoas</span>
                    <span className="text-foreground font-semibold">{formatCurrency(totalPrice)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Taxa de serviço</span>
                  <span className="text-foreground font-semibold">{formatCurrency(0)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t border-border pt-3">
                  <span className="text-foreground">Total</span>
                  <div className="text-right">
                    <span className={isPrivate ? "text-secondary" : "text-primary"}>{formatCurrency(totalPrice)}</span>
                    {tour.pix_discount > 0 && !partner && (
                      <p className="text-[11px] text-green-600 font-semibold">
                        ou {formatCurrency(Math.round(totalPrice * (1 - tour.pix_discount / 100)))} no PIX
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Link to={`/checkout?tour=${tour.slug}&pax=${guests}&date=${selectedDate}&mode=${tourMode}${partner ? `&partner_id=${partner.id}` : ''}`}
                  className={`w-full py-4 rounded-xl font-semibold text-lg transition-colors block text-center ${
                    isPrivate
                      ? "bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                      : "bg-primary hover:bg-primary/90 text-primary-foreground"
                  }`}>
                  Reservar {isPrivate ? "Privativo" : "Agora"}
                </Link>
                <ShareWithFriend itemName={tour.name} itemUrl={window.location.href} />
                <div className="flex items-center justify-center gap-2 text-muted-foreground text-[10px]">
                  <Shield size={12} />
                  <span>Cancelamento grátis até 24h antes</span>
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

export default TourDetail;
