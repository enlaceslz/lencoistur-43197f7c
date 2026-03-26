import destMaldives from "@/assets/dest-maldives.jpg";
import destGreece from "@/assets/dest-greece.jpg";
import destSafari from "@/assets/dest-safari.jpg";
import destPeru from "@/assets/dest-peru.jpg";
import tourLagoaAzul2 from "@/assets/tour-lagoa-azul-2.jpg";
import tourLagoaAzul3 from "@/assets/tour-lagoa-azul-3.jpg";

export interface Tour {
  id: string;
  name: string;
  slug: string;
  images: string[];
  location: string;
  duration: string;
  rating: number;
  reviews: number;
  price: number;
  tag: string | null;
  description: string;
  includes: string[];
  highlights: string[];
  difficulty: string;
  groupSize: string;
  departure: string;
  operator: string;
}

export interface Review {
  id: string;
  tourId: string;
  author: string;
  avatar: string;
  rating: number;
  date: string;
  comment: string;
  country: string;
}

export const tours: Tour[] = [
  {
    id: "1",
    name: "Lagoa Azul",
    slug: "lagoa-azul",
    images: [destMaldives, tourLagoaAzul2, tourLagoaAzul3],
    location: "Lençóis Maranhenses",
    duration: "1 dia",
    rating: 4.9,
    reviews: 234,
    price: 180,
    tag: "Mais Vendido",
    description: "A Lagoa Azul é uma das lagoas mais famosas do Parque Nacional dos Lençóis Maranhenses. Com águas cristalinas de tom azul-turquesa cercadas por dunas de areia branca, este passeio oferece uma experiência única e inesquecível. O passeio inclui travessia de 4x4 pelas dunas, paradas para fotos e banho nas lagoas.",
    includes: ["Transporte 4x4", "Guia bilíngue", "Água e snacks", "Seguro viagem"],
    highlights: ["Banho na Lagoa Azul", "Travessia pelas dunas", "Pôr do sol nas dunas", "Fotos profissionais"],
    difficulty: "Fácil",
    groupSize: "Até 12 pessoas",
    departure: "Saída às 8h de Barreirinhas",
    operator: "Lençóis Tour",
  },
  {
    id: "2",
    name: "Lagoa Bonita",
    slug: "lagoa-bonita",
    images: [destGreece, tourLagoaAzul2, tourLagoaAzul3],
    location: "Lençóis Maranhenses",
    duration: "1 dia",
    rating: 4.8,
    reviews: 189,
    price: 160,
    tag: "Imperdível",
    description: "A Lagoa Bonita é acessada por uma trilha a pé pelas dunas, oferecendo vistas panorâmicas incríveis do parque. É o lugar perfeito para quem busca tranquilidade e contato direto com a natureza. Ao chegar, você terá uma das vistas mais deslumbrantes dos Lençóis Maranhenses.",
    includes: ["Transporte até a entrada", "Guia local", "Água", "Lanche"],
    highlights: ["Vista panorâmica das dunas", "Trilha guiada", "Banho na lagoa", "Contemplação do nascer do sol"],
    difficulty: "Moderada",
    groupSize: "Até 10 pessoas",
    departure: "Saída às 6h de Barreirinhas",
    operator: "Lençóis Tour",
  },
  {
    id: "3",
    name: "Atins & Caburé",
    slug: "atins-cabure",
    images: [destSafari, tourLagoaAzul3, destGreece],
    location: "Atins, Maranhão",
    duration: "1 dia",
    rating: 4.7,
    reviews: 156,
    price: 220,
    tag: null,
    description: "Passeio de barco pelo Rio Preguiças até a vila de Atins e o farol de Caburé. Conheça comunidades ribeirinhas, mangues preservados e praias desertas. Um dos roteiros mais completos da região com parada para almoço em restaurante local à beira-rio.",
    includes: ["Barco exclusivo", "Guia turístico", "Almoço regional", "Protetor solar"],
    highlights: ["Rio Preguiças", "Farol de Mandacaru", "Vila de Atins", "Praia de Caburé"],
    difficulty: "Fácil",
    groupSize: "Até 15 pessoas",
    departure: "Saída às 9h de Barreirinhas",
    operator: "Rio Preguiças Tour",
  },
  {
    id: "4",
    name: "Santo Amaro",
    slug: "santo-amaro",
    images: [destPeru, tourLagoaAzul2, destSafari],
    location: "Santo Amaro, Maranhão",
    duration: "2 dias",
    rating: 4.9,
    reviews: 98,
    price: 380,
    tag: "Aventura",
    description: "Expedição de 2 dias para Santo Amaro, o lado menos explorado dos Lençóis Maranhenses. Lagoas maiores, menos turistas e paisagens de tirar o fôlego. Inclui pernoite em pousada rústica e jantar típico maranhense.",
    includes: ["Transporte 4x4", "Guia especializado", "Pernoite", "Café da manhã e jantar", "Seguro"],
    highlights: ["Lagoa da Gaivota", "Lagoa da Betânia", "Pernoite sob as estrelas", "Comunidades locais"],
    difficulty: "Moderada",
    groupSize: "Até 8 pessoas",
    departure: "Saída às 7h de Barreirinhas",
    operator: "Santo Amaro Expedições",
  },
];

export const reviews: Review[] = [
  { id: "r1", tourId: "1", author: "Maria Silva", avatar: "MS", rating: 5, date: "2026-03-10", comment: "Experiência incrível! A Lagoa Azul é ainda mais bonita ao vivo. Guia muito atencioso e divertido.", country: "Brasil" },
  { id: "r2", tourId: "1", author: "John Smith", avatar: "JS", rating: 5, date: "2026-03-08", comment: "One of the best tours I've ever done. The landscape is surreal, like nothing else on Earth.", country: "USA" },
  { id: "r3", tourId: "1", author: "Ana Costa", avatar: "AC", rating: 4, date: "2026-03-05", comment: "Muito bonito! Só achei o percurso de 4x4 um pouco longo, mas valeu cada minuto.", country: "Brasil" },
  { id: "r4", tourId: "2", author: "Pedro Santos", avatar: "PS", rating: 5, date: "2026-02-28", comment: "A trilha é desafiadora mas a vista compensa 100%. Recomendo ir cedo para pegar o nascer do sol.", country: "Brasil" },
  { id: "r5", tourId: "3", author: "Sophie Martin", avatar: "SM", rating: 5, date: "2026-02-20", comment: "Le bateau sur le Rio Preguiças est magnifique. Atins est un paradis caché!", country: "França" },
  { id: "r6", tourId: "4", author: "Carlos Mendes", avatar: "CM", rating: 5, date: "2026-02-15", comment: "Santo Amaro é o verdadeiro Lençóis. Sem multidões, só natureza pura. Experiência transformadora.", country: "Brasil" },
];

export function getTourBySlug(slug: string): Tour | undefined {
  return tours.find((t) => t.slug === slug);
}

export function getReviewsByTourId(tourId: string): Review[] {
  return reviews.filter((r) => r.tourId === tourId);
}
