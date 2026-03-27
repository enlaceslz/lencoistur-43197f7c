import { useState } from "react";
import destMaldives from "@/assets/dest-maldives.jpg";
import destGreece from "@/assets/dest-greece.jpg";
import destSafari from "@/assets/dest-safari.jpg";
import destPeru from "@/assets/dest-peru.jpg";
import tourLagoaAzul2 from "@/assets/tour-lagoa-azul-2.jpg";
import tourLagoaAzul3 from "@/assets/tour-lagoa-azul-3.jpg";
import heroTravel from "@/assets/hero-travel.jpg";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

const galleryImages = [
  { src: heroTravel, alt: "Vista aérea dos Lençóis Maranhenses ao pôr do sol" },
  { src: destMaldives, alt: "Lagoa cristalina entre dunas brancas" },
  { src: destGreece, alt: "Passeio de barco no Rio Preguiças" },
  { src: destSafari, alt: "Trekking nas dunas dos Lençóis" },
  { src: destPeru, alt: "Aventura de quadriciclo nas dunas" },
  { src: tourLagoaAzul2, alt: "Lagoa Azul vista de cima" },
  { src: tourLagoaAzul3, alt: "Pôr do sol nas dunas" },
];

const GallerySection = () => {
  const [lightbox, setLightbox] = useState<number | null>(null);

  const navigate = (dir: number) => {
    if (lightbox === null) return;
    setLightbox((lightbox + dir + galleryImages.length) % galleryImages.length);
  };

  return (
    <section className="py-20 md:py-28 bg-gradient-sand">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <p className="text-primary font-semibold tracking-widest uppercase text-sm mb-3">
            Galeria
          </p>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4">
            Momentos Inesquecíveis
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Confira algumas das paisagens que esperam por você.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {galleryImages.map((img, i) => (
            <button
              key={i}
              onClick={() => setLightbox(i)}
              className={`relative overflow-hidden rounded-2xl group cursor-pointer ${
                i === 0 ? "col-span-2 row-span-2" : ""
              }`}
            >
              <img
                src={img.src}
                alt={img.alt}
                className={`w-full object-cover group-hover:scale-110 transition-transform duration-500 ${
                  i === 0 ? "h-full min-h-[300px]" : "h-48 md:h-56"
                }`}
                loading="lazy"
              />
              <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/20 transition-colors duration-300" />
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-[60] bg-foreground/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setLightbox(null); }}
            className="absolute top-6 right-6 text-primary-foreground hover:text-secondary transition-colors"
          >
            <X size={32} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); navigate(-1); }}
            className="absolute left-4 md:left-8 text-primary-foreground hover:text-secondary transition-colors"
          >
            <ChevronLeft size={40} />
          </button>
          <img
            src={galleryImages[lightbox].src}
            alt={galleryImages[lightbox].alt}
            className="max-w-full max-h-[85vh] rounded-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={(e) => { e.stopPropagation(); navigate(1); }}
            className="absolute right-4 md:right-8 text-primary-foreground hover:text-secondary transition-colors"
          >
            <ChevronRight size={40} />
          </button>
          <p className="absolute bottom-6 text-primary-foreground/70 text-sm">
            {lightbox + 1} / {galleryImages.length}
          </p>
        </div>
      )}
    </section>
  );
};

export default GallerySection;
