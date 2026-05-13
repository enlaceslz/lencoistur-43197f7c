import { Star, Clock, MapPin } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";

const tourLagoasAzuis = "https://ppzdmxenxqsyebmsymro.supabase.co/storage/v1/object/public/tour-images/gallery/img-1777465186872-0.jpg";
const tourRioPreguicas = "https://ppzdmxenxqsyebmsymro.supabase.co/storage/v1/object/public/tour-images/gallery/img-1777465187850-1.jpeg";
const tourEcologico = "https://ppzdmxenxqsyebmsymro.supabase.co/storage/v1/object/public/tour-images/gallery/img-1777465188808-2.webp";
const tourGastronomico = "https://ppzdmxenxqsyebmsymro.supabase.co/storage/v1/object/public/tour-images/gallery/img-1777465186872-0.jpg";
const tourCultural = "https://ppzdmxenxqsyebmsymro.supabase.co/storage/v1/object/public/tour-images/gallery/img-1777465187850-1.jpeg";
const tourCaiaque = "https://ppzdmxenxqsyebmsymro.supabase.co/storage/v1/object/public/tour-images/gallery/img-1777465188808-2.webp";
const tourTrekking = "https://ppzdmxenxqsyebmsymro.supabase.co/storage/v1/object/public/tour-images/gallery/img-1777465186872-0.jpg";
const tourQuadriciclo = "https://ppzdmxenxqsyebmsymro.supabase.co/storage/v1/object/public/tour-images/gallery/img-1777465187850-1.jpeg";
const tourLagoaAzul2 = "https://ppzdmxenxqsyebmsymro.supabase.co/storage/v1/object/public/tour-images/gallery/img-1777465188808-2.webp";
const tourLagoaAzul3 = "https://ppzdmxenxqsyebmsymro.supabase.co/storage/v1/object/public/tour-images/gallery/img-1777465186872-0.jpg";
const tourPanorama = "https://ppzdmxenxqsyebmsymro.supabase.co/storage/v1/object/public/tour-images/gallery/img-1777465187850-1.jpeg";
const tourBanho = "https://ppzdmxenxqsyebmsymro.supabase.co/storage/v1/object/public/tour-images/gallery/img-1777465188808-2.webp";
const tour4x4 = "https://ppzdmxenxqsyebmsymro.supabase.co/storage/v1/object/public/tour-images/gallery/img-1777465186872-0.jpg";

const localImageMap: Record<string, string> = {
  "lagoas-azuis": tourLagoasAzuis,
  "betania": tourLagoaAzul2,
  "america": tourLagoaAzul3,
  "ponta-verde": tourPanorama,
  "emendadas": tourBanho,
  "circuito-municipal-gaivota": tour4x4,
  "travosa": tourLagoasAzuis,
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
  const [params] = useSearchParams();
  const partnerId = params.get("partner_id") || params.get("partner");
  const [tours, setTours] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("public_tours" as "tours").select("*").order("reviews_count", { ascending: false }).limit(8)
      .then(({ data, error }) => {
        if (error) {
          console.error("Erro ao carregar passeios na Home:", error);
        }
        setTours(data || []);
      });
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
              <Link to={`/passeios/${tour.slug}${partnerId ? `?partner_id=${partnerId}` : ''}`} key={tour.id}
                className="group bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="relative h-64 overflow-hidden">
                  {image ? (
                    <img src={image} alt={tour.name}
                      className="w-full h-full object-cover aspect-video group-hover:scale-110 transition-transform duration-500"
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
                          {formatCurrency(tour.mode_collective_enabled !== false ? tour.price : tour.private_price)}
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
