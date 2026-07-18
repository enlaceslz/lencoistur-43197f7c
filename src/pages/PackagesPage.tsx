import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Clock, Sparkles, ArrowRight, Package as PackageIcon } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import Breadcrumbs from "@/components/Breadcrumbs";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/lib/utils";
import { fetchPartnerCatalogPricing } from "@/lib/catalogPricing";
import { useLocalizedPath } from "@/lib/useLocalizedPath";

interface Package {
  id: string;
  name: string;
  slug: string;
  description: string;
  days: number;
  nights?: number;
  original_price: number;
  discount_price: number;
  tag: string;
  highlights: string[];
  banner_url?: string;
  package_tours?: any[];
}

const PackagesPage = () => {
  const { t } = useTranslation();
  const loc = useLocalizedPath();
  const [params] = useSearchParams();
  const partnerId = params.get("partner_id") || params.get("partner");
  const [packages, setPackages] = useState<Package[]>([]);
  const [pricingByPackageId, setPricingByPackageId] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPackages = async () => {
      setLoading(true);
      const [{ data }, { data: packageTours }] = await Promise.all([
        supabase
          .from("public_packages" as "packages")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("public_package_tour_items" as "package_tours")
          .select("package_id, tour_id, tour_name, tour_slug, tour_images"),
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

        setPackages(
          data.map((pkg: any) => ({
            ...pkg,
            package_tours: (toursByPackage[pkg.id] || []).map((tour) => ({ tour })),
          })),
        );

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

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={`${t("packages.title")} | Lençóis Tour`}
        description={t("packages.subtitle")}
        path="/pacotes"
        type="website"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          itemListElement: packages.map((pkg, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: pkg.name,
            url: `${window.location.origin}${loc(`/pacotes/${pkg.slug}`)}`,
          })),
        }}
      />
      <Navbar />
      <div className="pt-28 pb-20 container mx-auto px-4">
        <Breadcrumbs items={[{ label: "Início", path: "/" }, { label: t("packages.label") }]} />

        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-primary font-bold tracking-[0.2em] uppercase text-xs mb-4 opacity-80">
            {t("packages.label")}
          </p>
          <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-6">
            {t("packages.title")}
          </h1>
          <p className="text-muted-foreground text-lg">{t("packages.subtitle")}</p>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card border border-border rounded-lg overflow-hidden animate-pulse">
                <div className="h-48 bg-muted" />
                <div className="p-6 space-y-4">
                  <div className="h-5 bg-muted rounded w-2/3" />
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : packages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <PackageIcon className="text-muted-foreground/30 mb-4" size={48} />
            <p className="text-muted-foreground font-medium">{t("packages.empty")}</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {packages.map((pkg) => {
              const discount =
                pkg.original_price > 0
                  ? Math.round(((pkg.original_price - pkg.discount_price) / pkg.original_price) * 100)
                  : 0;
              const pkgTours = (pkg.package_tours || []).map((pt: any) => pt.tour).filter(Boolean);
              const displayPrice = partnerId ? pricingByPackageId[pkg.id] ?? pkg.discount_price : pkg.discount_price;

              return (
                <div key={pkg.id} className="bg-card border border-border rounded-lg overflow-hidden group flex flex-col">
                  <div className="relative h-48 flex">
                    {pkg.banner_url ? (
                      <img
                        src={pkg.banner_url}
                        alt={pkg.name}
                        loading="lazy"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = "/placeholder.svg";
                        }}
                      />
                    ) : pkgTours.length > 0 ? (
                      pkgTours.slice(0, 3).map((tour: any, idx: number) => (
                        <div key={`${pkg.id}-${tour.id}-${idx}`} className="flex-1 overflow-hidden">
                          {tour.images?.[0] ? (
                            <img src={tour.images[0]} alt={tour.name} className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <div className="w-full h-full bg-muted" />
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground italic">
                        {t("packages.noImages")}
                      </div>
                    )}
                    <div className="absolute top-3 left-3 flex gap-2">
                      {pkg.tag && (
                        <span className="bg-secondary text-secondary-foreground text-xs font-bold px-3 py-1.5 rounded-full">
                          {pkg.tag}
                        </span>
                      )}
                      {discount > 0 && (
                        <span className="bg-destructive text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-full">
                          -{discount}%
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-6 space-y-4 flex flex-col flex-1">
                    <div>
                      <h2 className="font-display text-xl font-bold text-foreground mb-1">{pkg.name}</h2>
                      <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">{pkg.description}</p>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock size={14} className="text-primary" /> {pkg.days} {t("packages.days")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Sparkles size={14} className="text-primary" /> {pkgTours.length} {t("packages.toursCount")}
                      </span>
                    </div>

                    <div className="border-t border-border pt-4 mt-auto flex items-end justify-between">
                      <div>
                        {!partnerId && pkg.original_price > 0 && (
                          <span className="text-sm text-muted-foreground line-through">
                            {formatCurrency(pkg.original_price)}
                          </span>
                        )}
                        <div className="flex items-baseline gap-1">
                          <span className="font-display text-2xl font-bold text-primary">
                            {formatCurrency(displayPrice)}
                          </span>
                          <span className="text-xs text-muted-foreground">{t("packages.perPerson")}</span>
                        </div>
                      </div>
                      <Link
                        to={loc(`/pacotes/${pkg.slug}${partnerId ? `?partner_id=${partnerId}` : ""}`)}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-semibold transition-none flex items-center gap-2"
                      >
                        {t("packages.view")} <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-12 text-center">
          <a
            href="https://wa.me/5598985880954?text=Olá! Gostaria de saber mais sobre os pacotes de passeios."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-[hsl(var(--whatsapp))] hover:bg-[hsl(var(--whatsapp-hover))] text-primary-foreground px-8 py-4 rounded-lg font-semibold text-lg transition-none"
          >
            {t("packages.whatsappCta")}
          </a>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PackagesPage;
