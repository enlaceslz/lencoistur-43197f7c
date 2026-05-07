import { Menu, X, Compass, Car, Shield, User } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === "/";
  const { t } = useTranslation();
  const { site: settings, empresa } = useSiteSettings();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navTheme = isHome && !scrolled && !open ? "light" : "dark";

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      isHome && !scrolled && !open 
        ? "bg-transparent py-7" 
        : "bg-white/70 backdrop-blur-xl border-b border-border/40 py-4 shadow-sm"
    }`}>
      <div className="container mx-auto flex items-center justify-between px-6 md:px-12">
        <Link to="/" className="flex items-center gap-3 group">
          {settings?.logoUrl ? (
            <img 
              src={settings.logoUrl} 
              alt={settings.titulo || "Lençóis Tour"} 
              className={`h-10 md:h-14 w-auto object-contain transition-all duration-500 group-hover:scale-105 ${navTheme === "light" ? "brightness-0 invert" : ""}`}
            />
          ) : (
            <div className={`font-display text-2xl md:text-3xl font-black tracking-tighter transition-colors duration-500 ${navTheme === "light" ? "text-white" : "text-foreground"}`}>
              Lençóis<span className="text-primary">Tour</span>
            </div>
          )}
        </Link>

        <div className={`hidden lg:flex items-center gap-10 text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-500 ${navTheme === "light" ? "text-white/90" : "text-foreground/70"}`}>
          <Link to="/passeios" className="hover:text-primary transition-all hover:translate-y-[-1px] flex items-center gap-2">
            <Compass size={14} className="opacity-50" /> {t("nav.tours")}
          </Link>
          <Link to="/translados" className="hover:text-primary transition-all hover:translate-y-[-1px] flex items-center gap-2">
            <Car size={14} className="opacity-50" /> {t("nav.transfers")}
          </Link>
          <Link to="/seguranca" className="hover:text-primary transition-all hover:translate-y-[-1px] flex items-center gap-2">
            <Shield size={14} className="opacity-50" /> {t("nav.safety")}
          </Link>
          <Link to="/minhas-reservas" className="hover:text-primary transition-all hover:translate-y-[-1px] flex items-center gap-2">
            <User size={14} className="opacity-50" /> {t("nav.myBookings")}
          </Link>
          
          <div className="flex items-center gap-6 pl-6 border-l border-current/10">
            <LanguageSwitcher variant={navTheme === "light" ? "light" : "dark"} />
            <Link to="/passeios" className="bg-primary hover:bg-primary/90 text-white px-7 py-3.5 rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">
              {t("nav.bookNow")}
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4 lg:hidden">
          <LanguageSwitcher variant={navTheme === "light" ? "light" : "dark"} />
          <button onClick={() => setOpen(!open)} className={`p-2 rounded-xl transition-colors ${navTheme === "light" ? "text-white hover:bg-white/10" : "text-foreground hover:bg-muted"}`}>
            {open ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="lg:hidden fixed inset-x-0 top-[100%] h-screen bg-white/95 backdrop-blur-2xl border-t border-border/40 p-8 flex flex-col gap-6 animate-in slide-in-from-top duration-500">
          <Link to="/passeios" onClick={() => setOpen(false)} className="text-lg font-black uppercase tracking-[0.2em] text-foreground border-b border-border/50 pb-4">{t("nav.tours")}</Link>
          <Link to="/translados" onClick={() => setOpen(false)} className="text-lg font-black uppercase tracking-[0.2em] text-foreground border-b border-border/50 pb-4">{t("nav.transfers")}</Link>
          <Link to="/seguranca" onClick={() => setOpen(false)} className="text-lg font-black uppercase tracking-[0.2em] text-foreground border-b border-border/50 pb-4">{t("nav.safety")}</Link>
          <Link to="/minhas-reservas" onClick={() => setOpen(false)} className="text-lg font-black uppercase tracking-[0.2em] text-foreground border-b border-border/50 pb-4">{t("nav.myBookings")}</Link>
          <Link to="/passeios" onClick={() => setOpen(false)} className="bg-primary text-white p-5 rounded-2xl font-black text-xs uppercase tracking-widest text-center shadow-xl shadow-primary/20 mt-4">
            {t("nav.bookNow")}
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
