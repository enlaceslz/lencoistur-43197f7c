import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users, User, Smartphone, Phone, Mail, History, FileText, ShoppingBag, Eye,
} from "lucide-react";
import { maskCPF, maskPhone } from "@/lib/masks";
import { formatCurrency } from "@/lib/utils";

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  cpf: string | null;
  passport: string | null;
  birth_date: string | null;
  country: string | null;
  ltvCategory?: "VIP" | "Fiel" | "Novo";
}

interface BookingRow {
  id: string;
  item_name: string;
  date: string | null;
  guests: number;
  final_total: number;
  status: string;
  created_at: string;
}

interface CustomerDocument {
  id: string;
  name: string;
  file_url: string;
  category: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pendente: { label: "Pendente", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  confirmada: { label: "Confirmada", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  cancelada: { label: "Cancelada", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

interface CustomerWideViewProps {
  customer: Customer | null;
  bookings: BookingRow[];
  documents: CustomerDocument[];
  onViewDocument: (fileUrl: string) => void;
}

export const CustomerWideView = ({
  customer,
  bookings,
  documents,
  onViewDocument,
}: CustomerWideViewProps) => {
  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <span className="animate-spin mb-4 opacity-20" />
        <p className="text-sm font-bold uppercase tracking-widest">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1 space-y-8">
        <section className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
            <User size={14} className="text-primary" /> Identificação
          </h3>
          <div className="space-y-4">
            <div>
              <Label className="text-[10px] uppercase font-bold text-slate-400">CPF / Passaporte</Label>
              <p className="text-sm font-black text-slate-700">{customer.cpf ? maskCPF(customer.cpf) : customer.passport || "—"}</p>
            </div>
            <div>
              <Label className="text-[10px] uppercase font-bold text-slate-400">Data de Nascimento</Label>
              <p className="text-sm font-black text-slate-700">{customer.birth_date ? new Date(customer.birth_date + "T12:00:00").toLocaleDateString("pt-BR") : "—"}</p>
            </div>
            <div>
              <Label className="text-[10px] uppercase font-bold text-slate-400">Nacionalidade</Label>
              <p className="text-sm font-black text-slate-700">{customer.country}</p>
            </div>
          </div>
        </section>

        <section className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
            <Smartphone size={14} className="text-emerald-500" /> Contato
          </h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Phone size={14} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-slate-700 truncate">{customer.phone ? maskPhone(customer.phone) : "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Mail size={14} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-slate-700 truncate">{customer.email || "—"}</p>
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
              {bookings.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-200">
                  <History className="mx-auto mb-3 text-slate-300" size={32} />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nenhuma reserva histórica</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {bookings.map((b) => (
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
                        <p className="text-sm font-black text-primary mb-1">{formatCurrency(b.final_total)}</p>
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
                {documents.length === 0 ? (
                  <div className="sm:col-span-2 bg-white rounded-3xl p-12 text-center border border-dashed border-slate-200">
                    <FileText className="mx-auto mb-3 text-slate-300" size={32} />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nenhum documento anexado</p>
                  </div>
                ) : (
                  documents.map((doc) => (
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
                      <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8 text-primary" onClick={() => onViewDocument(doc.file_url)}>
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
  );
};

export default CustomerWideView;
