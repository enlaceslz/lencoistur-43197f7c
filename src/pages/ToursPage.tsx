import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Star, MapPin, Clock, Search, SlidersHorizontal } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

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
  "passeio-de-barco": tourRioPreguicas,
  "roteiro-ecologico": tourEcologico,
  "passeio-gastronomico": tourGastronomico,
  "roteiro-cultural": tourCultural,
  "descida-de-caiaque": tourCaiaque,
  "trekking-nas-dunas": tourTrekking,
  "passeio-de-quadriciclo": tourQuadriciclo,
};

const getTourImage = (tour: any): string | null => {
  if (tour.images?.[0]) return tour.images[0];
  return localImageMap[tour.slug] || null;
};

const sortOptions = [
  { value: "popular", label: "Mais Popular" },
  { value: "price-asc", label: "Menor Preço" },
  { value: "price-desc", label: "Maior Preço" },
  { value: "rating", label: "Melhor Avaliação" },
];

const ToursPage = () => {
  const [tours, setTours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("popular");
  const [maxPrice, setMaxPrice] = useState(500);

  useEffect(() => {
    supabase.from("tours").select("*").eq("active", true).order("name")
      .then(({ data }) => { setTours(data || []); setLoading(false); });
  }, []);

  const filtered = tours
    .filter((t) => {
      const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
        (t.location || "").toLowerCase().includes(search.toLowerCase());
      const matchPrice = t.price <= maxPrice;
      return matchSearch && matchPrice;
    })
    .sort((a, b) => {
      if (sort === "price-asc") return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      if (sort === "rating") return (b.rating || 0) - (a.rating || 0);
      return (b.reviews_count || 0) - (a.reviews_count || 0);
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
        <div className="flex flex-col md:flex-row gap-4 mb-8 bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center gap-3 flex-1 bg-muted rounded-xl px-4 py-3">
            <Search size={18} className="text-muted-foreground" />
            <input type="text" placeholder="Buscar passeio..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent w-full outline-none text-foreground placeholder:text-muted-foreground text-sm" />
          </div>
          <div className="flex items-center gap-3 bg-muted rounded-xl px-4 py-3">
            <SlidersHorizontal size={16} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground whitespace-nowrap">Até R$</span>
            <input type="range" min={50} max={500} step={10} value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))} className="w-24 accent-primary" />
            <span className="text-sm font-semibold text-foreground w-12">{maxPrice}</span>
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
            <Link to={`/passeios/${tour.slug}`} key={tour.id}
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
                <h3 className="font-display text-xl font-bold text-foreground mb-2">{tour.name}</h3>
                <div className="flex items-center gap-4 text-muted-foreground text-sm mb-4">
                  <span className="flex items-center gap-1"><MapPin size={14} />{tour.location}</span>
                  <span className="flex items-center gap-1"><Clock size={14} />{tour.duration}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-muted-foreground">a partir de</span>
                    <p className="text-xl font-bold text-primary">R$ {tour.price}</p>
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
