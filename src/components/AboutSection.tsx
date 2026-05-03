import { useTranslation } from "react-i18next";

const AboutSection = () => {
  const { t } = useTranslation();

  return (
    <section id="sobre" className="py-20 md:py-32 bg-white relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-primary font-bold tracking-[0.2em] uppercase text-xs mb-4 opacity-80">{t("about.label")}</p>
          <h2 className="font-display text-4xl md:text-6xl font-bold text-foreground mb-10 leading-tight">
            {t("about.title")}
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed mb-6">
            {t("about.p1")}
          </p>
          <p className="text-muted-foreground leading-relaxed mb-6" dangerouslySetInnerHTML={{ __html: t("about.p2") }} />
          <p className="text-muted-foreground leading-relaxed mb-8" dangerouslySetInnerHTML={{ __html: t("about.p3") }} />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
            {[
              { value: "8+", label: t("about.stats.routes") },
              { value: "7 min", label: t("about.stats.time") },
              { value: "100%", label: t("about.stats.satisfaction") },
              { value: "Jan-Dez", label: t("about.stats.season") },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/50 backdrop-blur-sm border border-primary/10 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <p className="font-display text-3xl md:text-4xl font-bold text-primary">{stat.value}</p>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-2">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
