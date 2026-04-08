import { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

const galleryImages = [
  { src: "https://rmetppilvfrxosvxzhgj.supabase.co/storage/v1/object/public/message-attachments/60888f4c-003c-49d2-ac08-29d093ab51ba/images/15babd7b9c95115530233e97a0c511c22d1b5b121ba8085dad67bd2bcbfe1771.jpg", alt: "Vista aérea dos Lençóis Maranhenses - Santo Amaro" },
  { src: "https://rmetppilvfrxosvxzhgj.supabase.co/storage/v1/object/public/message-attachments/60888f4c-003c-49d2-ac08-29d093ab51ba/images/1aa3423f5c22c613cc6496fea87a24984bcaaa0f88c4b7f9b8b0f9a26fe933f3.jpg", alt: "Lagoas cristalinas entre dunas brancas" },
  { src: "https://rmetppilvfrxosvxzhgj.supabase.co/storage/v1/object/public/message-attachments/60888f4c-003c-49d2-ac08-29d093ab51ba/images/95e5091826ba9da491908baf1a99f833508cfde59c8fc0dda66a1d463e387d4d.jpg", alt: "Passeio de barco no Lago da Jangada" },
  { src: "https://rmetppilvfrxosvxzhgj.supabase.co/storage/v1/object/public/message-attachments/60888f4c-003c-49d2-ac08-29d093ab51ba/images/4409e081a4e41c4d5542a5423322b643e4d2661cb79b5af26ba6d155cdc889cb.jpg", alt: "Roteiro Ecológico nas dunas" },
  { src: "https://rmetppilvfrxosvxzhgj.supabase.co/storage/v1/object/public/message-attachments/60888f4c-003c-49d2-ac08-29d093ab51ba/images/d48e2e91d3bad66962e7a55a3bd5e6d83a1d9ae980ee62e11435dacc7c53cc8d.jpg", alt: "Circuito Ponta Verde - Lagoa do Reflexo" },
  { src: "https://rmetppilvfrxosvxzhgj.supabase.co/storage/v1/object/public/message-attachments/60888f4c-003c-49d2-ac08-29d093ab51ba/images/c343feaa64286847d8cac53e1ae0d22ed3ad549cc8fd20e651c0c1dbbd65722f.jpg", alt: "Descida de caiaque no Rio Alegre" },
  { src: "https://rmetppilvfrxosvxzhgj.supabase.co/storage/v1/object/public/message-attachments/60888f4c-003c-49d2-ac08-29d093ab51ba/images/fa678fa8f5c51b5099f77844243a54902337a97cb8ecfbe37b4a166b2f57498a.jpg", alt: "Trekking nas dunas dos Lençóis" },
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
