import { Shield, MapPin, Users, Award } from "lucide-react";
import { useTranslation } from "react-i18next";

const differentialKeys = [
  { key: "safety", icon: Shield },
  { key: "access", icon: MapPin },
  { key: "guides", icon: Users },
  { key: "satisfaction", icon: Award },
] as const;

const WhyUsSection = () => {
  const { t } = useTranslation();

  return (
    <section className="py-20 md:py-28 bg-foreground text-primary-foreground">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <p className="text-secondary font-semibold tracking-widest uppercase text-sm mb-3">{t("whyUs.label")}</p>
          <h2 className="font-display text-3xl md:text-5xl font-bold">
            {t("whyUs.title1")}<br />{t("whyUs.title2")}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {differentialKeys.map((d) => (
            <div key={d.key} className="text-center group">
              <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-primary-foreground/10 border border-primary-foreground/10 flex items-center justify-center group-hover:bg-secondary group-hover:border-secondary transition-colors duration-300">
                <d.icon size={28} className="text-secondary group-hover:text-secondary-foreground transition-colors" />
              </div>
              <h3 className="font-display text-lg font-bold mb-3">{t(`whyUs.items.${d.key}.title`)}</h3>
              <p className="text-primary-foreground/60 text-sm leading-relaxed">{t(`whyUs.items.${d.key}.desc`)}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <a
            href="https://wa.me/5598985880954"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-secondary hover:bg-secondary/90 text-secondary-foreground px-8 py-4 rounded-xl font-semibold text-lg transition-colors"
          >
            {t("whyUs.whatsappCta")}
          </a>
        </div>
      </div>
    </section>
  );
};

export default WhyUsSection;
