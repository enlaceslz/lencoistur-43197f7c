import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface BookingItem {
  id: string;
  bookingCode: string;
  type: "tour" | "transfer";
  itemName: string;
  date: string;
  guests: number;
  unitPrice: number;
  total: number;
  discount: number;
  finalTotal: number;
  payMethod: "pix" | "card";
  status: "confirmada" | "pendente" | "cancelada" | "concluida";
  paymentStatus: "pago" | "pendente";
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  createdAt: string;
  pixCode?: string;
  notes?: string;
  customerId?: string;
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
      data: Omit<BookingItem, "id" | "bookingCode" | "createdAt" | "pixCode" | "status" | "paymentStatus" | "customerId">
    ): Promise<BookingItem> => {
      // Create or find customer
      const { data: customer, error: customerError } = await supabase
        .from("customers")
        .insert({
          name: data.customerName,
          email: data.customerEmail,
          phone: data.customerPhone,
        })
        .select()
        .single();

      if (customerError || !customer) {
        throw new Error("Erro ao cadastrar cliente");
      }

      const bookingCode = generateBookingCode();
      const pixCode = data.payMethod === "pix" ? generatePixCode() : null;

      // RLS enforces: discount=0, final_total=total, status/payment_status='pendente'
      const total = data.unitPrice * data.guests;
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          booking_code: bookingCode,
          customer_id: customer.id,
          type: data.type === "transfer" ? "translado" : "passeio",
          item_name: data.itemName,
          date: data.date || null,
          guests: data.guests,
          unit_price: data.unitPrice,
          total: total,
          discount: 0,
          final_total: total,
          pay_method: data.payMethod,
          status: "pendente",
          payment_status: "pendente",
          pix_code: pixCode,
          notes: data.notes || null,
        })
        .select("*, customers(*)")
        .single();

      if (bookingError || !booking) {
        throw new Error("Erro ao criar reserva");
      }

      const mapped = mapDbToBooking(booking, booking.customers);
      setBookings((prev) => [mapped, ...prev]);
      return mapped;
    },
    []
  );

  const confirmPayment = useCallback(async (id: string) => {
    await supabase
      .from("bookings")
      .update({ status: "confirmada", payment_status: "pago" })
      .eq("id", id);
  }, []);

  const cancelBooking = useCallback(async (id: string) => {
    await supabase
      .from("bookings")
      .update({ status: "cancelada" })
      .eq("id", id);
  }, []);

  return { bookings, loading, addBooking, confirmPayment, cancelBooking, refresh: fetchBookings };
}
