import { Star, Clock, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { tours } from "@/data/tours";
import { useTranslation } from "react-i18next";

const ToursSection = () => {
  const { t } = useTranslation();

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
          {tours.map((tour) => (
            <Link
              to={`/passeios/${tour.slug}`}
              key={tour.id}
              className="group bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="relative h-64 overflow-hidden">
                <img
                  src={tour.images[0]}
                  alt={tour.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                  width={640}
                  height={800}
                />
                {tour.tag && (
                  <span className="absolute top-4 left-4 bg-secondary text-secondary-foreground text-xs font-bold px-3 py-1.5 rounded-full">
                    {tour.tag}
                  </span>
                )}
              </div>
              <div className="p-5">
                <div className="flex items-center gap-1 text-secondary mb-2">
                  <Star size={14} fill="currentColor" />
                  <span className="text-sm font-semibold">{tour.rating}</span>
                  <span className="text-muted-foreground text-xs">({tour.reviews} {t("tours.reviews")})</span>
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
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            to="/passeios"
            className="inline-block border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground px-8 py-3 rounded-xl font-semibold transition-colors"
          >
            {t("tours.viewAll")}
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ToursSection;
