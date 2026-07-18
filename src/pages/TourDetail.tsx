import { useParams, Link, useSearchParams } from "react-router-dom";
import { Star, MapPin, Clock, Users, ArrowLeft, Shield, CheckCircle, ChevronLeft, ChevronRight, Building2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";

import { formatCurrency, getTourEffectivePrice } from "@/lib/utils";
import { ShareWithFriend } from "@/components/ShareWithFriend";
import { fetchPartnerCatalogPricing } from "@/lib/catalogPricing";
import Breadcrumbs from "@/components/Breadcrumbs";
import { useTranslation } from "react-i18next";
import { useLocalizedPath } from "@/lib/useLocalizedPath";

const TourDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [params] = useSearchParams();
  const { t } = useTranslation();
  const loc = useLocalizedPath();
  const [tour, setTour] = useState<any>(null);
  const [partner, setPartner] = useState<{ id: string; name: string } | null>(null);
  const [partnerPricing, setPartnerPricing] = useState<{ effectivePrice: number; effectivePrivatePrice?: number | null } | null>(null);
  const [tourReviews, setTourReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImg, setCurrentImg] = useState(0);
  const [guests, setGuests] = useState(2);
  const [selectedDate, setSelectedDate] = useState("");
  const [tourMode, setTourMode] = useState<"coletivo" | "privativo">("privativo");

  useEffect(() => {
    if (!slug) return;
    const partnerId = params.get("partner_id") || params.get("partner");
    const load = async () => {
      setLoading(true);
      setError(null);
      const { data: t, error: err } = await supabase.from("public_tours" as "tours").select("id, slug, name, category, images, includes, highlights, tag, price, private_price, location, duration, group_size, rating, reviews_count, description, difficulty, departure, operator, vehicle_capacity, mode_collective_enabled, mode_private_enabled, default_mode, pix_discount").eq("slug", slug).single();
      if (err) {
        console.error("Erro ao carregar detalhes do passeio:", err);
        setError("Não foi possível carregar os detalhes deste passeio.");
        setLoading(false);
        return;
      }
      if (!t) {
        setError("not_found");
        setLoading(false);
        return;
      }
      setTour(t);
      if (partnerId) {
        try {
          const pricing = await fetchPartnerCatalogPricing(partnerId, [{ key: t.id, type: "tour", id: t.id }]);
          setPartner(pricing.partner);
          const item = pricing.items[t.id];
          setPartnerPricing(item ? { effectivePrice: item.effectivePrice, effectivePrivatePrice: item.effectivePrivatePrice } : null);
        } catch {
          setPartner(null);
          setPartnerPricing(null);
        }
      } else {
        setPartner(null);
        setPartnerPricing(null);
      }

      const collectiveOn = t.mode_collective_enabled ?? true;
      const privateOn = t.mode_private_enabled ?? true;
      const adminDefault = (t.default_mode === "coletivo" || t.default_mode === "privativo") ? t.default_mode : "privativo";
      let initial: "coletivo" | "privativo" = adminDefault;
      if (initial === "privativo" && !privateOn) initial = "coletivo";
      if (initial === "coletivo" && !collectiveOn) initial = "privativo";
      setTourMode(initial);

      setReviewsLoading(true);
      const { data: r } = await supabase.from("reviews").select("id, tour_id, author, avatar, country, created_at, rating, comment").eq("tour_id", t.id).order("created_at", { ascending: false });
      setTourReviews(r || []);
      setReviewsLoading(false);
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

  if (error === "not_found" || (!tour && error)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold text-foreground mb-4">{t("tourDetail.notFound")}</h1>
          <Link to={loc("/passeios")} className="text-primary hover:underline">{t("tourDetail.viewAll")}</Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md">
          <h1 className="font-display text-2xl font-bold text-foreground mb-4">{error}</h1>
          <button onClick={() => window.location.reload()} className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-bold hover:bg-primary/90 transition-colors">
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold text-foreground mb-4">{t("tourDetail.notFound")}</h1>
          <Link to={loc("/passeios")} className="text-primary hover:underline">{t("tourDetail.viewAll")}</Link>
        </div>
      </div>
    );
  }

  const images = tour.images || [];
  const includes = tour.includes || [];
  const highlights = tour.highlights || [];
  const isBoatTour = tour.category === "Passeio de Barco";
  const vehicleCapacity = isBoatTour ? 12 : (tour.vehicle_capacity || 9);
  const vehicleLabel = isBoatTour ? "embarcação" : "veículo";
  const collectiveOn = tour.mode_collective_enabled ?? true;
  const privateOn = tour.mode_private_enabled ?? true;
  const showModeToggle = collectiveOn && privateOn;
  const isPrivate = tourMode === "privativo";
  const unitPrice = getTourEffectivePrice(tour, partnerPricing);
  const totalPrice = isPrivate ? unitPrice : unitPrice * guests;
  const maxGuests = vehicleCapacity;

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={`${tour.name} | Lençóis Tour`}
        description={tour.description?.slice(0, 160) || "Passeio nos Lençóis Maranhenses com a Lençóis Tour."}
        path={`/passeios/${tour.slug}`}
        image={images[0]}
        type="product"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: tour.name,
          description: tour.description,
          image: images[0],
          offers: {
            "@type": "Offer",
            price: unitPrice / 100,
            priceCurrency: "BRL",
            availability: "https://schema.org/InStock",
          },
        }}
      />
      <Navbar />

      <div className="pt-24 pb-4 container mx-auto px-4">
        <Link to={loc("/passeios")} className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm mb-2">
          <ArrowLeft size={16} /> {t("tourDetail.back")}
        </Link>
        <Breadcrumbs items={[{ label: "Início", path: "/" }, { label: "Passeios", path: "/passeios" }, { label: tour?.name || "Detalhes" }]} />
      </div>

      <div className="container mx-auto px-4 pb-20">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
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
              <div className="flex items-center gap-3 mb-3">
                <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">{tour.name}</h1>
                {(tour.reviews_count || 0) >= 15 && (
                  <Badge className="bg-amber-500 text-white font-black uppercase text-[10px] tracking-widest px-2 py-0.5 rounded-md">
                    <Sparkles size={12} className="mr-1" /> {t("tourDetail.bestSeller")}
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin size={16} className="text-primary" />{tour.location}</span>
                <span className="flex items-center gap-1"><Clock size={16} className="text-primary" />{tour.duration}</span>
                <span className="flex items-center gap-1"><Users size={16} className="text-primary" />{tour.group_size}</span>
                <span className="flex items-center gap-1 text-secondary font-semibold">
                  <Star size={16} fill="currentColor" />{Number(tour.rating || 0).toFixed(1)} ({tour.reviews_count || 0} {t("tours.reviews")})
                </span>
              </div>
            </div>

            <div>
              <h2 className="font-display text-xl font-bold text-foreground mb-3">{t("tourDetail.about")}</h2>
              <p className="text-muted-foreground leading-relaxed">{tour.description}</p>
            </div>

            {highlights.length > 0 && (
              <div>
                <h2 className="font-display text-xl font-bold text-foreground mb-3">{t("tourDetail.highlights")}</h2>
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
                <h2 className="font-display text-xl font-bold text-foreground mb-3">{t("tourDetail.includes")}</h2>
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
                { label: t("tourDetail.difficulty"), value: tour.difficulty },
                { label: t("tourDetail.group"), value: tour.group_size },
                { label: t("tourDetail.departure"), value: tour.departure },
                { label: t("tourDetail.operator"), value: tour.operator },
              ].map((item) => (
                <div key={item.label} className="bg-card border border-border rounded-xl p-4">
                  <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                  <p className="text-sm font-semibold text-foreground">{item.value}</p>
                </div>
              ))}
            </div>

            {reviewsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            ) : tourReviews.length > 0 && (
              <div>
                <h2 className="font-display text-xl font-bold text-foreground mb-4">
                  {t("tourDetail.reviews")} ({tourReviews.length})
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
              {showModeToggle ? (
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">{t("tourDetail.mode")}</label>
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
                        <span>{t("tourDetail.modeCollective")}</span>
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
                        <span>{t("tourDetail.modePrivate")}</span>
                      </div>
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {isPrivate
                      ? `${vehicleLabel.charAt(0).toUpperCase() + vehicleLabel.slice(1)} ${t("tourDetail.modePrivateDesc", { capacity: vehicleCapacity })}`
                      : `${t("tourDetail.modeCollectiveDesc")} · ${vehicleLabel.charAt(0).toUpperCase() + vehicleLabel.slice(1)} ${t("tourDetail.modeSharedDesc", { capacity: vehicleCapacity })}`}
                  </p>
                </div>
              ) : (
                <div className="bg-muted/50 border border-border rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                    {isPrivate ? <Shield size={16} className="text-secondary" /> : <Users size={16} className="text-primary" />}
                    {isPrivate ? t("tourDetail.modePrivate") : t("tourDetail.modeCollective")}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isPrivate
                      ? `${vehicleLabel.charAt(0).toUpperCase() + vehicleLabel.slice(1)} ${t("tourDetail.modePrivateDesc", { capacity: vehicleCapacity })}`
                      : `${t("tourDetail.modeCollectiveDesc")} · ${vehicleLabel.charAt(0).toUpperCase() + vehicleLabel.slice(1)} ${t("tourDetail.modeSharedDesc", { capacity: vehicleCapacity })}`}
                  </p>
                </div>
              )}

              <div>
                {isPrivate ? (
                  <>
                    <span className="text-xs text-muted-foreground">{t("tourDetail.privateUnit", { vehicle: vehicleLabel.charAt(0).toUpperCase() + vehicleLabel.slice(1) })}</span>
                    <div className="flex items-baseline gap-1">
                      <span className="font-display text-3xl font-bold text-secondary">{formatCurrency(unitPrice)}</span>
                      <span className="text-muted-foreground text-sm">{t("tourDetail.perVehicle", { capacity: vehicleCapacity })}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="text-xs text-muted-foreground">{t("tourDetail.from")}</span>
                    <div className="flex items-baseline gap-1">
                      <span className="font-display text-3xl font-bold text-primary">{formatCurrency(unitPrice)}</span>
                      <span className="text-muted-foreground text-sm">{t("tourDetail.perPerson")}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1.5 block">{t("tourDetail.date")}</label>
                  <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1.5 block">
                    {isPrivate ? t("tourDetail.passengers") : t("tourDetail.participants")}
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
                    <span className="text-muted-foreground">{t("tourDetail.pickup", { guests })}</span>
                    <span className="text-foreground font-semibold">{formatCurrency(totalPrice)}</span>
                  </div>
                ) : (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("tourDetail.priceBreakdown", { price: formatCurrency(unitPrice), guests })}</span>
                    <span className="text-foreground font-semibold">{formatCurrency(totalPrice)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("tourDetail.serviceFee")}</span>
                  <span className="text-foreground font-semibold">{formatCurrency(0)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t border-border pt-3">
                  <span className="text-foreground">{t("tourDetail.total")}</span>
                  <div className="text-right">
                    <span className={isPrivate ? "text-secondary" : "text-primary"}>{formatCurrency(totalPrice)}</span>
                    {tour.pix_discount > 0 && !partner && (
                      <p className="text-[11px] text-green-600 font-semibold">
                        {t("tourDetail.pixDiscount", { price: formatCurrency(Math.round(totalPrice * (1 - tour.pix_discount / 100))) })}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Link to={loc(`/checkout?type=tour&tour=${tour.slug}&pax=${guests}&date=${selectedDate}&mode=${tourMode}${partner ? `&partner_id=${partner.id}` : ''}`)}
                  className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-xl block text-center active:scale-95 ${
                    isPrivate
                      ? "bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-secondary/20"
                      : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20"
                  }`}>
                  {t("tourDetail.continue")}
                </Link>
                <ShareWithFriend itemName={tour.name} itemUrl={window.location.href} />
                <div className="flex items-center justify-center gap-2 text-muted-foreground text-[10px]">
                  <Shield size={12} />
                  <span>{t("tourDetail.freeCancel")}</span>
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
