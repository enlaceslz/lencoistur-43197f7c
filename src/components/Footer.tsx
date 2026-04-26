import { MapPin, Phone, Mail, Instagram, Shield } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const Footer = () => {
  const { t } = useTranslation();
  const tourLinks = t("footer.tourLinks", { returnObjects: true }) as string[];
  const { settings } = useSiteSettings();

  return (
    <footer id="contato" className="bg-foreground text-primary-foreground border-t border-primary-foreground/10">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-1">
            <h3 className="font-display text-2xl font-bold mb-4">
              {settings?.logoUrl ? (
                <img 
                  src={settings.logoUrl} 
                  alt={settings.titulo || "LençóisTour"} 
                  className="h-10 md:h-12 w-auto object-contain brightness-0 invert" 
                />
              ) : (
                <>Lençóis<span className="text-secondary">Tour</span></>
              )}
            </h3>
            <p className="text-primary-foreground/60 text-sm leading-relaxed mb-4">
              {t("footer.desc")}
            </p>
            <a
              href="https://wa.me/5598985880954"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-whatsapp hover:bg-whatsapp-hover text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              📱 WhatsApp
            </a>
          </div>

          <div>
            <h4 className="font-display font-bold text-lg mb-4">{t("footer.toursTitle")}</h4>
            <ul className="space-y-2 text-primary-foreground/60 text-sm">
              {tourLinks.map((link) => (
                <li key={link}><a href="/passeios" className="hover:text-secondary transition-colors">{link}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold text-lg mb-4">{t("footer.companyTitle")}</h4>
            <ul className="space-y-2 text-primary-foreground/60 text-sm">
              <li><Link to="/seguranca" className="hover:text-secondary transition-colors flex items-center gap-1.5"><Shield size={14} /> Gestão de Segurança (SGS)</Link></li>
              <li><Link to="#" className="hover:text-secondary transition-colors">{t("footer.companyLinks.about")}</Link></li>
              <li><Link to="#" className="hover:text-secondary transition-colors">{t("footer.companyLinks.partner")}</Link></li>
              <li><Link to="/translados" className="hover:text-secondary transition-colors">{t("footer.companyLinks.transfers")}</Link></li>
              <li><Link to="#" className="hover:text-secondary transition-colors">{t("footer.companyLinks.terms")}</Link></li>
              <li><Link to="#" className="hover:text-secondary transition-colors">{t("footer.companyLinks.privacy")}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold text-lg mb-4">{t("footer.contactTitle")}</h4>
            <ul className="space-y-3 text-primary-foreground/60 text-sm">
              <li className="flex items-center gap-2"><MapPin size={16} className="text-secondary" />Santo Amaro do Maranhão, MA</li>
              <li className="flex items-center gap-2"><Phone size={16} className="text-secondary" />(98) 98588-0954</li>
              <li className="flex items-center gap-2"><Mail size={16} className="text-secondary" />contato@lencoisexperience.com</li>
              <li className="flex items-center gap-2"><Instagram size={16} className="text-secondary" />@lencoisexperience</li>
            </ul>

            <div className="mt-6">
              <p className="text-xs text-primary-foreground/40 mb-2">{t("footer.seals")}</p>
              <div className="flex gap-3 text-xs text-primary-foreground/50">
                <span className="border border-primary-foreground/20 px-3 py-1.5 rounded-lg">CADASTUR</span>
                <span className="border border-primary-foreground/20 px-3 py-1.5 rounded-lg">ICMBio</span>
                <span className="border border-primary-foreground/20 px-3 py-1.5 rounded-lg">Turismo Responsável</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 mt-12 pt-8 text-center text-primary-foreground/40 text-sm">
          {t("footer.copyright")}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
