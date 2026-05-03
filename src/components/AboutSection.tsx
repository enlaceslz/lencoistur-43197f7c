import { useTranslation } from "react-i18next";

const AboutSection = () => {
  const { t } = useTranslation();

  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-primary font-semibold tracking-widest uppercase text-sm mb-3">{t("about.label")}</p>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-6">
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
