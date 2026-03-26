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
            <p className="text-primary-foreground/60 text-sm leading-relaxed">
              A plataforma líder em turismo nos Lençóis Maranhenses. Passeios, translados e experiências únicas.
            </p>
          </div>

          <div>
            <h4 className="font-display font-bold text-lg mb-4">Passeios</h4>
            <ul className="space-y-2 text-primary-foreground/60 text-sm">
              <li><a href="#" className="hover:text-secondary transition-colors">Lagoa Azul</a></li>
              <li><a href="#" className="hover:text-secondary transition-colors">Lagoa Bonita</a></li>
              <li><a href="#" className="hover:text-secondary transition-colors">Atins & Caburé</a></li>
              <li><a href="#" className="hover:text-secondary transition-colors">Santo Amaro</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold text-lg mb-4">Empresa</h4>
            <ul className="space-y-2 text-primary-foreground/60 text-sm">
              <li><a href="#" className="hover:text-secondary transition-colors">Sobre Nós</a></li>
              <li><a href="#" className="hover:text-secondary transition-colors">Seja Parceiro</a></li>
              <li><a href="#" className="hover:text-secondary transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-secondary transition-colors">Termos de Uso</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold text-lg mb-4">Contato</h4>
            <ul className="space-y-3 text-primary-foreground/60 text-sm">
              <li className="flex items-center gap-2"><MapPin size={16} className="text-secondary" />Barreirinhas, MA</li>
              <li className="flex items-center gap-2"><Phone size={16} className="text-secondary" />(98) 99999-9999</li>
              <li className="flex items-center gap-2"><Mail size={16} className="text-secondary" />contato@lencoisexperience.com</li>
              <li className="flex items-center gap-2"><Instagram size={16} className="text-secondary" />@lencoisexperience</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 mt-12 pt-8 text-center text-primary-foreground/40 text-sm">
          © 2026 Lençóis Experience. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
