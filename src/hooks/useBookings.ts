import { useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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
  publicUnitPrice?: number;
  publicTotal?: number;
  partnerNetPrice?: number;
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
  termStatus?: "pendente" | "assinado" | "balcao";
  termPdfUrl?: string;
  groupId?: string;
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
  const term = row.sgs_risk_terms && row.sgs_risk_terms[0];
  
  let termStatus: "pendente" | "assinado" | "balcao" = "pendente";
  if (term?.pdf_url || term?.accepted) {
    termStatus = term?.signed_at_counter ? "balcao" : "assinado";
  }
  
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
    publicUnitPrice: row.public_unit_price,
    publicTotal: row.public_total,
    partnerNetPrice: row.partner_net_price,
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
    cpf: row.cpf || customer?.cpf || undefined,
    passport: customer?.passport || undefined,
    country: customer?.country || undefined,
    birthDate: row.birth_date || customer?.birth_date || undefined,
    invoiceUrl: row.invoice_url || undefined,
    voucherUrl: row.voucher_url || undefined,
    collaboratorId: row.collaborator_id || undefined,
    collaboratorName: row.collaborators?.name || undefined,
    partnerId: row.partner_id || undefined,
    termStatus,
    termPdfUrl: term?.pdf_url || undefined,
    groupId: row.group_id || undefined,
  };
}

const BOOKINGS_QUERY_KEY = ["bookings", "admin", "list"] as const;
const BOOKINGS_PAGE_SIZE = 1000;

async function fetchBookingsFromDb(customerId?: string): Promise<BookingItem[]> {
  let query = supabase
    .from("bookings")
    .select(
      "id, booking_code, type, item_name, date, guests, unit_price, total, discount, final_total, public_unit_price, public_total, partner_net_price, pay_method, status, payment_status, created_at, pix_code, notes, customer_id, cpf, birth_date, invoice_url, voucher_url, collaborator_id, partner_id, group_id, customers!customer_id(name, email, phone, cpf, passport, country, birth_date), collaborators(name), sgs_risk_terms(pdf_url, accepted, signed_at_counter)"
    )
    .order("created_at", { ascending: false })
    .limit(BOOKINGS_PAGE_SIZE);

  if (customerId) {
    query = query.eq("customer_id", customerId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row: any) => mapDbToBooking(row, row.customers));
}

export function useBookings(customerId?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: bookings = [], isLoading: loading } = useQuery<BookingItem[]>({
    queryKey: [...BOOKINGS_QUERY_KEY, customerId],
    queryFn: () => fetchBookingsFromDb(customerId),
    staleTime: 30_000,
    enabled: !!user,
  });



  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: BOOKINGS_QUERY_KEY }),
    [queryClient]
  );

  // Backwards-compatible alias for callers that used refresh() to force reload.
  const fetchBookings = invalidate;

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("bookings-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => {
        // React-query dedups concurrent invalidations, so a burst of realtime
        // events triggers a single refetch instead of one per event.
        invalidate();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [invalidate, user]);

  const confirmPayment = useCallback(async (id: string, groupId?: string) => {
    const { data, error } = await supabase.rpc("confirm_payment_transaction", {
      p_booking_id: id,
      p_group_id: groupId || null,
    });
    if (error) throw error;
    return data;
  }, []);


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
        isPaid?: boolean;
        items?: {
          type: "tour" | "transfer" | "package";
          itemName: string;
          date: string;
          guests: number;
          unitPrice?: number;
          discount?: number;
          publicUnitPrice?: number;
        }[];
      }

    ): Promise<BookingItem> => {
      const { data: result, error } = await supabase.functions.invoke("create-booking", {
        body: {
          type: data.type === "transfer" ? "translado" : data.type === "package" ? "package" : "passeio",
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
          collaboratorId: data.collaboratorId,
          unitPrice: data.unitPrice,
          discount: data.discount,
          publicUnitPrice: data.publicUnitPrice,
          publicTotal: data.publicTotal,
          partner_net_price: data.partnerNetPrice,
          items: data.items,

        },
      });

      if (error || !result) {
        const errorMsg = result?.error || error?.message || "Erro ao criar reserva";
        toast({ title: "Erro", description: errorMsg, variant: "destructive" });
        throw new Error(errorMsg);
      }

      const results = Array.isArray(result) ? result : [result];
      const mappedResults = results.map(r => mapDbToBooking(r, r.customers));
      
      if (data.isPaid) {
        const results = await Promise.allSettled(
          mappedResults.map(mapped =>
            confirmPayment(mapped.id).then(() => {
              mapped.paymentStatus = "pago";
              mapped.status = "confirmada";
            })
          )
        );
        for (const r of results) {
          if (r.status === "rejected") console.error("Erro ao confirmar pagamento inicial:", r.reason);
        }
      }

      // Optimistic prepend so the UI shows the new booking immediately;
      // the realtime subscription + invalidate() will reconcile shortly after.
      queryClient.setQueryData<BookingItem[]>(BOOKINGS_QUERY_KEY, (prev = []) => [
        ...mappedResults,
        ...prev,
      ]);
      return mappedResults[0]; // Returning the first one for compatibility

    },
    [confirmPayment, queryClient]
  );

  const cancelBooking = useCallback(async (id: string, groupId?: string) => {
    const { error } = await supabase.rpc("cancel_booking_transaction", {
      p_booking_id: id,
      p_group_id: groupId || null,
    });
    if (error) throw error;
  }, []);


  const completeBooking = useCallback(async (id: string) => {
    const { error } = await supabase.rpc("complete_booking_transaction", {
      p_booking_id: id,
    });
    if (error) throw error;
  }, []);

  const updateBookingNotes = useCallback(async (id: string, notes: string) => {
    const { error } = await supabase
      .from("bookings")
      .update({ notes })
      .eq("id", id);
    if (error) throw error;
  }, []);

  const deleteBooking = useCallback(async (id: string, groupId?: string) => {
    const { error } = await supabase.rpc("delete_booking_transaction", {
      p_booking_id: id,
      p_group_id: groupId || null,
    });
    if (error) throw error;
  }, []);



  const updateBooking = useCallback(async (id: string, customerId: string, data: any) => {
    const { error } = await supabase.rpc("update_booking_customer_transaction", {
      p_booking_id: id,
      p_customer_id: customerId,
      p_customer_data: {
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        cpf: data.cpf,
        passport: data.passport,
        country: data.country,
        birthDate: data.birthDate,
        notes: data.notes,
        payMethod: data.payMethod,
        collaboratorId: data.collaboratorId,
        partnerId: data.partnerId,
      },
      p_items: data.items || [],
      p_companions: data.companions || [],
    });
    if (error) throw error;
  }, []);


  const markTermAsSignedAtCounter = useCallback(async (bookingId: string) => {
    const { error } = await supabase.rpc("mark_term_signed_transaction", {
      p_booking_id: bookingId,
    });
    if (error) throw error;
    await fetchBookings();
  }, [fetchBookings]);

  return { bookings, loading, addBooking, updateBooking, confirmPayment, cancelBooking, deleteBooking, completeBooking, updateBookingNotes, markTermAsSignedAtCounter, refresh: fetchBookings };
}