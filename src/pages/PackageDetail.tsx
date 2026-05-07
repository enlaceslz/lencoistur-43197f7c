import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { ArrowLeft, Clock, Sparkles, CheckCircle, Shield, Info, ArrowRight, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/lib/utils";
import { ShareWithFriend } from "@/components/ShareWithFriend";

interface Package {
  id: string;
  name: string;
  slug: string;
  description: string;
  days: number;
  original_price: number;
  discount_price: number;
  tag: string;
  highlights: string[];
  package_tours?: any[];
}

const PackageDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [pkg, setPkg] = useState<Package | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPackage = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("packages")
        .select(`
          *,
          package_tours (
            tour:tours (*)
          )
        `)
        .eq("slug", slug)
        .eq("active", true)
        .maybeSingle();

      if (data) {
        setPkg(data);
      }
      setLoading(false);
    };

    fetchPackage();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <Loader2 className="animate-spin text-primary mb-4" size={48} />
        <p className="text-muted-foreground animate-pulse font-medium">Carregando experiências...</p>
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-6">
            <Info size={40} />
          </div>
          <h1 className="font-display text-2xl font-bold mb-2">Ops! Experiência não encontrada</h1>
          <p className="text-muted-foreground mb-8">O pacote que você está procurando pode ter sido removido ou o link está incorreto.</p>
          <Link to="/" className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold transition-all hover:bg-primary/90">
            Voltar para Início
          </Link>
        </div>
      </div>
    );
  }

  const pkgTours = (pkg.package_tours || []).map((pt: any) => pt.tour).filter(Boolean);
  const discount = pkg.original_price > 0 ? Math.round(((pkg.original_price - pkg.discount_price) / pkg.original_price) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-28 pb-20 container mx-auto px-4">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8">
          <ArrowLeft size={18} /> Voltar
        </button>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-secondary text-secondary-foreground text-xs font-bold px-3 py-1.5 rounded-full">{pkg.tag}</span>
                <span className="bg-destructive text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-full">Economia de {discount}%</span>
              </div>
              <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4">{pkg.name}</h1>
              <p className="text-muted-foreground text-lg leading-relaxed">{pkg.description}</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Clock size={24} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Duração</p>
                  <p className="text-lg font-bold text-foreground">{pkg.days} dias</p>
                </div>
              </div>
              <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Sparkles size={24} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Atividades</p>
                  <p className="text-lg font-bold text-foreground">{pkgTours.length} passeios inclusos</p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="font-display text-2xl font-bold text-foreground mb-6">O que está incluso neste pacote</h2>
              <div className="space-y-4">
                {pkgTours.map((tour, index) => (
                  <div key={tour.id} className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col md:flex-row gap-6 p-4">
                    <div className="w-full md:w-48 h-32 rounded-xl overflow-hidden shrink-0">
                      {tour.images?.[0] ? (
                        <img src={tour.images[0]} alt={tour.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <Info size={24} className="text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">{index + 1}</span>
                        <h3 className="font-display font-bold text-lg">{tour.name}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{tour.description}</p>
                      <Link to={`/passeios/${tour.slug}`} className="text-primary text-sm font-semibold hover:underline inline-flex items-center gap-1">
                        Ver detalhes <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
              <h3 className="font-display font-bold text-primary mb-4 flex items-center gap-2">
                <Shield size={20} /> Segurança e Garantia Lençóis Tour
              </h3>
              <ul className="space-y-3">
                {[
                  "Veículos 4x4 credenciados e revisados",
                  "Guias locais certificados pela ABETA",
                  "Sistema de Gestão de Segurança (SGS) ISO 21101",
                  "Seguro viagem incluso em todas as atividades",
                  "Cancelamento gratuito até 24h antes do início",
                ].map(item => (
                  <li key={item} className="flex items-start gap-3 text-sm text-foreground">
                    <CheckCircle size={16} className="text-primary mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Sidebar / Booking */}
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm sticky top-28">
              <div className="mb-6">
                <p className="text-sm text-muted-foreground line-through">De {formatCurrency(pkg.original_price)}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-primary font-display">{formatCurrency(pkg.discount_price)}</span>
                  <span className="text-muted-foreground">/ pessoa</span>
                </div>
                <p className="text-xs text-green-600 font-semibold mt-1">Você economiza {formatCurrency(pkg.original_price - pkg.discount_price)} neste combo!</p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <CheckCircle size={16} className="text-primary" /> Reserva Instantânea
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <CheckCircle size={16} className="text-primary" /> Sem taxas ocultas
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <CheckCircle size={16} className="text-primary" /> Pagamento Seguro
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <Link
                  to={`/checkout?type=package&id=${pkg.id}`}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2"
                >
                  Reservar Pacote
                </Link>
                <a
                  href={`https://wa.me/5598985880954?text=${encodeURIComponent(`Olá! Gostaria de reservar o ${pkg.name}.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full border border-border hover:bg-muted text-foreground py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                >
                  Falar com Especialista
                </a>
              </div>
              
              <div className="space-y-3">
                <ShareWithFriend itemName={pkg.name} itemUrl={window.location.href} />
                <p className="text-[10px] text-center text-muted-foreground mt-4">
                  Ao reservar, você concorda com nossos termos de uso e política de cancelamento.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PackageDetail;
