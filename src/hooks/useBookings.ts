import { useState, useCallback } from "react";

export interface BookingItem {
  id: string;
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
}

const STORAGE_KEY = "lencois_bookings";

function generateId(): string {
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

function loadBookings(): BookingItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveBookings(bookings: BookingItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
}

export function useBookings() {
  const [bookings, setBookings] = useState<BookingItem[]>(loadBookings);

  const addBooking = useCallback((data: Omit<BookingItem, "id" | "createdAt" | "pixCode" | "status" | "paymentStatus">): BookingItem => {
    const booking: BookingItem = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
      status: data.payMethod === "pix" ? "pendente" : "confirmada",
      paymentStatus: data.payMethod === "pix" ? "pendente" : "pago",
      pixCode: data.payMethod === "pix" ? generatePixCode() : undefined,
    };
    const updated = [booking, ...loadBookings()];
    saveBookings(updated);
    setBookings(updated);
    return booking;
  }, []);

  const confirmPayment = useCallback((id: string) => {
    const all = loadBookings().map((b) =>
      b.id === id ? { ...b, status: "confirmada" as const, paymentStatus: "pago" as const } : b
    );
    saveBookings(all);
    setBookings(all);
  }, []);

  const cancelBooking = useCallback((id: string) => {
    const all = loadBookings().map((b) =>
      b.id === id ? { ...b, status: "cancelada" as const } : b
    );
    saveBookings(all);
    setBookings(all);
  }, []);

  const refresh = useCallback(() => setBookings(loadBookings()), []);

  return { bookings, addBooking, confirmPayment, cancelBooking, refresh };
}
