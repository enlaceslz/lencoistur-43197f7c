import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Shield, CheckCircle, AlertTriangle, FileText, Pencil, Trash2, Users } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// Riscos inerentes conforme P6 VATTI
const RISKS_OPTIONS = [
  "Insolação e variações térmicas",
  "Interação com fauna local / Picadas de insetos",
  "Instabilidade climática e fenômenos naturais",
  "Danos ou perda de pertences pessoais",
  "Incidentes veiculares (Capotamento / Colisão)",
  "Riscos aquáticos (Quedas, Ingestão de água)",
  "Afogamento",
  "Incidentes em trilhas (Quedas / Entorses)",
  "Lesões de natureza grave ou gravíssima",
];

// Controles operacionais VATTI
const SAFETY_CONTROLS = [
  "Condutores certificados e treinados",
  "Treinamento contínuo em SGS",
  "Equipamentos de resgate a bordo",
  "Protocolos de Primeiros Socorros",
  "Briefing de segurança pré-saída",
  "Monitoramento de condições climáticas",
  "Plano de Resposta a Emergências (PRE)",
];

// Questões de saúde P6 VATTI
const HEALTH_QUESTIONS = [
  "Alergia", "Desmaios e/ou convulsões", "Cirurgia recente?", "Diabetes", 
  "Obeso/a", "Sedentário", "Com alguma parte do corpo imobilizada?", 
  "Portador de necessidades especiais?", "Fobia", "Sob efeito de álcool e/ou entorpecentes?",
  "Toma algum tipo de medicamento?"
];

const TermoAssinatura = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const bookingCode = params.get("booking") || "";
  const bookingIdParam = params.get("booking_id") || "";
  const termId = params.get("id") || "";
  
  const [booking, setBooking] = useState<any>(null);
  const [term, setTerm] = useState<any>(null);
  const [companions, setCompanions] = useState<any[]>([]);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const [acceptedRisks, setAcceptedRisks] = useState<string[]>([]);
  const [healthInfo, setHealthInfo] = useState<string[]>([]);
  const [signatures, setSignatures] = useState<{[key: string]: string}>({});
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (bookingCode || termId || bookingIdParam) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [bookingCode, termId, bookingIdParam]);

  const loadData = async () => {
    setLoading(true);
    try {
      const companyRes = await supabase.from("sgs_empresa").select("*").limit(1).maybeSingle();
      setCompany(companyRes.data);

      let bookingData = null;
      let termData = null;

      if (termId) {
        const termRes = await supabase.from("sgs_risk_terms").select("*, customers(*)").eq("id", termId).maybeSingle();
        if (termRes.data) {
          termData = termRes.data;
          if (termData.booking_id) {
            const bookingRes = await supabase.from("bookings").select("*, customers!fk_bookings_customer(*)").eq("id", termData.booking_id).maybeSingle();
            bookingData = bookingRes.data;
          } else if (bookingIdParam) {
            const bookingRes = await supabase.from("bookings").select("*, customers!fk_bookings_customer(*)").eq("id", bookingIdParam).maybeSingle();
            bookingData = bookingRes.data;
          }
        }
      } else if (bookingCode) {
        const bookingRes = await supabase.from("bookings").select("*, customers!fk_bookings_customer(*)").eq("booking_code", bookingCode).maybeSingle();
        bookingData = bookingRes.data;
        if (bookingData) {
          const termRes = await supabase.from("sgs_risk_terms").select("*").eq("booking_id", bookingData.id).maybeSingle();
          termData = termRes.data;
        }
      } else if (bookingIdParam) {
        const bookingRes = await supabase.from("bookings").select("*, customers!fk_bookings_customer(*)").eq("id", bookingIdParam).maybeSingle();
        bookingData = bookingRes.data;
      }

      if (bookingData || termData) {
        setBooking(bookingData);
        setTerm(termData);

        if (termData) {
          setAcceptedRisks(termData.risks_informed || []);
          setHealthInfo(termData.health_questions || []);
          
          const { data: companionsData } = await supabase
            .from("sgs_risk_term_minors")
            .select("*")
            .eq("risk_term_id", termData.id);
          
          if (companionsData) setCompanions(companionsData);

          const adultsNeedSigning = companionsData?.filter(c => c.is_adult && !c.signature_data).length === 0;
          if (termData.signature_data && adultsNeedSigning) {
            setSigned(true);
          }
        } else if (bookingData) {
          // No term yet, pre-load companions from booking and dependents table
          let preLoadedCompanions: any[] = [];
          
          // 1. Add companions from the booking record (if they were filled during checkout)
          if (bookingData.companions && Array.isArray(bookingData.companions)) {
            preLoadedCompanions = bookingData.companions.map((c: any, index: number) => ({
              id: `booking-comp-${index}`,
              full_name: c.name,
              is_adult: true, // Default to adult, user can adjust
              responsible_name: bookingData.customers?.name || bookingData.customer_name
            }));
          }

          // 2. Add dependents from the customer record
          const { data: dependentsData } = await supabase
            .from("dependents")
            .select("*")
            .eq("customer_id", bookingData.customer_id);
          
          if (dependentsData) {
            const existingNames = new Set(preLoadedCompanions.map(c => c.full_name.toLowerCase()));
            dependentsData.forEach(d => {
              if (!existingNames.has(d.name.toLowerCase())) {
                preLoadedCompanions.push({
                  id: d.id,
                  full_name: d.name,
                  is_adult: true,
                  responsible_name: bookingData.customers?.name || bookingData.customer_name
                });
              }
            });
          }

          setCompanions(preLoadedCompanions);
        }
      }
    } catch (err) {
      console.error("Error loading term data:", err);
    }
    setLoading(false);
  };

  const toggleHealth = (q: string) => {
    setHealthInfo(prev => 
      prev.includes(q) ? prev.filter(item => item !== q) : [...prev, q]
    );
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
    
    // Check main signature
    const blank = document.createElement('canvas');
    blank.width = canvas.width;
    blank.height = canvas.height;
    if (canvas.toDataURL() === blank.toDataURL()) {
      toast({ title: "Assinatura necessária", description: "O participante principal deve assinar no campo indicado.", variant: "destructive" });
      return;
    }

    // Check companion signatures if any adult
    const adultCompanions = companions.filter(c => c.is_adult);
    for (const companion of adultCompanions) {
      if (!signatures[companion.id] && !companion.signature_data) {
        toast({ title: "Assinatura pendente", description: `O dependente ${companion.full_name} deve assinar.`, variant: "destructive" });
        return;
      }
    }

    setSigning(true);
    const signatureData = canvas.toDataURL();

    try {
      let currentTermId = term?.id;

      if (!currentTermId) {
        // 1. Save term record if it doesn't exist
        const { data: termData, error: termError } = await supabase.from("sgs_risk_terms").insert([{
          booking_id: booking.id,
          customer_id: booking.customer_id,
          customer_name: booking.customers?.name || booking.customer_name || "Cliente",
          nationality: booking.customers?.country || "Brasil",
          phone: booking.customers?.phone || booking.customer_phone || "",
          email: booking.customers?.email || booking.customer_email || "",
          cpf: booking.customers?.cpf || "",
          birth_date: booking.customers?.birth_date || null,
          tour_name: booking.item_name || "Passeio",
          risks_informed: acceptedRisks,
          health_questions: healthInfo,
          safety_controls_informed: true,
          accepted: true,
          signature_data: signatureData,
          signed_at: new Date().toISOString(),
          term_date: new Date().toISOString().split('T')[0],
          cancellation_policy: "Conforme política da agência aceita no momento da reserva."
        }]).select().single();

        if (termError) throw termError;
        if (!termData) throw new Error("Erro ao criar o termo no banco de dados.");
        currentTermId = termData.id;
      } else {
        // Update existing term
        const { error: termError } = await supabase.from("sgs_risk_terms").update({
          risks_informed: acceptedRisks,
          health_questions: healthInfo,
          signature_data: signatureData,
          signed_at: new Date().toISOString(),
          term_date: new Date().toISOString().split('T')[0], // Atualiza a data do termo para o dia da assinatura
          accepted: true
        }).eq("id", currentTermId);

        if (termError) throw termError;
      }

      // 2. Save/Update companion signatures
      for (const companion of companions) {
        const signature = signatures[companion.id] || companion.signature_data;
        
        // Check if this specific companion already exists in sgs_risk_term_minors for this term
        const { data: existingMinor } = await supabase
          .from("sgs_risk_term_minors")
          .select("id")
          .eq("risk_term_id", currentTermId)
          .eq("full_name", companion.full_name)
          .maybeSingle();
        
        if (!existingMinor) {
          // If it's a new companion for this term
          const { error: minorError } = await supabase.from("sgs_risk_term_minors").insert([{
            risk_term_id: currentTermId,
            full_name: companion.full_name,
            is_adult: companion.is_adult,
            responsible_name: companion.responsible_name,
            signature_data: signature,
            signed_at: signature ? new Date().toISOString() : null
          }]);
          if (minorError) console.error("Error inserting companion:", minorError);
        } else {
          // It's an existing companion record, just update signature if provided
          const { error: minorError } = await supabase.from("sgs_risk_term_minors").update({
            signature_data: signature,
            signed_at: signature ? new Date().toISOString() : null
          }).eq("id", existingMinor.id);
          if (minorError) console.error("Error updating companion:", minorError);
        }
      }

      // 2. Generate PDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Header
      doc.setFillColor(0, 102, 204);
      doc.rect(0, 0, pageWidth, 40, 'F');
      doc.setFontSize(22);
      doc.setTextColor(255, 255, 255);
      doc.text("Termo de Ciência de Risco", pageWidth / 2, 20, { align: "center" });
      doc.setFontSize(10);
      doc.text("Sistema de Gestão de Segurança (SGS) - ISO 21103", pageWidth / 2, 30, { align: "center" });
      
      doc.setTextColor(0, 0, 0);
      let currentY = 50;
      
      // Booking Info
      doc.setFontSize(14);
      doc.text("Informações da Reserva", 14, currentY);
      currentY += 10;
      
      autoTable(doc, {
        startY: currentY,
        body: [
          ["Código da Reserva", booking.booking_code],
          ["Passeio / Atividade", booking.item_name],
          ["Data da Atividade", new Date(booking.date + "T12:00").toLocaleDateString("pt-BR")],
          ["Participante", booking.customers?.name || booking.customer_name],
          ["Documento / CPF", booking.customers?.cpf || "Não informado"],
        ],
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 3 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } }
      });
      
      currentY = (doc as any).lastAutoTable.finalY + 10;
      
      // Recommendations
      doc.setFontSize(11);
      doc.text("Recomendações e Informações:", 14, currentY);
      currentY += 5;
      doc.setFontSize(8);
      const recText = company?.term_recommendations || "Atividade não requer habilidade específica. Recomenda-se: saber nadar; trajes de banho e roupas confortáveis; levar toalha, casaco, chapéu, repelente e protetor solar; não usar acessórios; água e lanche. Não há sanitários no percurso.";
      doc.text(doc.splitTextToSize(recText, pageWidth - 28), 14, currentY);
      
      if (company?.term_safety_risks) {
        currentY += (doc.splitTextToSize(recText, pageWidth - 28).length * 4) + 5;
        doc.setFontSize(11);
        doc.text("Riscos e Segurança:", 14, currentY);
        currentY += 5;
        doc.setFontSize(8);
        doc.text(doc.splitTextToSize(company.term_safety_risks, pageWidth - 28), 14, currentY);
        currentY += (doc.splitTextToSize(company.term_safety_risks, pageWidth - 28).length * 4) + 5;
      } else {
        currentY += 12;
      }

      // Risks section with high contrast
      doc.setFontSize(14);
      doc.setTextColor(0, 102, 204);
      doc.text("Ciência de Riscos e Segurança", 14, currentY);
      currentY += 5;
      const risksRows = acceptedRisks.map(r => [`[X] ${r}`]);
      autoTable(doc, {
        startY: currentY,
        body: risksRows,
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 1, textColor: [51, 51, 51] }
      });
      
      currentY = (doc as any).lastAutoTable.finalY + 15;
      
      // Health
      doc.setFontSize(14);
      doc.text("Informações de Saúde", 14, currentY);
      currentY += 7;
      doc.setFontSize(10);
      const healthText = healthInfo.length > 0 ? `Condições informadas: ${healthInfo.join(", ")}` : "Nenhuma condição de saúde informada pelo participante.";
      doc.text(healthText, 14, currentY, { maxWidth: pageWidth - 28 });
      
      currentY += 15;

      // Companions
      if (companions.length > 0) {
        doc.setFontSize(14);
        doc.text("Autorização para Dependentes", 14, currentY);
        currentY += 5;
        const companionsRows = companions.map(c => [
          c.full_name, 
          c.is_adult ? "Adulto" : "Menor", 
          c.is_adult ? (signatures[c.id] || c.signature_data ? "Assinado" : "Pendente") : `Resp: ${c.responsible_name || '-'}`
        ]);
        autoTable(doc, {
          startY: currentY,
          head: [['Nome', 'Tipo', 'Status / Resp.']],
          body: companionsRows,
          theme: 'grid',
          styles: { fontSize: 9, cellPadding: 2 }
        });
        currentY = (doc as any).lastAutoTable.finalY + 15;
      }
      
      currentY += 5;
      
      // Declaration
      doc.setFontSize(12);
      doc.text("Declaração", 14, currentY);
      currentY += 7;
      doc.setFontSize(9);
      const declaration = `Declaro que fui informado sobre os riscos inerentes à atividade, bem como sobre os procedimentos de segurança. Comprometo-me a seguir as orientações da equipe técnica e assumo a responsabilidade por meus atos durante a execução do passeio. Observação: Esta operação segue as normas da ABNT NBR ISO 21103 e demais legislações pertinentes ao turismo de aventura. É de responsabilidade do contratante comunicar aos demais participantes que virão em sua companhia, todas as informações contidas neste documento.`;
      doc.text(doc.splitTextToSize(declaration, pageWidth - 28), 14, currentY);
      
      currentY += 25;
      
      // Signature
      doc.text("Assinatura Digital do Participante:", 14, currentY);
      doc.addImage(signatureData, 'PNG', 14, currentY + 5, 50, 20);
      doc.line(14, currentY + 26, 80, currentY + 26);
      doc.text(booking.customers?.name || booking.customer_name, 14, currentY + 31);
      doc.text(`Assinado em: ${new Date().toLocaleString("pt-BR")}`, 14, currentY + 36);

      const pdfBlob = doc.output('blob');
      const fileName = `termo_${booking?.booking_code || 'manual'}_${Date.now()}.pdf`;
      const filePath = `termos_assinados/${fileName}`;

      // 3. Upload to Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("customer-documents")
        .upload(filePath, pdfBlob, {
          contentType: 'application/pdf',
          cacheControl: '3600'
        });

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        // Continue even if storage fails, we still have the record
      }

      // 4. Save to CRM Customer Documents
      const customerId = booking?.customer_id || term?.customer_id;
      if (customerId) {
        const { error: docError } = await supabase.from("customer_documents").insert({
          customer_id: customerId,
          name: `Termo Assinado - ${booking?.item_name || term?.tour_name}`,
          file_url: supabase.storage.from("customer-documents").getPublicUrl(filePath).data.publicUrl,
          file_type: "application/pdf",
          file_size: pdfBlob.size,
          category: "termo"
        });
        if (docError) console.error("Error saving to customer_documents:", docError);
      }

      // Also save to generic Documents Module
      const { error: genericDocError } = await supabase.from("documents").insert({
        name: `Termo Assinado - ${booking?.item_name || term?.tour_name} - ${booking?.booking_code || 'SGS'}`,
        type: "termo_assinado",
        description: `Termo assinado por ${booking?.customers?.name || booking?.customer_name || term?.customer_name} em ${new Date().toLocaleDateString("pt-BR")}`,
        file_url: filePath,
        file_name: fileName,
        status: "vigente"
      });

      if (genericDocError) console.error("Error saving to generic documents:", genericDocError);

      // 5. Update term with PDF URL
      await supabase.from("sgs_risk_terms").update({ pdf_url: filePath }).eq("id", currentTermId);

      // 6. Send Confirmation Email
      try {
        await supabase.functions.invoke("send-term-email", {
          body: {
            customerEmail: booking?.customers?.email || booking?.customer_email || term?.customers?.email || term?.email,
            customerName: booking?.customers?.name || booking?.customer_name || term?.customer_name,
            signUrl: null, // Just a confirmation
            tourName: booking?.item_name || term?.tour_name
          }
        });
      } catch (emailErr) {
        console.error("Error calling send-term-email function:", emailErr);
      }

      toast({ title: "Termo Assinado!", description: "Obrigado por completar este passo de segurança." });
      setSigned(true);
      
    } catch (err: any) {
      console.error(err);
      toast({ title: "Erro ao processar", description: err.message || "Tente novamente ou fale com o suporte.", variant: "destructive" });
    } finally {
      setSigning(false);
    }
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
            {company && (
              <div className="mt-2 pt-2 border-t border-border/50 text-[10px] text-muted-foreground">
                <p><strong>{company.nome_fantasia || company.razao_social}</strong> • CNPJ: {company.cnpj}</p>
                <p>{company.endereco}, {company.cidade}-{company.estado}</p>
              </div>
            )}
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
                <h3 className="font-bold">Informações e Recomendações</h3>
              </div>
              <div className="text-sm text-muted-foreground leading-relaxed">
                {company?.term_recommendations ? (
                  <div className="whitespace-pre-wrap text-[13px] bg-muted/30 p-4 rounded-2xl border border-border/50">
                    {company.term_recommendations}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px]">
                    <div className="flex items-start gap-2">
                      <CheckCircle size={14} className="text-primary mt-0.5 flex-shrink-0" />
                      <span>Trajes de banho e roupas leves/confortáveis</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle size={14} className="text-primary mt-0.5 flex-shrink-0" />
                      <span>Levar toalha, casaco leve e óculos de sol</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle size={14} className="text-primary mt-0.5 flex-shrink-0" />
                      <span><strong>Uso de protetor solar e repelente</strong></span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle size={14} className="text-primary mt-0.5 flex-shrink-0" />
                      <span>Saber nadar (paradas em lagoas/rios)</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle size={14} className="text-primary mt-0.5 flex-shrink-0" />
                      <span>Evitar acessórios e joias</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle size={14} className="text-primary mt-0.5 flex-shrink-0" />
                      <span>Portar água e lanche leve</span>
                    </div>
                  </div>
                )}

                <div className="mt-4 bg-amber-500/5 border border-amber-500/10 rounded-xl p-3">
                  <p className="text-[11px] font-medium text-amber-700 leading-tight">
                    <AlertTriangle size={12} className="inline mr-1 -mt-0.5" />
                    Nota: Sanitários disponíveis apenas no embarque e pontos de parada específicos. Atividades podem ser suspensas por condições climáticas adversas.
                  </p>
                </div>
              </div>
            </div>

            {/* Safety Risks Content */}
            {company?.term_safety_risks && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-primary">
                  <Shield size={18} />
                  <h3 className="font-bold">Riscos e Cuidados com a Segurança</h3>
                </div>
                <div className="whitespace-pre-wrap text-[13px] bg-muted/30 p-4 rounded-2xl border border-border/50 leading-relaxed text-muted-foreground">
                  {company.term_safety_risks}
                </div>
              </div>
            )}

            {/* Health Questions */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 text-foreground">
                <Shield size={18} className="text-primary" />
                <h3 className="font-bold">Informações de Saúde</h3>
              </div>
              <p className="text-xs text-muted-foreground">Você possui alguma das condições abaixo? (Opcional)</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {HEALTH_QUESTIONS.map(q => (
                  <button 
                    key={q}
                    type="button"
                    onClick={() => toggleHealth(q)}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all ${healthInfo.includes(q) ? 'bg-primary/10 border-primary text-primary' : 'bg-muted/30 border-transparent text-muted-foreground hover:border-border'}`}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${healthInfo.includes(q) ? 'bg-primary border-primary' : 'border-muted-foreground/30'}`}>
                      {healthInfo.includes(q) && <CheckCircle size={10} className="text-white" />}
                    </div>
                    <span className="text-[10px] font-medium leading-tight">{q}</span>
                  </button>
                ))}
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

            {/* Companions Section */}
            {companions.length > 0 && (
              <div className="space-y-4 border-t border-border pt-6">
                <div className="flex items-center gap-2 text-foreground">
                  <Users size={18} className="text-primary" />
                  <h3 className="font-bold">Autorização para Dependentes</h3>
                </div>
                <div className="space-y-3">
                  {companions.map(companion => (
                    <div key={companion.id} className="bg-muted/30 border border-border/50 rounded-2xl p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-sm font-bold">{companion.full_name}</p>
                          <p className="text-[10px] text-muted-foreground uppercase font-semibold">
                            {companion.is_adult ? "Maior de Idade" : `Menor de Idade • Responsável: ${companion.responsible_name || 'Não informado'}`}
                          </p>
                        </div>
                        {companion.is_adult && (
                          <div className="flex flex-col items-end">
                            {companion.signature_data ? (
                              <span className="text-[10px] bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full font-bold">ASSINADO</span>
                            ) : (
                              <span className="text-[10px] bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full font-bold">ASSINATURA PENDENTE</span>
                            )}
                          </div>
                        )}
                      </div>

                      {companion.is_adult && !companion.signature_data && (
                        <div className="mt-3 space-y-2">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">Assinatura do Dependente:</p>
                          <div className="bg-white rounded-xl border border-border overflow-hidden h-32 relative">
                            <canvas 
                              id={`canvas-${companion.id}`}
                              className="w-full h-full cursor-crosshair touch-none"
                              onMouseDown={(e) => {
                                const canvas = e.currentTarget;
                                const ctx = canvas.getContext('2d');
                                if (!ctx) return;
                                ctx.lineWidth = 2;
                                ctx.lineCap = 'round';
                                ctx.strokeStyle = '#000';
                                const rect = canvas.getBoundingClientRect();
                                let lastX = e.clientX - rect.left;
                                let lastY = e.clientY - rect.top;
                                ctx.beginPath();
                                ctx.moveTo(lastX, lastY);

                                const handleMouseMove = (moveEvent: MouseEvent) => {
                                  const x = moveEvent.clientX - rect.left;
                                  const y = moveEvent.clientY - rect.top;
                                  ctx.lineTo(x, y);
                                  ctx.stroke();
                                };

                                const handleMouseUp = () => {
                                  window.removeEventListener('mousemove', handleMouseMove);
                                  window.removeEventListener('mouseup', handleMouseUp);
                                  setSignatures(prev => ({ ...prev, [companion.id]: canvas.toDataURL() }));
                                };

                                window.addEventListener('mousemove', handleMouseMove);
                                window.addEventListener('mouseup', handleMouseUp);
                              }}
                              onTouchStart={(e) => {
                                const canvas = e.currentTarget;
                                const ctx = canvas.getContext('2d');
                                if (!ctx) return;
                                ctx.lineWidth = 2;
                                ctx.lineCap = 'round';
                                ctx.strokeStyle = '#000';
                                const rect = canvas.getBoundingClientRect();
                                let lastX = e.touches[0].clientX - rect.left;
                                let lastY = e.touches[0].clientY - rect.top;
                                ctx.beginPath();
                                ctx.moveTo(lastX, lastY);

                                const handleTouchMove = (moveEvent: TouchEvent) => {
                                  moveEvent.preventDefault();
                                  const x = moveEvent.touches[0].clientX - rect.left;
                                  const y = moveEvent.touches[0].clientY - rect.top;
                                  ctx.lineTo(x, y);
                                  ctx.stroke();
                                };

                                const handleTouchEnd = () => {
                                  window.removeEventListener('touchmove', handleTouchMove);
                                  window.removeEventListener('touchend', handleTouchEnd);
                                  setSignatures(prev => ({ ...prev, [companion.id]: canvas.toDataURL() }));
                                };

                                window.addEventListener('touchmove', handleTouchMove, { passive: false });
                                window.addEventListener('touchend', handleTouchEnd);
                              }}
                            />
                            <button 
                              type="button"
                              onClick={(e) => {
                                const canvas = document.getElementById(`canvas-${companion.id}`) as HTMLCanvasElement;
                                if (canvas) {
                                  const ctx = canvas.getContext('2d');
                                  ctx?.clearRect(0, 0, canvas.width, canvas.height);
                                  setSignatures(prev => {
                                    const next = { ...prev };
                                    delete next[companion.id];
                                    return next;
                                  });
                                }
                              }}
                              className="absolute bottom-2 right-2 p-1.5 bg-muted/80 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {companion.signature_data && (
                        <div className="mt-2 flex flex-col items-center border-t border-dashed pt-2">
                           <img src={companion.signature_data} alt="Assinatura" className="h-12 object-contain" />
                           <p className="text-[8px] text-muted-foreground">Assinado em {new Date(companion.signed_at).toLocaleString('pt-BR')}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                Ao assinar este termo, declaro que li todas as informações e recomendações, que respondi as questões com total veracidade e que todas as minhas dúvidas foram sanadas. Comprometo-me a cumprir rigorosamente com os procedimentos de segurança e seguir as orientações da equipe da <strong>{company?.nome_fantasia || 'LENÇÓIS TOUR'}</strong>. Tenho plena ciência de que minha segurança e a do grupo dependem do cumprimento destas normas, e assumo a corresponsabilidade por meus atos durante a atividade. <strong>Observação:</strong> Esta operação segue as normas da ABNT NBR ISO 21103 e demais legislações pertinentes ao turismo de aventura. É de responsabilidade do contratante comunicar aos demais participantes que virão em sua companhia, todas as informações contidas neste documento.
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