import { Star, Clock, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

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
                      <span className="text-xs text-muted-foreground">{t("tours.from")}</span>
                      <p className="text-xl font-bold text-primary">R$ {tour.price}</p>
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
