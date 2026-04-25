import { useState, useMemo } from "react";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Search, Receipt, FileText, CheckCircle2, Clock, 
  ExternalLink, Printer, MoreHorizontal, Download, Paperclip, Upload
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { PrintReceiptButton } from "@/components/BookingReceipt";

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

const fmt = (v: number) => `R$ ${(v / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
const fmtDate = (d: string) => {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("pt-BR"); } catch { return d; }
};

export default function NotasFiscaisTab({ bookings: initialBookings }: NotasFiscaisTabProps) {
  const [search, setSearch] = useState("");
  const [bookings, setBookings] = useState<BookingRow[]>(initialBookings);

  const filtered = useMemo(() => {
    return bookings.filter(b => 
      b.booking_code.toLowerCase().includes(search.toLowerCase()) ||
      b.customers?.name?.toLowerCase().includes(search.toLowerCase()) ||
      b.invoice_number?.toLowerCase().includes(search.toLowerCase())
    );
  }, [bookings, search]);

  const stats = useMemo(() => {
    const total = bookings.length;
    const withInvoice = bookings.filter(b => b.invoice_issued).length;
    const pendingInvoice = bookings.filter(b => !b.invoice_issued && b.payment_status === "pago").length;
    return { total, withInvoice, pendingInvoice };
  }, [bookings]);

  const updateBooking = async (id: string, updates: Partial<BookingRow>) => {
    // Remove relation objects before sending to Supabase
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText size={16} /> Total de Reservas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 size={16} className="text-green-600" /> Notas Emitidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.withInvoice}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock size={16} className="text-yellow-600" /> Pendentes (Pagas)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.pendingInvoice}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input 
            placeholder="Buscar por código, cliente ou nota..." 
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reserva</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status Pgto</TableHead>
              <TableHead>Comprovante</TableHead>
              <TableHead>NF-e</TableHead>
              <TableHead>Recibo</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((b) => (
              <TableRow key={b.id}>
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span>{b.booking_code}</span>
                    <span className="text-xs text-muted-foreground">{fmtDate(b.created_at)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{b.customers?.name || "N/A"}</span>
                    <span className="text-xs text-muted-foreground">{b.customers?.email || ""}</span>
                  </div>
                </TableCell>
                <TableCell>{fmt(b.final_total)}</TableCell>
                <TableCell>
                  <Badge variant={b.payment_status === "pago" ? "default" : "secondary"} className={b.payment_status === "pago" ? "bg-green-600 hover:bg-green-700" : ""}>
                    {b.payment_status === "pago" ? "Pago" : "Pendente"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {b.voucher_url ? (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => window.open(b.voucher_url!, "_blank")}
                      >
                        <Paperclip size={14} />
                        Ver
                      </Button>
                    ) : (
                      <div className="relative">
                        <input
                          type="file"
                          id={`file-${b.id}`}
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, b.id)}
                          accept="image/*,.pdf"
                        />
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 gap-1 text-muted-foreground hover:text-primary"
                          onClick={() => document.getElementById(`file-${b.id}`)?.click()}
                        >
                          <Upload size={14} />
                          Anexar
                        </Button>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {b.invoice_issued ? (
                    <div className="flex flex-col gap-1">
                      <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50">Emitida</Badge>
                      {b.invoice_number && <span className="text-xs font-mono">#{b.invoice_number}</span>}
                    </div>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">Pendente</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {b.receipt_issued ? (
                    <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">Enviado</Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">Não enviado</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
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
                    />
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {b.voucher_url && (
                          <DropdownMenuItem onClick={() => updateBooking(b.id, { voucher_url: null } as any)}>
                            <Paperclip size={14} className="mr-2" />
                            Remover Comprovante
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleMarkInvoiceIssued(b.id, !!b.invoice_issued)}>
                          <FileText size={14} className="mr-2" />
                          {b.invoice_issued ? "Remover NF-e" : "Marcar NF-e Emitida"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateBooking(b.id, { receipt_issued: !b.receipt_issued })}>
                          <Receipt size={14} className="mr-2" />
                          {b.receipt_issued ? "Marcar Recibo Pendente" : "Marcar Recibo Enviado"}
                        </DropdownMenuItem>
                        {b.invoice_url && (
                          <DropdownMenuItem onClick={() => window.open(b.invoice_url!, "_blank")}>
                            <ExternalLink size={14} className="mr-2" />
                            Ver Nota Fiscal
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
