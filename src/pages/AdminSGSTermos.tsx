import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Plus, CheckCircle, XCircle, Shield, FileText, Printer, Users, Trash2, UserPlus, Search, Edit, Eye, Settings, Save, Send, Link as LinkIcon, Loader2, MessageCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { ptBR } from "date-fns/locale";
import { formatDate } from "@/lib/utils";

const HEALTH_QUESTIONS_LIST = [
  { id: "has_allergy", label: "Alergia", detailKey: "allergy_details" },
  { id: "has_fainting_convulsions", label: "Desmaios e/ou convulsões" },
  { id: "recent_surgery", label: "Cirurgia recente?" },
  { id: "has_diabetes", label: "Diabetes" },
  { id: "is_obese", label: "Obeso/a" },
  { id: "is_sedentary", label: "Sedentário" },
  { id: "has_immobilized_part", label: "Com alguma parte do corpo imobilizada?" },
  { id: "has_special_needs", label: "Portador de necessidades especiais?" },
  { id: "has_phobia", label: "Fobia", detailKey: "phobia_details" },
  { id: "under_influence", label: "Está sob efeito de álcool e/ou entorpecentes?" },
  { id: "takes_medication", label: "Toma algum tipo de medicamento?", detailKey: "medication_details" },
];

const maskCPF = (v: string) => {
  const n = v.replace(/\D/g, "");
  if (n.length === 11) return n.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  return n;
};

const formatPhone = (v: string) => {
  const n = v.replace(/\D/g, "");
  if (n.startsWith("55") && n.length >= 12) {
    const ddd = n.substring(2, 4);
    const rest = n.substring(4);
    if (rest.length === 9) return `+55 (${ddd}) ${rest.substring(0, 5)}-${rest.substring(5)}`;
    if (rest.length === 8) return `+55 (${ddd}) ${rest.substring(0, 4)}-${rest.substring(4)}`;
  }
  if (n.length <= 10) return n.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  if (n.length === 11) return n.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  return v.startsWith("+") ? v : (v ? `+${v}` : "");
};

const AdminSGSTermos = () => {
  const [terms, setTerms] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [tours, setTours] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos"); // "todos", "assinado", "pendente"
  const [company, setCompany] = useState<any>(null);

  const [termConfig, setTermConfig] = useState({
    term_recommendations: "",
    term_safety_risks: ""
  });

  const [sendingEmail, setSendingEmail] = useState<string | null>(null);

  const [form, setForm] = useState({
    customer_id: "",
    booking_id: "",
    tour_id: "",
    vehicle_id: "",
    has_allergy: false,
    allergy_details: "",
    has_fainting_convulsions: false,
    recent_surgery: false,
    has_diabetes: false,
    is_obese: false,
    is_sedentary: false,
    has_immobilized_part: false,
    has_special_needs: false,
    has_phobia: false,
    phobia_details: "",
    under_influence: false,
    takes_medication: false,
    medication_details: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    term_date: formatDate(new Date(), "yyyy-MM-dd"),
    minors: [] as any[],
  });

  const [minorForm, setMinorForm] = useState({ full_name: "", cpf: "", birth_date: "", is_adult: false, responsible_name: "" });

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    const [termsRes, customersRes, toursRes, vehiclesRes, companyRes, bookingsRes] = await Promise.all([
      supabase.from("sgs_risk_terms").select("*, customers(*), tours(name), sgs_veiculos(modelo)").order("created_at", { ascending: false }),
      supabase.from("customers").select("*"),
      supabase.from("tours").select("id, name, description, duration, price, private_price").eq("active", true).order("name"),
      supabase.from("sgs_veiculos").select("id, modelo, placa"),
      supabase.from("sgs_empresa").select("*").limit(1).maybeSingle(),
      supabase.from("bookings").select("id, booking_code, item_name, customer_id").order("created_at", { ascending: false }),
    ]);

    setTerms((termsRes.data || []).map(t => ({
      ...t,
      customers: t.customers ? { ...t.customers, cpf: t.customers.cpf ? maskCPF(t.customers.cpf) : null } : null
    })));
    setCustomers((customersRes.data || []).map(c => ({
      ...c,
      cpf: c.cpf ? maskCPF(c.cpf) : null
    })));
    setTours(toursRes.data || []);
    setVehicles(vehiclesRes.data || []);
    setBookings(bookingsRes.data || []);
    setCompany(companyRes.data);
    if (companyRes.data) {
      setTermConfig({
        term_recommendations: companyRes.data.term_recommendations || "",
        term_safety_risks: companyRes.data.term_safety_risks || ""
      });
    }
    setLoading(false);
  };

  const handleSaveConfig = async () => {
    if (!company) return;
    const { error } = await supabase
      .from("sgs_empresa")
      .update({
        term_recommendations: termConfig.term_recommendations,
        term_safety_risks: termConfig.term_safety_risks,
        updated_at: new Date().toISOString()
      })
      .eq("id", company.id);

    if (error) {
      toast({ title: "Erro ao salvar configurações", variant: "destructive" });
    } else {
      toast({ title: "Configurações salvas com sucesso!" });
      setShowConfig(false);
      load();
    }
  };

  const addMinor = () => {
    if (!minorForm.full_name) return;
    setForm(f => ({ ...f, minors: [...f.minors, { ...minorForm, id: Math.random().toString() }] }));
    setMinorForm({ full_name: "", cpf: "", birth_date: "", is_adult: false, responsible_name: "" });
  };

  const removeMinor = (id: string) => {
    setForm(f => ({ ...f, minors: f.minors.filter(m => m.id !== id) }));
  };

  const handleEdit = async (term: any) => {
    setEditingId(term.id);
    
    // Load minors for this term
    const { data: minorsData } = await supabase
      .from("sgs_risk_term_minors")
      .select("*")
      .eq("risk_term_id", term.id);

    setForm({
      customer_id: term.customer_id,
      booking_id: term.booking_id || "",
      tour_id: term.tour_id,
      vehicle_id: term.vehicle_id || "",
      has_allergy: term.has_allergy,
      allergy_details: term.allergy_details || "",
      has_fainting_convulsions: term.has_fainting_convulsions,
      recent_surgery: term.recent_surgery,
      has_diabetes: term.has_diabetes,
      is_obese: term.is_obese,
      is_sedentary: term.is_sedentary,
      has_immobilized_part: term.has_immobilized_part,
      has_special_needs: term.has_special_needs,
      has_phobia: term.has_phobia,
      phobia_details: term.phobia_details || "",
      under_influence: term.under_influence,
      takes_medication: term.takes_medication,
      medication_details: term.medication_details || "",
      emergency_contact_name: term.emergency_contact_name || "",
      emergency_contact_phone: term.emergency_contact_phone || "",
      term_date: term.term_date,
      minors: minorsData || [],
    });
    
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este termo?")) return;

    // Delete minors first (cascade might be on, but being safe)
    await supabase.from("sgs_risk_term_minors").delete().eq("risk_term_id", id);
    
    const { error } = await supabase.from("sgs_risk_terms").delete().eq("id", id);

    if (error) {
      toast({ title: "Erro ao excluir termo", variant: "destructive" });
    } else {
      toast({ title: "Termo excluído com sucesso!" });
      load();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer_id || !form.tour_id || !company) {
      toast({ title: "Preencha os campos obrigatórios", variant: "destructive" });
      return;
    }

    const selectedCustomer = customers.find(c => c.id === form.customer_id);
    const selectedTour = tours.find(t => t.id === form.tour_id);

    const termPayload = {
      customer_id: form.customer_id,
      booking_id: form.booking_id || null,
      tour_id: form.tour_id,
      vehicle_id: form.vehicle_id || null,
      company_id: company.id,
      customer_name: selectedCustomer?.name,
      tour_name: selectedTour?.name,
      term_date: formatDate(new Date(), "yyyy-MM-dd"), // Sempre usa a data atual ao salvar/enviar
      has_allergy: form.has_allergy,
      allergy_details: form.allergy_details,
      has_fainting_convulsions: form.has_fainting_convulsions,
      recent_surgery: form.recent_surgery,
      has_diabetes: form.has_diabetes,
      is_obese: form.is_obese,
      is_sedentary: form.is_sedentary,
      has_immobilized_part: form.has_immobilized_part,
      has_special_needs: form.has_special_needs,
      has_phobia: form.has_phobia,
      phobia_details: form.phobia_details,
      under_influence: form.under_influence,
      takes_medication: form.takes_medication,
      medication_details: form.medication_details,
      emergency_contact_name: form.emergency_contact_name,
      emergency_contact_phone: form.emergency_contact_phone,
      accepted: editingId ? true : false,
    };

    const { data: termData, error } = editingId 
      ? await supabase.from("sgs_risk_terms").update(termPayload as any).eq("id", editingId).select().single()
      : await supabase.from("sgs_risk_terms").insert([termPayload as any]).select().single();

    if (error) {
      console.error(error);
      toast({ title: editingId ? "Erro ao atualizar termo" : "Erro ao registrar termo", variant: "destructive" });
    } else {
      if (editingId) {
        await supabase.from("sgs_risk_term_minors").delete().eq("risk_term_id", editingId);
      }

      if (form.minors.length > 0) {
        const minorsPayload = form.minors.map(m => ({
          risk_term_id: termData.id,
          full_name: m.full_name,
          cpf: m.cpf,
          birth_date: m.birth_date || null,
          is_adult: m.is_adult || false,
          responsible_name: m.responsible_name || null
        }));
        await supabase.from("sgs_risk_term_minors").insert(minorsPayload);
      }

      toast({ title: editingId ? "Termo atualizado com sucesso!" : "Termo de conhecimento gerado com sucesso!" });
      setShowForm(false);
      setEditingId(null);
      resetForm();
      load();
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({
      customer_id: "",
      booking_id: "",
      tour_id: "",
      vehicle_id: "",
      has_allergy: false,
      allergy_details: "",
      has_fainting_convulsions: false,
      recent_surgery: false,
      has_diabetes: false,
      is_obese: false,
      is_sedentary: false,
      has_immobilized_part: false,
      has_special_needs: false,
      has_phobia: false,
      phobia_details: "",
      under_influence: false,
      takes_medication: false,
      medication_details: "",
      emergency_contact_name: "",
      emergency_contact_phone: "",
      term_date: formatDate(new Date(), "yyyy-MM-dd"),
      minors: [],
    });
  };

  const printTerm = async (termId: string) => {
    const { data: term, error } = await supabase
      .from("sgs_risk_terms")
      .select("*, customers(*), tours(*), sgs_veiculos(*), sgs_empresa(*), sgs_risk_term_minors(*)")
      .eq("id", termId)
      .single();

    if (error || !term) {
      toast({ title: "Erro ao carregar termo para impressão", variant: "destructive" });
      return;
    }

    const win = window.open("", "_blank");
    if (!win) return;

    const termDate = term.term_date ? new Date(term.term_date + "T12:00:00") : new Date();
    const formattedDate = formatDate(termDate, "dd 'de' MMMM 'de' yyyy");
    
    const minorsHtml = term.sgs_risk_term_minors?.map((m: any, i: number) => `
      <div style="margin: 8px 0; padding-bottom: 5px; border-bottom: 1px solid #f0f0f0;">
        <p style="margin: 2px 0;"><strong>${i + 1}- ${m.full_name}</strong> ${m.is_adult ? "(Maior de Idade)" : "(Menor de Idade)"}</p>
        <p style="margin: 2px 0; font-size: 10px; color: #666;">
          ${m.cpf ? `CPF: ${m.cpf}` : ""} ${m.birth_date ? `| Nasc: ${formatDate(new Date(m.birth_date), "dd/MM/yyyy")}` : ""} 
          ${!m.is_adult && m.responsible_name ? `| Responsável: ${m.responsible_name}` : ""}
        </p>
        ${m.signature_data ? `<div style="margin-top: 5px;"><img src="${m.signature_data}" style="height: 40px;" /><br/><span style="font-size: 8px;">Assinado em ${formatDate(new Date(m.signed_at), "dd/MM/yyyy HH:mm")}</span></div>` : ""}
      </div>
    `).join("") || "Nenhum dependente declarado.";

    const healthResponse = (val: boolean) => val ? "S" : "N";

    const customerName = (term.customers as any)?.name || term.customer_name;
    const customerCityState = (term.customers as any)?.city && (term.customers as any)?.state 
      ? `${(term.customers as any).city}/${(term.customers as any).state}` 
      : term.city_state || "___";

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Termo de Conhecimento de Risco - ${customerName}</title>
        <style>
          body { font-family: 'Arial', sans-serif; line-height: 1.4; color: #333; max-width: 800px; margin: 40px auto; padding: 20px; }
          .header { display: flex; align-items: center; gap: 20px; margin-bottom: 20px; border-bottom: 2px solid #eee; padding-bottom: 15px; }
          .header img { max-width: 150px; }
          .header-text { flex: 1; }
          h1 { font-size: 18px; margin: 0 0 5px 0; text-transform: uppercase; }
          h2 { font-size: 14px; margin: 0; color: #666; }
          .section { margin-bottom: 20px; }
          .section-title { font-weight: bold; background: #f5f5f5; padding: 5px 10px; margin-bottom: 10px; border-left: 4px solid #333; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
          .health-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px; font-size: 11px; }
          .health-item { display: flex; justify-content: space-between; padding-right: 10px; border-bottom: 1px dotted #ccc; }
          .footer { margin-top: 50px; text-align: center; }
          .signature-box { margin-top: 40px; border-top: 1px solid #333; display: inline-block; min-width: 300px; padding-top: 5px; }
          .small { font-size: 10px; color: #666; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          ${term.sgs_empresa?.logo_url ? `<img src="${term.sgs_empresa.logo_url}" />` : ""}
          <div class="header-text">
            <h1>Termo de Conhecimento de Risco e Corresponsabilidade</h1>
            <p class="small">Atende aos requisitos de Segurança da empresa e legislações ambientais (ABNT NBR ISO 21103)</p>
          </div>
        </div>

        <div class="section">
          <p>O presente Termo atende aos requisitos de Segurança da nossa empresa e as questões legais e ambientais da nossa atividade, bem como visa a segurança e a satisfação dos nossos clientes.</p>
          <p>A empresa <strong>${term.sgs_empresa?.razao_social || "LENÇOIS TOUR"}</strong>, CNPJ <strong>${term.sgs_empresa?.cnpj || "11.622.667/0001-42"}</strong>, endereço <strong>${term.sgs_empresa?.endereco || "PÇ NSS SRA CONCEIÇÃO, SN, CENTRO"}</strong>, telefone <strong>${term.sgs_empresa?.telefone || "(98) 98588-0954"}</strong>, e-mail: <strong>${term.sgs_empresa?.email || "vattilencois@gmail.com.br"}</strong> é um operador de turismo fora de estrada que realiza passeios veículos 4x4 na Rota das Emoções.</p>
        </div>

        <div class="section">
          <div class="section-title">Informações e Recomendações</div>
          <div style="font-size: 10px; color: #444; white-space: pre-wrap;">
            ${term.sgs_empresa?.term_recommendations || `
            <p>A atividade não requer habilidades técnicas avançadas, mas para sua melhor experiência recomendamos:</p>
            <ul style="margin-top: 5px; padding-left: 15px;">
              <li>Saber nadar (haverá paradas para banho em lagoas e rios);</li>
              <li>Trajes de banho, roupas leves e calçados que possam molhar;</li>
              <li>Levar: toalha, casaco corta-vento, chapéu/boné e óculos de sol;</li>
              <li><strong>Indispensável:</strong> REPELENTE e PROTETOR SOLAR;</li>
              <li>Evitar acessórios (brincos, relógios, anéis) para prevenir perdas ou acidentes;</li>
              <li>Portar água potável e lanche leve para o percurso.</li>
            </ul>
            `}
          </div>
        </div>

        <div class="section">
          <div class="section-title">Riscos e Cuidados com a Segurança</div>
          <div style="font-size: 10px; color: #444; white-space: pre-wrap;">
            ${term.sgs_empresa?.term_safety_risks || `
            <p>Os riscos inerentes ao passeio off-road na Rota das Emoções incluem: insolação, variações térmicas (hipotermia), picadas de insetos, mudanças climáticas bruscas, perda de objetos, incidentes veiculares (capotamento/colisão) e riscos aquáticos aos quais é necessário o uso obrigatório do colete salva-vidas quando solicitado ou em situações de risco, permanecer em locais seguros da embarcação durante a navegação, não consumir bebidas alcoólicas em excesso que possam comprometer a minha segurança.</p>
            <p style="margin-top: 5px;"><strong>Nossas Medidas de Segurança:</strong></p>
            <ul style="padding-left: 15px;">
              <li>Condutores com certificação e treinamento contínuo;</li>
              <li>Equipamentos de resgate e comunicação em todas as viaturas;</li>
              <li>Equipe preparada para Primeiros Socorros e Resgate;</li>
              <li>Plano de Resposta a Emergências (PRE) rigorosamente seguido.</li>
            </ul>
            <p style="margin-top: 5px;">A atividade poderá ser interrompida a qualquer momento por decisão técnica em caso de condições climáticas adversas ou riscos à integridade do grupo.</p>
            `}
          </div>
        </div>

        <div class="section">
          <div class="section-title">Informações do Cliente</div>
          <div class="grid">
            <div><strong>Nome:</strong> ${customerName}</div>
            <div><strong>CPF/Passaporte:</strong> ${(term.customers as any)?.cpf || term.cpf || "___"}</div>
            <div><strong>Data Nasc:</strong> ${(term.customers as any)?.birth_date ? formatDate(new Date((term.customers as any).birth_date), "dd/MM/yyyy") : "___"}</div>
            <div><strong>Telefone:</strong> ${(term.customers as any)?.phone || term.phone || "___"}</div>
            <div><strong>Cidade/UF:</strong> ${customerCityState}</div>
            <div><strong>E-mail:</strong> ${(term.customers as any)?.email || term.email || "___"}</div>
          </div>
          <p><strong>Contato de Emergência:</strong> ${term.emergency_contact_name || "___"} - Tel: ${term.emergency_contact_phone || "___"}</p>
        </div>

        <div class="section">
          <div class="section-title">Autorização para Dependentes</div>
          ${minorsHtml}
        </div>

        <div class="section">
          <div class="section-title">Informações Importantes (S = Sim / N = Não)</div>
          <div class="health-grid">
            <div class="health-item"><span>Alergia:</span> <strong>${healthResponse(term.has_allergy)}</strong></div>
            <div class="health-item"><span>Desmaios:</span> <strong>${healthResponse(term.has_fainting_convulsions)}</strong></div>
            <div class="health-item"><span>Cirurgia recente:</span> <strong>${healthResponse(term.recent_surgery)}</strong></div>
            <div class="health-item"><span>Diabetes:</span> <strong>${healthResponse(term.has_diabetes)}</strong></div>
            <div class="health-item"><span>Obeso/a:</span> <strong>${healthResponse(term.is_obese)}</strong></div>
            <div class="health-item"><span>Sedentário:</span> <strong>${healthResponse(term.is_sedentary)}</strong></div>
            <div class="health-item"><span>Imobilizado:</span> <strong>${healthResponse(term.has_immobilized_part)}</strong></div>
            <div class="health-item"><span>Necessidades Esp:</span> <strong>${healthResponse(term.has_special_needs)}</strong></div>
            <div class="health-item"><span>Fobia:</span> <strong>${healthResponse(term.has_phobia)}</strong></div>
            <div class="health-item"><span>Álcool/Entorpec:</span> <strong>${healthResponse(term.under_influence)}</strong></div>
          </div>
          <p class="small" style="margin-top: 5px;">
            ${term.has_allergy ? `<strong>Qual alergia:</strong> ${term.allergy_details || "Não detalhado"} <br/>` : ""}
            ${term.takes_medication ? `<strong>Medicação:</strong> ${term.medication_details || "Não detalhado"}` : "<strong>Medicamentos:</strong> Não toma."}
          </p>
        </div>

        <div class="section">
          <div class="section-title">Ciência e Declaração de Responsabilidade</div>
          <p style="font-size: 10px; color: #444; margin-bottom: 5px;">
            Declaro que li todas as informações e recomendações, que respondi com veracidade e que todas as minhas dúvidas foram sanadas. Comprometo-me a seguir rigorosamente as orientações da equipe técnica e condutores para garantir a segurança individual e do grupo.
          </p>
          <p style="font-size: 10px; color: #444; margin-bottom: 5px;">
            Tenho plena ciência dos riscos mencionados e assumo a responsabilidade por atos próprios que contrariem as normas de segurança estabelecidas. Confirmo estar em condições físicas e psicológicas adequadas para a realização da atividade.
          </p>
          <p style="font-size: 10px; color: #444;">
            <strong>Observação:</strong> Esta operação segue as normas da ABNT NBR ISO 21103 e demais legislações pertinentes ao turismo de aventura. É de responsabilidade do contratante comunicar aos demais participantes que virão em sua companhia, todas as informações contidas neste documento.
          </p>
        </div>

        <div class="footer">
          <p>${term.sgs_empresa?.cidade ? term.sgs_empresa.cidade.toUpperCase() : "SANTO AMARO"} - ${term.sgs_empresa?.estado || "MA"}, ${formattedDate}</p>
          <div class="signature-box">
            Assinatura do Cliente
          </div>
          ${term.signature_data ? `<div><img src="${term.signature_data}" style="height: 60px; margin-bottom: -20px;"/><br/><span class="small">Assinado digitalmente em ${formatDate(new Date(term.signed_at), "dd/MM/yyyy HH:mm")}</span></div>` : ""}
        </div>
        
        <div class="no-print" style="margin-top: 40px; text-align: center;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #333; color: #fff; border: none; cursor: pointer; border-radius: 5px;">Imprimir Termo</button>
        </div>
      </body>
      </html>
    `;

    win.document.write(html);
    win.document.close();
  };

  const filtered = terms.filter(t => {
    const matchesSearch = !search || 
      t.customer_name?.toLowerCase().includes(search.toLowerCase()) || 
      t.tour_name?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === "todos" || 
      (statusFilter === "assinado" && t.signature_data) || 
      (statusFilter === "pendente" && !t.signature_data);
      
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout title="SGS — Termos de Ciência de Risco">
      <div className="space-y-6">
        <div className="glass-card p-6 rounded-[2.5rem] border border-border/50 flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="relative flex-1 max-w-md w-full">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Buscar por cliente ou passeio..."
              className="w-full pl-11 pr-4 h-12 bg-background border border-border rounded-2xl text-sm text-foreground outline-none focus:ring-4 focus:ring-primary/10 transition-all font-medium" 
            />
          </div>
          
          <div className="flex bg-muted/50 p-1.5 rounded-2xl border border-border/50">
            {[
              { id: "todos", label: "Todos", color: "primary" },
              { id: "assinado", label: "Assinados", color: "emerald-600" },
              { id: "pendente", label: "Pendentes", color: "amber-600" }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  statusFilter === tab.id 
                  ? "bg-white text-primary shadow-lg shadow-black/5" 
                  : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex gap-3 w-full lg:w-auto">
            <button 
              onClick={() => { setShowConfig(!showConfig); setShowForm(false); }}
              className="flex-1 lg:flex-none h-12 px-6 bg-muted/50 hover:bg-muted text-muted-foreground rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-border"
            >
              <Settings size={18} />
              Configurações
            </button>
            <button 
              onClick={() => {
                if (!showForm) resetForm();
                setShowForm(!showForm);
                setShowConfig(false);
              }}
              className="flex-1 lg:flex-none h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              {showForm ? <XCircle size={20} /> : <Plus size={20} strokeWidth={3} />} 
              {showForm ? "Fechar" : "Novo Termo"}
            </button>
          </div>
        </div>

        {showConfig && (
          <div className="bg-card border border-border rounded-2xl p-6 space-y-6 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <Settings className="text-primary" size={24} />
                <h3 className="font-display font-bold text-lg">Configurações de Conteúdo dos Termos</h3>
              </div>
              <button onClick={() => setShowConfig(false)} className="text-muted-foreground hover:text-foreground">
                <XCircle size={20} />
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold flex items-center gap-2">
                  <FileText size={16} className="text-primary" />
                  Informações e Recomendações
                </label>
                <textarea 
                  value={termConfig.term_recommendations}
                  onChange={e => setTermConfig({ ...termConfig, term_recommendations: e.target.value })}
                  rows={10}
                  className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none"
                  placeholder="Liste as recomendações para os clientes..."
                />
                <p className="text-[10px] text-muted-foreground">Este texto aparecerá na seção de Recomendações do termo impresso e digital.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold flex items-center gap-2">
                  <Shield size={16} className="text-primary" />
                  Riscos e Cuidados com a Segurança
                </label>
                <textarea 
                  value={termConfig.term_safety_risks}
                  onChange={e => setTermConfig({ ...termConfig, term_safety_risks: e.target.value })}
                  rows={10}
                  className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none"
                  placeholder="Descreva os riscos e medidas de segurança..."
                />
                <p className="text-[10px] text-muted-foreground">Este texto aparecerá na seção de Riscos do termo impresso e digital.</p>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button 
                onClick={handleSaveConfig}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95"
              >
                <Save size={18} />
                Salvar Alterações
              </button>
            </div>
          </div>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-6 shadow-sm">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <Shield className="text-primary" size={24} />
              <h3 className="font-display font-bold text-lg">{editingId ? "Editar Termo de Responsabilidade" : "Gerar Novo Termo de Responsabilidade"}</h3>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Vincular a Reserva (Opcional)</label>
                <select 
                  value={form.booking_id}
                  onChange={async e => {
                    const bid = e.target.value;
                    const booking = bookings.find(b => b.id === bid);
                    if (booking) {
                      setForm(f => ({ ...f, booking_id: bid, customer_id: booking.customer_id }));
                      
                      // Auto-load dependents from the customer to populate companions
                      const { data: deps } = await supabase
                        .from("dependents")
                        .select("*")
                        .eq("customer_id", booking.customer_id);
                      
                      if (deps && deps.length > 0) {
                        setForm(f => ({
                          ...f,
                          minors: deps.map(d => ({
                            full_name: d.name,
                            cpf: d.cpf || "",
                            birth_date: d.birth_date || "",
                            is_adult: true, // assume default or calculate based on age
                            id: d.id
                          }))
                        }));
                        toast({ title: `${deps.length} dependentes importados automaticamente` });
                      }
                    } else {
                      setForm(f => ({ ...f, booking_id: bid }));
                    }
                  }}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none"
                >
                  <option value="">Selecione a Reserva</option>
                  {bookings.map(b => (
                    <option key={b.id} value={b.id}>{b.booking_code} - {b.item_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Cliente *</label>
                <select 
                  required
                  value={form.customer_id}
                  onChange={e => setForm({ ...form, customer_id: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none"
                >
                  <option value="">Selecione o Cliente</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Passeio *</label>
                <select 
                  required
                  value={form.tour_id}
                  onChange={e => setForm({ ...form, tour_id: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none"
                >
                  <option value="">Selecione o Passeio</option>
                  {tours.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Veículo</label>
                <select 
                  value={form.vehicle_id}
                  onChange={e => setForm({ ...form, vehicle_id: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none"
                >
                  <option value="">Selecione o Veículo</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.modelo} ({v.placa})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
               <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Data do Termo (Atualizada automaticamente)</label>
                <input 
                  type="date"
                  disabled
                  value={form.term_date}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none opacity-70 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Contato de Emergência</label>
                <input 
                  placeholder="Nome do contato"
                  value={form.emergency_contact_name}
                  onChange={e => setForm({ ...form, emergency_contact_name: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Tel. Emergência</label>
                <input 
                  placeholder="(00) 00000-0000"
                  value={form.emergency_contact_phone}
                  onChange={e => setForm({ ...form, emergency_contact_phone: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-bold flex items-center gap-2 border-t pt-4"><FileText size={16} /> Questionário de Saúde</h4>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {HEALTH_QUESTIONS_LIST.map(q => (
                  <div key={q.id} className="space-y-2">
                    <label className="flex items-center gap-3 p-3 bg-muted rounded-xl cursor-pointer hover:bg-muted/80 transition-colors">
                      <input 
                        type="checkbox" 
                        checked={(form as any)[q.id]} 
                        onChange={e => setForm({ ...form, [q.id]: e.target.checked })}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary/30"
                      />
                      <span className="text-xs font-medium">{q.label}</span>
                    </label>
                    {q.detailKey && (form as any)[q.id] && (
                      <input 
                        placeholder={`Detalhes sobre ${q.label}...`}
                        value={(form as any)[q.detailKey]}
                        onChange={e => setForm({ ...form, [q.detailKey]: e.target.value })}
                        className="w-full bg-background border border-border rounded-lg px-2 py-1.5 text-[11px] outline-none"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-bold flex items-center gap-2 border-t pt-4"><Users size={16} /> Autorização para Dependentes</h4>
              <div className="bg-muted p-4 rounded-2xl space-y-4">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <input 
                    placeholder="Nome completo"
                    value={minorForm.full_name}
                    onChange={e => setMinorForm({ ...minorForm, full_name: e.target.value })}
                    className="bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none"
                  />
                  <input 
                    placeholder="CPF (se houver)"
                    value={minorForm.cpf}
                    onChange={e => setMinorForm({ ...minorForm, cpf: e.target.value })}
                    className="bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none"
                  />
                  <input 
                    type="date"
                    value={minorForm.birth_date}
                    onChange={e => {
                      const birthDate = e.target.value;
                      let isAdult = false;
                      if (birthDate) {
                        const birth = new Date(birthDate);
                        const today = new Date();
                        let age = today.getFullYear() - birth.getFullYear();
                        const m = today.getMonth() - birth.getMonth();
                        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
                          age--;
                        }
                        isAdult = age >= 18;
                      }
                      setMinorForm({ ...minorForm, birth_date: birthDate, is_adult: isAdult });
                    }}
                    className="bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none"
                  />
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={minorForm.is_adult}
                        onChange={e => setMinorForm({ ...minorForm, is_adult: e.target.checked })}
                        className="w-4 h-4 rounded border-border text-primary"
                      />
                      <span className="text-[10px] font-semibold uppercase">Maior de Idade</span>
                    </label>
                  </div>
                </div>

                {!minorForm.is_adult && (
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Quem é o responsável?</label>
                      <select
                        value={minorForm.responsible_name}
                        onChange={e => setMinorForm({ ...minorForm, responsible_name: e.target.value })}
                        className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none"
                      >
                        <option value="">Selecione o Responsável</option>
                        {/* Option 1: The main customer */}
                        {customers.find(c => c.id === form.customer_id) && (
                          <option value={customers.find(c => c.id === form.customer_id).name}>
                            {customers.find(c => c.id === form.customer_id).name} (Cliente Principal)
                          </option>
                        )}
                        {/* Option 2: Other adult companions already added */}
                        {form.minors.filter(m => m.is_adult).map(adult => (
                          <option key={adult.id} value={adult.full_name}>
                            {adult.full_name} (Dependente Adulto)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button 
                        type="button" 
                        onClick={addMinor}
                        className="w-full bg-primary text-primary-foreground py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                      >
                        <UserPlus size={16} /> Adicionar Dependente
                      </button>
                    </div>
                  </div>
                )}

                {minorForm.is_adult && (
                  <div className="flex justify-end">
                    <button 
                      type="button" 
                      onClick={addMinor}
                      className="bg-primary text-primary-foreground px-6 py-2 rounded-xl text-xs font-bold flex items-center gap-2"
                    >
                      <UserPlus size={16} /> Adicionar Dependente Adulto
                    </button>
                  </div>
                )}

                {form.minors.length > 0 && (
                  <div className="space-y-2 pt-2">
                    {form.minors.map(m => (
                      <div key={m.id} className="flex items-center justify-between bg-background border border-border px-3 py-2 rounded-lg text-xs">
                        <div className="flex flex-col">
                          <span className="font-bold">{m.full_name} {m.is_adult ? "(Adulto)" : "(Menor)"}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {m.birth_date ? `Nascimento: ${formatDate(new Date(m.birth_date), "dd/MM/yyyy")}` : ""} 
                            {!m.is_adult && m.responsible_name ? ` • Responsável: ${m.responsible_name}` : ""}
                          </span>
                        </div>
                        <button type="button" onClick={() => removeMinor(m.id)} className="text-destructive"><Trash2 size={14} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button 
                type="submit" 
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl text-sm font-bold shadow-sm transition-all active:scale-[0.98]"
              >
                {editingId ? "Atualizar Termo de Responsabilidade" : "Gerar Termo de Responsabilidade"}
              </button>
              <button 
                type="button" 
                onClick={() => { setShowForm(false); resetForm(); }}
                className="bg-muted text-muted-foreground px-6 py-3 rounded-xl text-sm font-semibold"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        <div className="grid gap-4">
          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
          ) : filtered.length === 0 ? (
            <div className="bg-card border border-dashed border-border rounded-2xl py-12 text-center text-muted-foreground">
              <FileText size={40} className="mx-auto mb-3 opacity-20" />
              <p>Nenhum termo gerado ainda</p>
            </div>
          ) : filtered.map(t => (
            <div key={t.id} className="bg-card border border-border rounded-[2.5rem] p-6 hover:shadow-2xl hover:border-primary/30 transition-all group relative overflow-hidden admin-card-hover flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className={`absolute top-0 left-0 w-2 h-full transition-colors ${t.signature_data ? "bg-emerald-500" : "bg-amber-500"}`} />
              
              <div className="flex items-center gap-6">
                <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all shadow-inner ${t.signature_data ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                  {t.signature_data ? <CheckCircle size={32} /> : <FileText size={32} />}
                </div>
                <div>
                  <h4 className="font-display font-black text-xl text-foreground group-hover:text-primary transition-colors leading-tight">{t.customer_name}</h4>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest">{t.tour_name}</p>
                    {t.sgs_veiculos?.modelo && <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">• {t.sgs_veiculos.modelo}</p>}
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">• {formatDate(new Date(t.created_at), "dd/MM/yyyy")}</p>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Badge variant="outline" className={`font-black text-[9px] uppercase px-3 py-1 rounded-full border ${t.signature_data ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                      {t.signature_data ? "Documento Assinado" : "Pendente de Assinatura"}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 lg:justify-end">
                {!t.signature_data && (
                  <>
                    <button 
                      onClick={async () => {
                        const customer = customers.find(c => c.id === t.customer_id);
                        if (!customer?.email) {
                          toast({ title: "Cliente sem e-mail", description: "Cadastre um e-mail para enviar o link.", variant: "destructive" });
                          return;
                        }
                        setSendingEmail(t.id);
                        try {
                          const baseUrl = window.location.origin;
                          const signUrl = `${baseUrl}/assinatura-termo?id=${t.id}${t.booking_id ? `&booking_id=${t.booking_id}` : ''}`;
                          const { error } = await supabase.functions.invoke("send-term-email", {
                            body: { customerEmail: customer.email, customerName: customer.name, signUrl: signUrl, tourName: t.tour_name }
                          });
                          if (error) throw error;
                          toast({ title: "E-mail enviado!", description: "Link de assinatura enviado ao cliente." });
                        } catch (err) {
                          toast({ title: "Erro ao enviar", description: "Não foi possível enviar o e-mail.", variant: "destructive" });
                        } finally {
                          setSendingEmail(null);
                        }
                      }}
                      disabled={sendingEmail === t.id}
                      className="h-11 px-5 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-xl transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                    >
                      {sendingEmail === t.id ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                      Enviar E-mail
                    </button>
                    <button 
                      onClick={() => {
                        const customer = customers.find(c => c.id === t.customer_id);
                        if (!customer?.phone) {
                          toast({ title: "Cliente sem telefone", description: "Cadastre um número para enviar o link.", variant: "destructive" });
                          return;
                        }
                        const baseUrl = window.location.origin;
                        const signUrl = `${baseUrl}/assinatura-termo?id=${t.id}${t.booking_id ? `&booking_id=${t.booking_id}` : ''}`;
                        const message = `Olá ${customer.name}! Aqui está o seu link para assinatura do Termo de Ciência de Risco para o passeio ${t.tour_name}: ${signUrl}`;
                        const cleanPhone = customer.phone.replace(/\D/g, "");
                        const whatsappUrl = `https://wa.me/${cleanPhone.startsWith('55') ? cleanPhone : '55' + cleanPhone}?text=${encodeURIComponent(message)}`;
                        window.open(whatsappUrl, '_blank');
                        toast({ title: "WhatsApp aberto" });
                      }}
                      className="h-11 px-5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 hover:text-white rounded-xl transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                    >
                      <MessageCircle size={16} />
                      WhatsApp
                    </button>
                  </>
                )}
                <button 
                  onClick={() => printTerm(t.id)}
                  className="h-11 px-5 bg-blue-500/10 hover:bg-blue-500 text-blue-600 hover:text-white rounded-xl transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                >
                  <Eye size={16} /> Visualizar
                </button>
                <button 
                  onClick={() => handleEdit(t)}
                  className="h-11 px-5 bg-amber-500/10 hover:bg-amber-500 text-amber-600 hover:text-white rounded-xl transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                >
                  <Edit size={16} /> Editar
                </button>
                <button 
                  onClick={() => handleDelete(t.id)}
                  className="h-11 px-5 bg-destructive/10 hover:bg-destructive text-destructive hover:text-white rounded-xl transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                >
                  <Trash2 size={16} /> Excluir
                </button>
              </div>
            </div>
          ))}
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSGSTermos;
