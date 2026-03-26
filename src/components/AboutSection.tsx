const AboutSection = () => {
  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-primary font-semibold tracking-widest uppercase text-sm mb-3">Sobre o Destino</p>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-6">
            Santo Amaro do Maranhão
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed mb-6">
            Descubra Santo Amaro do Maranhão, o roteiro turístico mais procurado e a porta de entrada mais próxima para o Parque Nacional dos Lençóis Maranhenses.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Os Lençóis Maranhenses são um tesouro natural de valor inestimável, reconhecido como <strong className="text-foreground">Patrimônio Mundial da Humanidade</strong>. Em Santo Amaro, você encontra a essência rústica e aconchegante do interior, com uma estrutura completa de pousadas e restaurantes.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-8">
            Oferecemos <strong className="text-foreground">8 roteiros exclusivos</strong> de ecoturismo, aventura e experiência, incluindo trekking, caiaque e o famoso passeio de quadriciclo. Aproveite a rica gastronomia maranhense, com pratos típicos como o famoso <strong className="text-foreground">camarão da Malásia</strong>.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: "8", label: "Roteiros Exclusivos" },
              { value: "7 min", label: "Até as Lagoas" },
              { value: "100%", label: "Satisfação" },
              { value: "Jun-Ago", label: "Melhor Época" },
            ].map((stat) => (
              <div key={stat.label} className="bg-ocean-light rounded-2xl p-5">
                <p className="font-display text-2xl md:text-3xl font-bold text-primary">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
