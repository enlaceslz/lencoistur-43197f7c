import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";

const FAQSection = () => {
  const { t } = useTranslation();
  const items = (t("faq.items", { returnObjects: true }) as { q: string; a: string }[]) || [];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };

  return (
    <section id="faq" className="py-24 md:py-32 bg-gradient-to-b from-white to-ocean-light/20">
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <p className="text-primary font-bold tracking-[0.2em] uppercase text-xs mb-4 opacity-80">
            {t("faq.label")}
          </p>
          <h2 className="font-display text-4xl md:text-6xl font-bold text-foreground mb-6">
            {t("faq.title")}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t("faq.subtitle")}
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-3">
            {items.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="bg-card border border-border rounded-2xl px-6 data-[state=open]:shadow-lg transition-shadow"
              >
                <AccordionTrigger className="text-left font-display font-semibold text-foreground hover:text-primary py-5 text-base">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pb-5">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            {t("faq.notFound")}
          </p>
          <a
            href="https://wa.me/5598985880954"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-whatsapp hover:bg-whatsapp-hover text-primary-foreground px-6 py-3 rounded-xl font-semibold transition-colors"
          >
            {t("faq.whatsappCta")}
          </a>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
