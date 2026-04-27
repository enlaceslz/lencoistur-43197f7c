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
    const { error } = await supabase
      .from("bookings")
      .update({ status: "confirmada", payment_status: "pago" })
      .eq("id", id);
    if (error) throw error;
  }, []);

  const cancelBooking = useCallback(async (id: string) => {
    const { error } = await supabase
      .from("bookings")
      .update({ status: "cancelada" })
      .eq("id", id);
    if (error) throw error;
  }, []);

  const completeBooking = useCallback(async (id: string) => {
    const { error } = await supabase
      .from("bookings")
      .update({ status: "concluida" })
      .eq("id", id);
    if (error) throw error;
  }, []);

  const updateBookingNotes = useCallback(async (id: string, notes: string) => {
    const { error } = await supabase
      .from("bookings")
      .update({ notes })
      .eq("id", id);
    if (error) throw error;
  }, []);

  return { bookings, loading, addBooking, confirmPayment, cancelBooking, completeBooking, updateBookingNotes, refresh: fetchBookings };
}
