import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === "/";
  const { t } = useTranslation();
  const { settings } = useSiteSettings();

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 ${isHome ? "bg-foreground/10" : "bg-card/95 shadow-sm"} backdrop-blur-md border-b ${isHome ? "border-white/10" : "border-border"}`}>
      <div className="container mx-auto flex items-center justify-between py-4 px-4 md:px-8">
        <Link to="/" className={`font-display text-xl md:text-2xl font-bold tracking-wide ${isHome ? "text-primary-foreground" : "text-foreground"}`}>
          {settings?.logoUrl ? (
            <img 
              src={settings.logoUrl} 
              alt={settings.titulo || "LençóisTour"} 
              className={`h-8 md:h-10 w-auto object-contain ${isHome ? "brightness-0 invert" : ""}`}
            />
          ) : (
            <>Lençóis<span className="text-secondary">Tour</span></>
          )}
        </Link>

        <div className={`hidden md:flex items-center gap-8 text-sm font-medium ${isHome ? "text-primary-foreground/90" : "text-foreground/80"}`}>
          <Link to="/passeios" className="hover:text-secondary transition-colors">{t("nav.tours")}</Link>
          <Link to="/translados" className="hover:text-secondary transition-colors">{t("nav.transfers")}</Link>
          <Link to="/seguranca" className="hover:text-secondary transition-colors">{t("nav.safety")}</Link>
          {isHome && (
            <>
              <a href="#como-funciona" className="hover:text-secondary transition-colors">{t("nav.howItWorks")}</a>
              <a href="#parceiros" className="hover:text-secondary transition-colors">{t("nav.partners")}</a>
            </>
          )}
          <LanguageSwitcher variant={isHome ? "light" : "dark"} />
          <Link to="/passeios" className="bg-secondary hover:bg-secondary/90 text-secondary-foreground px-5 py-2.5 rounded-lg font-semibold transition-colors">
            {t("nav.bookNow")}
          </Link>
        </div>

        <div className="flex items-center gap-3 md:hidden">
          <LanguageSwitcher variant={isHome ? "light" : "dark"} />
          <button onClick={() => setOpen(!open)} className={isHome ? "text-primary-foreground" : "text-foreground"}>
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {open && (
        <div className={`md:hidden ${isHome ? "bg-foreground/95 text-primary-foreground" : "bg-card text-foreground"} backdrop-blur-lg border-t border-border px-6 py-6 flex flex-col gap-4`}>
          <Link to="/passeios" onClick={() => setOpen(false)} className="py-2">{t("nav.tours")}</Link>
          <Link to="/translados" onClick={() => setOpen(false)} className="py-2">{t("nav.transfers")}</Link>
          <Link to="/seguranca" onClick={() => setOpen(false)} className="py-2">{t("nav.safety")}</Link>
          <Link to="/" onClick={() => setOpen(false)} className="py-2">{t("nav.home")}</Link>
          <Link to="/passeios" onClick={() => setOpen(false)} className="bg-secondary text-secondary-foreground px-5 py-3 rounded-lg font-semibold mt-2 text-center">
            {t("nav.bookNow")}
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
