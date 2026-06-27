import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import ToursSection from "@/components/ToursSection";
import GallerySection from "@/components/GallerySection";
import PackagesSection from "@/components/PackagesSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import WhyUsSection from "@/components/WhyUsSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import FAQSection from "@/components/FAQSection";
import PartnersSection from "@/components/PartnersSection";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import AIChatbot from "@/components/AIChatbot";
import SEO from "@/components/SEO";

const Index = () => {
  return (
    <div className="min-h-screen">
      <SEO
        title="Lençóis Tour — Passeios e transfers nos Lençóis Maranhenses"
        description="Saia de Santo Amaro e chegue às Lagoas Azuis em 7 minutos. 4x4 licenciados, guias locais e 8 rotas exclusivas de ecoturismo e aventura."
        path="/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "TravelAgency",
          name: "Lençóis Tour Experience",
          url: "https://lencoistur.lovable.app",
          areaServed: "Santo Amaro do Maranhão, MA",
          telephone: "+55 98 98588-0954",
        }}
      />
      <Navbar />
      <HeroSection />
      <AboutSection />
      <ToursSection />
      <GallerySection />
      <PackagesSection />
      <HowItWorksSection />
      <WhyUsSection />
      <TestimonialsSection />
      <FAQSection />
      <PartnersSection />
      <Footer />
      <WhatsAppFloat />
      <AIChatbot />
    </div>
  );
};

export default Index;
