import { MapPin, Phone, Mail, Instagram, Shield } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const Footer = () => {
  const { t } = useTranslation();
  const { site: settings, empresa } = useSiteSettings();
  const defaultTourLinks = t("footer.tourLinks", { returnObjects: true }) as string[];
  const tourLinks = settings?.footerTours && settings.footerTours.length > 0 
    ? settings.footerTours 
    : defaultTourLinks;


  return (
    <footer id="contato" className="bg-foreground text-primary-foreground border-t border-primary-foreground/10 pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-1">
            <h3 className="font-display text-2xl font-bold mb-4">
              {settings?.logoUrl ? (
                <img 
                  src={settings.logoUrl} 
                  alt={settings.titulo || "Lençóis Tour Experience"} 
                  className="h-12 md:h-14 w-auto object-contain" 
                />
              ) : (
                <>{empresa?.nome ? empresa.nome : <>Lençóis Tour<span className="text-secondary"> Experience</span></>}</>
              )}
            </h3>
            <p className="text-primary-foreground/60 text-sm leading-relaxed mb-4">
              {t("footer.desc")}
            </p>
            <a
              href={settings?.whatsappUrl || "https://wa.me/5598985880954"}
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
                <li key={link}>
                  <Link to="/passeios" className="hover:text-secondary transition-colors inline-block py-1">
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold text-lg mb-4">{t("footer.companyTitle")}</h4>
            <ul className="space-y-2 text-primary-foreground/60 text-sm">
              <li><Link to="/#sobre" className="hover:text-secondary transition-colors inline-block py-1">{t("footer.companyLinks.about")}</Link></li>
              <li><Link to="/seguranca" className="hover:text-secondary transition-colors flex items-center gap-1.5 py-1"><Shield size={14} /> {t("footer.companyLinks.safety")}</Link></li>
              <li><a href="/#parceiros" className="hover:text-secondary transition-colors inline-block py-1">{t("footer.companyLinks.partner")}</a></li>
              <li><Link to="/translados" className="hover:text-secondary transition-colors inline-block py-1">{t("footer.companyLinks.transfers")}</Link></li>
              <li><Link to="/assinatura-termo" className="hover:text-secondary transition-colors inline-block py-1">{t("footer.companyLinks.terms")}</Link></li>
              <li><Link to="#" className="hover:text-secondary transition-colors inline-block py-1">{t("footer.companyLinks.privacy")}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold text-lg mb-4">{t("footer.contactTitle")}</h4>
            <ul className="space-y-3 text-primary-foreground/60 text-sm">
              <li className="flex items-center gap-2"><MapPin size={16} className="text-secondary" />{empresa?.endereco || "Santo Amaro do Maranhão, MA"}</li>
              <li className="flex items-center gap-2"><Phone size={16} className="text-secondary" />{empresa?.telefone || "(98) 98588-0954"}</li>
              <li className="flex items-center gap-2"><Mail size={16} className="text-secondary" />{empresa?.email || "contato@lencoisexperience.com"}</li>
              <li className="flex items-center gap-2">
                <Instagram size={16} className="text-secondary" />
                <a 
                  href={settings?.instagram || "https://instagram.com/lencoisexperience"} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-secondary transition-colors"
                >
                  {settings?.instagram ? (settings.instagram.split('/').filter(Boolean).pop()?.startsWith('@') ? settings.instagram.split('/').filter(Boolean).pop() : `@${settings.instagram.split('/').filter(Boolean).pop()}`) : "@lencoisexperience"}
                </a>
              </li>
            </ul>

            <div className="mt-6">
              <p className="text-xs text-primary-foreground/40 mb-2">{t("footer.seals")}</p>
              <div className="flex flex-wrap gap-2 text-[10px] md:text-xs text-primary-foreground/50">
                <span className="border border-primary-foreground/20 px-3 py-1.5 rounded-lg whitespace-nowrap">CADASTUR</span>
                <span className="border border-primary-foreground/20 px-3 py-1.5 rounded-lg whitespace-nowrap">ICMBio</span>
                <span className="border border-primary-foreground/20 px-3 py-1.5 rounded-lg whitespace-nowrap">Turismo Responsável</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-primary-foreground/40 text-sm">
          <p>{t("footer.copyright")}</p>
          <div className="flex items-center gap-1">
            <span>Desenvolvido por</span>
            <a 
              href="https://lovable.dev" 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-semibold hover:text-secondary transition-colors"
            >
              Lovable
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
