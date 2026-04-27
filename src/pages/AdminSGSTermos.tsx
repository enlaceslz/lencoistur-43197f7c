import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Plus, CheckCircle, XCircle, Shield, FileText, Printer, Users, Trash2, UserPlus, Search, Edit, Eye } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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

const AdminSGSTermos = () => {
  const [terms, setTerms] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [tours, setTours] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [company, setCompany] = useState<any>(null);

  const [form, setForm] = useState({
    customer_id: "",
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
    term_date: format(new Date(), "yyyy-MM-dd"),
    minors: [] as any[],
  });

  const [minorForm, setMinorForm] = useState({ full_name: "", cpf: "", birth_date: "", is_adult: false, responsible_name: "" });

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    const [termsRes, customersRes, toursRes, vehiclesRes, companyRes] = await Promise.all([
      supabase.from("sgs_risk_terms").select("*, customers(*), tours(name), sgs_veiculos(modelo)").order("created_at", { ascending: false }),
      supabase.from("customers").select("*"),
      supabase.from("tours").select("id, name, description, duration, price, private_price").eq("active", true).order("name"),
      supabase.from("sgs_veiculos").select("id, modelo, placa"),
      supabase.from("sgs_empresa").select("*").limit(1).maybeSingle(),
    ]);

    setTerms(termsRes.data || []);
    setCustomers(customersRes.data || []);
    setTours(toursRes.data || []);
    setVehicles(vehiclesRes.data || []);
    setCompany(companyRes.data);
    setLoading(false);
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
      tour_id: form.tour_id,
      vehicle_id: form.vehicle_id || null,
      company_id: company.id,
      customer_name: selectedCustomer?.name,
      tour_name: selectedTour?.name,
      term_date: form.term_date,
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
      accepted: true,
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
      term_date: format(new Date(), "yyyy-MM-dd"),
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

    const formattedDate = format(new Date(term.term_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    
    const minorsHtml = term.sgs_risk_term_minors?.map((m: any, i: number) => `
      <p style="margin: 5px 0;">${i + 1}- ${m.full_name}, ${m.cpf ? `CPF: ${m.cpf}` : ""}, Data Nasc: ${m.birth_date ? format(new Date(m.birth_date), "dd/MM/yyyy") : "___"}</p>
    `).join("") || "Nenhum menor declarado.";

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
          <div class="section-title">Descrição da Atividade</div>
          <p><strong>Passeio:</strong> ${term.tours?.name || term.tour_name}</p>
          <p>${term.tours?.description || "Passeio em veículo 4x4 na Rota das Emoções com duração de aproximadamente 8h. Inicia na agência às 9h com visita às dunas. Três paradas para banho. Chegada às 17h."}</p>
          <p><strong>Veículo:</strong> ${term.sgs_veiculos?.modelo || "Veículo 4x4 padrão"} - Placa: ${term.sgs_veiculos?.placa || "___"}</p>
          <p class="small">Idade mínima recomendada: 2 anos. Peso máximo: 110kg. Recomenda-se saber nadar e traje de banho.</p>
        </div>

        <div class="section">
          <div class="section-title">Riscos e Cuidados com a Segurança</div>
          <p class="small">Os riscos inerentes são: insolação, hipotermia, picadas de insetos, mau tempo, perda de objetos, capotamento, colisão, quedas na água, afogamento e lesões. Adotamos controles como capacitação, cabos de resgate e orientações.</p>
        </div>

        <div class="section">
          <div class="section-title">Informações do Cliente</div>
          <div class="grid">
            <div><strong>Nome:</strong> ${customerName}</div>
            <div><strong>CPF/Passaporte:</strong> ${(term.customers as any)?.cpf || term.cpf || "___"}</div>
            <div><strong>Data Nasc:</strong> ${(term.customers as any)?.birth_date ? format(new Date((term.customers as any).birth_date), "dd/MM/yyyy") : "___"}</div>
            <div><strong>Telefone:</strong> ${(term.customers as any)?.phone || term.phone || "___"}</div>
            <div><strong>Cidade/UF:</strong> ${customerCityState}</div>
            <div><strong>E-mail:</strong> ${(term.customers as any)?.email || term.email || "___"}</div>
          </div>
          <p><strong>Contato de Emergência:</strong> ${term.emergency_contact_name || "___"} - Tel: ${term.emergency_contact_phone || "___"}</p>
        </div>

        <div class="section">
          <div class="section-title">Autorização para Menores</div>
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
          <div class="section-title">Ciência e Declaração</div>
          <p style="font-size: 11px;">Declaro que li todas as informações e recomendações, que respondi com veracidade e que minhas dúvidas foram sanadas. Comprometo-me a seguir as orientações da equipe. Tenho ciência dos riscos mencionados e isento a Lençóis Tour de danos causados por atos próprios contrários às orientações.</p>
        </div>

        <div class="footer">
          <p>Santo Amaro, ${formattedDate}</p>
          <div class="signature-box">
            Assinatura do Cliente
          </div>
          ${term.signature_data ? `<div><img src="${term.signature_data}" style="height: 60px; margin-bottom: -20px;"/><br/><span class="small">Assinado digitalmente em ${format(new Date(term.signed_at), "dd/MM/yyyy HH:mm")}</span></div>` : ""}
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

  const filtered = terms.filter(t =>
    !search || 
    t.customer_name?.toLowerCase().includes(search.toLowerCase()) || 
    t.tour_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout title="SGS - Termos de Ciência de Risco">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Buscar por cliente ou passeio..."
              className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30" 
            />
          </div>
          <button 
            onClick={() => {
              if (!showForm) resetForm();
              setShowForm(!showForm);
            }}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2"
          >
            {showForm ? <XCircle size={16} /> : <Plus size={16} />} 
            {showForm ? "Fechar Formulário" : "Novo Termo"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-6 shadow-sm">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <Shield className="text-primary" size={24} />
              <h3 className="font-display font-bold text-lg">{editingId ? "Editar Termo de Responsabilidade" : "Gerar Novo Termo de Responsabilidade"}</h3>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
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
                <label className="text-sm font-semibold text-foreground mb-1 block">Data do Termo</label>
                <input 
                  type="date"
                  value={form.term_date}
                  onChange={e => setForm({ ...form, term_date: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none"
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
              <h4 className="text-sm font-bold flex items-center gap-2 border-t pt-4"><Users size={16} /> Acompanhantes Menores de Idade</h4>
              <div className="bg-muted p-4 rounded-2xl space-y-4">
                <div className="grid sm:grid-cols-3 gap-3">
                  <input 
                    placeholder="Nome completo do menor"
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
                  <div className="flex gap-2">
                    <input 
                      type="date"
                      value={minorForm.birth_date}
                      onChange={e => setMinorForm({ ...minorForm, birth_date: e.target.value })}
                      className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none"
                    />
                    <button 
                      type="button" 
                      onClick={addMinor}
                      className="bg-primary text-primary-foreground p-2 rounded-xl"
                    >
                      <UserPlus size={18} />
                    </button>
                  </div>
                </div>
                {form.minors.length > 0 && (
                  <div className="space-y-2 pt-2">
                    {form.minors.map(m => (
                      <div key={m.id} className="flex items-center justify-between bg-background border border-border px-3 py-2 rounded-lg text-xs">
                        <span>{m.full_name} {m.cpf ? `(${m.cpf})` : ""} {m.birth_date ? `• ${format(new Date(m.birth_date), "dd/MM/yyyy")}` : ""}</span>
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
            <div key={t.id} className="bg-card border border-border rounded-2xl p-5 hover:shadow-md transition-shadow group">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${t.signature_data ? "bg-green-500/10 text-green-500" : "bg-amber-500/10 text-amber-500"}`}>
                    {t.signature_data ? <CheckCircle size={24} /> : <FileText size={24} />}
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground text-lg">{t.customer_name}</h4>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <span className="font-medium text-primary">{t.tour_name}</span>
                      {t.sgs_veiculos?.modelo && <span>• {t.sgs_veiculos.modelo}</span>}
                    </p>
                    <div className="flex gap-4 mt-1">
                      <p className="text-xs text-muted-foreground">Gerado em: {format(new Date(t.created_at), "dd/MM/yyyy")}</p>
                      <p className="text-xs text-muted-foreground">Status: <span className={t.signature_data ? "text-green-600 font-semibold" : "text-amber-600 font-semibold"}>{t.signature_data ? "Assinado" : "Pendente de Assinatura"}</span></p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => printTerm(t.id)}
                    className="p-3 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 rounded-xl transition-colors flex items-center gap-2 text-sm font-semibold"
                    title="Visualizar Termo"
                  >
                    <Eye size={18} /> <span className="hidden sm:inline">Visualizar</span>
                  </button>
                  <button 
                    onClick={() => handleEdit(t)}
                    className="p-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 rounded-xl transition-colors flex items-center gap-2 text-sm font-semibold"
                    title="Editar Termo"
                  >
                    <Edit size={18} /> <span className="hidden sm:inline">Editar</span>
                  </button>
                  <button 
                    onClick={() => handleDelete(t.id)}
                    className="p-3 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-xl transition-colors flex items-center gap-2 text-sm font-semibold"
                    title="Excluir Termo"
                  >
                    <Trash2 size={18} /> <span className="hidden sm:inline">Excluir</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSGSTermos;
