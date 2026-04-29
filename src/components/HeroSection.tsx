import { Search, MapPin, Calendar, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const HERO_IMG_DEFAULT = "https://images.unsplash.com/photo-1616421004128-40656a877073?auto=format&fit=crop&q=100&w=3840";

const categoryKeys = ["boat", "eco", "gastro", "cultural", "kayak", "trekking"] as const;

const HeroSection = () => {
  const { t } = useTranslation();
  const [heroImg, setHeroImg] = useState(HERO_IMG_DEFAULT);

  useEffect(() => {
    const loadSettings = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "site")
        .maybeSingle();
      
      if (data && (data.value as any)?.bannerUrl) {
        setHeroImg((data.value as any).bannerUrl);
      }
    };
    loadSettings();
  }, []);

  return (
    <section className="relative min-h-[100vh] flex items-center justify-center overflow-hidden">
      <img
        src={HERO_IMG}
        alt="Vista aérea dos Lençóis Maranhenses com lagoas azuis e dunas brancas - Santo Amaro MA"
        className="absolute inset-0 w-full h-full object-cover"
        width={1920}
        height={1080}
      />
      <div className="absolute inset-0 bg-gradient-hero" />

      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="flex flex-col items-center gap-2 mb-4 animate-fade-up">
          <Link to="/seguranca" className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-secondary-foreground text-[10px] md:text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-white/20 transition-all">
            <ShieldCheck size={14} className="text-secondary" />
            Compromisso com sua Segurança — ISO 21101
          </Link>
          <p className="text-secondary font-semibold tracking-[0.3em] uppercase text-sm">
            {t("hero.location")}
          </p>
        </div>
        <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-primary-foreground leading-tight mb-6 animate-fade-up" style={{ animationDelay: "0.1s" }}>
          {t("hero.title1")}<br />
          <span className="italic font-normal">{t("hero.title2")}</span>
        </h1>
        <p className="text-primary-foreground/80 text-lg md:text-xl max-w-2xl mx-auto mb-8 animate-fade-up" style={{ animationDelay: "0.2s" }}>
          {t("hero.subtitle")}
        </p>

        <div className="animate-fade-up flex flex-wrap justify-center gap-3 mb-10 max-w-3xl mx-auto" style={{ animationDelay: "0.25s" }}>
          {categoryKeys.map((key) => (
            <Link
              key={key}
              to="/passeios"
              className="bg-card/90 backdrop-blur-sm text-foreground hover:bg-secondary hover:text-secondary-foreground px-5 py-3 rounded-xl font-semibold text-sm transition-colors"
            >
              {t(`hero.categories.${key}`)}
            </Link>
          ))}
        </div>

        <div className="animate-fade-up max-w-3xl mx-auto bg-card/95 backdrop-blur-sm rounded-2xl p-3 flex flex-col md:flex-row gap-3 shadow-2xl" style={{ animationDelay: "0.3s" }}>
          <div className="flex items-center gap-3 flex-1 px-4 py-3 bg-muted rounded-xl">
            <MapPin size={20} className="text-primary shrink-0" />
            <input type="text" placeholder={t("hero.searchWhere")} className="bg-transparent w-full outline-none text-foreground placeholder:text-muted-foreground" />
          </div>
          <div className="flex items-center gap-3 flex-1 px-4 py-3 bg-muted rounded-xl">
            <Calendar size={20} className="text-primary shrink-0" />
            <input type="text" placeholder={t("hero.searchWhen")} className="bg-transparent w-full outline-none text-foreground placeholder:text-muted-foreground" />
          </div>
          <Link to="/passeios" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors">
            <Search size={18} />
            {t("hero.search")}
          </Link>
        </div>

        <div className="animate-fade-up mt-6" style={{ animationDelay: "0.4s" }}>
          <a
            href="https://wa.me/5598985880954"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-whatsapp hover:bg-whatsapp-hover text-primary-foreground px-6 py-3 rounded-xl font-semibold transition-colors"
          >
            {t("hero.whatsapp")}
          </a>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
