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
  collaboratorId?: string;
  collaboratorName?: string;
  partnerId?: string;
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
    collaboratorId: row.collaborator_id || undefined,
    collaboratorName: row.collaborators?.name || undefined,
    partnerId: row.partner_id || undefined,
  };
}

export function useBookings() {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    const { data: bookingsData } = await supabase
      .from("bookings")
      .select("*, customers!fk_bookings_customer(*), collaborators(name)")
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
        partnerId?: string;
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
          partner_id: data.partnerId,
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
      .select("*, customers!fk_bookings_customer(name)")
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
        categoria: booking.partner_id ? "parceiro" : "reserva",
        cliente: booking.customers?.name || "Cliente",
        booking_id: booking.id,
        partner_id: booking.partner_id || null,
        recebido_em: new Date().toISOString().slice(0, 10),
        observacoes: `Gerado automaticamente via CRM (Reserva ${booking.booking_code})${booking.partner_id ? ' - Venda via Parceiro' : ''}`
      });

    if (financeError) {
      console.error("Erro ao gerar conta a receber:", financeError);
      // Não barramos a confirmação da reserva se o financeiro falhar, mas logamos.
    }
  }, []);

  const cancelBooking = useCallback(async (id: string) => {
    const { error } = await supabase
      .from("bookings")
      .update({ status: "cancelada", payment_status: "pendente" })
      .eq("id", id);
    if (error) throw error;

    // Também atualizar o status no financeiro (Contas a Receber)
    await supabase
      .from("contas_receber")
      .update({ status: "cancelado", observacoes: "Reserva cancelada via CRM" })
      .eq("booking_id", id);
  }, []);

  const completeBooking = useCallback(async (id: string) => {
    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select("*, customers!fk_bookings_customer(name)")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;

    const { error: updateError } = await supabase
      .from("bookings")
      .update({ status: "concluida" })
      .eq("id", id);
    
    if (updateError) throw updateError;

    // Se houver um colaborador vinculado, gerar a comissão/pagamento
    if (booking.collaborator_id) {
      const { data: collab } = await supabase
        .from("collaborators")
        .select("*")
        .eq("id", booking.collaborator_id)
        .single();

      if (collab) {
        let commissionAmount = 0;
        if (collab.payment_type === "commission") {
          commissionAmount = Math.round((booking.final_total * collab.payment_value) / 100);
        } else if (collab.payment_type === "per_tour" || collab.payment_type === "daily") {
          commissionAmount = collab.payment_value * 100; // converter para centavos
        }

        if (commissionAmount > 0) {
          const description = `Comissão/Pagamento: ${booking.item_name} (Reserva ${booking.booking_code})`;
          
          // Registrar no histórico de pagamentos do colaborador
          await supabase.from("collaborator_payments").insert({
            collaborator_id: collab.id,
            booking_id: booking.id,
            amount: commissionAmount / 100,
            description,
            due_date: new Date().toISOString().slice(0, 10),
            status: "pending"
          });

          // Registrar no financeiro (Contas a Pagar)
          await supabase.from("contas_pagar").insert({
            descricao: `Colaborador: ${collab.name} - ${description}`,
            valor: commissionAmount / 100,
            vencimento: new Date().toISOString().slice(0, 10),
            status: "pendente",
            categoria: "comissão",
            fornecedor: collab.name,
            booking_id: booking.id,
            collaborator_id: collab.id,
            observacoes: `Gerado automaticamente na conclusão da reserva ${booking.booking_code}`
          });
        }
      }
    }

    // Se houver um parceiro vinculado, gerar a remuneração/comissão do parceiro
    if (booking.partner_id) {
      const { data: partner } = await supabase
        .from("partners")
        .select("*")
        .eq("id", booking.partner_id)
        .single();

      if (partner) {
        let partnerRemuneration = 0;
        const rType = partner.remuneration_type || "comissao_percent";
        const rValue = partner.remuneration_value || partner.commission_rate || 0;

        if (rType === "comissao_percent") {
          partnerRemuneration = Math.round((booking.final_total * rValue) / 100);
        } else if (rType === "valor_por_passeio") {
          partnerRemuneration = rValue * 100; // converter para centavos
        }

        if (partnerRemuneration > 0) {
          const description = `Comissão Parceiro: ${booking.item_name} (Reserva ${booking.booking_code})`;
          
          // Registrar no financeiro (Contas a Pagar)
          await supabase.from("contas_pagar").insert({
            descricao: `${partner.name} - ${description}`,
            valor: partnerRemuneration / 100,
            vencimento: new Date().toISOString().slice(0, 10),
            status: "pendente",
            categoria: "comissão parceiro",
            fornecedor: partner.name,
            booking_id: booking.id,
            partner_id: partner.id,
            observacoes: `Gerado automaticamente na conclusão da reserva ${booking.booking_code}`
          });
        }
      }
    }

    // Registrar o custo operacional base se não houver colaborador (ou adicionalmente)
    if (!booking.collaborator_id) {
      const { error: costError } = await supabase
        .from("contas_pagar")
        .insert({
          descricao: `Custo Operacional: ${booking.item_name} (Reserva ${booking.booking_code})`,
          valor: Math.round(booking.final_total * 0.4) / 100, // Estimativa de 40% de custo operacional
          vencimento: new Date().toISOString().slice(0, 10),
          status: "pendente",
          categoria: "operacional",
          fornecedor: "Operação Interna",
          booking_id: booking.id,
          observacoes: `Gerado automaticamente na conclusão da reserva ${booking.booking_code}`
        });

      if (costError) console.error("Erro ao gerar custo operacional:", costError);
    }
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
        collaborator_id: data.collaboratorId || null,
        partner_id: data.partnerId || null,
      })
      .eq("id", id);
      
    if (bookingError) throw bookingError;
  }, []);

  return { bookings, loading, addBooking, updateBooking, confirmPayment, cancelBooking, completeBooking, updateBookingNotes, refresh: fetchBookings };
}
