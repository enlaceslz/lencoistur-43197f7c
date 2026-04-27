const tourLagoasAzuis = "https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?auto=format&fit=crop&q=95&w=2560";
const tourRioPreguicas = "https://images.unsplash.com/photo-1506190500381-458919392ca3?auto=format&fit=crop&q=95&w=2560";
const tourEcologico = "https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?auto=format&fit=crop&q=95&w=2560";
const tourGastronomico = "https://images.unsplash.com/photo-1569336415962-a4bd9f67c07a?auto=format&fit=crop&q=95&w=2560";
const tourCultural = "https://images.unsplash.com/photo-1621303837174-89787a7d4729?auto=format&fit=crop&q=95&w=2560";
const tourCaiaque = "https://images.unsplash.com/photo-1625026214227-2c9cc0883658?auto=format&fit=crop&q=95&w=2560";
const tourTrekking = "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=95&w=2560";
const tourQuadriciclo = "https://images.unsplash.com/photo-1589112735741-26c6d04325a8?auto=format&fit=crop&q=95&w=2560";
const galleryBanho = "https://images.unsplash.com/photo-1632734490799-738914614a93?auto=format&fit=crop&q=95&w=2560";
const galleryPanorama = "https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?auto=format&fit=crop&q=95&w=2560";
const galleryFarol = "https://images.unsplash.com/photo-1506190500381-458919392ca3?auto=format&fit=crop&q=95&w=2560";
const gallery4x4 = "https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?auto=format&fit=crop&q=95&w=2560";
const galleryPorDoSol = "https://images.unsplash.com/photo-1569336415962-a4bd9f67c07a?auto=format&fit=crop&q=95&w=2560";

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
  category: string;
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
    name: "Lagoas Azuis",
    slug: "lagoas-azuis",
    images: [tourLagoasAzuis, galleryBanho, galleryPanorama],
    location: "Santo Amaro, Maranhão",
    duration: "Meio dia",
    rating: 4.9,
    reviews: 312,
    price: 150,
    tag: "Mais Vendido",
    description: "As famosas Lagoas Azuis são o cartão-postal do Parque Nacional dos Lençóis Maranhenses. Saindo de Santo Amaro, em menos de 7 minutos você já está nas dunas! O passeio de 4x4 credenciado leva você pelas dunas brancas até as lagoas de água cristalina azul-turquesa, onde você pode nadar, relaxar e tirar fotos incríveis. Os guias locais conhecem os melhores pontos e horários para fotos inesquecíveis.",
    includes: ["Transporte 4x4 credenciado", "Guia local especializado", "Água mineral", "Seguro viagem"],
    highlights: ["Banho nas Lagoas Azuis", "Travessia pelas dunas brancas", "Fotos panorâmicas", "Acesso em 7 min de Santo Amaro"],
    difficulty: "Fácil",
    groupSize: "Até 10 pessoas",
    departure: "Santo Amaro do Maranhão",
    operator: "Lençóis Tour",
    category: "Ecoturismo",
  },
  {
    id: "2",
    name: "Passeio de Barco - Rio Preguiças",
    slug: "passeio-de-barco",
    images: [tourRioPreguicas, galleryFarol, galleryPorDoSol],
    location: "Santo Amaro / Barreirinhas",
    duration: "1 dia",
    rating: 4.8,
    reviews: 245,
    price: 220,
    tag: "Imperdível",
    description: "Navegue pelo Rio Preguiças em um passeio de barco inesquecível! Conheça comunidades ribeirinhas, mangues preservados, o famoso Farol de Mandacaru com vista panorâmica, a vila de Atins e a praia de Caburé, onde o rio encontra o mar. Inclui parada para almoço regional com frutos do mar frescos à beira do rio.",
    includes: ["Barco com piloteiro experiente", "Guia turístico", "Almoço regional", "Paradas para banho"],
    highlights: ["Farol de Mandacaru", "Vila de Atins", "Praia de Caburé", "Comunidades ribeirinhas", "Mangues preservados"],
    difficulty: "Fácil",
    groupSize: "Até 15 pessoas",
    departure: "Barreirinhas",
    operator: "Lençóis Tour",
    category: "Passeio de Barco",
  },
  {
    id: "3",
    name: "Roteiro Ecológico",
    slug: "roteiro-ecologico",
    images: [tourEcologico, tourLagoasAzuis, galleryPanorama],
    location: "Santo Amaro, Maranhão",
    duration: "1 dia",
    rating: 4.7,
    reviews: 178,
    price: 180,
    tag: "Aventura",
    description: "O Roteiro Ecológico é ideal para quem busca contato profundo com a natureza. Percorra trilhas entre dunas, vegetação nativa e lagoas secretas que poucos turistas conhecem. Os guias locais, que nasceram e cresceram na região, revelam os segredos das dunas e da fauna local. Uma experiência de imersão total no ecossistema único dos Lençóis Maranhenses.",
    includes: ["Transporte 4x4", "Guia ecológico local", "Lanche natural", "Água"],
    highlights: ["Trilhas entre dunas", "Lagoas secretas", "Flora e fauna nativas", "Contato com comunidades locais"],
    difficulty: "Moderada",
    groupSize: "Até 8 pessoas",
    departure: "Santo Amaro do Maranhão",
    operator: "Lençóis Tour",
    category: "Ecoturismo",
  },
  {
    id: "4",
    name: "Passeio Gastronômico",
    slug: "passeio-gastronomico",
    images: [tourGastronomico, tourCultural, tourRioPreguicas],
    location: "Santo Amaro, Maranhão",
    duration: "Meio dia",
    rating: 4.9,
    reviews: 134,
    price: 200,
    tag: "Experiência",
    description: "Descubra a rica gastronomia maranhense neste roteiro exclusivo. Prove o famoso camarão da Malásia, peixes frescos do rio, torta de caranguejo e doces típicos. Visite restaurantes locais e conheça a culinária autêntica de Santo Amaro, acompanhado de guia que conta as histórias e tradições por trás de cada prato.",
    includes: ["Transporte", "Guia gastronômico", "Degustações incluídas", "Bebida local"],
    highlights: ["Camarão da Malásia", "Culinária maranhense", "Restaurantes locais", "História gastronômica"],
    difficulty: "Fácil",
    groupSize: "Até 10 pessoas",
    departure: "Santo Amaro do Maranhão",
    operator: "Lençóis Tour",
    category: "Gastronomia",
  },
  {
    id: "5",
    name: "Roteiro Cultural",
    slug: "roteiro-cultural",
    images: [tourCultural, tourGastronomico, galleryBanho],
    location: "Santo Amaro, Maranhão",
    duration: "Meio dia",
    rating: 4.6,
    reviews: 98,
    price: 160,
    tag: null,
    description: "Conheça a história, as tradições e a cultura de Santo Amaro do Maranhão. Visite comunidades locais, conheça artesãos, assista apresentações culturais e entenda como os moradores vivem em harmonia com o Parque Nacional. Um roteiro que vai muito além das paisagens, revelando a alma do povo maranhense.",
    includes: ["Transporte", "Guia cultural", "Visita a comunidades", "Lanche"],
    highlights: ["Artesanato local", "Tradições maranhenses", "Comunidades ribeirinhas", "Música e dança regional"],
    difficulty: "Fácil",
    groupSize: "Até 12 pessoas",
    departure: "Santo Amaro do Maranhão",
    operator: "Lençóis Tour",
    category: "Cultural",
  },
  {
    id: "6",
    name: "Descida de Caiaque",
    slug: "descida-de-caiaque",
    images: [tourCaiaque, tourRioPreguicas, galleryPorDoSol],
    location: "Santo Amaro, Maranhão",
    duration: "3-4 horas",
    rating: 4.8,
    reviews: 156,
    price: 250,
    tag: "Aventura",
    description: "Aventura radical nos rios da região! Desça de caiaque por águas calmas e trechos mais agitados, cercado pela vegetação exuberante dos Lençóis. Ideal para quem busca adrenalina aliada à natureza. Instrutores experientes acompanham todo o percurso, garantindo segurança e diversão.",
    includes: ["Caiaque e equipamentos", "Instrutor certificado", "Colete salva-vidas", "Lanche e água"],
    highlights: ["Descida em caiaque", "Paisagens exclusivas", "Contato com a natureza", "Adrenalina e diversão"],
    difficulty: "Moderada",
    groupSize: "Até 8 pessoas",
    departure: "Santo Amaro do Maranhão",
    operator: "Lençóis Tour",
    category: "Aventura",
  },
  {
    id: "7",
    name: "Trekking nas Dunas",
    slug: "trekking-nas-dunas",
    images: [tourTrekking, tourEcologico, galleryPanorama],
    location: "Santo Amaro, Maranhão",
    duration: "1 dia",
    rating: 4.9,
    reviews: 89,
    price: 190,
    tag: "Aventura",
    description: "Caminhada épica pelas dunas dos Lençóis Maranhenses. Trilha de nível moderado que leva a lagoas remotas, longe das rotas turísticas tradicionais. Ideal para aventureiros que querem conhecer o lado selvagem do parque. Inclui paradas para banho em lagoas cristalinas e pôr do sol inesquecível.",
    includes: ["Guia especializado em trekking", "Água e snacks", "Protetor solar", "Seguro"],
    highlights: ["Lagoas remotas", "Pôr do sol nas dunas", "Trilha exclusiva", "Fotos profissionais"],
    difficulty: "Moderada a Difícil",
    groupSize: "Até 6 pessoas",
    departure: "Santo Amaro do Maranhão",
    operator: "Lençóis Tour",
    category: "Aventura",
  },
  {
    id: "8",
    name: "Passeio de Quadriciclo",
    slug: "passeio-de-quadriciclo",
    images: [tourQuadriciclo, gallery4x4, tourLagoasAzuis],
    location: "Santo Amaro, Maranhão",
    duration: "2-3 horas",
    rating: 4.7,
    reviews: 201,
    price: 280,
    tag: "Popular",
    description: "Pilote um quadriciclo pelas trilhas e dunas dos Lençóis Maranhenses! Percorra caminhos exclusivos com paradas para banho nas lagoas. Um dos passeios mais procurados por quem busca emoção e liberdade. O famoso passeio de quadriciclo de Santo Amaro é uma experiência única.",
    includes: ["Quadriciclo", "Instrutor acompanhante", "Capacete e equipamentos", "Seguro"],
    highlights: ["Pilotagem nas dunas", "Trilhas exclusivas", "Parada nas lagoas", "Fotos de ação"],
    difficulty: "Moderada",
    groupSize: "Individual ou dupla",
    departure: "Santo Amaro do Maranhão",
    operator: "Lençóis Tour",
    category: "Aventura",
  },
];

export const reviews: Review[] = [
  {
    id: "r1", tourId: "1", author: "Rafael Almeida", avatar: "RA", rating: 5, date: "2026-03-15",
    comment: "Foi a melhor experiência que já tive em viagem no Brasil. O guia era super atencioso, explicou tudo sobre a região e ainda nos levou para ver o pôr do sol mais lindo da minha vida.",
    country: "Brasil"
  },
  {
    id: "r2", tourId: "1", author: "Reese Whitman", avatar: "RW", rating: 5, date: "2026-03-10",
    comment: "Visiting Lençóis with Lençóis Tour was an amazing experience. The guides were friendly, very professional, and took us to stunning spots I would never have found on my own. I highly recommend their tours.",
    country: "EUA"
  },
  {
    id: "r3", tourId: "1", author: "Carlos Menezes", avatar: "CM", rating: 5, date: "2026-03-05",
    comment: "Eu e minha família fomos surpreendidos pela organização do passeio. A Lençóis Tour pensou em cada parada, tirou fotos maravilhosas e deixou as crianças encantadas com as dunas.",
    country: "Brasil"
  },
  {
    id: "r4", tourId: "2", author: "Juliana Ribeiro", avatar: "JR", rating: 5, date: "2026-02-28",
    comment: "Fechei o roteiro completo com a agência e deu tudo certo: transfer pontual, pousada confortável e passeios incríveis nas lagoas. Recomendo muito a Lençóis Tour para quem quer praticidade.",
    country: "Brasil"
  },
  {
    id: "r5", tourId: "3", author: "Sophie Martin", avatar: "SM", rating: 5, date: "2026-02-20",
    comment: "Le roteiro ecológico est magnifique! La nature est incroyable et les guides connaissent chaque recoin des dunes. Une expérience inoubliable!",
    country: "França"
  },
  {
    id: "r6", tourId: "4", author: "Ana Costa", avatar: "AC", rating: 5, date: "2026-02-15",
    comment: "O camarão da Malásia de Santo Amaro é sensacional! O passeio gastronômico foi uma surpresa maravilhosa, cada parada melhor que a outra.",
    country: "Brasil"
  },
  {
    id: "r7", tourId: "6", author: "Pedro Santos", avatar: "PS", rating: 5, date: "2026-02-10",
    comment: "A descida de caiaque foi incrível! Adrenalina pura cercado por uma paisagem de tirar o fôlego. Os instrutores foram muito profissionais.",
    country: "Brasil"
  },
  {
    id: "r8", tourId: "8", author: "Maria Silva", avatar: "MS", rating: 4, date: "2026-01-20",
    comment: "Passeio de quadriciclo é imperdível! Super divertido e com paradas nas lagoas. Só achei um pouco curto, queria mais tempo!",
    country: "Brasil"
  },
];

export function getTourBySlug(slug: string): Tour | undefined {
  return tours.find((t) => t.slug === slug);
}

export function getReviewsByTourId(tourId: string): Review[] {
  return reviews.filter((r) => r.tourId === tourId);
}
