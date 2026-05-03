import { Link } from "react-router-dom";
import { Clock, Sparkles, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";

interface Package {
  id: string;
  name: string;
  slug: string;
  description: string;
  days: number;
  original_price: number;
  discount_price: number;
  tag: string;
  highlights: string[];
  package_tours?: any[];
}

const PackagesSection = () => {
  const { t } = useTranslation();
  const [dbPackages, setDbPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPackages = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("packages")
        .select(`
          *,
          package_tours (
            tour:tours (id, name, slug, images)
          )
        `)
        .eq("active", true)
        .order("created_at", { ascending: false });

      if (data) {
        setDbPackages(data);
      }
      setLoading(false);
    };

    fetchPackages();
  }, []);

  if (loading) return null;
  if (dbPackages.length === 0) return null;

  return (
    <section className="py-24 md:py-32 bg-ocean-light/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <p className="text-primary font-bold tracking-[0.2em] uppercase text-xs mb-4 opacity-80">
            {t("packages.label")}
          </p>
          <h2 className="font-display text-4xl md:text-6xl font-bold text-foreground mb-6">
            {t("packages.title")}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t("packages.subtitle")}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {dbPackages.map((pkg) => {
            const discount = pkg.original_price > 0 ? Math.round(((pkg.original_price - pkg.discount_price) / pkg.original_price) * 100) : 0;
            const pkgTours = (pkg.package_tours || []).map((pt: any) => pt.tour).filter(Boolean);

            return (
              <div key={pkg.id} className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-xl transition-shadow group">
                <div className="relative h-48 flex">
                  {pkgTours.length > 0 ? pkgTours.slice(0, 3).map((tour: any, idx: number) => (
                    <div key={`${pkg.id}-${tour.id}-${idx}`} className="flex-1 overflow-hidden">
                      {tour.images?.[0] ? (
                        <img src={tour.images[0]} alt={tour.name} className="w-full h-full object-cover aspect-[4/3] group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                      ) : (
                        <div className="w-full h-full bg-muted" />
                      )}
                    </div>
                  )) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground italic">
                      {t("packages.noImages")}
                    </div>
                  )}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="bg-secondary text-secondary-foreground text-xs font-bold px-3 py-1.5 rounded-full">{pkg.tag}</span>
                    <span className="bg-destructive text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-full">-{discount}%</span>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="font-display text-xl font-bold text-foreground mb-1">{pkg.name}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{pkg.description}</p>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock size={14} className="text-primary" /> {pkg.days} {t("packages.days")}</span>
                    <span className="flex items-center gap-1"><Sparkles size={14} className="text-primary" /> {pkgTours.length} {t("packages.toursCount")}</span>
                  </div>

                  <div className="space-y-2">
                    {pkg.highlights.map((h) => (
                      <div key={h} className="flex items-center gap-2 text-sm text-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        {h}
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-border pt-4 flex items-end justify-between">
                    <div>
                      <span className="text-sm text-muted-foreground line-through">
                        {formatCurrency(pkg.original_price)}
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="font-display text-2xl font-bold text-primary">
                          {formatCurrency(pkg.discount_price)}
                        </span>
                        <span className="text-xs text-muted-foreground">{t("packages.perPerson")}</span>
                      </div>
                    </div>
                    <Link to={`/pacotes/${pkg.slug}`} className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2">
                      {t("packages.view")} <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <a href="https://wa.me/5598985880954?text=Olá! Gostaria de saber mais sobre os pacotes de passeios."
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-[hsl(var(--whatsapp))] hover:bg-[hsl(var(--whatsapp-hover))] text-primary-foreground px-8 py-4 rounded-xl font-semibold text-lg transition-colors">
            {t("packages.whatsappCta")}
          </a>
        </div>
      </div>
    </section>
  );
};

export default PackagesSection;
