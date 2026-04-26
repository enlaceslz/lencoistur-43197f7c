import { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
const galleryLagoasAzuis = "https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?auto=format&fit=crop&q=95&w=2560";
const galleryBanho = "https://images.unsplash.com/photo-1621303837174-89787a7d4729?auto=format&fit=crop&q=95&w=2560";
const galleryPanorama = "https://images.unsplash.com/photo-1616421004128-40656a877073?auto=format&fit=crop&q=95&w=2560";
const galleryFarol = "https://images.unsplash.com/photo-1506190500381-458919392ca3?auto=format&fit=crop&q=95&w=2560";
const gallery4x4 = "https://images.unsplash.com/photo-1569336415962-a4bd9f67c07a?auto=format&fit=crop&q=95&w=2560";
const galleryPorDoSol = "https://images.unsplash.com/photo-1511216335778-7cb8f49fa7a3?auto=format&fit=crop&q=95&w=2560";
const galleryAerial = "https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?auto=format&fit=crop&q=95&w=2560";

const galleryImages = [
  { src: galleryLagoasAzuis, alt: "Dunas brancas e lagoas azuis dos Lençóis Maranhenses - Santo Amaro" },
  { src: galleryBanho, alt: "Turistas nadando nas lagoas cristalinas dos Lençóis Maranhenses" },
  { src: galleryPanorama, alt: "Panorama das dunas e lagoas ao pôr do sol" },
  { src: galleryFarol, alt: "Farol de Mandacaru - Lençóis Maranhenses" },
  { src: gallery4x4, alt: "Passeio de 4x4 nas dunas dos Lençóis Maranhenses" },
  { src: galleryPorDoSol, alt: "Pôr do sol deslumbrante nos Lençóis Maranhenses" },
  { src: galleryCaiaque, alt: "Caiaque nas lagoas cristalinas dos Lençóis" },
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
