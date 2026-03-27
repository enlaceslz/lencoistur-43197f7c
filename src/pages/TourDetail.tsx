import { useParams, Link } from "react-router-dom";
import { getTourBySlug, getReviewsByTourId } from "@/data/tours";
import { Star, MapPin, Clock, Users, ArrowLeft, Shield, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState } from "react";

const TourDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const tour = getTourBySlug(slug || "");
  const tourReviews = tour ? getReviewsByTourId(tour.id) : [];
  const [currentImg, setCurrentImg] = useState(0);
  const [guests, setGuests] = useState(2);
  const [selectedDate, setSelectedDate] = useState("");

  if (!tour) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold text-foreground mb-4">Passeio não encontrado</h1>
          <Link to="/passeios" className="text-primary hover:underline">Ver todos os passeios</Link>
        </div>
      </div>
    );
  }

  const totalPrice = tour.price * guests;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Breadcrumb */}
      <div className="pt-24 pb-4 container mx-auto px-4">
        <Link to="/passeios" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm">
          <ArrowLeft size={16} /> Voltar para passeios
        </Link>
      </div>

      <div className="container mx-auto px-4 pb-20">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Images + Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Gallery */}
            <div className="relative rounded-2xl overflow-hidden">
              <img
                src={tour.images[currentImg]}
                alt={tour.name}
                className="w-full h-[300px] md:h-[450px] object-cover"
                width={1200}
                height={800}
              />
              {tour.tag && (
                <span className="absolute top-4 left-4 bg-secondary text-secondary-foreground text-sm font-bold px-4 py-2 rounded-full">
                  {tour.tag}
                </span>
              )}
              {tour.images.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImg((p) => (p === 0 ? tour.images.length - 1 : p - 1))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-card/80 backdrop-blur-sm hover:bg-card p-2 rounded-full transition-colors"
                  >
                    <ChevronLeft size={20} className="text-foreground" />
                  </button>
                  <button
                    onClick={() => setCurrentImg((p) => (p === tour.images.length - 1 ? 0 : p + 1))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-card/80 backdrop-blur-sm hover:bg-card p-2 rounded-full transition-colors"
                  >
                    <ChevronRight size={20} className="text-foreground" />
                  </button>
                </>
              )}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {tour.images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImg(i)}
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${i === currentImg ? "bg-primary-foreground" : "bg-primary-foreground/40"}`}
                  />
                ))}
              </div>
            </div>

            {/* Thumbnails */}
            <div className="flex gap-3">
              {tour.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentImg(i)}
                  className={`rounded-xl overflow-hidden border-2 transition-colors ${i === currentImg ? "border-primary" : "border-transparent"}`}
                >
                  <img src={img} alt="" className="w-24 h-16 object-cover" loading="lazy" />
                </button>
              ))}
            </div>

            {/* Title & Meta */}
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">{tour.name}</h1>
              <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin size={16} className="text-primary" />{tour.location}</span>
                <span className="flex items-center gap-1"><Clock size={16} className="text-primary" />{tour.duration}</span>
                <span className="flex items-center gap-1"><Users size={16} className="text-primary" />{tour.groupSize}</span>
                <span className="flex items-center gap-1 text-secondary font-semibold">
                  <Star size={16} fill="currentColor" />{tour.rating} ({tour.reviews} avaliações)
                </span>
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className="font-display text-xl font-bold text-foreground mb-3">Sobre o Passeio</h2>
              <p className="text-muted-foreground leading-relaxed">{tour.description}</p>
            </div>

            {/* Highlights */}
            <div>
              <h2 className="font-display text-xl font-bold text-foreground mb-3">Destaques</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {tour.highlights.map((h) => (
                  <div key={h} className="flex items-center gap-3 bg-ocean-light rounded-xl px-4 py-3">
                    <CheckCircle size={18} className="text-primary shrink-0" />
                    <span className="text-foreground text-sm">{h}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Includes */}
            <div>
              <h2 className="font-display text-xl font-bold text-foreground mb-3">O que está incluso</h2>
              <div className="flex flex-wrap gap-3">
                {tour.includes.map((item) => (
                  <span key={item} className="bg-muted text-foreground px-4 py-2 rounded-full text-sm flex items-center gap-2">
                    <Shield size={14} className="text-primary" />{item}
                  </span>
                ))}
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Dificuldade", value: tour.difficulty },
                { label: "Grupo", value: tour.groupSize },
                { label: "Saída", value: tour.departure },
                { label: "Operador", value: tour.operator },
              ].map((item) => (
                <div key={item.label} className="bg-card border border-border rounded-xl p-4">
                  <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                  <p className="text-sm font-semibold text-foreground">{item.value}</p>
                </div>
              ))}
            </div>

            {/* Reviews */}
            <div>
              <h2 className="font-display text-xl font-bold text-foreground mb-4">
                Avaliações ({tourReviews.length})
              </h2>
              <div className="space-y-4">
                {tourReviews.map((review) => (
                  <div key={review.id} className="bg-card border border-border rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                          {review.avatar}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-sm">{review.author}</p>
                          <p className="text-xs text-muted-foreground">{review.country} · {new Date(review.date).toLocaleDateString("pt-BR")}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-secondary">
                        {Array.from({ length: review.rating }).map((_, i) => (
                          <Star key={i} size={14} fill="currentColor" />
                        ))}
                      </div>
                    </div>
                    <p className="text-muted-foreground text-sm">{review.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Booking Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-card border border-border rounded-2xl p-6 shadow-lg space-y-6">
              <div>
                <span className="text-xs text-muted-foreground">a partir de</span>
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-3xl font-bold text-primary">R$ {tour.price}</span>
                  <span className="text-muted-foreground text-sm">/ pessoa</span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1.5 block">Data do passeio</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1.5 block">Participantes</label>
                  <div className="flex items-center gap-4 bg-muted border border-border rounded-xl px-4 py-3">
                    <button
                      onClick={() => setGuests(Math.max(1, guests - 1))}
                      className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-colors font-bold"
                    >
                      -
                    </button>
                    <span className="flex-1 text-center font-semibold text-foreground">{guests}</span>
                    <button
                      onClick={() => setGuests(Math.min(12, guests + 1))}
                      className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-colors font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">R$ {tour.price} × {guests} pessoas</span>
                  <span className="text-foreground font-semibold">R$ {totalPrice}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Taxa de serviço</span>
                  <span className="text-foreground font-semibold">R$ 0</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t border-border pt-3">
                  <span className="text-foreground">Total</span>
                  <span className="text-primary">R$ {totalPrice}</span>
                </div>
              </div>

              <Link
                to={`/checkout?tour=${tour.slug}&pax=${guests}&date=${selectedDate}`}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-4 rounded-xl font-semibold text-lg transition-colors block text-center"
              >
                Reservar Agora
              </Link>

              <div className="flex items-center justify-center gap-2 text-muted-foreground text-xs">
                <Shield size={14} />
                <span>Cancelamento grátis até 24h antes</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default TourDetail;
