import { Star } from "lucide-react";
import { useTranslation } from "react-i18next";

const testimonials = [
  { name: "Rafael Almeida", quote: "Foi a melhor experiência que já tive em viagem no Brasil. O guia era super atencioso, explicou tudo sobre a região e ainda nos levou para ver o pôr do sol mais lindo da minha vida.", country: "Brasil" },
  { name: "Reese Whitman", quote: "Visiting Lençóis with Lençóis Tour was an amazing experience. The guides were friendly, very professional, and took us to stunning spots I would never have found on my own. I highly recommend their tours.", country: "EUA" },
  { name: "Carlos Menezes", quote: "Eu e minha família fomos surpreendidos pela organização do passeio. A Lençóis Tour pensou em cada parada, tirou fotos maravilhosas e deixou as crianças encantadas com as dunas.", country: "Brasil" },
  { name: "Juliana Ribeiro", quote: "Fechei o roteiro completo com a agência e deu tudo certo: transfer pontual, pousada confortável e passeios incríveis nas lagoas. Recomendo muito a Lençóis Tour para quem quer praticidade.", country: "Brasil" },
];

const TestimonialsSection = () => {
  const { t } = useTranslation();

  return (
    <section className="py-24 md:py-32 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <p className="text-primary font-bold tracking-[0.2em] uppercase text-xs mb-4 opacity-80">{t("testimonials.label")}</p>
          <h2 className="font-display text-4xl md:text-6xl font-bold text-foreground">
            {t("testimonials.title")}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((tm) => (
            <div key={tm.name} className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-shadow">
              <div className="flex gap-1 text-secondary mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={16} fill="currentColor" />
                ))}
              </div>
              <blockquote className="text-muted-foreground text-sm leading-relaxed mb-5 italic">
                "{tm.quote}"
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                  {tm.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{tm.name}</p>
                  <p className="text-xs text-muted-foreground">{tm.country}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
