import { Star, Clock, MapPin } from "lucide-react";
import destGreece from "@/assets/dest-greece.jpg";
import destPeru from "@/assets/dest-peru.jpg";
import destMaldives from "@/assets/dest-maldives.jpg";
import destSafari from "@/assets/dest-safari.jpg";

const tours = [
  {
    name: "Lagoa Azul",
    image: destMaldives,
    location: "Lençóis Maranhenses",
    duration: "1 dia",
    rating: 4.9,
    reviews: 234,
    price: 180,
    tag: "Mais Vendido",
  },
  {
    name: "Lagoa Bonita",
    image: destGreece,
    location: "Lençóis Maranhenses",
    duration: "1 dia",
    rating: 4.8,
    reviews: 189,
    price: 160,
    tag: "Imperdível",
  },
  {
    name: "Atins & Caburé",
    image: destSafari,
    location: "Atins, Maranhão",
    duration: "1 dia",
    rating: 4.7,
    reviews: 156,
    price: 220,
    tag: null,
  },
  {
    name: "Santo Amaro",
    image: destPeru,
    location: "Santo Amaro, Maranhão",
    duration: "2 dias",
    rating: 4.9,
    reviews: 98,
    price: 380,
    tag: "Aventura",
  },
];

const ToursSection = () => {
  return (
    <section id="passeios" className="py-20 md:py-28 bg-gradient-sand">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <p className="text-primary font-semibold tracking-widest uppercase text-sm mb-3">Nossos Passeios</p>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4">
            Experiências Inesquecíveis
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Descubra os melhores passeios dos Lençóis Maranhenses com guias experientes.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {tours.map((tour) => (
            <div key={tour.name} className="group bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="relative h-64 overflow-hidden">
                <img
                  src={tour.image}
                  alt={tour.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                  width={640}
                  height={800}
                />
                {tour.tag && (
                  <span className="absolute top-4 left-4 bg-secondary text-secondary-foreground text-xs font-bold px-3 py-1.5 rounded-full">
                    {tour.tag}
                  </span>
                )}
              </div>
              <div className="p-5">
                <div className="flex items-center gap-1 text-secondary mb-2">
                  <Star size={14} fill="currentColor" />
                  <span className="text-sm font-semibold">{tour.rating}</span>
                  <span className="text-muted-foreground text-xs">({tour.reviews} avaliações)</span>
                </div>
                <h3 className="font-display text-xl font-bold text-foreground mb-2">{tour.name}</h3>
                <div className="flex items-center gap-4 text-muted-foreground text-sm mb-4">
                  <span className="flex items-center gap-1"><MapPin size={14} />{tour.location}</span>
                  <span className="flex items-center gap-1"><Clock size={14} />{tour.duration}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-muted-foreground">a partir de</span>
                    <p className="text-xl font-bold text-primary">R$ {tour.price}</p>
                  </div>
                  <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors">
                    Reservar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ToursSection;
