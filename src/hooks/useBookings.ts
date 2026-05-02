import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface BookingItem {
  id: string;
  bookingCode: string;
  type: "tour" | "transfer" | "package";
  itemName: string;
  date: string;
  guests: number;
  unitPrice: number;
  total: number;
  discount: number;
  finalTotal: number;
  payMethod: "pix" | "card" | "info";
  status: "confirmada" | "pendente" | "cancelada" | "concluida";
  paymentStatus: "pago" | "pendente";
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  createdAt: string;
  pixCode?: string;
  notes?: string;
  customerId?: string;
  cpf?: string;
  passport?: string;
  country?: string;
  birthDate?: string;
  invoiceUrl?: string;
  voucherUrl?: string;
}

function generateBookingCode(): string {
  const year = new Date().getFullYear();
  const num = String(Math.floor(Math.random() * 9999) + 1).padStart(4, "0");
  return `RES-${year}-${num}`;
}

function generatePixCode(): string {
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let code = "00020126580014BR.GOV.BCB.PIX0136";
  for (let i = 0; i < 36; i++) code += chars[Math.floor(Math.random() * chars.length)];
  code += "5204000053039865802BR5925LENCOIS TOUR LTDA6013SANTO AMARO";
  return code;
}

function mapDbToBooking(row: any, customer?: any): BookingItem {
  return {
    id: row.id,
    bookingCode: row.booking_code,
    type: row.type,
    itemName: row.item_name,
    date: row.date || "",
    guests: row.guests,
    unitPrice: row.unit_price,
    total: row.total,
    discount: row.discount,
    finalTotal: row.final_total,
    payMethod: row.pay_method,
    status: row.status,
    paymentStatus: row.payment_status,
    customerName: customer?.name || "",
    customerEmail: customer?.email || "",
    customerPhone: customer?.phone || "",
    createdAt: row.created_at,
    pixCode: row.pix_code || undefined,
    notes: row.notes || undefined,
    customerId: row.customer_id,
    cpf: customer?.cpf || undefined,
    passport: customer?.passport || undefined,
    country: customer?.country || undefined,
    birthDate: customer?.birth_date || undefined,
    invoiceUrl: row.invoice_url || undefined,
    voucherUrl: row.voucher_url || undefined,
  };
}

export function useBookings() {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    const { data: bookingsData } = await supabase
      .from("bookings")
      .select("*, customers(*)")
      .order("created_at", { ascending: false });

    if (bookingsData) {
      setBookings(
        bookingsData.map((row: any) => mapDbToBooking(row, row.customers))
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBookings();

    // Realtime subscription
    const channel = supabase
      .channel("bookings-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => {
        fetchBookings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchBookings]);

  const addBooking = useCallback(
    async (
      data: Omit<BookingItem, "id" | "bookingCode" | "createdAt" | "pixCode" | "status" | "paymentStatus" | "customerId"> & {
        cpf?: string;
        passport?: string;
        country?: string;
        birthDate?: string;
        notes?: string;
        companions?: { name: string; cpf?: string; birthDate?: string; relationship?: string }[];
      }
    ): Promise<BookingItem> => {
      const { data: result, error } = await supabase.functions.invoke("create-booking", {
        body: {
          type: data.type === "transfer" ? "translado" : "passeio",
          itemName: data.itemName,
          date: data.date || null,
          guests: data.guests,
          payMethod: data.payMethod,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone,
          cpf: data.cpf,
          passport: data.passport,
          country: data.country,
          birthDate: data.birthDate,
          notes: data.notes,
          companions: data.companions,
        },
      });

      if (error || !result) {
        throw new Error(result?.error || "Erro ao criar reserva");
      }

      const mapped = mapDbToBooking(result, result.customers);
      setBookings((prev) => [mapped, ...prev]);
      return mapped;
    },
    []
  );

  const confirmPayment = useCallback(async (id: string) => {
    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select("*, customers(name)")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;

    const { error: updateError } = await supabase
      .from("bookings")
      .update({ status: "confirmada", payment_status: "pago" })
      .eq("id", id);
    
    if (updateError) throw updateError;

    // Integrar com Financeiro: Gerar Conta a Receber automaticamente
    const { error: financeError } = await supabase
      .from("contas_receber")
      .insert({
        descricao: `Reserva ${booking.booking_code} - ${booking.item_name}`,
        valor: booking.final_total,
        vencimento: booking.date || new Date().toISOString().slice(0, 10),
        status: "recebido",
        categoria: "reserva",
        cliente: booking.customers?.name || "Cliente",
        booking_id: booking.id,
        recebido_em: new Date().toISOString().slice(0, 10),
        observacoes: `Gerado automaticamente via CRM (Reserva ${booking.booking_code})`
      });

    if (financeError) {
      console.error("Erro ao gerar conta a receber:", financeError);
      // Não barramos a confirmação da reserva se o financeiro falhar, mas logamos.
    }
  }, []);

  const cancelBooking = useCallback(async (id: string) => {
    const { error } = await supabase
      .from("bookings")
      .delete()
      .eq("id", id);
    if (error) throw error;
  }, []);

  const completeBooking = useCallback(async (id: string) => {
    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select("*, customers(name)")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;

    const { error: updateError } = await supabase
      .from("bookings")
      .update({ status: "concluida" })
      .eq("id", id);
    
    if (updateError) throw updateError;

    // Se houver um parceiro/motorista vinculado (futuro), aqui geraria a comissão no Contas a Pagar.
    // Por enquanto, vamos registrar o custo operacional estimado para fins de DRE
    const { error: costError } = await supabase
      .from("contas_pagar")
      .insert({
        descricao: `Custo Operacional: ${booking.item_name} (Reserva ${booking.booking_code})`,
        valor: Math.round(booking.final_total * 0.4), // Estimativa de 40% de custo operacional
        vencimento: new Date().toISOString().slice(0, 10),
        status: "pendente",
        categoria: "operacional",
        fornecedor: "Operação Interna",
        observacoes: `Gerado automaticamente na conclusão da reserva ${booking.booking_code}`
      });

    if (costError) console.error("Erro ao gerar custo operacional:", costError);
  }, []);

  const updateBookingNotes = useCallback(async (id: string, notes: string) => {
    const { error } = await supabase
      .from("bookings")
      .update({ notes })
      .eq("id", id);
    if (error) throw error;
  }, []);

  const updateBooking = useCallback(async (id: string, customerId: string, data: any) => {
    const { error: customerError } = await supabase
      .from("customers")
      .update({
        name: data.customerName,
        email: data.customerEmail,
        phone: data.customerPhone,
        cpf: data.cpf,
        passport: data.passport,
        country: data.country,
        birth_date: data.birthDate,
      })
      .eq("id", customerId);
    
    if (customerError) throw customerError;

    const { error: bookingError } = await supabase
      .from("bookings")
      .update({
        type: data.type,
        item_name: data.itemName,
        date: data.date,
        guests: data.guests,
        pay_method: data.payMethod,
        unit_price: data.unitPrice,
        total: data.total,
        discount: data.discount,
        final_total: data.finalTotal,
        notes: data.notes,
      })
      .eq("id", id);
      
    if (bookingError) throw bookingError;
  }, []);

  return { bookings, loading, addBooking, updateBooking, confirmPayment, cancelBooking, completeBooking, updateBookingNotes, refresh: fetchBookings };
}
