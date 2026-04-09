import { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

const galleryImages = [
  { src: "https://images.unsplash.com/photo-1704644411334-f6ca48963d6c?w=1200&q=90&auto=format&fit=crop", alt: "Dunas brancas e lagoas azuis dos Lençóis Maranhenses - Santo Amaro" },
  { src: "https://images.unsplash.com/photo-1650623598032-4fddce25b34f?w=1200&q=90&auto=format&fit=crop", alt: "Vista aérea das lagoas cristalinas entre dunas" },
  { src: "https://images.unsplash.com/photo-1680323535239-25b4b65eee75?w=1200&q=90&auto=format&fit=crop", alt: "Panorama das dunas e lagoas dos Lençóis Maranhenses" },
  { src: "https://images.unsplash.com/photo-1672271688662-3a03bbb75ec9?w=1200&q=90&auto=format&fit=crop", alt: "Lagoa cercada por dunas brancas em Santo Amaro" },
  { src: "https://images.unsplash.com/photo-1671385054651-f017771dea4a?w=1200&q=90&auto=format&fit=crop", alt: "Lagoa cristalina no coração dos Lençóis" },
  { src: "https://images.unsplash.com/photo-1679095007377-e6c8e13f9178?w=1200&q=90&auto=format&fit=crop", alt: "Farol de Mandacaru - Lençóis Maranhenses" },
  { src: "https://images.unsplash.com/photo-1561916108-2d4d48d132c8?w=1200&q=90&auto=format&fit=crop", alt: "Turistas nas lagoas dos Lençóis Maranhenses" },
];

const GallerySection = () => {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const { t } = useTranslation();

  const navigate = (dir: number) => {
    if (lightbox === null) return;
    setLightbox((lightbox + dir + galleryImages.length) % galleryImages.length);
  };

  return (
    <section className="py-20 md:py-28 bg-gradient-sand">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <p className="text-primary font-semibold tracking-widest uppercase text-sm mb-3">
            {t("gallery.label")}
          </p>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4">
            {t("gallery.title")}
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            {t("gallery.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {galleryImages.map((img, i) => (
            <button
              key={i}
              onClick={() => setLightbox(i)}
              className={`relative overflow-hidden rounded-2xl group cursor-pointer ${i === 0 ? "col-span-2 row-span-2" : ""}`}
            >
              <img
                src={img.src}
                alt={img.alt}
                className={`w-full object-cover group-hover:scale-110 transition-transform duration-500 ${i === 0 ? "h-full min-h-[300px]" : "h-48 md:h-56"}`}
                loading="lazy"
              />
              <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/20 transition-colors duration-300" />
            </button>
          ))}
        </div>
      </div>

      {lightbox !== null && (
        <div className="fixed inset-0 z-[60] bg-foreground/90 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button onClick={(e) => { e.stopPropagation(); setLightbox(null); }} className="absolute top-6 right-6 text-primary-foreground hover:text-secondary transition-colors"><X size={32} /></button>
          <button onClick={(e) => { e.stopPropagation(); navigate(-1); }} className="absolute left-4 md:left-8 text-primary-foreground hover:text-secondary transition-colors"><ChevronLeft size={40} /></button>
          <img src={galleryImages[lightbox].src} alt={galleryImages[lightbox].alt} className="max-w-full max-h-[85vh] rounded-2xl object-contain" onClick={(e) => e.stopPropagation()} />
          <button onClick={(e) => { e.stopPropagation(); navigate(1); }} className="absolute right-4 md:right-8 text-primary-foreground hover:text-secondary transition-colors"><ChevronRight size={40} /></button>
          <p className="absolute bottom-6 text-primary-foreground/70 text-sm">{lightbox + 1} / {galleryImages.length}</p>
        </div>
      )}
    </section>
  );
};

export default GallerySection;
