import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Qual a melhor época para visitar os Lençóis Maranhenses?",
    answer: "A melhor época é entre junho e agosto, quando as lagoas estão cheias após o período de chuvas (janeiro a maio). Porém, é possível encontrar lagoas de maio a novembro, dependendo do volume de chuvas do ano.",
  },
  {
    question: "Como chegar em Santo Amaro do Maranhão?",
    answer: "O acesso mais comum é via São Luís (MA). De lá, você pode pegar um transfer de van (4h30 de viagem) ou alugar um carro. Também é possível chegar por Barreirinhas e de lá seguir para Santo Amaro de Toyota 4x4 (3h).",
  },
  {
    question: "Preciso de preparo físico para os passeios?",
    answer: "Depende do roteiro. Passeios de 4x4 às lagoas são acessíveis para todas as idades. Já o trekking nas dunas exige um preparo moderado, com caminhadas de 2h a 4h sob sol. Temos roteiros para todos os perfis!",
  },
  {
    question: "Os passeios incluem transporte do hotel?",
    answer: "Sim! Todos os nossos passeios incluem busca e retorno na sua pousada ou hotel em Santo Amaro. Basta informar o endereço no momento da reserva.",
  },
  {
    question: "Posso cancelar minha reserva?",
    answer: "Sim. Oferecemos cancelamento gratuito até 24 horas antes do passeio. Após esse prazo, será cobrada uma taxa de 50% do valor. Em caso de mau tempo, reagendamos sem custo adicional.",
  },
  {
    question: "Quais formas de pagamento são aceitas?",
    answer: "Aceitamos PIX (com 5% de desconto), cartões de crédito (em até 3x sem juros), transferência bancária e dinheiro. O pagamento pode ser feito online no momento da reserva ou presencialmente.",
  },
  {
    question: "É seguro nadar nas lagoas?",
    answer: "Sim! As lagoas dos Lençóis são de água doce, rasas (geralmente até 3m) e sem correnteza. A temperatura da água é agradável (entre 25°C e 30°C). Nossos guias conhecem as lagoas mais seguras e bonitas.",
  },
  {
    question: "Crianças podem participar dos passeios?",
    answer: "Sim! Temos roteiros familiares ideais para crianças. Os passeios de 4x4 e as lagoas são perfeitos para famílias. Para trekking e quadriciclo, recomendamos idade mínima de 12 anos.",
  },
];

const FAQSection = () => {
  return (
    <section id="faq" className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <p className="text-primary font-semibold tracking-widest uppercase text-sm mb-3">
            Dúvidas Frequentes
          </p>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4">
            Perguntas & Respostas
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Tudo que você precisa saber antes de embarcar na sua aventura.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="bg-card border border-border rounded-2xl px-6 data-[state=open]:shadow-lg transition-shadow"
              >
                <AccordionTrigger className="text-left font-display font-semibold text-foreground hover:text-primary py-5 text-base">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            Não encontrou sua resposta?
          </p>
          <a
            href="https://wa.me/5598985880954"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-whatsapp hover:bg-whatsapp-hover text-primary-foreground px-6 py-3 rounded-xl font-semibold transition-colors"
          >
            📱 Fale Conosco no WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
