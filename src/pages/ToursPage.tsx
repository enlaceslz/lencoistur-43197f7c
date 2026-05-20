import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Star, MapPin, Clock, Search, SlidersHorizontal, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { formatCurrency } from "@/lib/utils";
import { fetchPartnerCatalogPricing } from "@/lib/catalogPricing";
import { Badge } from "@/components/ui/badge";


import tourLagoasAzuis from "@/assets/tour-lagoas-azuis-hero.jpg";
import tourRioPreguicas from "@/assets/tour-rio-preguicas.jpg";
import tourEcologico from "@/assets/tour-roteiro-ecologico.jpg";
import tourGastronomico from "@/assets/tour-gastronomico.jpg";
import tourCultural from "@/assets/tour-cultural.jpg";
import tourCaiaque from "@/assets/tour-caiaque.jpg";
import tourTrekking from "@/assets/tour-trekking.jpg";
import tourQuadriciclo from "@/assets/tour-quadriciclo.jpg";

const localImageMap: Record<string, string> = {
  "lagoas-azuis": tourLagoasAzuis,
  "betania": tourLagoasAzuis,
  "america": tourLagoasAzuis,
  "ponta-verde": tourLagoasAzuis,
  "emendadas": tourLagoasAzuis,
  "circuito-municipal-gaivota": tourLagoasAzuis,
  "travosa": tourLagoasAzuis,
  "passeio-de-barco": tourRioPreguicas,
  "roteiro-ecologico": tourEcologico,
  "passeio-gastronomico": tourGastronomico,
  "roteiro-cultural": tourCultural,
  "descida-de-caiaque": tourCaiaque,
  "trekking-nas-dunas": tourTrekking,
  "passeio-de-quadriciclo": tourQuadriciclo,
};
const sortOptions = [
  { value: "popular", label: "Mais Populares" },
  { value: "rating", label: "Melhor Avaliados" },
  { value: "price-asc", label: "Menor Preço" },
  { value: "price-desc", label: "Maior Preço" },
];

const getTourImage = (tour: any) => {
  if (tour.images && tour.images.length > 0) return tour.images[0];
  return localImageMap[tour.slug] || "/placeholder.svg";
};

const ToursPage = () => {
  const [params] = useSearchParams();
  const partnerId = params.get("partner_id") || params.get("partner");
  const [tours, setTours] = useState<any[]>([]);
  const [partner, setPartner] = useState<{ id: string; name: string } | null>(null);
  const [pricingByTourId, setPricingByTourId] = useState<Record<string, { effectivePrice: number; effectivePrivatePrice?: number | null }>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(params.get("search") || "");
  const [sort, setSort] = useState("popular");

  const [maxPrice, setMaxPrice] = useState(3000);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase.from("public_tours" as "tours").select("*").order("name");
      if (error) {
        console.error("Erro ao carregar passeios:", error);
      }
      const safeTours = data || [];
      setTours(safeTours);

      if (partnerId && safeTours.length > 0) {
        try {
          const pricing = await fetchPartnerCatalogPricing(
            partnerId,
            safeTours.map((tour) => ({ key: tour.id, type: "tour" as const, id: tour.id })),
          );

          setPartner(pricing.partner);
          setPricingByTourId(
            Object.fromEntries(
              Object.entries(pricing.items).map(([key, value]) => [
                key,
                {
                  effectivePrice: value.effectivePrice,
                  effectivePrivatePrice: value.effectivePrivatePrice,
                },
              ]),
            ),
          );
        } catch {
          setPartner(null);
          setPricingByTourId({});
        }
      } else {
        setPartner(null);
        setPricingByTourId({});
      }

      setLoading(false);
    };
    load();
  }, [partnerId]);

  const filtered = tours
    .filter((t) => {
      const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
        (t.location || "").toLowerCase().includes(search.toLowerCase());
      
      const isPrivate = t.mode_collective_enabled === false;
      const basePrice = isPrivate ? (t.private_price || 0) : t.price;
      const partnerPricing = pricingByTourId[t.id];
      const priceToFormat = partnerPricing
        ? (isPrivate ? (partnerPricing.effectivePrivatePrice || basePrice) : partnerPricing.effectivePrice)
        : basePrice;

      
      const effectivePrice = priceToFormat / 100;
      const matchPrice = effectivePrice <= maxPrice;
      return matchSearch && matchPrice;
    })
    .sort((a, b) => {
      const getPrice = (t: any) => {
        const isPrivate = t.mode_collective_enabled === false;
        const basePrice = isPrivate ? (t.private_price || 0) : t.price;
        const partnerPricing = pricingByTourId[t.id];

        return partnerPricing
          ? (isPrivate ? (partnerPricing.effectivePrivatePrice || basePrice) : partnerPricing.effectivePrice)
          : basePrice;
      };
      const priceA = getPrice(a) / 100;
      const priceB = getPrice(b) / 100;
      if (sort === "price-asc") return priceA - priceB;
      if (sort === "price-desc") return priceB - priceA;
      if (sort === "rating") return (Number(b.rating) || 0) - (Number(a.rating) || 0);
      return (Number(b.reviews_count) || 0) - (Number(a.reviews_count) || 0);
    });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-24 pb-10 bg-gradient-sand">
        <div className="container mx-auto px-4">
          <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-3">Nossos Passeios</h1>
          <p className="text-muted-foreground text-lg">Encontre a experiência perfeita nos Lençóis Maranhenses</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-col lg:flex-row gap-4 mb-8 bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center gap-3 flex-1 bg-muted rounded-xl px-4 py-3">
            <Search size={18} className="text-muted-foreground" />
            <input type="text" placeholder="Buscar passeio..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent w-full outline-none text-foreground placeholder:text-muted-foreground text-sm" />
          </div>
          <div className="flex items-center gap-3 bg-muted rounded-xl px-4 py-3 min-w-fit">
            <SlidersHorizontal size={16} className="text-muted-foreground shrink-0" />
            <span className="text-sm text-muted-foreground whitespace-nowrap">Até R$</span>
            <input type="range" min={50} max={3000} step={10} value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))} className="w-full sm:w-32 accent-primary" />
            <span className="text-sm font-semibold text-foreground min-w-[3rem]">{maxPrice}</span>
          </div>
          <select value={sort} onChange={(e) => setSort(e.target.value)}
            className="bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground outline-none">
            {sortOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <p className="text-muted-foreground text-sm mb-6">
          {loading ? "Carregando..." : `${filtered.length} passeio(s) encontrado(s)`}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((tour) => (
            <Link to={`/passeios/${tour.slug}${partnerId ? `?partner_id=${partnerId}` : ''}`} key={tour.id}
              className="group bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="relative h-56 overflow-hidden">
                {getTourImage(tour) ? (
                  <img src={getTourImage(tour)!} alt={tour.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy" />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <span className="text-muted-foreground">Sem imagem</span>
                  </div>
                )}
                {tour.tag && (
                  <span className="absolute top-4 left-4 bg-secondary text-secondary-foreground text-xs font-bold px-3 py-1.5 rounded-full">
                    {tour.tag}
                  </span>
                )}
              </div>
              <div className="p-5">
                <div className="flex items-center gap-1 text-secondary mb-2">
                  <Star size={14} fill="currentColor" />
                  <span className="text-sm font-semibold">{Number(tour.rating || 0).toFixed(1)}</span>
                  <span className="text-muted-foreground text-xs">({tour.reviews_count || 0})</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-display text-xl font-bold text-foreground leading-tight">{tour.name}</h3>
                  {(tour.reviews_count || 0) >= 15 && (
                    <Badge className="bg-amber-500 text-white font-black uppercase text-[8px] tracking-widest px-1.5 py-0 rounded-sm">
                      Top
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-4 text-muted-foreground text-sm mb-4">
                  <span className="flex items-center gap-1"><MapPin size={14} />{tour.location}</span>
                  <span className="flex items-center gap-1"><Clock size={14} />{tour.duration}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-muted-foreground">
                      {tour.mode_collective_enabled !== false ? "Coletivo" : "Privativo"}
                    </span>
                    <div className="flex items-baseline gap-1">
                      <p className={`text-lg font-bold ${tour.mode_collective_enabled !== false ? "text-primary" : "text-secondary"}`}>
                        {(() => {
                          const isPrivate = tour.mode_collective_enabled === false;
                          const basePublicPrice = isPrivate ? (tour.private_price || 0) : tour.price;

                          const partnerPricing = pricingByTourId[tour.id];
                          const priceToFormat = partnerPricing
                            ? (isPrivate ? (partnerPricing.effectivePrivatePrice || basePublicPrice) : partnerPricing.effectivePrice)
                            : basePublicPrice;
                          return formatCurrency(priceToFormat);
                        })()}
                      </p>
                      {tour.pix_discount > 0 && !partnerId && (
                        <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold">
                          -{tour.pix_discount}% PIX
                        </span>
                      )}
                      {partnerId && (
                        <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold">
                          Tarifa Parceiro
                        </span>
                      )}
                    </div>
                    {tour.mode_collective_enabled !== false && tour.mode_private_enabled !== false && (
                      <p className="text-[10px] text-secondary font-semibold">Privativo disponível</p>
                    )}
                  </div>
                  <span className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-semibold">
                    Ver Detalhes
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {!loading && filtered.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">Nenhum passeio encontrado com esses filtros.</p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default ToursPage;
