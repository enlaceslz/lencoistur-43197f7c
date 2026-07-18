import { Link, useSearchParams } from "react-router-dom";
import { Clock, Sparkles, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { fetchPartnerCatalogPricing } from "@/lib/catalogPricing";
import { useLocalizedPath } from "@/lib/useLocalizedPath";

interface Package {
  id: string;
  name: string;
  slug: string;
  description: string;
  days: number;
  original_price: number;
  discount_price: number;
  partner_price?: number;
  tag: string;
  highlights: string[];
  package_tours?: any[];
}

const PackagesSection = () => {
  const { t } = useTranslation();
  const loc = useLocalizedPath();
  const [params] = useSearchParams();
  const partnerId = params.get("partner_id") || params.get("partner");
  const [dbPackages, setDbPackages] = useState<Package[]>([]);
  const [pricingByPackageId, setPricingByPackageId] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPackages = async () => {
      setLoading(true);
      const [{ data: data }, { data: packageTours }] = await Promise.all([
        supabase
        .from("public_packages" as "packages")
        .select(`
          *
        `)
        .order("created_at", { ascending: false }),
        supabase.from("public_package_tour_items" as "package_tours").select("package_id, tour_id, tour_name, tour_slug, tour_images")
      ]);

      if (data) {
        const toursByPackage = (packageTours || []).reduce((acc: Record<string, any[]>, item: any) => {
          acc[item.package_id] = acc[item.package_id] || [];
          acc[item.package_id].push({
            id: item.tour_id,
            name: item.tour_name,
            slug: item.tour_slug,
            images: item.tour_images,
          });
          return acc;
        }, {});

        setDbPackages(data.map((pkg: any) => ({ ...pkg, package_tours: (toursByPackage[pkg.id] || []).map((tour) => ({ tour })) })));
        if (partnerId && data.length > 0) {
          try {
            const pricing = await fetchPartnerCatalogPricing(
              partnerId,
              data.map((pkg) => ({ key: pkg.id, type: "package" as const, id: pkg.id })),
            );
            setPricingByPackageId(
              Object.fromEntries(Object.entries(pricing.items).map(([key, value]) => [key, value.effectivePrice])),
            );
          } catch {
            setPricingByPackageId({});
          }
        } else {
          setPricingByPackageId({});
        }
      }
      setLoading(false);
    };

    fetchPackages();
  }, [partnerId]);

  if (loading) return null;
  if (dbPackages.length === 0) return null;

  return (
    <section className="py-24 md:py-32 bg-ocean-light/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <p className="text-primary font-bold tracking-[0.2em] uppercase text-xs mb-4 opacity-80">
            {t("packages.label")}
          </p>
          <h2 className="font-display text-3xl md:text-6xl font-bold text-foreground mb-6">
            {t("packages.title")}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t("packages.subtitle")}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {(dbPackages || []).map((pkg) => {
            const discount = pkg.original_price > 0 ? Math.round(((pkg.original_price - pkg.discount_price) / pkg.original_price) * 100) : 0;
            const pkgTours = (pkg.package_tours || []).map((pt: any) => pt.tour).filter(Boolean);

            return (
              <div key={pkg.id} className="bg-card border border-border rounded-lg overflow-hidden group">
                <div className="relative h-48 flex">
                  {(pkgTours || []).length > 0 ? (pkgTours || []).slice(0, 3).map((tour: any, idx: number) => (
                    <div key={`${pkg.id}-${tour.id}-${idx}`} className="flex-1 overflow-hidden">
                      {tour.images?.[0] ? (
                        <img src={tour.images[0]} alt={tour.name} className="w-full h-full object-cover aspect-[4/3]" loading="lazy" />
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
                    {pkg.tag && <span className="bg-secondary text-secondary-foreground text-xs font-bold px-3 py-1.5 rounded-full">{pkg.tag}</span>}
                    {discount > 0 && <span className="bg-destructive text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-full">-{discount}%</span>}
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
                    {(pkg.highlights || []).map((h) => (
                      <div key={h} className="flex items-center gap-2 text-sm text-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        {h}
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-border pt-4 flex items-end justify-between">
                    <div>
                      {!partnerId && pkg.original_price > 0 && (
                        <span className="text-sm text-muted-foreground line-through">
                          {formatCurrency(pkg.original_price)}
                        </span>
                      )}
                      <div className="flex items-baseline gap-1">
                        <span className="font-display text-2xl font-bold text-primary">
                          {formatCurrency(partnerId ? (pricingByPackageId[pkg.id] ?? pkg.discount_price) : pkg.discount_price)}
                        </span>
                        <span className="text-xs text-muted-foreground">{t("packages.perPerson")}</span>
                      </div>
                    </div>
                    <Link to={loc(`/pacotes/${pkg.slug}${partnerId ? `?partner_id=${partnerId}` : ''}`)} className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-semibold transition-none flex items-center gap-2">
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
            className="inline-flex items-center gap-3 bg-[hsl(var(--whatsapp))] hover:bg-[hsl(var(--whatsapp-hover))] text-primary-foreground px-8 py-4 rounded-lg font-semibold text-lg transition-none">
            {t("packages.whatsappCta")}
          </a>
        </div>
      </div>
    </section>
  );
};

export default PackagesSection;
