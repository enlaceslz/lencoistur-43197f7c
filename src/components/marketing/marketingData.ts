export const whatsappCampaigns = [
  { id: 1, name: "Promo Lençóis Julho", status: "ativa", sent: 1240, delivered: 1198, read: 876, clicked: 312, date: "2026-03-25" },
  { id: 2, name: "Lembrete Reservas Semana", status: "ativa", sent: 89, delivered: 87, read: 72, clicked: 45, date: "2026-03-28" },
  { id: 3, name: "Black Friday Antecipada", status: "finalizada", sent: 3200, delivered: 3100, read: 2450, clicked: 890, date: "2026-03-15" },
  { id: 4, name: "Recuperação Carrinho", status: "automática", sent: 156, delivered: 150, read: 120, clicked: 78, date: "2026-03-29" },
];

export const emailCampaigns = [
  { id: 1, name: "Newsletter Março", status: "enviada", recipients: 2400, opens: 864, clicks: 192, bounces: 48, date: "2026-03-20" },
  { id: 2, name: "Novos Passeios 2026", status: "rascunho", recipients: 0, opens: 0, clicks: 0, bounces: 0, date: "2026-03-30" },
  { id: 3, name: "Cupom Primeira Compra", status: "automática", recipients: 580, opens: 348, clicks: 145, bounces: 12, date: "2026-03-01" },
];

export const leads = [
  { id: 1, name: "Carlos Mendes", phone: "(98) 99123-4567", email: "carlos@email.com", source: "WhatsApp", interest: "Lençóis Completo", status: "quente", lastContact: "2026-03-29", score: 85 },
  { id: 2, name: "Ana Beatriz", phone: "(11) 98765-1234", email: "ana.b@email.com", source: "Site", interest: "Atins + Caburé", status: "morno", lastContact: "2026-03-27", score: 60 },
  { id: 3, name: "Pedro Alves", phone: "(21) 97654-3210", email: "pedro@email.com", source: "Instagram", interest: "Translado São Luís", status: "frio", lastContact: "2026-03-20", score: 25 },
  { id: 4, name: "Mariana Costa", phone: "(98) 98877-6655", email: "mari@email.com", source: "Indicação", interest: "Pacote Família", status: "quente", lastContact: "2026-03-30", score: 92 },
  { id: 5, name: "Roberto Lima", phone: "(85) 99988-7766", email: "roberto.l@email.com", source: "Google Ads", interest: "Day Use Lençóis", status: "abandonou", lastContact: "2026-03-22", score: 40 },
];

export const remarketingRules = [
  { id: 1, trigger: "Carrinho abandonado", delay: "30 min", channel: "WhatsApp", message: "Oi {nome}! Notamos que você não finalizou sua reserva para {passeio}. Precisa de ajuda? 😊", active: true, conversions: 34 },
  { id: 2, trigger: "Visitou passeio 2x sem reservar", delay: "24h", channel: "WhatsApp", message: "Olá {nome}! O passeio {passeio} é um dos nossos mais procurados. Que tal garantir sua vaga?", active: true, conversions: 18 },
  { id: 3, trigger: "Reserva concluída", delay: "48h", channel: "E-mail", message: "Sua aventura nos Lençóis está chegando! Confira dicas para aproveitar ao máximo.", active: true, conversions: 0 },
  { id: 4, trigger: "Pós-passeio (7 dias)", delay: "7 dias", channel: "E-mail + WhatsApp", message: "Como foi sua experiência? Avalie e ganhe 10% na próxima reserva!", active: false, conversions: 56 },
  { id: 5, trigger: "Aniversário do cliente", delay: "No dia", channel: "WhatsApp", message: "Feliz aniversário, {nome}! 🎂 Presente especial: 15% OFF em qualquer passeio!", active: true, conversions: 12 },
];
