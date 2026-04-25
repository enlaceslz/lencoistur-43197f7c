import { Printer, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

export interface ReceiptData {
  bookingCode: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  itemName: string;
  type: string;
  date: string;
  guests: number;
  unitPrice: number;
  total: number;
  discount: number;
  finalTotal: number;
  payMethod: string;
  paymentStatus: string;
  status: string;
  pixCode?: string | null;
  createdAt: string;
  notes?: string | null;
}

const fmt = (v: number) => `R$ ${(v / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
const fmtDate = (d: string) => {
  if (!d) return "—";
  try { return new Date(d + "T12:00").toLocaleDateString("pt-BR"); } catch { return d; }
};
const fmtDateTime = (d: string) => {
  if (!d) return "—";
  try { return new Date(d).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }); } catch { return d; }
};

const payLabel = (m: string) => {
  const map: Record<string, string> = { pix: "PIX", cartao: "Cartão de Crédito", card: "Cartão de Crédito", dinheiro: "Dinheiro", transferencia: "Transferência" };
  return map[m] || m;
};

const statusLabel = (s: string) => {
  const map: Record<string, string> = { confirmada: "Confirmada", pendente: "Pendente", cancelada: "Cancelada", concluida: "Concluída", pago: "Pago", reembolsado: "Reembolsado" };
  return map[s] || s;
};

function generateReceiptHTML(data: ReceiptData, company?: any): string {
  const brandName = company?.nome_fantasia || company?.razao_social || "LENÇÓIS TOUR";
  const cnpj = company?.cnpj || "00.000.000/0001-00";
  const cadastur = company?.cadastur || "00.000.000/0001-00";
  const address = company?.endereco || "Santo Amaro do Maranhão, MA";
  const phone = company?.telefone || "(98) 98588-0954";

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Recibo - ${data.bookingCode}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; color: #1a1a2e; background: #fff; padding: 40px; max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 3px solid #0c4a6e; }
    .brand h1 { font-size: 28px; color: #0c4a6e; font-weight: 800; letter-spacing: -0.5px; }
    .brand p { font-size: 12px; color: #64748b; margin-top: 4px; }
    .receipt-info { text-align: right; }
    .receipt-info .code { font-size: 20px; font-weight: 700; color: #0c4a6e; font-family: 'Courier New', monospace; }
    .receipt-info .date { font-size: 12px; color: #64748b; margin-top: 4px; }
    .receipt-title { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #94a3b8; font-weight: 600; margin-bottom: 12px; }
    .section { margin-bottom: 24px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .field label { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
    .field value, .field p { font-size: 14px; color: #1e293b; font-weight: 500; }
    .financial { background: #f8fafc; border-radius: 12px; padding: 20px; margin-top: 8px; }
    .fin-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; color: #475569; }
    .fin-row.discount { color: #16a34a; }
    .fin-total { display: flex; justify-content: space-between; padding: 12px 0 0; margin-top: 8px; border-top: 2px solid #e2e8f0; font-size: 20px; font-weight: 700; color: #0c4a6e; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .status-confirmada, .status-pago { background: #dcfce7; color: #166534; }
    .status-pendente { background: #fef3c7; color: #92400e; }
    .status-cancelada, .status-reembolsado { background: #fee2e2; color: #991b1b; }
    .status-concluida { background: #dbeafe; color: #1e40af; }
    .pix-section { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; margin-top: 16px; }
    .pix-code { font-family: 'Courier New', monospace; font-size: 10px; word-break: break-all; color: #374151; background: #fff; padding: 8px; border-radius: 6px; margin-top: 8px; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8; }
    .footer p { margin: 2px 0; }
    .notes { background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px; font-size: 13px; color: #78350f; margin-top: 8px; }
    @media print {
      body { padding: 20px; }
      @page { margin: 15mm; size: A4; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <h1>🏖️ LENÇÓIS TOUR</h1>
      <p>Turismo de Aventura — Santo Amaro do Maranhão, MA</p>
      <p>CNPJ: 00.000.000/0001-00 | CADASTUR: 00.000.000/0001-00</p>
    </div>
    <div class="receipt-info">
      <div class="code">${data.bookingCode}</div>
      <div class="date">Emitido em: ${fmtDateTime(data.createdAt)}</div>
    </div>
  </div>

  <div class="section">
    <div class="receipt-title">Recibo de Reserva</div>
    <div style="display:flex; gap:8px; margin-bottom:16px;">
      <span class="status-badge status-${data.status}">${statusLabel(data.status)}</span>
      <span class="status-badge status-${data.paymentStatus}">${statusLabel(data.paymentStatus)}</span>
    </div>
  </div>

  <div class="section">
    <div class="receipt-title">Dados do Cliente</div>
    <div class="grid">
      <div class="field"><label>Nome</label><p>${data.customerName}</p></div>
      <div class="field"><label>E-mail</label><p>${data.customerEmail}</p></div>
      ${data.customerPhone ? `<div class="field"><label>Telefone</label><p>${data.customerPhone}</p></div>` : ""}
    </div>
  </div>

  <div class="section">
    <div class="receipt-title">Detalhes da Reserva</div>
    <div class="grid">
      <div class="field"><label>Tipo</label><p>${data.type === "passeio" ? "Passeio" : "Translado"}</p></div>
      <div class="field"><label>${data.type === "passeio" ? "Passeio" : "Rota"}</label><p>${data.itemName}</p></div>
      <div class="field"><label>Data</label><p>${fmtDate(data.date)}</p></div>
      <div class="field"><label>Participantes</label><p>${data.guests} pessoa(s)</p></div>
      <div class="field"><label>Pagamento</label><p>${payLabel(data.payMethod)}</p></div>
    </div>
  </div>

  <div class="section">
    <div class="receipt-title">Resumo Financeiro</div>
    <div class="financial">
      <div class="fin-row"><span>${data.guests}x ${fmt(data.unitPrice)}</span><span>${fmt(data.total)}</span></div>
      ${data.discount > 0 ? `<div class="fin-row discount"><span>Desconto PIX</span><span>-${fmt(data.discount)}</span></div>` : ""}
      <div class="fin-total"><span>TOTAL</span><span>${fmt(data.finalTotal)}</span></div>
    </div>
    ${data.pixCode ? `
    <div class="pix-section">
      <strong style="font-size:13px;color:#166534;">Código PIX Copia e Cola:</strong>
      <div class="pix-code">${data.pixCode}</div>
    </div>
    ` : ""}
  </div>

  ${data.notes ? `
  <div class="section">
    <div class="receipt-title">Observações</div>
    <div class="notes">${data.notes}</div>
  </div>
  ` : ""}

  <div class="footer">
    <p><strong>LENÇÓIS TOUR</strong> — Rota das Emoções</p>
    <p>Santo Amaro do Maranhão, MA | WhatsApp: (98) 98588-0954</p>
    <p>lencoistur.lovable.app</p>
    <p style="margin-top:8px;">Este documento é um comprovante de reserva. Não é um documento fiscal.</p>
  </div>
</body>
</html>`;
}

export function printReceipt(data: ReceiptData) {
  const html = generateReceiptHTML(data);
  const printWindow = window.open("", "_blank", "width=800,height=900");
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.print();
  };
}

export function downloadReceiptPDF(data: ReceiptData) {
  // Uses print-to-PDF via browser dialog
  printReceipt(data);
}

interface PrintReceiptButtonProps {
  data: ReceiptData;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  label?: string;
}

export function PrintReceiptButton({ data, variant = "outline", size = "sm", className = "", label = "Imprimir Recibo" }: PrintReceiptButtonProps) {
  return (
    <Button variant={variant} size={size} className={className} onClick={() => printReceipt(data)}>
      <Printer size={14} className="mr-1.5" />
      {label}
    </Button>
  );
}

export default PrintReceiptButton;
