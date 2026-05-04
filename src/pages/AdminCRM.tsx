import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Search, Phone, Mail, Globe, Eye, Download, Loader2, Users, DollarSign, MapPin, Smartphone, RefreshCw, Calendar, Plus, Pencil, Trash2, X, Save, UserPlus, Baby, FileText, Printer, Paperclip, Upload, History, Tag as TagIcon } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import CustomerStats from "@/components/crm/CustomerStats";
import CustomerInteractionHistory from "@/components/crm/CustomerInteractionHistory";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  cpf: string | null;
  passport: string | null;
  birth_date: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  country: string | null;
  cep: string | null;
  address: string | null;
  number: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  tags: string[];
  totalBookings: number;
  totalSpent: number;
  lastBooking: string | null;
  ltvCategory?: "VIP" | "Fiel" | "Novo";
}

interface CustomerDocument {
  id: string;
  customer_id: string;
  name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  category: string;
  created_at: string;
}

interface Dependent {
  id: string;
  customer_id: string;
  name: string;
  cpf: string | null;
  birth_date: string | null;
  relationship: string;
  created_at: string;
}

interface BookingRow {
  id: string;
  booking_code: string;
  item_name: string;
  date: string | null;
  guests: number;
  final_total: number;
  status: string;
  payment_status: string;
  created_at: string;
  type: string;
}

const maskCPF = (v: string) => {
  const n = v.replace(/\D/g, "");
  if (n.length <= 11) return n.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  return n;
};

const maskCEP = (v: string) => {
  const n = v.replace(/\D/g, "");
  if (n.length <= 8) return n.replace(/(\d{5})(\d{3})/, "$1-$2");
  return n;
};

const maskPhone = (v: string) => {
  const n = v.replace(/\D/g, "");
  if (n.length <= 10) return n.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  if (n.length === 11) return n.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  return v;
};

interface CustomerForm {
  name: string;
  email: string;
  phone: string;
  cpf: string;
  passport: string;
  birth_date: string;
  notes: string;
  status: string;
  country: string;
  cep: string;
  address: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  tags: string[];
}

interface DependentForm {
  name: string;
  cpf: string;
  birth_date: string;
  relationship: string;
}

const emptyForm: CustomerForm = { 
  name: "", 
  email: "", 
  phone: "", 
  cpf: "", 
  passport: "",
  birth_date: "", 
  notes: "", 
  status: "regular",
  country: "Brasil",
  cep: "",
  address: "",
  number: "",
  neighborhood: "",
  city: "",
  state: "",
  tags: []
};

const emptyDependentForm: DependentForm = {
  name: "",
  cpf: "",
  birth_date: "",
  relationship: "Filho(a)"
};

const fmt = (v: number) => `R$ ${(v / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Helper masks already defined above
const fmtPrice = (v: number) => `R$ ${(v / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;


const isValidCPF = (cpf: string) => {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return false;
  if (/^(\d)\1+$/.test(digits)) return false;

  let sum = 0;
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(digits.substring(i - 1, i)) * (11 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(digits.substring(9, 10))) return false;

  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(digits.substring(i - 1, i)) * (12 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(digits.substring(10, 11))) return false;

  return true;
};

const payStatusConfig: Record<string, { label: string; className: string }> = {
  pago: { label: "Pago", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  pendente: { label: "Pendente", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
};

const statusConfig: Record<string, { label: string; className: string }> = {
  pendente: { label: "Pendente", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  confirmada: { label: "Confirmada", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  cancelada: { label: "Cancelada", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

const customerStatusConfig: Record<string, { label: string; className: string }> = {
  regular: { label: "Regular", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  vip: { label: "VIP", className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  bloqueado: { label: "Bloqueado", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

const validateForm = (form: CustomerForm): string | null => {
  const name = form.name.trim();
  if (!name || name.length < 2 || name.length > 120) return "Nome deve ter entre 2 e 120 caracteres.";
  
  const email = form.email.trim().toLowerCase();
  if (email && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255)) {
    return "E-mail informado é inválido.";
  }

  if (form.phone) {
    const digits = form.phone.replace(/\D/g, "");
    if (digits.length < 10 && form.country === "Brasil") return "Telefone deve ter 10 ou 11 dígitos.";
  }

  if (form.country === "Brasil") {
    if (!form.cpf) return "CPF é obrigatório para brasileiros.";
    if (!isValidCPF(form.cpf)) return "CPF inválido.";
  } else if (!form.passport) {
    return "Passaporte é obrigatório para estrangeiros.";
  }

  return null;
};

const calculateAge = (birthDate: string | null) => {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate + "T00:00:00");
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

const AdminCRM = () => {
  return (
    <TooltipProvider>
      <AdminCRMContent />
    </TooltipProvider>
  );
};

const AdminCRMContent = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerBookings, setCustomerBookings] = useState<BookingRow[]>([]);
  const [customerDocuments, setCustomerDocuments] = useState<CustomerDocument[]>([]);
  const [dependents, setDependents] = useState<Dependent[]>([]);
  const [allDependents, setAllDependents] = useState<(Dependent & { customer_name: string })[]>([]);
  const [filter, setFilter] = useState<"all" | "with_bookings" | "no_bookings" | "dependents">("all");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState<CustomerForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [fetchingCep, setFetchingCep] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [deleteDocConfirm, setDeleteDocConfirm] = useState<string | null>(null);
  const [docCategory, setDocCategory] = useState("outros");

  const handleCepSearch = async (cep: string) => {
    const cleanedCep = cep.replace(/\D/g, "");
    if (cleanedCep.length !== 8) return;

    setFetchingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanedCep}/json/`);
      const data = await response.json();
      
      if (data.erro) {
        toast.error("CEP não encontrado.");
      } else {
        setForm(prev => ({
          ...prev,
          address: data.logradouro,
          neighborhood: data.bairro,
          city: data.localidade,
          state: data.uf
        }));
      }
    } catch (error) {
      toast.error("Erro ao buscar CEP.");
    } finally {
      setFetchingCep(false);
    }
  };

  // Dependent Modal state
  const [dependentModalOpen, setDependentModalOpen] = useState(false);
  const [editingDependent, setEditingDependent] = useState<Dependent | null>(null);
  const [depForm, setDepForm] = useState<DependentForm>(emptyDependentForm);
  const [savingDependent, setSavingDependent] = useState(false);
  const [deleteDepConfirm, setDeleteDepConfirm] = useState<string | null>(null);

  const relationships = ["Cônjuge", "Namorado(a)", "Filho(a)", "Amigo(a)", "Tutor"];

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchAllDependents = async () => {
    const { data } = await supabase
      .from("dependents")
      .select("*, customers(name)")
      .order("name");
    
    if (data) {
      setAllDependents(data.map((d: any) => ({
        ...d,
        customer_name: d.customers?.name || "Desconhecido"
      })));
    }
  };

  const fetchCustomers = async () => {
    setLoading(true);
    const { data: customersData, error } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar clientes.");
      setLoading(false);
      return;
    }

    if (customersData) {
      const { data: bookingsData } = await supabase
        .from("bookings")
        .select("customer_id, final_total, status, created_at");

      const bookingsByCustomer: Record<string, { count: number; total: number; lastDate: string | null }> = {};
      (bookingsData || []).forEach((b: any) => {
        if (!bookingsByCustomer[b.customer_id]) {
          bookingsByCustomer[b.customer_id] = { count: 0, total: 0, lastDate: null };
        }
        bookingsByCustomer[b.customer_id].count++;
        if (b.status !== "cancelada") {
          bookingsByCustomer[b.customer_id].total += b.final_total;
        }
        if (!bookingsByCustomer[b.customer_id].lastDate || b.created_at > bookingsByCustomer[b.customer_id].lastDate!) {
          bookingsByCustomer[b.customer_id].lastDate = b.created_at;
        }
      });

      setCustomers(customersData.map((c: any) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        cpf: c.cpf,
        passport: c.passport,
        birth_date: c.birth_date,
        notes: c.notes,
        status: c.status || "regular",
        created_at: c.created_at,
        country: c.country || "Brasil",
        cep: c.cep,
        address: c.address,
        number: c.number,
        neighborhood: c.neighborhood,
        city: c.city,
        state: c.state,
        tags: c.tags || [],
        totalBookings: bookingsByCustomer[c.id]?.count || 0,
        totalSpent: bookingsByCustomer[c.id]?.total || 0,
        lastBooking: bookingsByCustomer[c.id]?.lastDate || null,
        ltvCategory: (bookingsByCustomer[c.id]?.total || 0) > 500000 ? "VIP" : (bookingsByCustomer[c.id]?.count || 0) >= 3 ? "Fiel" : "Novo"
      })));
    }
    setLoading(false);
    fetchAllDependents();
  };

  const fetchDependents = async (customerId: string) => {
    const { data } = await supabase
      .from("dependents")
      .select("*")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });
    setDependents(data || []);
  };

  const fetchDocuments = async (customerId: string) => {
    const { data } = await supabase
      .from("customer_documents")
      .select("*")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });
    setCustomerDocuments(data || []);
  };

  const selectCustomer = async (c: Customer) => {
    setSelectedCustomer(c);
    
    // Fetch bookings
    const { data: bookings } = await supabase
      .from("bookings")
      .select("id, booking_code, item_name, date, guests, final_total, status, payment_status, created_at, type")
      .eq("customer_id", c.id)
      .order("created_at", { ascending: false });
    setCustomerBookings(bookings || []);

    // Fetch dependents
    fetchDependents(c.id);

    // Fetch documents
    fetchDocuments(c.id);
  };

  const openCreateModal = () => {
    setEditingCustomer(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setForm({ 
      name: c.name, 
      email: c.email, 
      phone: c.phone || "", 
      cpf: c.cpf || "",
      passport: c.passport || "",
      birth_date: c.birth_date || "",
      notes: c.notes || "",
      status: c.status || "regular",
      country: c.country || "Brasil",
      cep: c.cep || "",
      address: c.address || "",
      number: c.number || "",
      neighborhood: c.neighborhood || "",
      city: c.city || "",
      state: c.state || "",
      tags: c.tags || []
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const validationError = validateForm(form);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      email: form.email.trim() ? form.email.trim().toLowerCase() : null,
      phone: form.phone.replace(/\D/g, "") || null,
      cpf: form.country === "Brasil" ? (form.cpf.replace(/\D/g, "") || null) : null,
      passport: form.country !== "Brasil" ? (form.passport || null) : null,
      birth_date: form.birth_date || null,
      notes: form.notes || null,
      status: form.status,
      country: form.country,
      cep: form.cep,
      address: form.address,
      number: form.number,
      neighborhood: form.neighborhood,
      city: form.city,
      state: form.state,
      tags: form.tags
    };

    if (editingCustomer) {
      const { error } = await supabase
        .from("customers")
        .update(payload)
        .eq("id", editingCustomer.id);
      if (error) {
        toast.error(error.message.includes("customers_email_unique") ? "E-mail já cadastrado." : error.message.includes("customers_cpf_key") ? "CPF já cadastrado." : "Erro ao atualizar cliente.");
        setSaving(false);
        return;
      }
      toast.success("Cliente atualizado!");
      if (selectedCustomer?.id === editingCustomer.id) {
        setSelectedCustomer({ ...selectedCustomer, ...payload });
      }
    } else {
      const { error } = await supabase.from("customers").insert(payload);
      if (error) {
        toast.error(error.message.includes("customers_email_unique") ? "E-mail já cadastrado." : error.message.includes("customers_cpf_key") ? "CPF já cadastrado." : "Erro ao cadastrar cliente.");
        setSaving(false);
        return;
      }
      toast.success("Cliente cadastrado!");
    }

    setSaving(false);
    setModalOpen(false);
    fetchCustomers();
  };

  const openCreateDependentModal = () => {
    setEditingDependent(null);
    setDepForm(emptyDependentForm);
    setDependentModalOpen(true);
  };

  const openEditDependentModal = (d: Dependent) => {
    setEditingDependent(d);
    setDepForm({
      name: d.name,
      cpf: d.cpf ? maskCPF(d.cpf) : "",
      birth_date: d.birth_date || "",
      relationship: d.relationship
    });
    setDependentModalOpen(true);
  };

  const handleSaveDependent = async () => {
    if (!selectedCustomer) return;
    if (!depForm.name.trim()) {
      toast.error("Nome é obrigatório.");
      return;
    }

    setSavingDependent(true);
    const payload = {
      customer_id: selectedCustomer.id,
      name: depForm.name.trim(),
      cpf: depForm.cpf.replace(/\D/g, "") || null,
      birth_date: depForm.birth_date || null,
      relationship: depForm.relationship
    };

    if (editingDependent) {
      const { error } = await supabase
        .from("dependents")
        .update(payload)
        .eq("id", editingDependent.id);
      if (error) {
        toast.error("Erro ao atualizar dependente.");
        setSavingDependent(false);
        return;
      }
      toast.success("Dependente atualizado!");
    } else {
      const { error } = await supabase.from("dependents").insert(payload);
      if (error) {
        toast.error("Erro ao cadastrar dependente.");
        setSavingDependent(false);
        return;
      }
      toast.success("Dependente cadastrado!");
    }

    setSavingDependent(false);
    setDependentModalOpen(false);
    fetchDependents(selectedCustomer.id);
  };

  const handleDeleteDependent = async (id: string) => {
    const { error } = await supabase.from("dependents").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir dependente.");
      return;
    }
    toast.success("Dependente excluído!");
    setDeleteDepConfirm(null);
    if (selectedCustomer) fetchDependents(selectedCustomer.id);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("customers").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir. Pode ter reservas vinculadas.");
      setDeleteConfirm(null);
      return;
    }
    toast.success("Cliente excluído!");
    setDeleteConfirm(null);
    if (selectedCustomer?.id === id) {
      setSelectedCustomer(null);
      setCustomerBookings([]);
    }
    fetchCustomers();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedCustomer || !e.target.files || e.target.files.length === 0) return;
    
    setUploadingDoc(true);
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${selectedCustomer.id}/${Date.now()}.${fileExt}`;
    
    try {
      const { data, error } = await supabase.storage
        .from('customer-documents')
        .upload(fileName, file);
        
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage
        .from('customer-documents')
        .getPublicUrl(fileName);
        
      const { error: dbError } = await supabase
        .from('customer_documents')
        .insert({
          customer_id: selectedCustomer.id,
          name: file.name,
          file_url: publicUrl,
          file_type: file.type,
          file_size: file.size,
          category: docCategory
        });
        
      if (dbError) throw dbError;
      
      toast.success("Documento anexado!");
      fetchDocuments(selectedCustomer.id);
    } catch (error: any) {
      toast.error("Erro ao anexar documento: " + error.message);
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    const doc = customerDocuments.find(d => d.id === id);
    if (!doc) return;
    
    try {
      const path = doc.file_url.split('/').pop();
      if (path) {
        const fullPath = `${selectedCustomer?.id}/${path}`;
        await supabase.storage.from('customer-documents').remove([fullPath]);
      }
      
      const { error } = await supabase.from("customer_documents").delete().eq("id", id);
      if (error) throw error;
      
      toast.success("Documento removido!");
      if (selectedCustomer) fetchDocuments(selectedCustomer.id);
    } catch (error: any) {
      toast.error("Erro ao excluir documento.");
    }
    setDeleteDocConfirm(null);
  };

  const exportCSV = () => {
    if (filtered.length === 0) {
      toast.error("Nenhum cliente para exportar.");
      return;
    }
    const header = "Nome,Email,Telefone,Documento,Data Nascimento,Status,Pais,CEP,Endereco,Cidade,Estado,Reservas,Total Gasto,Cadastro,Observacoes\n";
    const rows = filtered.map(c =>
      `"${c.name}","${c.email}","${c.phone || ""}","${c.country === "Brasil" ? (c.cpf || "") : (c.passport || "")}","${c.birth_date || ""}","${c.status}","${c.country || "Brasil"}","${c.cep || ""}","${(c.address || "").replace(/"/g, '""')}","${c.city || ""}","${c.state || ""}",${c.totalBookings},"${fmt(c.totalSpent)}","${new Date(c.created_at).toLocaleDateString("pt-BR")}","${(c.notes || "").replace(/"/g, '""')}"`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clientes_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${filtered.length} clientes exportados!`);
  };

  const exportPDF = () => {
    if (filtered.length === 0) {
      toast.error("Nenhum cliente para exportar.");
      return;
    }

    const doc = new jsPDF();
    const tableColumn = ["Nome", "Email", "Telefone", "Documento", "Cidade/UF", "Reservas", "Total Gasto"];
    const tableRows: any[] = [];

    filtered.forEach(c => {
      const customerData = [
        c.name,
        c.email,
        c.phone || "—",
        c.country === "Brasil" ? (c.cpf ? maskCPF(c.cpf) : "—") : (c.passport || "—"),
        c.city ? `${c.city}/${c.state || ""}` : "—",
        c.totalBookings,
        fmt(c.totalSpent)
      ];
      tableRows.push(customerData);
    });

    doc.setFontSize(18);
    doc.text("Relatório de Clientes", 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, 14, 30);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      theme: "striped",
      headStyles: { fillColor: [45, 108, 223], textColor: [255, 255, 255] },
      styles: { fontSize: 8, cellPadding: 2 },
    });

    doc.save(`clientes_${new Date().toISOString().split("T")[0]}.pdf`);
    toast.success(`${filtered.length} clientes exportados para PDF!`);
  };

  const exportClientPDF = (c: Customer) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(45, 108, 223);
    doc.rect(0, 0, 210, 40, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("Ficha do Cliente", 14, 25);
    
    // Content
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("DADOS PESSOAIS", 14, 55);
    doc.line(14, 57, 196, 57);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Nome: ${c.name}`, 14, 65);
    doc.text(`E-mail: ${c.email}`, 14, 72);
    doc.text(`Telefone: ${c.phone ? maskPhone(c.phone) : "—"}`, 14, 79);
    doc.text(`Documento: ${c.country === "Brasil" ? (c.cpf ? maskCPF(c.cpf) : "—") : (c.passport || "—")}`, 14, 86);
    doc.text(`Data de Nascimento: ${c.birth_date ? new Date(c.birth_date + "T00:00:00").toLocaleDateString("pt-BR") : "—"}`, 14, 93);
    doc.text(`Nacionalidade: ${c.country}`, 14, 100);
    
    doc.setFont("helvetica", "bold");
    doc.text("ENDEREÇO", 14, 115);
    doc.line(14, 117, 196, 117);
    doc.setFont("helvetica", "normal");
    doc.text(`Endereço: ${c.address || "—"}${c.number ? `, ${c.number}` : ""}`, 14, 125);
    doc.text(`Bairro: ${c.neighborhood || "—"}`, 14, 132);
    doc.text(`Cidade/Estado: ${c.city || "—"} - ${c.state || "—"}`, 14, 139);
    doc.text(`CEP: ${c.cep || "—"}`, 14, 146);
    
    if (c.notes) {
      doc.setFont("helvetica", "bold");
      doc.text("OBSERVAÇÕES", 14, 160);
      doc.line(14, 162, 196, 162);
      doc.setFont("helvetica", "normal");
      const splitNotes = doc.splitTextToSize(c.notes, 180);
      doc.text(splitNotes, 14, 170);
    }

    // Bookings summary
    doc.setFont("helvetica", "bold");
    doc.text("RESUMO FINANCEIRO", 14, 200);
    doc.line(14, 202, 196, 202);
    doc.setFont("helvetica", "normal");
    doc.text(`Total de Reservas: ${c.totalBookings}`, 14, 210);
    doc.text(`Total Gasto: ${fmt(c.totalSpent)}`, 14, 217);
    doc.text(`Última Reserva: ${c.lastBooking ? new Date(c.lastBooking).toLocaleDateString("pt-BR") : "—"}`, 14, 224);

    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Ficha gerada em ${new Date().toLocaleString("pt-BR")}`, 14, 285);

    doc.save(`cliente_${c.name.replace(/\s+/g, "_")}.pdf`);
    toast.success("Ficha do cliente gerada com sucesso!");
  };

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    const matchesSearch = c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || (c.phone || "").includes(q) || (c.cpf || "").includes(q) || (c.passport || "").toLowerCase().includes(q) || (c.city || "").toLowerCase().includes(q);
    if (filter === "with_bookings") return matchesSearch && c.totalBookings > 0;
    if (filter === "no_bookings") return matchesSearch && c.totalBookings === 0;
    if (filter === "dependents") return false; // Handled separately
    return matchesSearch;
  });

  const filteredDependents = allDependents.filter((d) => {
    const q = search.toLowerCase();
    return d.name.toLowerCase().includes(q) || (d.cpf || "").includes(q) || d.customer_name.toLowerCase().includes(q);
  });

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const newThisMonth = customers.filter(c => {
    const d = new Date(c.created_at);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;

  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
  const withBookings = customers.filter((c) => c.totalBookings > 0).length;

  const clientStats = [
    { label: "Total de Clientes", value: customers.length.toString(), icon: Users, color: "text-primary" },
    { label: "Novos (Mês)", value: newThisMonth.toString(), icon: UserPlus, color: "text-purple-600" },
    { label: "Receita Total", value: fmt(totalRevenue), icon: DollarSign, color: "text-blue-600" },
    { label: "Ticket Médio", value: withBookings > 0 ? fmt(Math.round(totalRevenue / withBookings)) : "R$ 0", icon: Smartphone, color: "text-amber-600" },
  ];

  if (loading) {
    return (
      <AdminLayout title="CRM - Clientes">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="CRM - Clientes">
      <div className="space-y-6">
        {/* Stats */}
        <CustomerStats 
          totalCustomers={customers.length}
          newThisMonth={newThisMonth}
          totalRevenue={totalRevenue}
          averageTicket={withBookings > 0 ? Math.round(totalRevenue / withBookings) : 0}
          fmt={fmt}
        />

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Client List */}
          <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="flex items-center gap-2 flex-1 bg-muted rounded-xl px-4 py-2.5">
                <Search size={16} className="text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar por nome, e-mail, telefone, documento ou cidade..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-transparent w-full outline-none text-foreground text-sm placeholder:text-muted-foreground"
                />
              </div>
                <div className="flex flex-wrap gap-2">
                <Button size="sm" className="rounded-xl flex-1 sm:flex-none" onClick={openCreateModal}>
                  <Plus size={14} className="mr-1" /> Novo Cliente
                </Button>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button variant="outline" size="sm" className="rounded-xl flex-1 sm:flex-none" onClick={() => fetchCustomers()}>
                    <RefreshCw size={14} />
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-xl flex-1 sm:flex-none" onClick={exportCSV}>
                    <Download size={14} /> <span className="hidden xs:inline">CSV</span>
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-xl flex-1 sm:flex-none" onClick={exportPDF}>
                    <FileText size={14} /> <span className="hidden xs:inline">PDF</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-1.5 mb-6 overflow-x-auto pb-2 scrollbar-hide">
              {([
                { key: "all" as const, label: "Titulares", count: customers.length },
                { key: "with_bookings" as const, label: "Com Reservas", count: withBookings },
                { key: "no_bookings" as const, label: "Sem Reservas", count: customers.length - withBookings },
                { key: "dependents" as const, label: "Dependentes", count: allDependents.length },
              ]).map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                    filter === f.key
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {f.label} ({f.count})
                </button>
              ))}
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 overflow-hidden">
              {(filter === "dependents" ? filteredDependents : filtered).length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="mx-auto mb-3 opacity-40" size={40} />
                  <p className="font-medium">Nenhum {filter === "dependents" ? "dependente" : "cliente"} encontrado</p>
                  <p className="text-sm mt-1">Clique em "Novo Cliente" para cadastrar.</p>
                </div>
              ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground bg-muted/30">
                      <th className="text-left py-3 px-4 font-bold uppercase text-[10px] tracking-widest">{filter === "dependents" ? "Dependente" : "Cliente"}</th>
                      <th className="text-left py-3 px-2 font-bold uppercase text-[10px] tracking-widest hidden sm:table-cell">{filter === "dependents" ? "Titular" : "Contato"}</th>
                      <th className="text-center py-3 px-2 font-bold uppercase text-[10px] tracking-widest">{filter === "dependents" ? "Idade" : "Histórico"}</th>
                      <th className="text-right py-3 px-2 font-bold uppercase text-[10px] tracking-widest hidden sm:table-cell">{filter === "dependents" ? "Parentesco" : "Faturamento"}</th>
                      <th className="text-right py-3 px-4 font-bold uppercase text-[10px] tracking-widest">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filter === "dependents" ? (
                      filteredDependents.map((d) => {
                        const age = calculateAge(d.birth_date);
                        return (
                          <tr
                            key={d.id}
                            className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                          >
                            <td className="py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs font-bold shrink-0">
                                  <Baby size={16} />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-foreground truncate">{d.name}</p>
                                  <p className="text-xs text-muted-foreground truncate">{d.cpf ? maskCPF(d.cpf) : "Sem CPF"}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 text-muted-foreground hidden sm:table-cell">
                              <span className="flex items-center gap-1">
                                <Users size={12} /> {d.customer_name}
                              </span>
                            </td>
                            <td className="py-3 text-right text-foreground font-medium">
                              {age !== null ? `${age} anos` : "—"}
                            </td>
                            <td className="py-3 text-right font-semibold text-foreground hidden sm:table-cell">
                              <Badge variant="outline" className="text-[10px]">{d.relationship}</Badge>
                            </td>
                            <td className="py-3 text-right">
                              <div className="flex gap-1 justify-end">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                                      const parent = customers.find(c => c.id === d.customer_id);
                                      if (parent) selectCustomer(parent);
                                    }}>
                                      <Eye size={14} className="text-primary" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Ver Responsável</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      filtered.map((c) => {
                        const hasDependents = allDependents.some(d => d.customer_id === c.id);
                        const ltvColor = c.ltvCategory === "VIP" ? "bg-purple-100 text-purple-700 border-purple-200" : c.ltvCategory === "Fiel" ? "bg-blue-100 text-blue-700 border-blue-200" : "bg-muted text-muted-foreground border-border";
                        
                        return (
                          <tr
                            key={c.id}
                            className={`border-b border-border last:border-0 hover:bg-primary/5 transition-all cursor-pointer group ${selectedCustomer?.id === c.id ? "bg-primary/5" : ""}`}
                            onClick={() => selectCustomer(c)}
                          >
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-xs font-black shrink-0 shadow-sm group-hover:bg-primary group-hover:text-white transition-all">
                                  {c.name.trim() ? c.name.trim().split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "C"}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-foreground truncate flex items-center gap-2 group-hover:text-primary transition-colors">
                                    {c.name}
                                    {c.ltvCategory && (
                                      <Badge variant="outline" className={`text-[8px] px-1.5 py-0 font-black uppercase tracking-tighter ${ltvColor}`}>
                                        {c.ltvCategory}
                                      </Badge>
                                    )}
                                  </p>
                                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium">
                                    <Mail size={10} />
                                    {c.email}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-2 hidden sm:table-cell">
                              <div className="flex flex-col">
                                <span className="text-xs font-semibold text-foreground flex items-center gap-1">
                                  <Smartphone size={10} className="text-primary" />
                                  {c.phone ? maskPhone(c.phone) : "—"}
                                </span>
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                  <MapPin size={10} />
                                  {c.city || "N/A"}/{c.state || "N/A"}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-2 text-center">
                              <div className="flex flex-col items-center">
                                <span className="text-sm font-bold">{c.totalBookings}</span>
                                <span className="text-[9px] uppercase font-black text-muted-foreground tracking-tighter">Reservas</span>
                              </div>
                            </td>
                            <td className="py-4 px-2 text-right hidden sm:table-cell">
                              <div className="flex flex-col items-end">
                                <span className="text-sm font-black text-foreground">{fmt(c.totalSpent)}</span>
                                <span className="text-[9px] uppercase font-bold text-primary tracking-widest">LTV TOTAL</span>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-right">
                            <div className="flex gap-1 justify-end">
                              {c.phone && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <a
                                      href={`https://wa.me/55${c.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá ${c.name.split(" ")[0]}! Tudo bem?`)}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-green-100 dark:hover:bg-green-900/30">
                                        <Smartphone size={14} className="text-green-600" />
                                      </Button>
                                    </a>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Enviar WhatsApp</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); openEditModal(c); }}>
                                    <Pencil size={14} className="text-muted-foreground" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Editar Cliente</p>
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); setDeleteConfirm(c.id); }}>
                                    <Trash2 size={14} className="text-destructive" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Excluir Cliente</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </td>
                        </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Lençóis Tour CRM Live</p>
                  </div>
                  <Badge variant="secondary" className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg">
                    {(filter === "dependents" ? filteredDependents : filtered).length} registro(s)
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
            {selectedCustomer ? (
                <div className="space-y-6">
                  <div className="text-center bg-muted/20 p-6 rounded-3xl border border-border/50">
                    <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground text-2xl font-black mx-auto mb-4 shadow-xl">
                      {selectedCustomer.name.trim() ? selectedCustomer.name.trim().split(" ").filter(Boolean).map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "C"}
                    </div>
                    <h3 className="font-display text-xl font-black text-foreground">{selectedCustomer.name}</h3>
                    <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
                      <Badge variant="outline" className={`uppercase text-[10px] font-black tracking-widest px-3 py-1 ${customerStatusConfig[selectedCustomer.status]?.className || ""}`}>
                        {customerStatusConfig[selectedCustomer.status]?.label || selectedCustomer.status}
                      </Badge>
                      {selectedCustomer.ltvCategory && (
                        <Badge variant="secondary" className="uppercase text-[10px] font-black tracking-widest px-3 py-1 bg-primary text-white">
                          {selectedCustomer.ltvCategory}
                        </Badge>
                      )}
                      {selectedCustomer.tags?.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-[8px] uppercase tracking-tighter px-1.5 py-0 bg-muted text-muted-foreground border-border">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground mt-4 uppercase tracking-widest">
                      Parceiro Lençóis Tour desde {new Date(selectedCustomer.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>

                  <Tabs defaultValue="info" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                      <TabsTrigger value="info" className="text-[10px] font-black uppercase tracking-widest">Informações</TabsTrigger>
                      <TabsTrigger value="timeline" className="text-[10px] font-black uppercase tracking-widest">Histórico</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="info" className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 text-center">
                          <p className="text-2xl font-black text-primary leading-none">{selectedCustomer.totalBookings}</p>
                          <p className="text-[10px] uppercase font-bold text-muted-foreground mt-2 tracking-widest">Viagens</p>
                        </div>
                        <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 text-center">
                          <p className="text-2xl font-black text-foreground leading-none">{fmt(selectedCustomer.totalSpent)}</p>
                          <p className="text-[10px] uppercase font-bold text-muted-foreground mt-2 tracking-widest">LTV Acumulado</p>
                        </div>
                      </div>

                      <div className="space-y-4 bg-muted/10 p-5 rounded-2xl border border-border/50 shadow-inner">
                        <div className="flex items-center gap-4 text-sm font-semibold">
                          <div className="p-2 rounded-lg bg-background border border-border cursor-pointer hover:bg-muted" onClick={() => { navigator.clipboard.writeText(selectedCustomer.email || ""); toast.success("E-mail copiado!"); }}><Mail size={16} className="text-primary" /></div>
                          <span className="text-foreground truncate">{selectedCustomer.email || "Sem e-mail cadastrado"}</span>
                        </div>
                        {selectedCustomer.phone && (
                          <div className="flex items-center gap-4 text-sm font-semibold">
                            <div className="p-2 rounded-lg bg-background border border-border cursor-pointer hover:bg-muted" onClick={() => { navigator.clipboard.writeText(selectedCustomer.phone || ""); toast.success("Telefone copiado!"); }}><Smartphone size={16} className="text-primary" /></div>
                            <span className="text-foreground">{maskPhone(selectedCustomer.phone)}</span>
                          </div>
                        )}
                        {selectedCustomer.address && (
                          <div className="flex items-start gap-4 text-sm font-semibold">
                            <div className="p-2 rounded-lg bg-background border border-border shrink-0"><MapPin size={16} className="text-primary" /></div>
                            <div className="flex flex-col">
                              <span className="text-foreground text-xs leading-tight">
                                {selectedCustomer.address}{selectedCustomer.number ? `, ${selectedCustomer.number}` : ""}
                              </span>
                              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter mt-1">
                                {selectedCustomer.neighborhood ? `${selectedCustomer.neighborhood}, ` : ""}{selectedCustomer.city} - {selectedCustomer.state}
                              </span>
                            </div>
                          </div>
                        )}
                        {selectedCustomer.lastBooking && (
                          <div className="flex items-center gap-4 text-sm border-t border-border pt-4 mt-2">
                            <div className="p-2 rounded-lg bg-primary/10"><Calendar size={16} className="text-primary" /></div>
                            <div className="flex flex-col">
                              <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Última Viagem</span>
                              <span className="text-xs font-bold">{new Date(selectedCustomer.lastBooking).toLocaleDateString("pt-BR", { dateStyle: 'long' })}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {selectedCustomer.notes && (
                        <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/20 shadow-sm">
                          <p className="text-[10px] font-black text-amber-800 dark:text-amber-400 uppercase tracking-widest mb-1">Observações Internas</p>
                          <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed font-medium">{selectedCustomer.notes}</p>
                        </div>
                      )}

                      <div className="flex flex-col gap-2">
                        {selectedCustomer.phone && (
                          <div className="flex gap-2">
                            <a
                              href={`https://wa.me/${selectedCustomer.country === "Brasil" ? "55" : ""}${selectedCustomer.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá ${selectedCustomer.name.split(" ")[0]}! Tudo bem?`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1"
                            >
                              <Button className="w-full rounded-xl bg-green-600 hover:bg-green-700 text-white shadow-sm h-11">
                                <Smartphone size={16} /> WhatsApp
                              </Button>
                            </a>
                            <a
                              href={`tel:${selectedCustomer.phone.replace(/\D/g, "")}`}
                              className="shrink-0"
                            >
                              <Button variant="outline" className="rounded-xl h-11 w-11 p-0">
                                <Phone size={16} />
                              </Button>
                            </a>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-2">
                          <Button variant="outline" className="w-full rounded-xl h-11" onClick={() => openEditModal(selectedCustomer)}>
                            <Pencil size={14} /> Editar
                          </Button>
                          <Button variant="outline" className="w-full rounded-xl border-primary/20 text-primary hover:bg-primary/5 h-11" onClick={() => exportClientPDF(selectedCustomer)}>
                            <Printer size={14} /> Ficha PDF
                          </Button>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="timeline">
                      <CustomerInteractionHistory customerId={selectedCustomer.id} />
                    </TabsContent>
                  </Tabs>
                <div className="border-t border-border pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-display font-bold text-foreground">Dependentes / Acompanhantes</h4>
                    <Button variant="ghost" size="sm" className="h-7 text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary hover:bg-primary/20 rounded-lg" onClick={openCreateDependentModal}>
                      <Plus size={12} className="mr-1" /> Adicionar
                    </Button>
                  </div>
                  
                  {dependents.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground italic bg-muted/20 p-3 rounded-xl border border-dashed border-border text-center mb-6">
                      Nenhum dependente cadastrado.
                    </p>
                  ) : (
                    <div className="space-y-2 mb-6">
                      {dependents.map(d => {
                        const age = calculateAge(d.birth_date);
                        return (
                          <div key={d.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border border-border/50 group hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center text-muted-foreground">
                                <Baby size={16} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-foreground truncate">{d.name}</p>
                                <p className="text-[9px] text-muted-foreground uppercase font-black tracking-tighter">
                                  {d.relationship} • {age !== null ? `${age} anos` : "—"} • {d.cpf ? maskCPF(d.cpf) : "SEM CPF"}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDependentModal(d)}>
                                <Pencil size={12} className="text-muted-foreground" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-destructive/10" onClick={() => setDeleteDepConfirm(d.id)}>
                                <Trash2 size={12} className="text-destructive" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-3 border-t border-border pt-4">
                    <h4 className="font-display font-bold text-foreground">Documentos e Anexos</h4>
                    <div className="flex gap-2">
                      <select 
                        className="text-[10px] bg-background border border-border rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-primary/50 font-bold uppercase tracking-tight"
                        value={docCategory}
                        onChange={(e) => setDocCategory(e.target.value)}
                      >
                        <option value="outros">Outros</option>
                        <option value="recibo">Recibo</option>
                        <option value="termo">Termo</option>
                        <option value="documento">Documento</option>
                      </select>
                      <Label htmlFor="doc-upload" className="cursor-pointer">
                        <div className="flex items-center gap-1 bg-primary/10 text-primary hover:bg-primary/20 px-2 py-1 rounded text-[10px] font-bold transition-colors">
                          {uploadingDoc ? <Loader2 size={12} className="animate-spin" /> : <Paperclip size={12} />}
                          Anexar
                        </div>
                        <Input 
                          id="doc-upload" 
                          type="file" 
                          className="hidden" 
                          onChange={handleFileUpload} 
                          disabled={uploadingDoc}
                        />
                      </Label>
                    </div>
                  </div>
                  
                  {customerDocuments.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground italic bg-muted/20 p-3 rounded-xl border border-dashed border-border text-center">
                      Nenhum documento anexado.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {customerDocuments.map((doc) => (
                        <div key={doc.id} className="bg-muted/50 rounded-xl p-3 flex items-center justify-between group">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center shrink-0 border border-border">
                              <FileText size={16} className="text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">{doc.name}</p>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[8px] px-1 py-0 uppercase bg-background">
                                  {doc.category}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground">
                                  {new Date(doc.created_at).toLocaleDateString("pt-BR")}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <Download size={12} />
                              </Button>
                            </a>
                            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-destructive/10" onClick={() => setDeleteDocConfirm(doc.id)}>
                              <Trash2 size={12} className="text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-border pt-6 mt-6">
                  <h4 className="font-display font-bold text-foreground mb-3">Histórico de Reservas</h4>
                  {customerBookings.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma reserva encontrada.</p>
                  ) : (
                    <div className="space-y-2">
                      {customerBookings.map((b) => (
                        <div key={b.id} className="bg-muted/40 hover:bg-muted/60 transition-colors border border-border/50 rounded-2xl px-4 py-3 group">
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="text-[10px] font-black font-mono text-muted-foreground bg-background px-1.5 py-0.5 rounded border border-border">{b.booking_code}</span>
                              <Badge variant="secondary" className="text-[8px] font-black uppercase tracking-tighter px-1.5 py-0">{b.type === "passeio" ? "Passeio" : "Translado"}</Badge>
                            </div>
                            <p className="text-sm font-black text-primary ml-2">{fmt(b.final_total)}</p>
                          </div>
                          <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">{b.item_name}</p>
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                              {b.date || new Date(b.created_at).toLocaleDateString("pt-BR")} · {b.guests} {b.guests === 1 ? 'pessoa' : 'pessoas'}
                            </p>
                            <div className="flex gap-1">
                              <Badge variant="outline" className={`text-[8px] font-black uppercase tracking-tighter ${statusConfig[b.status]?.className || ""}`}>
                                {statusConfig[b.status]?.label || b.status}
                              </Badge>
                              <Badge variant="outline" className={`text-[8px] font-black uppercase tracking-tighter ${payStatusConfig[b.payment_status]?.className || ""}`}>
                                {payStatusConfig[b.payment_status]?.label || b.payment_status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground text-sm">
                <Users className="mb-3 opacity-30" size={40} />
                Selecione um cliente para ver detalhes
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Delete Document Confirmation */}
      <Dialog open={!!deleteDocConfirm} onOpenChange={() => setDeleteDocConfirm(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Remover Documento</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja remover este anexo permanentemente?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDocConfirm(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={() => deleteDocConfirm && handleDeleteDocument(deleteDocConfirm)}>
              <Trash2 size={14} className="mr-1" /> Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCustomer ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            <div className="md:col-span-2">
              <Label htmlFor="customer-name">Nome *</Label>
              <Input
                id="customer-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nome completo"
                maxLength={120}
                required
                className="rounded-xl"
              />
              {form.birth_date && (
                <p className="text-[10px] mt-1 text-muted-foreground">
                  Idade: {calculateAge(form.birth_date)} anos 
                  ({calculateAge(form.birth_date)! < 18 ? "Menor" : "Maior"})
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="customer-country">Nacionalidade</Label>
              <select
                id="customer-country"
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                className="w-full flex h-10 rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="Brasil">Brasil</option>
                <option value="Estrangeiro">Estrangeiro</option>
              </select>
            </div>
            <div>
              <Label htmlFor="customer-email">E-mail</Label>
              <Input
                id="customer-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="email@exemplo.com (opcional)"
                maxLength={255}
                className="rounded-xl"
              />
            </div>
            <div>
              <Label htmlFor="customer-phone">Telefone</Label>
              <Input
                id="customer-phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: maskPhone(e.target.value) })}
                placeholder={form.country === "Brasil" ? "(99) 99999-9999" : "Telefone com DDI"}
                maxLength={20}
                className="rounded-xl"
              />
            </div>
            <div>
              {form.country === "Brasil" ? (
                <>
                  <Label htmlFor="customer-cpf">CPF *</Label>
                  <Input
                    id="customer-cpf"
                    value={form.cpf}
                    onChange={(e) => setForm({ ...form, cpf: maskCPF(e.target.value) })}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    className="rounded-xl"
                  />
                </>
              ) : (
                <>
                  <Label htmlFor="customer-passport">Passaporte *</Label>
                  <Input
                    id="customer-passport"
                    value={form.passport}
                    onChange={(e) => setForm({ ...form, passport: e.target.value })}
                    placeholder="Número do Passaporte"
                    className="rounded-xl"
                  />
                </>
              )}
            </div>
            <div>
              <Label htmlFor="customer-birth">Data de Nascimento</Label>
              <Input
                id="customer-birth"
                type="date"
                value={form.birth_date}
                onChange={(e) => setForm({ ...form, birth_date: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div>
              <Label htmlFor="customer-status">Status</Label>
              <select
                id="customer-status"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full flex h-10 rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="regular">Regular</option>
                <option value="vip">VIP</option>
                <option value="bloqueado">Bloqueado</option>
              </select>
            </div>

            <div className="md:col-span-2 border-t border-border pt-4 mt-2">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <MapPin size={16} /> Endereço
              </h4>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="customer-cep">
                    {form.country === "Brasil" ? "CEP" : "Código Postal"}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="customer-cep"
                      value={form.cep}
                      onChange={(e) => {
                        const val = form.country === "Brasil" ? maskCEP(e.target.value) : e.target.value;
                        setForm({ ...form, cep: val });
                        if (form.country === "Brasil" && val.replace(/\D/g, "").length === 8) {
                          handleCepSearch(val);
                        }
                      }}
                      placeholder={form.country === "Brasil" ? "00000-000" : "Postal Code"}
                      maxLength={form.country === "Brasil" ? 9 : undefined}
                      className="rounded-xl"
                    />
                    {fetchingCep && <Loader2 size={16} className="animate-spin self-center" />}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="customer-address">Logradouro / Rua</Label>
                  <Input
                    id="customer-address"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="Av. Paulista..."
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <Label htmlFor="customer-number">Número</Label>
                  <Input
                    id="customer-number"
                    value={form.number}
                    onChange={(e) => setForm({ ...form, number: e.target.value })}
                    placeholder="123"
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <Label htmlFor="customer-neighborhood">Bairro</Label>
                  <Input
                    id="customer-neighborhood"
                    value={form.neighborhood}
                    onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}
                    placeholder="Centro"
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <Label htmlFor="customer-city">Cidade</Label>
                  <Input
                    id="customer-city"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="São Paulo"
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <Label htmlFor="customer-state">Estado / Província</Label>
                  <Input
                    id="customer-state"
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    placeholder="SP"
                    className="rounded-xl"
                  />
                </div>
              </div>
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="customer-notes" className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1.5">
                <FileText size={14} /> Observações Internas (Privado)
              </Label>
              <textarea
                id="customer-notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Notas internas importantes sobre as preferências ou restrições do cliente..."
                className="w-full min-h-[100px] rounded-2xl border border-input bg-amber-50/30 dark:bg-amber-900/10 px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/30 focus-visible:border-amber-500/50 transition-all font-medium"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving} className="rounded-xl">
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="rounded-xl">
              {saving ? <Loader2 size={14} className="animate-spin mr-1" /> : <Save size={14} className="mr-1" />}
              {editingCustomer ? "Salvar" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir Cliente</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita. Clientes com reservas vinculadas não podem ser excluídos.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>
              <Trash2 size={14} className="mr-1" /> Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dependent Modal */}
      <Dialog open={dependentModalOpen} onOpenChange={setDependentModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingDependent ? "Editar Dependente" : "Novo Dependente"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="dep-name">Nome *</Label>
              <Input
                id="dep-name"
                value={depForm.name}
                onChange={(e) => setDepForm({ ...depForm, name: e.target.value })}
                placeholder="Nome do dependente"
                className="rounded-xl"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dep-relationship">Parentesco</Label>
                <select
                  id="dep-relationship"
                  value={depForm.relationship}
                  onChange={(e) => setDepForm({ ...depForm, relationship: e.target.value })}
                  className="w-full flex h-10 rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {relationships.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <Label htmlFor="dep-birth">Nascimento</Label>
                <Input
                  id="dep-birth"
                  type="date"
                  value={depForm.birth_date}
                  onChange={(e) => setDepForm({ ...depForm, birth_date: e.target.value })}
                  className="rounded-xl"
                />
                {depForm.birth_date && (
                  <p className="text-[10px] mt-1 text-muted-foreground">
                    Idade: {calculateAge(depForm.birth_date)} anos 
                    ({calculateAge(depForm.birth_date)! < 18 ? "Menor" : "Maior"})
                  </p>
                )}
              </div>
              <div className="col-span-2">
                <Label htmlFor="dep-cpf">CPF</Label>
                <Input
                  id="dep-cpf"
                  value={depForm.cpf}
                  onChange={(e) => setDepForm({ ...depForm, cpf: maskCPF(e.target.value) })}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  className="rounded-xl"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDependentModalOpen(false)} disabled={savingDependent} className="rounded-xl">
              Cancelar
            </Button>
            <Button onClick={handleSaveDependent} disabled={savingDependent} className="rounded-xl">
              {savingDependent ? <Loader2 size={14} className="animate-spin mr-1" /> : <Save size={14} className="mr-1" />}
              {editingDependent ? "Salvar" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dependent Confirmation */}
      <Dialog open={!!deleteDepConfirm} onOpenChange={() => setDeleteDepConfirm(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir Dependente</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir este dependente?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDepConfirm(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={() => deleteDepConfirm && handleDeleteDependent(deleteDepConfirm)}>
              <Trash2 size={14} className="mr-1" /> Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminCRM;
