import { Building2, Users, Car, Compass } from "lucide-react";
import { useTranslation } from "react-i18next";

const partnerTypeKeys = [
  { icon: Building2, key: "hotels", count: "50+" },
  { icon: Compass, key: "guides", count: "120+" },
  { icon: Car, key: "drivers", count: "80+" },
  { icon: Users, key: "agencies", count: "30+" },
] as const;

const PartnersSection = () => {
  const { t } = useTranslation();

  return (
    <section id="parceiros" className="py-20 md:py-28 bg-foreground text-primary-foreground">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-secondary font-semibold tracking-widest uppercase text-sm mb-3">{t("partners.label")}</p>
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-6">
              {t("partners.title1")}<br />{t("partners.title2")}<br />{t("partners.title3")}
            </h2>
            <p className="text-primary-foreground/70 text-lg mb-8 max-w-lg">
              {t("partners.subtitle")}
            </p>
            <button className="bg-secondary hover:bg-secondary/90 text-secondary-foreground px-8 py-4 rounded-xl font-semibold text-lg transition-colors">
              {t("partners.cta")}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-5">
            {partnerTypeKeys.map((p) => (
              <div key={p.key} className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-6 text-center border border-primary-foreground/10 hover:border-secondary/50 transition-colors">
                <p.icon size={36} className="mx-auto mb-3 text-secondary" />
                <p className="text-2xl font-bold mb-1">{p.count}</p>
                <p className="text-primary-foreground/70 text-sm">{t(`partners.types.${p.key}`)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PartnersSection;
