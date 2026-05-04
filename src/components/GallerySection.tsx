import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";

const DEFAULT_GALLERY = [
  { src: "/src/assets/gallery-panorama-dunas.jpg", alt: "Panorama das dunas e lagoas ao pôr do sol" },
  { src: "/src/assets/gallery-banho-lagoa.jpg", alt: "Turistas nadando nas lagoas cristalinas dos Lençóis Maranhenses" },
  { src: "/src/assets/gallery-4x4-dunas.jpg", alt: "Passeio de 4x4 nas dunas dos Lençóis Maranhenses" },
  { src: "/src/assets/gallery-farol-mandacaru.jpg", alt: "Farol de Mandacaru - Lençóis Maranhenses" },
  { src: "/src/assets/gallery-por-do-sol.jpg", alt: "Pôr do sol deslumbrante nos Lençóis Maranhenses" },
  { src: "/src/assets/tour-lagoa-azul-2.jpg", alt: "Dunas brancas e lagoas azuis dos Lençóis Maranhenses - Santo Amaro" },
  { src: "/src/assets/tour-lagoa-azul-3.jpg", alt: "Vista aérea das lagoas cristalinas dos Lençóis" },
  { src: "/src/assets/tour-lagoas-azuis-hero.jpg", alt: "Experiência única nos Lençóis" },
  { src: "/src/assets/tour-rio-preguicas.jpg", alt: "Passeio de barco pelo Rio Preguiças" },
  { src: "/src/assets/tour-roteiro-ecologico.jpg", alt: "Belezas naturais preservadas" },
  { src: "/src/assets/tour-gastronomico.jpg", alt: "Sabores típicos da região" },
  { src: "/src/assets/tour-cultural.jpg", alt: "Cultura e tradições locais" },
  { src: "/src/assets/tour-caiaque.jpg", alt: "Aventura de caiaque" },
  { src: "/src/assets/tour-trekking.jpg", alt: "Trekking pelas dunas" },
  { src: "/src/assets/tour-quadriciclo.jpg", alt: "Adrenalina no quadriciclo" },
];

const GallerySection = () => {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [galleryImages, setGalleryImages] = useState(DEFAULT_GALLERY);
  const { t } = useTranslation();

  useEffect(() => {
    const loadGallery = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "gallery")
        .maybeSingle();
      
      if (data && Array.isArray((data.value as any)?.images)) {
        setGalleryImages((data.value as any).images);
      }
    };
    loadGallery();
  }, []);

  const navigate = (dir: number) => {
    if (lightbox === null) return;
    setLightbox((lightbox + dir + galleryImages.length) % galleryImages.length);
  };

  return (
    <section className="py-24 md:py-32 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <p className="text-primary font-bold tracking-[0.2em] uppercase text-xs mb-4 opacity-80">
            {t("gallery.label")}
          </p>
          <h2 className="font-display text-3xl md:text-6xl font-bold text-foreground mb-6">
            {t("gallery.title")}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
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
                className={`w-full object-cover aspect-square md:aspect-auto group-hover:scale-110 transition-transform duration-500 ${i === 0 ? "h-full min-h-[300px]" : "h-48 md:h-56"}`}
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
