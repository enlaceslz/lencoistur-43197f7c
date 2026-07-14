import {
  Building2, Compass, Car, Users, MapPin, Search, Plus, Edit, Trash2,
  Loader2, Banknote, Landmark, Percent, FileText, Calendar, Clock,
  Phone, Mail, User,
} from "lucide-react";

export const iconMap: Record<string, any> = {
  Building2, Compass, Car, Users, MapPin, Search, Plus, Edit, Trash2,
  Loader2, Banknote, Landmark, Percent, FileText, Calendar, Clock,
  Phone, Mail, User,
};

export const getIcon = (name: string) => iconMap[name] || Building2;

export const getGradient = (color: string) => {
  if (color.includes("blue")) return "from-blue-500 to-indigo-600";
  if (color.includes("green")) return "from-emerald-500 to-teal-600";
  if (color.includes("amber") || color.includes("yellow")) return "from-amber-500 to-orange-600";
  if (color.includes("purple") || color.includes("pink")) return "from-purple-500 to-pink-600";
  if (color.includes("rose") || color.includes("red")) return "from-rose-500 to-red-600";
  return "from-slate-500 to-slate-700";
};

export function isCnpj(value: string): boolean {
  return value.replace(/\D/g, "").length >= 14;
}
