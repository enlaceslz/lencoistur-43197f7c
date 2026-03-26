import { Shield, MapPin, Users, Award } from "lucide-react";

const differentials = [
  {
    icon: Shield,
    title: "Segurança e Conforto 4x4",
    description: "Nossos veículos são credenciados e revisados, garantindo que você explore o Parque Nacional dos Lençóis Maranhenses com total tranquilidade e o máximo de conforto.",
  },
  {
    icon: MapPin,
    title: "Acesso Imediato ao Paraíso",
    description: "Localizados em Santo Amaro, a base mais próxima, levamos você às lagoas em menos de 7 minutos. Mais tempo para curtir, menos tempo no deslocamento.",
  },
  {
    icon: Users,
    title: "Guias Locais Especializados",
    description: "Nossos guias nasceram e cresceram na região. Eles conhecem os melhores horários, os segredos das dunas e os pontos perfeitos para fotos inesquecíveis.",
  },
  {
    icon: Award,
    title: "100% de Satisfação Comprovada",
    description: "Nossa reputação é construída com base em experiências reais. Veja os depoimentos de quem já viajou e comprove a qualidade e o carinho do nosso atendimento.",
  },
];

const WhyUsSection = () => {
  return (
    <section className="py-20 md:py-28 bg-foreground text-primary-foreground">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <p className="text-secondary font-semibold tracking-widest uppercase text-sm mb-3">Diferenciais</p>
          <h2 className="font-display text-3xl md:text-5xl font-bold">
            Por Que a Lençóis Tour é a<br />Sua Melhor Escolha?
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {differentials.map((d) => (
            <div key={d.title} className="text-center group">
              <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-primary-foreground/10 border border-primary-foreground/10 flex items-center justify-center group-hover:bg-secondary group-hover:border-secondary transition-colors duration-300">
                <d.icon size={28} className="text-secondary group-hover:text-secondary-foreground transition-colors" />
              </div>
              <h3 className="font-display text-lg font-bold mb-3">{d.title}</h3>
              <p className="text-primary-foreground/60 text-sm leading-relaxed">{d.description}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <a
            href="https://wa.me/5598985880954"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-secondary hover:bg-secondary/90 text-secondary-foreground px-8 py-4 rounded-xl font-semibold text-lg transition-colors"
          >
            📱 Agendar meu passeio via WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
};

export default WhyUsSection;
