import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Shield, CheckCircle, AlertTriangle, Phone, FileText, Activity, Users, Award, ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

const Seguranca = () => {
  const { t } = useTranslation();

  const isoStandards = [
    {
      id: "21101",
      title: "ABNT NBR ISO 21101",
      subtitle: "Gestão da Segurança",
      desc: "Estabelece os requisitos para o nosso Sistema de Gestão de Segurança (SGS), abrangendo planejamento, operação e melhoria contínua.",
    },
    {
      id: "21102",
      title: "ABNT NBR ISO 21102",
      subtitle: "Competência de Líderes",
      desc: "Define as competências necessárias para nossos guias e condutores, garantindo que estejam preparados para gerenciar riscos.",
    },
    {
      id: "21103",
      title: "ABNT NBR ISO 21103",
      subtitle: "Informação aos Participantes",
      desc: "Garante que você receba informações claras sobre a atividade, seus riscos e requisitos antes de iniciar sua aventura.",
    },
  ];

  const safetyCommitments = [
    "Veículos 4x4 revisados e equipados com kits de emergência.",
    "Equipe treinada em primeiros socorros e resgate em áreas remotas.",
    "Monitoramento constante das condições climáticas e do terreno.",
    "Briefing de segurança detalhado antes de cada passeio.",
    "Sistema de Gestão de Segurança (SGS) auditado internamente.",
    "Uso de equipamentos de comunicação (Rádio/GPS) em todos os roteiros.",
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-ocean-light/30">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-bold mb-6">
            <Shield size={16} />
            <span>SGS — Sistema de Gestão de Segurança</span>
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-bold text-foreground mb-6">
            Sua Segurança é Nossa <br className="hidden md:block" /> <span className="text-primary">Prioridade Máxima</span>
          </h1>
          <p className="max-w-2xl mx-auto text-muted-foreground text-lg mb-8">
            Na Lençóis Tour, acreditamos que o turismo responsável começa com a segurança. 
            Operamos em total conformidade com as normas técnicas brasileiras e internacionais.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/passeios" className="bg-primary text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all">
              Conheça nossos roteiros
            </Link>
            <a href="#iso" className="bg-white text-foreground border border-border px-8 py-4 rounded-2xl font-bold hover:bg-muted transition-all">
              Normas ISO
            </a>
          </div>
        </div>
      </section>

      {/* ISO Section */}
      <section id="iso" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Padrões Internacionais</h2>
            <p className="text-muted-foreground">Alinhamento total com as normas ABNT NBR ISO para Turismo de Aventura.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {isoStandards.map((iso) => (
              <div key={iso.id} className="bg-ocean-light/20 p-8 rounded-3xl border border-primary/10 hover:shadow-xl transition-all">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                  <Award className="text-primary" size={24} />
                </div>
                <h3 className="font-display font-bold text-xl mb-1">{iso.title}</h3>
                <p className="text-primary font-semibold text-sm mb-4">{iso.subtitle}</p>
                <p className="text-muted-foreground text-sm leading-relaxed">{iso.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Commitments */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">Compromisso com o Bem-Estar</h2>
              <p className="text-muted-foreground mb-8">
                Nossa gestão de segurança transcende a mera prevenção de acidentes; ela é um pilar fundamental do turismo responsável. 
                Ao adotar práticas robustas, demonstramos compromisso com o bem-estar do turista e a sustentabilidade do destino.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                {safetyCommitments.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 bg-white p-4 rounded-2xl border border-border shadow-sm">
                    <CheckCircle className="text-secondary mt-1 flex-shrink-0" size={18} />
                    <span className="text-sm font-medium text-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square bg-primary/5 rounded-full absolute -top-10 -right-10 w-64 h-64 -z-10 animate-pulse"></div>
              <div className="bg-white border border-border rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full"></div>
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center">
                    <Phone className="text-destructive" size={32} />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-xl">Emergência?</h3>
                    <p className="text-muted-foreground text-sm">Canais de resposta rápida 24h</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-2xl">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-1">Central Lençóis Tour</p>
                    <p className="text-lg font-bold text-primary font-mono">(98) 98588-0954</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-2xl">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-1">Ambulância (SAMU)</p>
                    <p className="text-lg font-bold text-foreground font-mono">192</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-2xl">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-1">Bombeiros</p>
                    <p className="text-lg font-bold text-foreground font-mono">193</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-6 text-center italic">
                  * Nossa equipe possui Plano de Resposta a Emergências (PRE) <br /> treinado e atualizado.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Transparência Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="font-display text-3xl font-bold mb-6">Transparência e Documentação</h2>
          <p className="text-muted-foreground mb-10">
            Nossa Política de Segurança e Plano de Gestão estão disponíveis para consulta pública. 
            Acreditamos que um turista bem informado é um turista mais seguro.
          </p>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="p-6 border border-border rounded-3xl text-left bg-muted/20">
              <FileText className="text-primary mb-4" size={32} />
              <h3 className="font-bold mb-2">P1 — Política de Segurança</h3>
              <p className="text-xs text-muted-foreground mb-4">Relatório oficial descrevendo nossas diretrizes e compromissos com a segurança conforme ISO 21101.</p>
              <Link to="/admin/sgs" className="text-primary text-sm font-bold flex items-center gap-1 hover:underline">
                Visualizar documento <ExternalLink size={14} />
              </Link>
            </div>
            <div className="p-6 border border-border rounded-3xl text-left bg-muted/20">
              <Shield className="text-primary mb-4" size={32} />
              <h3 className="font-bold mb-2">Informações aos Participantes</h3>
              <p className="text-xs text-muted-foreground mb-4">Manual de orientações básicas sobre riscos, equipamentos e conduta segura durante os passeios.</p>
              <Link to="/passeios" className="text-primary text-sm font-bold flex items-center gap-1 hover:underline">
                Acesse nossos roteiros <ExternalLink size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto bg-primary rounded-[40px] p-8 md:p-16 text-white shadow-2xl shadow-primary/20 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-br-full"></div>
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-6">Pronto para sua Aventura?</h2>
            <p className="text-white/80 text-lg mb-10">
              Agora que você sabe que está em boas mãos, que tal escolher o roteiro perfeito para sua viagem?
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/passeios" className="bg-white text-primary px-8 py-4 rounded-2xl font-bold hover:bg-muted transition-all">
                Ver todos os passeios
              </Link>
              <Link to="/minhas-reservas" className="bg-primary-dark text-white border border-white/20 px-8 py-4 rounded-2xl font-bold hover:bg-primary-dark/80 transition-all">
                Minhas reservas
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Seguranca;