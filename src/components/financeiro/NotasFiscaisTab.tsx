import { useState, useMemo } from "react";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Search, Receipt, FileText, CheckCircle2, Clock, 
  MoreHorizontal, Download, Paperclip, Upload, Plus
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { PrintReceiptButton } from "@/components/BookingReceipt";
import { formatCurrency } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface BookingRow {
  id: string;
  booking_code: string;
  item_name: string;
  final_total: number;
  payment_status: string;
  status: string;
  created_at: string;
  invoice_number?: string | null;
  invoice_issued?: boolean;
  receipt_issued?: boolean;
  invoice_url?: string | null;
  voucher_url?: string | null;
  customers: { name: string; email: string; phone?: string } | null;
  type: string;
  date: string | null;
  guests: number;
  unit_price: number;
  total: number;
  discount: number;
  pay_method: string;
  pix_code?: string | null;
  notes?: string | null;
}

interface NotasFiscaisTabProps {
  bookings: any[];
}

const fmt = (v: number) => formatCurrency(v);
const fmtDate = (d: string) => {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("pt-BR"); } catch { return d; }
};

export default function NotasFiscaisTab({ bookings: initialBookings }: NotasFiscaisTabProps) {
  const [search, setSearch] = useState("");
  const [bookings, setBookings] = useState<BookingRow[]>(initialBookings);
  const [statusFilter, setStatusFilter] = useState("todos");

  const filtered = useMemo(() => {
    return bookings.filter(b => {
      const matchesSearch = b.booking_code.toLowerCase().includes(search.toLowerCase()) ||
                           b.customers?.name?.toLowerCase().includes(search.toLowerCase()) ||
                           (b.invoice_number || "").toLowerCase().includes(search.toLowerCase());
      
      const matchesStatus = statusFilter === "todos" || 
                           (statusFilter === "emitida" ? b.invoice_issued : !b.invoice_issued);
      
      return matchesSearch && matchesStatus;
    });
  }, [bookings, search, statusFilter]);

  const exportToCSV = () => {
    const headers = ["Código", "Cliente", "Email", "Valor", "Status Pgto", "NF Emitida", "Nº Nota", "Data"];
    const rows = filtered.map(b => [
      b.booking_code,
      b.customers?.name || "N/A",
      b.customers?.email || "N/A",
      b.final_total.toString(),
      b.payment_status,
      b.invoice_issued ? "Sim" : "Não",
      b.invoice_number || "N/A",
      fmtDate(b.created_at)
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `notas_fiscais_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const stats = useMemo(() => {
    const total = bookings.length;
    const withInvoice = bookings.filter(b => b.invoice_issued).length;
    const pendingInvoice = bookings.filter(b => !b.invoice_issued && b.payment_status === "pago").length;
    return { total, withInvoice, pendingInvoice };
  }, [bookings]);

  const updateBooking = async (id: string, updates: Partial<BookingRow>) => {
    const { customers, ...dataToUpdate } = updates;
    
    const { error } = await supabase
      .from("bookings")
      .update(dataToUpdate as any)
      .eq("id", id);

    if (error) {
      console.error("Update error:", error);
      toast.error("Erro ao atualizar reserva");
      return;
    }

    setBookings(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
    toast.success("Reserva atualizada");
  };

  const handleMarkInvoiceIssued = (id: string, current: boolean) => {
    const number = current ? null : prompt("Informe o número da Nota Fiscal (opcional):");
    updateBooking(id, { 
      invoice_issued: !current, 
      invoice_number: number || null,
      invoice_issued_at: !current ? new Date().toISOString() : null 
    } as any);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, bookingId: string, field: "voucher_url" | "invoice_url") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop();
    const filePath = `${field}/${bookingId}-${Math.random()}.${fileExt}`;

    try {
      const { data, error: uploadError } = await supabase.storage
        .from('vouchers')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('vouchers')
        .getPublicUrl(filePath);

      await updateBooking(bookingId, { [field]: publicUrl } as any);
      toast.success(field === "voucher_url" ? "Comprovante anexado!" : "Nota Fiscal anexada!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Erro ao enviar arquivo");
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Total de Reservas", value: stats.total, icon: FileText, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/20" },
          { label: "Notas Emitidas", value: stats.withInvoice, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/20" },
          { label: "Pendentes (Pagas)", value: stats.pendingInvoice, icon: Clock, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/20" },
        ].map((s, idx) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">{s.label}</p>
                  <p className="text-3xl font-black mt-1">{s.value}</p>
                </div>
                <div className={`p-4 rounded-2xl ${s.bg} ${s.color}`}>
                  <s.icon size={24} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 bg-card p-4 rounded-2xl border border-border/50">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input 
            placeholder="Buscar por código, cliente ou nota..." 
            className="pl-10 rounded-xl border-none bg-muted/50 h-11 focus:ring-2 focus:ring-primary"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="rounded-xl h-11 w-[160px] border-none bg-muted/50">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos Status</SelectItem>
              <SelectItem value="emitida">NF Emitida</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            onClick={exportToCSV}
            className="rounded-xl h-11 border-border/50 hover:bg-muted font-bold text-xs uppercase tracking-wider"
          >
            <Download size={16} className="mr-2" /> Exportar
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 border-b border-border">
              <TableHead className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest">Reserva</TableHead>
              <TableHead className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest">Cliente</TableHead>
              <TableHead className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest">Valor</TableHead>
              <TableHead className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest">Status Pgto</TableHead>
              <TableHead className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest">Documentos</TableHead>
              <TableHead className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence mode="popLayout">
              {filtered.map((b, idx) => (
                <motion.tr 
                  key={b.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.03 }}
                  className="group hover:bg-primary/5 border-b border-border/50 last:border-0"
                >
                  <TableCell className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-foreground group-hover:text-primary transition-colors">{b.booking_code}</span>
                      <span className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1 font-mono uppercase">
                        <Clock size={10} /> {fmtDate(b.created_at)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground">{b.customers?.name || "N/A"}</span>
                      <span className="text-xs text-muted-foreground">{b.customers?.email || ""}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <span className="font-black text-foreground">{fmt(b.final_total)}</span>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <Badge variant="outline" className={`rounded-lg px-2 py-0.5 font-bold uppercase text-[9px] border ${
                      b.payment_status === "pago" 
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                        : "bg-amber-50 text-amber-700 border-amber-100"
                    }`}>
                      {b.payment_status === "pago" ? "Pago" : "Pendente"}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {/* Comprovante */}
                      <div className="group/doc">
                        {b.voucher_url ? (
                          <button 
                            onClick={() => window.open(b.voucher_url!, "_blank")}
                            className="flex items-center gap-1.5 p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors text-[10px] font-bold uppercase"
                          >
                            <Paperclip size={12} /> Comprovante
                          </button>
                        ) : (
                          <div className="relative">
                            <input
                              type="file"
                              id={`voucher-${b.id}`}
                              className="hidden"
                              onChange={(e) => handleFileUpload(e, b.id, "voucher_url")}
                              accept="image/*,.pdf"
                            />
                            <button 
                              onClick={() => document.getElementById(`voucher-${b.id}`)?.click()}
                              className="flex items-center gap-1.5 p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-primary transition-colors text-[10px] font-bold uppercase border border-dashed border-border"
                            >
                              <Upload size={12} /> Comprovante
                            </button>
                          </div>
                        )}
                      </div>

                      {/* NF-e */}
                      <div className="group/doc">
                        {b.invoice_issued ? (
                          <div className="flex items-center gap-2">
                             <button 
                                onClick={() => b.invoice_url && window.open(b.invoice_url, "_blank")}
                                className="flex items-center gap-1.5 p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors text-[10px] font-bold uppercase"
                              >
                                <FileText size={12} /> NF-e #{b.invoice_number || "S/N"}
                              </button>
                          </div>
                        ) : (
                          <div className="relative">
                             <input
                              type="file"
                              id={`invoice-${b.id}`}
                              className="hidden"
                              onChange={(e) => handleFileUpload(e, b.id, "invoice_url")}
                              accept="image/*,.pdf"
                            />
                            <button 
                              onClick={() => handleMarkInvoiceIssued(b.id, false)}
                              className="flex items-center gap-1.5 p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-primary transition-colors text-[10px] font-bold uppercase border border-dashed border-border"
                            >
                              <Plus size={12} /> Emitir NF-e
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <PrintReceiptButton 
                        data={{
                          bookingCode: b.booking_code,
                          customerName: b.customers?.name || "",
                          customerEmail: b.customers?.email || "",
                          customerPhone: b.customers?.phone,
                          itemName: b.item_name,
                          type: b.type,
                          date: b.date || "",
                          guests: b.guests,
                          unitPrice: b.unit_price,
                          total: b.total,
                          discount: b.discount,
                          finalTotal: b.final_total,
                          payMethod: b.pay_method,
                          paymentStatus: b.payment_status,
                          status: b.status,
                          pixCode: b.pix_code,
                          createdAt: b.created_at,
                          notes: b.notes
                        }}
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary"
                      />
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
                            <MoreHorizontal size={18} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl border-none shadow-xl">
                          <DropdownMenuItem onClick={() => updateBooking(b.id, { receipt_issued: !b.receipt_issued })} className="rounded-lg gap-2">
                            <Receipt size={14} className="text-primary" />
                            {b.receipt_issued ? "Desmarcar Recibo" : "Marcar Recibo Enviado"}
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem onClick={() => handleMarkInvoiceIssued(b.id, !!b.invoice_issued)} className="rounded-lg gap-2">
                            <FileText size={14} className="text-emerald-500" />
                            {b.invoice_issued ? "Remover Marcação de NF-e" : "Marcar NF-e Emitida"}
                          </DropdownMenuItem>

                          {b.invoice_issued && !b.invoice_url && (
                            <DropdownMenuItem onClick={() => document.getElementById(`invoice-${b.id}`)?.click()} className="rounded-lg gap-2">
                              <Upload size={14} className="text-blue-500" />
                              Anexar Arquivo NF-e
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuItem className="rounded-lg gap-2 text-rose-500" onClick={exportToCSV}>
                             <Download size={14} />
                             Exportar Dados
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </motion.tr>
              ))}
            </AnimatePresence>
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
