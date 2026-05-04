import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";

const DEFAULT_GALLERY = [
  { src: "https://ppzdmxenxqsyebmsymro.supabase.co/storage/v1/object/public/tour-images/gallery/img-1777465186872-0.jpg", alt: "Panorama das dunas e lagoas ao pôr do sol" },
  { src: "https://ppzdmxenxqsyebmsymro.supabase.co/storage/v1/object/public/tour-images/gallery/img-1777465187850-1.jpeg", alt: "Turistas nadando nas lagoas cristalinas dos Lençóis Maranhenses" },
  { src: "https://ppzdmxenxqsyebmsymro.supabase.co/storage/v1/object/public/tour-images/gallery/img-1777465188808-2.webp", alt: "Passeio de 4x4 nas dunas dos Lençóis Maranhenses" },
  { src: "https://ppzdmxenxqsyebmsymro.supabase.co/storage/v1/object/public/tour-images/gallery/img-1777465186872-0.jpg", alt: "Farol de Mandacaru - Lençóis Maranhenses" },
  { src: "https://ppzdmxenxqsyebmsymro.supabase.co/storage/v1/object/public/tour-images/gallery/img-1777465187850-1.jpeg", alt: "Pôr do sol deslumbrante nos Lençóis Maranhenses" },
  { src: "https://ppzdmxenxqsyebmsymro.supabase.co/storage/v1/object/public/tour-images/gallery/img-1777465188808-2.webp", alt: "Dunas brancas e lagoas azuis dos Lençóis Maranhenses - Santo Amaro" }
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
