import { Star, Clock, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const tourLagoasAzuis = "https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?auto=format&fit=crop&q=100&w=1200";
const tourRioPreguicas = "https://images.unsplash.com/photo-1506190500381-458919392ca3?auto=format&fit=crop&q=100&w=1200";
const tourEcologico = "https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?auto=format&fit=crop&q=100&w=1200";
const tourGastronomico = "https://images.unsplash.com/photo-1569336415962-a4bd9f67c07a?auto=format&fit=crop&q=100&w=1200";
const tourCultural = "https://images.unsplash.com/photo-1621303837174-89787a7d4729?auto=format&fit=crop&q=100&w=1200";
const tourCaiaque = "https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?auto=format&fit=crop&q=100&w=1200";
const tourTrekking = "https://images.unsplash.com/photo-1625026214227-2c9cc0883658?auto=format&fit=crop&q=100&w=1200";
const tourQuadriciclo = "https://images.unsplash.com/photo-1589112735741-26c6d04325a8?auto=format&fit=crop&q=100&w=1200";

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

const ToursSection = () => {
  const { t } = useTranslation();
  const [tours, setTours] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("tours").select("*").eq("active", true).order("reviews_count", { ascending: false }).limit(8)
      .then(({ data }) => setTours(data || []));
  }, []);

  const getTourImage = (tour: any): string | null => {
    if (tour.images?.[0]) return tour.images[0];
    return localImageMap[tour.slug] || null;
  };

  return (
    <section id="passeios" className="py-20 md:py-28 bg-gradient-sand">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <p className="text-primary font-semibold tracking-widest uppercase text-sm mb-3">{t("tours.label")}</p>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4">
            {t("tours.title")}
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            {t("tours.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {tours.map((tour) => {
            const image = getTourImage(tour);
            return (
              <Link to={`/passeios/${tour.slug}`} key={tour.id}
                className="group bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="relative h-64 overflow-hidden">
                  {image ? (
                    <img src={image} alt={tour.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      loading="lazy" />
                  ) : (
                    <div className="w-full h-full bg-muted" />
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
                    <span className="text-muted-foreground text-xs">({tour.reviews_count || 0} {t("tours.reviews")})</span>
                  </div>
                  <h3 className="font-display text-xl font-bold text-foreground mb-2">{tour.name}</h3>
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
                          R$ {tour.mode_collective_enabled !== false ? tour.price : tour.private_price}
                        </p>
                        {tour.pix_discount > 0 && (
                          <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold">
                            -{tour.pix_discount}% PIX
                          </span>
                        )}
                      </div>
                      {tour.mode_collective_enabled !== false && tour.mode_private_enabled !== false && (
                        <p className="text-[10px] text-secondary font-semibold">Privativo disponível</p>
                      )}
                    </div>
                    <span className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-semibold">
                      {t("tours.book")}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="text-center mt-10">
          <Link to="/passeios"
            className="inline-block border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground px-8 py-3 rounded-xl font-semibold transition-colors">
            {t("tours.viewAll")}
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ToursSection;
