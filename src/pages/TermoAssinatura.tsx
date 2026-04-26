import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Shield, CheckCircle, AlertTriangle, FileText, Pencil, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

// Riscos inerentes conforme P6 VATTI
const RISKS_OPTIONS = [
  "Insolação e hipotermia",
  "Picadas de insetos e animais peçonhentos",
  "Mau tempo e mudanças climáticas repentinas",
  "Perda de objetos pessoais",
  "Capotamento ou tombamento do veículo",
  "Colisão com outro veículo",
  "Quedas na água",
  "Ingestão ou respiração de água",
  "Afogamento",
  "Lesões graves ou gravíssimas (traumatismos, escoriações)",
  "Queimadura solar",
  "Desidratação",
];

// Controles operacionais VATTI
const SAFETY_CONTROLS = [
  "Capacitação constante da equipe de condutores",
  "Cabo de resgate disponível em todas as operações",
  "Orientações de segurança por escrito e verbalmente",
  "Equipe capacitada em primeiros socorros",
  "Equipe preparada para realizar resgates",
  "Plano de Resposta a Emergências (PRE) implementado",
  "Veículos equipados com kit de segurança",
];

// Questões de saúde P6 VATTI
const HEALTH_QUESTIONS = [
  "Alergia", "Diabetes", "Desmaios/Convulsões", "Obeso(a)",
  "Cirurgia recente", "Sedentário(a)", "Parte do corpo imobilizada",
  "Necessidades especiais", "Fobia a água",
];

const TermoAssinatura = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const bookingCode = params.get("booking") || "";
  
  const [booking, setBooking] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const [acceptedRisks, setAcceptedRisks] = useState<string[]>([]);
  const [healthInfo, setHealthInfo] = useState<string[]>([]);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (bookingCode) {
      loadBooking();
    } else {
      setLoading(false);
    }
  }, [bookingCode]);

  const loadBooking = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("bookings")
      .select("*, customers(*)")
      .eq("booking_code", bookingCode)
      .maybeSingle();
      
    if (data) {
      setBooking(data);
      // Check if already signed
      const { data: termData } = await supabase
        .from("sgs_risk_terms")
        .select("id")
        .eq("booking_id", data.id)
        .maybeSingle();
      
      if (termData) {
        setSigned(true);
      }
    }
    setLoading(false);
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx?.beginPath();
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000";

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const toggleRisk = (risk: string) => {
    setAcceptedRisks(prev => 
      prev.includes(risk) ? prev.filter(r => r !== risk) : [...prev, risk]
    );
  };

  const handleSign = async () => {
    if (acceptedRisks.length === 0) {
      toast({ title: "Atenção", description: "Você precisa declarar ciência de todos os riscos marcando as opções.", variant: "destructive" });
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Check if canvas is empty (simplified)
    const blank = document.createElement('canvas');
    blank.width = canvas.width;
    blank.height = canvas.height;
    if (canvas.toDataURL() === blank.toDataURL()) {
      toast({ title: "Assinatura necessária", description: "Por favor, assine no campo indicado.", variant: "destructive" });
      return;
    }

    setSigning(true);
    const signatureData = canvas.toDataURL();

    const { error } = await supabase.from("sgs_risk_terms").insert({
      booking_id: booking.id,
      customer_name: booking.customers?.name || booking.customer_name,
      nationality: booking.customers?.nationality || "BR",
      phone: booking.customers?.phone || booking.customer_phone,
      tour_name: booking.item_name,
      risks_informed: acceptedRisks,
      accepted: true,
      signature_data: signatureData,
      signed_at: new Date().toISOString(),
      cancellation_policy: "Conforme política da agência aceita no momento da reserva."
    });

    if (error) {
      toast({ title: "Erro ao salvar", description: "Tente novamente ou fale com o suporte.", variant: "destructive" });
    } else {
      toast({ title: "Termo Assinado!", description: "Obrigado por completar este passo de segurança." });
      setSigned(true);
    }
    setSigning(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 container mx-auto px-4 max-w-lg text-center">
          <AlertTriangle size={48} className="text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Reserva não encontrada</h1>
          <p className="text-muted-foreground mb-8">Verifique o código da reserva no seu e-mail ou WhatsApp.</p>
          <Link to="/" className="bg-primary text-white px-6 py-2 rounded-xl">Voltar para Início</Link>
        </div>
      </div>
    );
  }

  if (signed) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 container mx-auto px-4 max-w-lg text-center">
          <CheckCircle size={64} className="text-green-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-4">Termo Assinado!</h1>
          <p className="text-muted-foreground mb-8">
            Você já assinou o Termo de Ciência de Risco para a reserva <strong>{bookingCode}</strong>. 
            Tudo pronto para sua aventura!
          </p>
          <div className="flex flex-col gap-3">
            <Link to="/minhas-reservas" className="bg-primary text-white px-6 py-3 rounded-xl font-semibold">Minhas Reservas</Link>
            <Link to="/" className="text-primary hover:underline">Voltar para Início</Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-32 pb-20 container mx-auto px-4 max-w-2xl">
        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
          {/* Header */}
          <div className="bg-primary/5 p-6 border-b border-border">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="text-primary" size={24} />
              <h1 className="font-display text-xl font-bold text-foreground">Gestão de Segurança (SGS)</h1>
            </div>
            <h2 className="text-sm font-semibold text-muted-foreground">Termo de Conhecimento de Risco e Corresponsabilidade</h2>
            <p className="text-xs text-muted-foreground mt-1">Conforme Norma ABNT NBR ISO 21103</p>
          </div>

          <div className="p-6 space-y-6">
            {/* Booking Summary */}
            <div className="bg-muted/50 rounded-2xl p-4 grid sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Passeio / Atividade</p>
                <p className="text-sm font-bold">{booking.item_name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Data</p>
                <p className="text-sm font-bold">{new Date(booking.date + "T12:00").toLocaleDateString("pt-BR")}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Participante</p>
                <p className="text-sm font-bold">{booking.customers?.name || booking.customer_name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Reserva</p>
                <p className="text-sm font-bold font-mono text-primary">{booking.booking_code}</p>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <FileText size={18} />
                <h3 className="font-bold">Informações Importantes</h3>
              </div>
              <div className="text-sm text-muted-foreground space-y-2 leading-relaxed">
                <p>O passeio será realizado em veículo 4x4 na região dos Lençóis Maranhenses. A atividade envolve deslocamento em terrenos irregulares, dunas e banho em lagoas naturais.</p>
                <p><strong>Recomendações:</strong> Traje de banho, protetor solar, chapéu, água e seguir rigorosamente as instruções do condutor/guia.</p>
              </div>
            </div>

            {/* Risks Checklist */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-amber-600">
                <AlertTriangle size={18} />
                <h3 className="font-bold">Ciência de Riscos</h3>
              </div>
              <p className="text-sm text-muted-foreground">Marque as opções abaixo para confirmar que você foi informado sobre os riscos inerentes à atividade:</p>
              <div className="grid sm:grid-cols-2 gap-2">
                {RISKS_OPTIONS.map(risk => (
                  <label key={risk} className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${acceptedRisks.includes(risk) ? 'bg-primary/5 border-primary/30 text-primary' : 'bg-muted/30 border-transparent text-muted-foreground hover:border-border'}`}>
                    <input type="checkbox" className="sr-only" checked={acceptedRisks.includes(risk)} onChange={() => toggleRisk(risk)} />
                    <div className={`w-5 h-5 rounded flex items-center justify-center border ${acceptedRisks.includes(risk) ? 'bg-primary border-primary' : 'border-muted-foreground/30'}`}>
                      {acceptedRisks.includes(risk) && <CheckCircle size={14} className="text-white" />}
                    </div>
                    <span className="text-xs font-medium">{risk}</span>
                  </label>
                ))}
              </div>
              <button 
                type="button" 
                onClick={() => setAcceptedRisks(RISKS_OPTIONS)}
                className="text-xs text-primary hover:underline font-semibold"
              >
                Ciente de todos os riscos acima
              </button>
            </div>

            {/* Signature Area */}
            <div className="space-y-4 border-t border-border pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-foreground">
                  <Pencil size={18} />
                  <h3 className="font-bold">Assinatura Digital</h3>
                </div>
                <button 
                  type="button" 
                  onClick={clearCanvas}
                  className="text-xs text-destructive hover:underline flex items-center gap-1"
                >
                  <Trash2 size={14} /> Limpar
                </button>
              </div>
              <p className="text-xs text-muted-foreground">Utilize o mouse ou o dedo (em telas touch) para assinar no campo branco abaixo:</p>
              
              <div className="border-2 border-dashed border-border rounded-2xl bg-white overflow-hidden touch-none">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={200}
                  className="w-full h-[200px] cursor-crosshair"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseOut={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
              </div>
            </div>

            {/* Declaration */}
            <div className="bg-secondary/5 border border-secondary/20 rounded-2xl p-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Ao assinar este termo, declaro que li todas as informações e recomendações, que respondi as questões com veracidade e que minhas dúvidas foram sanadas. Comprometo-me a cumprir com os procedimentos e seguir as orientações da equipe da <strong>LENÇÓIS TOUR</strong>. Tenho ciência de que qualquer ato meu contrário às informações recebidas pode causar danos à minha integridade física, os quais assumo integralmente.
              </p>
            </div>

            <button
              onClick={handleSign}
              disabled={signing}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 transition-all disabled:opacity-50 disabled:scale-100 active:scale-95"
            >
              {signing ? "Salvando..." : "Confirmar e Assinar Termo"}
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default TermoAssinatura;