import { Search, CreditCard, MapPin, CheckCircle } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Escolha seu Passeio",
    description: "Explore nosso catálogo de experiências nos Lençóis Maranhenses.",
  },
  {
    icon: CreditCard,
    title: "Reserve Online",
    description: "Pagamento seguro via PIX, cartão ou boleto. Confirmação instantânea.",
  },
  {
    icon: MapPin,
    title: "Viva a Experiência",
    description: "Nossos guias buscam você no hotel. Só aproveitar!",
  },
  {
    icon: CheckCircle,
    title: "Avalie",
    description: "Compartilhe sua experiência e ajude outros viajantes.",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="como-funciona" className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <p className="text-primary font-semibold tracking-widest uppercase text-sm mb-3">Simples e Rápido</p>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground">
            Como Funciona
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <div key={step.title} className="text-center group">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-ocean-light flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                <step.icon size={32} className="text-primary group-hover:text-primary-foreground transition-colors" />
              </div>
              <div className="text-sm font-bold text-secondary mb-2">0{i + 1}</div>
              <h3 className="font-display text-xl font-bold text-foreground mb-2">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
