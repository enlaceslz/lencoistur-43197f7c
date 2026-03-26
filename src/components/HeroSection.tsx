import heroImg from "@/assets/hero-travel.jpg";
import { Search, MapPin, Calendar } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-[100vh] flex items-center justify-center overflow-hidden">
      <img
        src={heroImg}
        alt="Praia paradisíaca nos Lençóis Maranhenses"
        className="absolute inset-0 w-full h-full object-cover"
        width={1920}
        height={1080}
      />
      <div className="absolute inset-0 bg-gradient-hero" />

      <div className="relative z-10 container mx-auto px-4 text-center">
        <p className="text-secondary font-semibold tracking-[0.3em] uppercase text-sm mb-4 animate-fade-up">
          Parque Nacional dos Lençóis Maranhenses
        </p>
        <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-primary-foreground leading-tight mb-6 animate-fade-up" style={{ animationDelay: "0.1s" }}>
          Descubra o paraíso<br />
          <span className="italic font-normal">mais perto do que você imagina</span>
        </h1>
        <p className="text-primary-foreground/80 text-lg md:text-xl max-w-2xl mx-auto mb-10 animate-fade-up" style={{ animationDelay: "0.2s" }}>
          Passeios exclusivos, guias especializados e as melhores experiências nos Lençóis Maranhenses.
        </p>

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
      </div>
    </section>
  );
};

export default HeroSection;
