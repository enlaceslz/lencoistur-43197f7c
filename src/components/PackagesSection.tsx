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
  tourSlugs: string[];
  days: number;
  originalPrice: number;
  discountPrice: number;
  tag: string;
  highlights: string[];
}

const packages: Package[] = [
  {
    id: "pkg-1", name: "Pacote Essencial Lençóis", slug: "essencial",
    description: "O melhor dos Lençóis Maranhenses em 3 dias. Ideal para quem tem pouco tempo mas quer viver as experiências mais icônicas.",
    tourSlugs: ["lagoas-azuis", "passeio-de-barco", "passeio-gastronomico"], days: 3, originalPrice: 57000, discountPrice: 45900, tag: "Mais Vendido",
    highlights: ["Lagoas Azuis", "Rio Preguiças", "Gastronomia local", "Transfer incluso"],
  },
  {
    id: "pkg-2", name: "Pacote Aventura Total", slug: "aventura",
    description: "Para quem busca adrenalina! Caiaque, quadriciclo e trekking nas dunas mais impressionantes do Brasil.",
    tourSlugs: ["descida-de-caiaque", "trekking-nas-dunas", "passeio-de-quadriciclo"], days: 4, originalPrice: 72000, discountPrice: 57900, tag: "Aventura",
    highlights: ["Caiaque nos rios", "Trekking nas dunas", "Quadriciclo", "Lagoas remotas"],
  },
  {
    id: "pkg-3", name: "Pacote Imersão Completa", slug: "imersao",
    description: "A experiência definitiva: 5 dias explorando todos os cantos dos Lençóis Maranhenses com roteiros exclusivos.",
    tourSlugs: ["lagoas-azuis", "passeio-de-barco", "roteiro-ecologico", "roteiro-cultural", "descida-de-caiaque"], days: 5, originalPrice: 106000, discountPrice: 79900, tag: "Premium",
    highlights: ["5 passeios completos", "Roteiro ecológico", "Cultural + gastronômico", "Guia exclusivo"],
  },
];

const PackagesSection = () => {
  const { t } = useTranslation();
  const [tours, setTours] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("tours").select("id,slug,name,images").eq("active", true)
      .then(({ data }) => setTours(data || []));
  }, []);

  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <p className="text-primary font-semibold tracking-widest uppercase text-sm mb-3">
            {t("packages.label")}
          </p>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4">
            {t("packages.title")}
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            {t("packages.subtitle")}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {packages.map((pkg) => {
            const discount = Math.round(((pkg.originalPrice - pkg.discountPrice) / pkg.originalPrice) * 100);
            const pkgTours = pkg.tourSlugs.map((s) => tours.find((t) => t.slug === s)).filter(Boolean);

            return (
              <div key={pkg.id} className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-xl transition-shadow group">
                <div className="relative h-48 flex">
                  {pkgTours.slice(0, 3).map((tour: any) => (
                    <div key={tour.id} className="flex-1 overflow-hidden">
                      {tour.images?.[0] ? (
                        <img src={tour.images[0]} alt={tour.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                      ) : (
                        <div className="w-full h-full bg-muted" />
                      )}
                    </div>
                  ))}
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
                    <span className="flex items-center gap-1"><Sparkles size={14} className="text-primary" /> {pkg.tourSlugs.length} {t("packages.toursCount")}</span>
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
                        {formatCurrency(pkg.originalPrice)}
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="font-display text-2xl font-bold text-primary">
                          {formatCurrency(pkg.discountPrice)}
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
