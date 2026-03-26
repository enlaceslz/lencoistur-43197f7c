import heroImg from "@/assets/hero-travel.jpg";
import { Search, MapPin, Calendar } from "lucide-react";
import { Link } from "react-router-dom";

const tourCategories = [
  { label: "Passeio de Barco", href: "/passeios" },
  { label: "Roteiro Ecológico", href: "/passeios" },
  { label: "Passeio Gastronômico", href: "/passeios" },
  { label: "Roteiro Cultural", href: "/passeios" },
  { label: "Descida de Caiaque", href: "/passeios" },
  { label: "Trekking nas Dunas", href: "/passeios" },
];

const HeroSection = () => {
  return (
    <section className="relative min-h-[100vh] flex items-center justify-center overflow-hidden">
      <img
        src={heroImg}
        alt="Vista aérea dos Lençóis Maranhenses com lagoas azuis e dunas brancas"
        className="absolute inset-0 w-full h-full object-cover"
        width={1920}
        height={1080}
      />
      <div className="absolute inset-0 bg-gradient-hero" />

      <div className="relative z-10 container mx-auto px-4 text-center">
        <p className="text-secondary font-semibold tracking-[0.3em] uppercase text-sm mb-4 animate-fade-up">
          Santo Amaro do Maranhão
        </p>
        <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-primary-foreground leading-tight mb-6 animate-fade-up" style={{ animationDelay: "0.1s" }}>
          A Porta de Entrada Mais Rápida<br />
          <span className="italic font-normal">para os Lençóis Maranhenses</span>
        </h1>
        <p className="text-primary-foreground/80 text-lg md:text-xl max-w-2xl mx-auto mb-8 animate-fade-up" style={{ animationDelay: "0.2s" }}>
          Em menos de 7 minutos, você sai da cidade e já está nas famosas Lagoas Azuis! Veículos 4x4 credenciados, guias locais especializados e 8 roteiros exclusivos de ecoturismo e aventura.
        </p>

        {/* Category Buttons */}
        <div className="animate-fade-up flex flex-wrap justify-center gap-3 mb-10 max-w-3xl mx-auto" style={{ animationDelay: "0.25s" }}>
          {tourCategories.map((cat) => (
            <Link
              key={cat.label}
              to={cat.href}
              className="bg-card/90 backdrop-blur-sm text-foreground hover:bg-secondary hover:text-secondary-foreground px-5 py-3 rounded-xl font-semibold text-sm transition-colors"
            >
              {cat.label}
            </Link>
          ))}
        </div>

        {/* Search Bar */}
        <div className="animate-fade-up max-w-3xl mx-auto bg-card/95 backdrop-blur-sm rounded-2xl p-3 flex flex-col md:flex-row gap-3 shadow-2xl" style={{ animationDelay: "0.3s" }}>
          <div className="flex items-center gap-3 flex-1 px-4 py-3 bg-muted rounded-xl">
            <MapPin size={20} className="text-primary shrink-0" />
            <input type="text" placeholder="Para onde você quer ir?" className="bg-transparent w-full outline-none text-foreground placeholder:text-muted-foreground" />
          </div>
          <div className="flex items-center gap-3 flex-1 px-4 py-3 bg-muted rounded-xl">
            <Calendar size={20} className="text-primary shrink-0" />
            <input type="text" placeholder="Quando?" className="bg-transparent w-full outline-none text-foreground placeholder:text-muted-foreground" />
          </div>
          <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors">
            <Search size={18} />
            Buscar
          </button>
        </div>

        {/* WhatsApp CTA */}
        <div className="animate-fade-up mt-6" style={{ animationDelay: "0.4s" }}>
          <a
            href="https://wa.me/5598985880954"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-primary-foreground px-6 py-3 rounded-xl font-semibold transition-colors"
          >
            📱 Agendar via WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
