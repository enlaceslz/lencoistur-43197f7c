import React, { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/components/AdminLayout";
import { 
  Search, Phone, Mail, Globe, Eye, Download, Loader2, Users, ShoppingBag, 
  DollarSign, MapPin, Smartphone, RefreshCw, Calendar, Plus, 
  Pencil, Trash2, X, Save, UserPlus, Baby, FileText, Printer, 
  Paperclip, Upload, History, Tag as TagIcon, Target, CheckCircle2,
  ChevronRight, Star, Heart, Activity, Award, Shield, User, 
  MoreHorizontal, Map, Filter, ArrowRight, UserCheck, UserPlus2
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import CustomerStats from "@/components/crm/CustomerStats";
import CustomerInteractionHistory from "@/components/crm/CustomerInteractionHistory";
import { NumericFormat } from "react-number-format";
import { maskCPF, maskPhone, maskCEP, maskDate } from "@/lib/masks";

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

// Utilizando máscaras centralizadas de @/lib/masks.ts

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
    if (form.country === "Brasil") {
      if (digits.length < 10) return "Telefone brasileiro deve ter 10 ou 11 dígitos.";
    } else {
      if (digits.length < 7) return "Telefone estrangeiro deve ter pelo menos 7 dígitos.";
    }
  }

  if (form.country === "Brasil") {
    if (!form.cpf) return "CPF é obrigatório para brasileiros.";
    if (!isValidCPF(form.cpf)) return "CPF inválido.";
  } else if (!form.passport) {
    return "Passaporte ou Documento é obrigatório para estrangeiros.";
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
  const [isWideViewOpen, setIsWideViewOpen] = useState(false);
  const [isWideViewNewWindow, setIsWideViewNewWindow] = useState(false);
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
    // Check for customer_id in URL for wide view new window
    const urlParams = new URLSearchParams(window.location.search);
    const wideViewId = urlParams.get('wide_view_id');
    if (wideViewId) {
      setIsWideViewNewWindow(true);
      
    }

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

      const mappedCustomers = customersData.map((c: any) => ({
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
        ltvCategory: (bookingsByCustomer[c.id]?.total || 0) > 500000 ? "VIP" : (bookingsByCustomer[c.id]?.count || 0) >= 3 ? "Fiel" : "Novo" as any
      }));

      setCustomers(mappedCustomers);

      if (wideViewId) {
        const target = mappedCustomers.find((c: any) => c.id === wideViewId);
        if (target) {
          selectCustomer(target);
        }
      }
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

  const selectCustomer = useCallback(async (c: Customer) => {
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
  }, []);

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
      phone: form.country === "Brasil" ? (form.phone.replace(/\D/g, "") || null) : (form.phone || null),
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

  return isWideViewNewWindow ? (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
      {/* Visualização Ampla Simplificada para nova janela */}
      <div className="max-w-6xl mx-auto">
        <div className="bg-white border-b border-slate-100 p-6 flex items-center justify-between rounded-t-3xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
              <Users size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 leading-none mb-1">
                {selectedCustomer?.name || "Detalhes do Cliente"}
              </h1>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] font-black uppercase bg-primary/5 text-primary border-primary/10">
                  {selectedCustomer?.ltvCategory || "Cliente"}
                </Badge>
                <p className="text-xs text-slate-500 font-medium">Ficha Cadastral Ampla</p>
              </div>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="rounded-xl font-bold h-10"
            onClick={() => window.close()}
          >
            Fechar Janela
          </Button>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-b-3xl shadow-sm">
          {selectedCustomer ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-1 space-y-8">
                <section className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                    <User size={14} className="text-primary" /> Identificação
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-[10px] uppercase font-bold text-slate-400">CPF / Passaporte</Label>
                      <p className="text-sm font-black text-slate-700">{selectedCustomer.cpf ? maskCPF(selectedCustomer.cpf) : selectedCustomer.passport || "—"}</p>
                    </div>
                    <div>
                      <Label className="text-[10px] uppercase font-bold text-slate-400">Data de Nascimento</Label>
                      <p className="text-sm font-black text-slate-700">{selectedCustomer.birth_date ? new Date(selectedCustomer.birth_date + "T12:00:00").toLocaleDateString("pt-BR") : "—"}</p>
                    </div>
                    <div>
                      <Label className="text-[10px] uppercase font-bold text-slate-400">Nacionalidade</Label>
                      <p className="text-sm font-black text-slate-700">{selectedCustomer.country}</p>
                    </div>
                  </div>
                </section>

                <section className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                    <Smartphone size={14} className="text-emerald-500" /> Contato
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <Phone size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-700 truncate">{selectedCustomer.phone ? maskPhone(selectedCustomer.phone) : "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Mail size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-700 truncate">{selectedCustomer.email || "—"}</p>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              <div className="md:col-span-2 space-y-8">
                <Tabs defaultValue="reservas" className="w-full">
                  <TabsList className="bg-slate-100/50 p-1 rounded-2xl w-full justify-start h-12">
                    <TabsTrigger value="reservas" className="rounded-xl font-bold text-xs px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                      <History size={14} className="mr-2" /> Reservas
                    </TabsTrigger>
                    <TabsTrigger value="documentos" className="rounded-xl font-bold text-xs px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                      <FileText size={14} className="mr-2" /> Documentos
                    </TabsTrigger>
                  </TabsList>
                  
                  <div className="mt-6">
                    <TabsContent value="reservas">
                      {customerBookings.length === 0 ? (
                        <div className="bg-slate-50 rounded-3xl p-12 text-center border border-dashed border-slate-200">
                          <History className="mx-auto mb-3 text-slate-300" size={32} />
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nenhuma reserva histórica</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-3">
                          {customerBookings.map((b) => (
                            <div key={b.id} className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between hover:border-primary/20 hover:shadow-md transition-all group">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center shrink-0">
                                  <ShoppingBag size={18} />
                                </div>
                                <div>
                                  <p className="text-sm font-black text-slate-700 leading-tight">{b.item_name}</p>
                                  <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase">
                                    {b.date || new Date(b.created_at).toLocaleDateString("pt-BR")} · {b.guests} PAX
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-black text-primary mb-1">{fmt(b.final_total)}</p>
                                <Badge variant="outline" className={`text-[8px] font-black uppercase tracking-tighter ${statusConfig[b.status]?.className || ""}`}>
                                  {statusConfig[b.status]?.label || b.status}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="documentos">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {customerDocuments.length === 0 ? (
                          <div className="sm:col-span-2 bg-slate-50 rounded-3xl p-12 text-center border border-dashed border-slate-200">
                            <FileText className="mx-auto mb-3 text-slate-300" size={32} />
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nenhum documento anexado</p>
                          </div>
                        ) : (
                          customerDocuments.map((doc) => (
                            <div key={doc.id} className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between group">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                                  <FileText size={20} className="text-primary/60" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-black text-slate-700 truncate mb-0.5">{doc.name}</p>
                                  <Badge variant="secondary" className="text-[8px] font-bold uppercase">{doc.category}</Badge>
                                </div>
                              </div>
                              <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8 text-primary" onClick={() => window.open(doc.file_url, '_blank')}>
                                <Eye size={14} />
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 size={40} className="animate-spin mb-4 opacity-20" />
              <p className="text-sm font-bold uppercase tracking-widest">Carregando...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  ) : (
    <AdminLayout title="Gestão de Clientes & CRM">
      <div className="space-y-8 pb-10">
        {/* Advanced Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in-fade" style={{ animationDelay: '0.05s' }}>
          {[
            { label: "Base de Clientes", value: customers.length, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10", desc: "Total de titulares" },
            { label: "Novos Parceiros", value: newThisMonth, icon: UserPlus, color: "text-purple-500", bg: "bg-purple-500/10", desc: "Registrados este mês" },
            { label: "LTV Consolidado", value: fmt(totalRevenue), icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-500/10", desc: "Receita histórica" },
            { label: "Ticket Médio", value: withBookings > 0 ? fmt(Math.round(totalRevenue / withBookings)) : "R$ 0", icon: Target, color: "text-amber-500", bg: "bg-amber-500/10", desc: "Valor por cliente" },
          ].map((stat, i) => (
            <div key={i} className="glass-card admin-card-hover rounded-[2rem] p-6 relative overflow-hidden group border border-white/20 shadow-xl shadow-black/5 bg-white">
              <div className="absolute right-0 top-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-primary/10 transition-colors" />
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shadow-sm transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                  <stat.icon size={22} strokeWidth={2.5} />
                </div>
                <div className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">{stat.desc}</div>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-black text-foreground tracking-tighter group-hover:translate-x-1 transition-transform">{stat.value}</p>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="w-full">
          {/* Client List */}
          <div className="glass-card rounded-[2.5rem] p-8 animate-in-fade" style={{ animationDelay: '0.2s' }}>
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className="flex items-center gap-3 flex-1 bg-muted/40 border border-border/20 rounded-2xl px-5 py-3 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <Search size={18} className="text-primary/50" />
                <input
                  type="text"
                  placeholder="Pesquisar clientes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-transparent w-full outline-none text-foreground text-sm font-medium placeholder:text-muted-foreground/40"
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

            <div className="overflow-hidden">
              {(filter === "dependents" ? filteredDependents : filtered).length === 0 ? (
                <div className="text-center py-20 bg-muted/20 rounded-[2rem] border border-dashed border-border/50">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 opacity-50">
                    <Users size={32} />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Vazio</p>
                  <p className="text-xs font-medium text-muted-foreground/60 mt-2">Nenhum {filter === "dependents" ? "dependente" : "cliente"} encontrado.</p>
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
                                      selectCustomer({ id: d.customer_id, name: d.customer_name } as Customer);
                                      setIsWideViewOpen(true);
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
                            onClick={() => {
                              selectCustomer(c);
                              setIsWideViewOpen(true);
                            }}
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
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {c.tags?.slice(0, 2).map(tag => (
                                      <span key={tag} className="text-[8px] px-1 bg-muted text-muted-foreground rounded uppercase font-bold tracking-tighter">
                                        {tag}
                                      </span>
                                    ))}
                                    {c.tags?.length > 2 && <span className="text-[8px] text-muted-foreground">+{c.tags.length - 2}</span>}
                                  </div>
                                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium mt-1">
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
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10" onClick={(e) => { 
                                    e.stopPropagation(); 
                                    const url = `${window.location.origin}${window.location.pathname}?wide_view_id=${c.id}`;
                                    window.open(url, '_blank');
                                  }}>
                                    <Eye size={14} />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Visualização Ampla</p>
                                </TooltipContent>
                              </Tooltip>
                              {c.phone && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <a
                                      href={`https://wa.me/${c.phone.startsWith("+") ? c.phone.replace(/\D/g, "") : `55${c.phone.replace(/\D/g, "")}`}?text=${encodeURIComponent(`Olá ${c.name.split(" ")[0]}! Tudo bem?`)}`}
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
        <DialogContent className="sm:max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl rounded-3xl overflow-hidden bg-[#F8FAFC]">
          <div className="bg-white border-b border-slate-100 p-4 md:p-6 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                {editingCustomer ? <Pencil size={20} className="md:w-6 md:h-6" /> : <UserPlus size={20} className="md:w-6 md:h-6" />}
              </div>
              <div>
                <DialogTitle className="text-lg md:text-xl font-black text-slate-900 leading-none mb-1">
                  {editingCustomer ? "Editar Cliente" : "Novo Cliente"}
                </DialogTitle>
                <p className="text-[11px] md:text-sm text-slate-500 font-medium">Gestão de perfil e dados de contato</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setModalOpen(false)} className="rounded-full hover:bg-slate-100 transition-colors">
              <X size={20} className="text-slate-400" />
            </Button>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="flex flex-col h-[calc(90vh-80px)]">
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-8">
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
                <option value="Argentina">Argentina</option>
                <option value="Chile">Chile</option>
                <option value="Uruguai">Uruguai</option>
                <option value="Paraguai">Paraguai</option>
                <option value="Estados Unidos">Estados Unidos</option>
                <option value="Portugal">Portugal</option>
                <option value="Espanha">Espanha</option>
                <option value="França">França</option>
                <option value="Alemanha">Alemanha</option>
                <option value="Reino Unido">Reino Unido</option>
                <option value="Outro">Outro (Estrangeiro)</option>
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
                placeholder={form.country === "Brasil" ? "(99) 99999-9999" : "+DDI Telefone"}
                maxLength={25}
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
                  <Label htmlFor="customer-passport">Passaporte / Documento *</Label>
                  <Input
                    id="customer-passport"
                    value={form.passport}
                    onChange={(e) => setForm({ ...form, passport: e.target.value })}
                    placeholder="Nº Passaporte ou ID"
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
            <div className="md:col-span-2">
              <Label className="flex items-center gap-2">
                <TagIcon size={14} /> Tags / Marcadores
              </Label>
              <div className="flex flex-wrap gap-2 mb-2 min-h-[32px] p-2 border border-dashed rounded-xl bg-muted/20">
                {form.tags.length === 0 ? (
                  <span className="text-[10px] text-muted-foreground italic">Nenhuma tag adicionada. Digite uma tag e pressione vírgula ou Enter.</span>
                ) : (
                  form.tags.map((tag, idx) => (
                    <Badge key={idx} variant="secondary" className="gap-1 px-2 py-0.5 rounded-lg bg-primary/10 text-primary border-primary/20">
                      {tag}
                      <button 
                        type="button"
                        onClick={() => setForm({ ...form, tags: form.tags.filter((_, i) => i !== idx) })}
                        className="hover:text-red-500 transition-colors"
                      >
                        <X size={10} />
                      </button>
                    </Badge>
                  ))
                )}
              </div>
              <Input
                placeholder="Adicionar tag (ex: VIP, Frequent Traveler, Problema...)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    const val = e.currentTarget.value.trim();
                    if (val && !form.tags.includes(val)) {
                      setForm({ ...form, tags: [...form.tags, val] });
                      e.currentTarget.value = '';
                    }
                  }
                }}
                className="rounded-xl"
              />
              <p className="text-[9px] text-muted-foreground mt-1">Pressione Enter ou vírgula para adicionar.</p>
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
        </div>
            <div className="bg-white border-t border-slate-100 p-4 md:p-6 flex gap-3 sticky bottom-0">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)} disabled={saving} className="flex-1 h-12 rounded-xl font-bold">
                Cancelar
              </Button>
              <Button type="submit" disabled={saving} className="flex-[2] h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-black shadow-lg shadow-primary/20 transition-all active:scale-[0.98]">
                {saving ? <Loader2 size={18} className="animate-spin mr-2" /> : <CheckCircle2 size={18} className="mr-2" />}
                {editingCustomer ? "Salvar Alterações" : "Cadastrar Cliente"}
              </Button>
            </div>
          </form>
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
    </div>
  </AdminLayout>
  );
};

export default AdminCRM;
