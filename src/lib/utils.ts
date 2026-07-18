import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatInTimeZone } from "date-fns-tz";
import { ptBR } from "date-fns/locale";

const DEFAULT_TIMEZONE = "America/Fortaleza";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | number, formatStr: string = "dd/MM/yyyy HH:mm:ss") {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return formatInTimeZone(dateObj, DEFAULT_TIMEZONE, formatStr, { locale: ptBR });
}

export function formatCurrency(value: number) {
  return (value / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function getTourEffectivePrice(
  tour: {
    mode_collective_enabled?: boolean | null;
    price: number;
    private_price?: number | null;
  },
  partnerPricing?: { effectivePrice: number; effectivePrivatePrice?: number | null } | null,
): number {
  const isPrivate = tour.mode_collective_enabled === false;
  const basePrice = isPrivate ? (tour.private_price || 0) : tour.price;
  return partnerPricing
    ? (isPrivate ? (partnerPricing.effectivePrivatePrice || basePrice) : partnerPricing.effectivePrice)
    : basePrice;
}

export function getTourDisplayMode(
  tour: { mode_collective_enabled?: boolean | null; mode_private_enabled?: boolean | null; default_mode?: string | null },
): "coletivo" | "privativo" {
  const collectiveOn = tour.mode_collective_enabled ?? true;
  const privateOn = tour.mode_private_enabled ?? true;
  const adminDefault = (tour.default_mode === "coletivo" || tour.default_mode === "privativo") ? tour.default_mode : "privativo";
  let mode: "coletivo" | "privativo" = adminDefault;
  if (mode === "privativo" && !privateOn) mode = "coletivo";
  if (mode === "coletivo" && !collectiveOn) mode = "privativo";
  return mode;
}

export function validateCPF(cpf: string): boolean {
  const cleanCPF = cpf.replace(/\D/g, "");

  if (cleanCPF.length !== 11) return false;

  if (/^(\d)\1+$/.test(cleanCPF)) return false;

  let sum = 0;
  let remainder;

  for (let i = 1; i <= 9; i++) {
    sum = sum + parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
  }

  remainder = (sum * 10) % 11;

  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.substring(9, 10))) return false;

  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum = sum + parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
  }

  remainder = (sum * 10) % 11;

  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.substring(10, 11))) return false;

  return true;
}


