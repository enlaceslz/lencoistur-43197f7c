import { MapPin, Phone, Mail, Instagram } from "lucide-react";

const Footer = () => {
  return (
    <footer id="contato" className="bg-foreground text-primary-foreground border-t border-primary-foreground/10">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-1">
            <h3 className="font-display text-2xl font-bold mb-4">
              Lençóis<span className="text-secondary">Experience</span>
            </h3>
            <p className="text-primary-foreground/60 text-sm leading-relaxed mb-4">
              A plataforma líder em turismo nos Lençóis Maranhenses. Passeios, translados e experiências únicas em Santo Amaro do Maranhão.
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
            <h4 className="font-display font-bold text-lg mb-4">Passeios</h4>
            <ul className="space-y-2 text-primary-foreground/60 text-sm">
              <li><a href="/passeios" className="hover:text-secondary transition-colors">Lagoas Azuis</a></li>
              <li><a href="/passeios" className="hover:text-secondary transition-colors">Passeio de Barco</a></li>
              <li><a href="/passeios" className="hover:text-secondary transition-colors">Roteiro Ecológico</a></li>
              <li><a href="/passeios" className="hover:text-secondary transition-colors">Descida de Caiaque</a></li>
              <li><a href="/passeios" className="hover:text-secondary transition-colors">Passeio Gastronômico</a></li>
              <li><a href="/passeios" className="hover:text-secondary transition-colors">Trekking nas Dunas</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold text-lg mb-4">Empresa</h4>
            <ul className="space-y-2 text-primary-foreground/60 text-sm">
              <li><a href="#" className="hover:text-secondary transition-colors">Sobre Nós</a></li>
              <li><a href="#" className="hover:text-secondary transition-colors">Seja Parceiro</a></li>
              <li><a href="/translados" className="hover:text-secondary transition-colors">Translados</a></li>
              <li><a href="#" className="hover:text-secondary transition-colors">Termos de Uso</a></li>
              <li><a href="#" className="hover:text-secondary transition-colors">Política de Privacidade</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold text-lg mb-4">Contato</h4>
            <ul className="space-y-3 text-primary-foreground/60 text-sm">
              <li className="flex items-center gap-2"><MapPin size={16} className="text-secondary" />Santo Amaro do Maranhão, MA</li>
              <li className="flex items-center gap-2"><Phone size={16} className="text-secondary" />(98) 98588-0954</li>
              <li className="flex items-center gap-2"><Mail size={16} className="text-secondary" />contato@lencoisexperience.com</li>
              <li className="flex items-center gap-2"><Instagram size={16} className="text-secondary" />@lencoisexperience</li>
            </ul>

            <div className="mt-6">
              <p className="text-xs text-primary-foreground/40 mb-2">Selos e Certificações</p>
              <div className="flex gap-3 text-xs text-primary-foreground/50">
                <span className="border border-primary-foreground/20 px-3 py-1.5 rounded-lg">CADASTUR</span>
                <span className="border border-primary-foreground/20 px-3 py-1.5 rounded-lg">ICMBio</span>
                <span className="border border-primary-foreground/20 px-3 py-1.5 rounded-lg">Turismo Responsável</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 mt-12 pt-8 text-center text-primary-foreground/40 text-sm">
          © 2026 Lençóis Experience. Todos os direitos reservados. Inspirado na operação da Lençóis Tour.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
