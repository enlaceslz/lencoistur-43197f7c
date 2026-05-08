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
  publicUnitPrice?: number;
  publicTotal?: number;
  payMethod: string;
  paymentStatus: string;
  status: string;
  pixCode?: string | null;
  createdAt: string;
  notes?: string | null;
  cpf?: string;
  passport?: string;
}

const fmt = (v: number) => `R$ ${(v / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d: string) => {
  if (!d) return "—";
  try { return new Date(d + "T12:00").toLocaleDateString("pt-BR"); } catch { return d; }
};
const fmtDateTime = (d: string) => {
  if (!d) return "—";
  try { return new Date(d).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }); } catch { return d; }
};

const payLabel = (m: string) => {
  const map: Record<string, string> = { 
    pix: "PIX (Pagamento Instantâneo)", 
    cartao: "Cartão de Crédito / Débito", 
    card: "Cartão de Crédito", 
    dinheiro: "Dinheiro / Espécie", 
    transferencia: "Transferência Bancária",
    info: "Solicitação de Informações"
  };
  return map[m] || m;
};

const statusLabel = (s: string) => {
  const map: Record<string, string> = { 
    confirmada: "Reserva Confirmada", 
    pendente: "Pagamento Pendente", 
    cancelada: "Reserva Cancelada", 
    concluida: "Serviço Concluído", 
    pago: "Pagamento Aprovado", 
    reembolsado: "Valor Reembolsado" 
  };
  return map[s] || s;
};

function generateReceiptHTML(data: ReceiptData, company?: any): string {
  const brandName = company?.nome_fantasia || company?.razao_social || "LENÇÓIS TOUR";
  const cnpj = company?.cnpj || "00.000.000/0001-00";
  const cadastur = company?.cadastur || "00.000.000/0001-00";
  const address = company?.endereco || "Santo Amaro do Maranhão, MA";
  const phone = company?.telefone || "(98) 98588-0954";
  const email = company?.email || "contato@lencoistur.com";
  const logoUrl = company?.logo_url;

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Comprovante de Reserva - ${data.bookingCode}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
      color: #1e293b; 
      background: #f8fafc; 
      padding: 20px;
      line-height: 1.5;
    }
    .page {
      background: #fff;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      border-radius: 8px;
    }
    .header { 
      display: flex; 
      justify-content: space-between; 
      align-items: flex-start; 
      margin-bottom: 40px; 
      padding-bottom: 24px; 
      border-bottom: 2px solid #e2e8f0; 
    }
    .brand-container { display: flex; align-items: center; gap: 16px; }
    .logo { width: 64px; height: 64px; object-fit: contain; border-radius: 8px; }
    .brand h1 { font-size: 24px; color: #0c4a6e; font-weight: 800; letter-spacing: -0.025em; margin-bottom: 4px; }
    .brand p { font-size: 13px; color: #64748b; line-height: 1.4; }
    
    .receipt-info { text-align: right; }
    .receipt-label { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px; }
    .receipt-info .code { font-size: 22px; font-weight: 800; color: #0f172a; font-family: 'Courier New', monospace; }
    .receipt-info .date { font-size: 12px; color: #64748b; margin-top: 4px; }
    
    .status-container { display: flex; gap: 8px; margin-bottom: 32px; }
    .status-badge { 
      display: inline-flex; 
      align-items: center; 
      padding: 6px 14px; 
      border-radius: 9999px; 
      font-size: 12px; 
      font-weight: 700; 
      text-transform: uppercase;
      letter-spacing: 0.025em;
    }
    .status-confirmada, .status-pago { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
    .status-pendente { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
    .status-cancelada, .status-reembolsado { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
    .status-concluida { background: #dbeafe; color: #1e40af; border: 1px solid #bfdbfe; }
    
    .section-title { 
      font-size: 12px; 
      text-transform: uppercase; 
      letter-spacing: 0.1em; 
      color: #64748b; 
      font-weight: 700; 
      margin-bottom: 16px; 
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .section-title::after { content: ""; flex: 1; height: 1px; background: #f1f5f9; }
    
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; margin-bottom: 32px; }
    .field label { font-size: 11px; color: #94a3b8; font-weight: 600; text-transform: uppercase; display: block; margin-bottom: 4px; }
    .field p { font-size: 15px; color: #1e293b; font-weight: 600; }
    
    .financial-card { 
      background: #f8fafc; 
      border: 1px solid #e2e8f0;
      border-radius: 12px; 
      padding: 24px; 
      margin-bottom: 32px; 
    }
    .fin-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; color: #475569; }
    .fin-row.discount { color: #16a34a; font-weight: 600; }
    .fin-total { 
      display: flex; 
      justify-content: space-between; 
      padding-top: 16px; 
      margin-top: 16px; 
      border-top: 2px dashed #e2e8f0; 
      font-size: 24px; 
      font-weight: 800; 
      color: #0c4a6e; 
    }
    
    .pix-container { 
      background: #f0fdf4; 
      border: 1px solid #bbf7d0; 
      border-radius: 12px; 
      padding: 20px; 
      margin-top: 24px; 
    }
    .pix-title { font-size: 14px; font-weight: 700; color: #166534; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; }
    .pix-code { 
      font-family: 'Courier New', monospace; 
      font-size: 11px; 
      word-break: break-all; 
      color: #334155; 
      background: #fff; 
      padding: 12px; 
      border-radius: 8px; 
      border: 1px solid #dcfce7;
    }
    
    .notes-container { 
      background: #fffbeb; 
      border: 1px solid #fde68a; 
      border-radius: 12px; 
      padding: 16px; 
      margin-bottom: 32px;
    }
    .notes-text { font-size: 14px; color: #78350f; line-height: 1.6; white-space: pre-wrap; }
    
    .footer { 
      margin-top: 48px; 
      padding-top: 32px; 
      border-top: 1px solid #f1f5f9; 
      text-align: center; 
    }
    .footer-brand { font-size: 16px; font-weight: 700; color: #0c4a6e; margin-bottom: 8px; }
    .footer-info { font-size: 12px; color: #94a3b8; line-height: 1.8; }
    .footer-tag { font-size: 10px; color: #cbd5e1; margin-top: 24px; text-transform: uppercase; letter-spacing: 0.05em; }

    @media print {
      body { background: #fff; padding: 0; }
      .page { box-shadow: none; border-radius: 0; padding: 0; width: 100%; max-width: none; }
      .no-print { display: none; }
      @page { margin: 20mm; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="brand-container">
        ${logoUrl ? `<img src="${logoUrl}" alt="Logo" class="logo">` : `<div class="logo" style="background:#0c4a6e;display:flex;align-items:center;justify-content:center;color:white;font-weight:800;font-size:24px;">L</div>`}
        <div class="brand">
          <h1>${brandName}</h1>
          <p>${address}</p>
          <p>CNPJ: ${cnpj} | CADASTUR: ${cadastur}</p>
        </div>
      </div>
      <div class="receipt-info">
        <p class="receipt-label">Comprovante de Reserva</p>
        <div class="code">#${data.bookingCode}</div>
        <div class="date">Emitido em ${fmtDateTime(data.createdAt)}</div>
      </div>
    </div>

    <div class="status-container">
      <span class="status-badge status-${data.status}">${statusLabel(data.status)}</span>
      <span class="status-badge status-${data.paymentStatus}">${statusLabel(data.paymentStatus)}</span>
    </div>

    <div class="section-title">Dados do Cliente</div>
    <div class="grid">
      <div class="field"><label>Nome Completo</label><p>${data.customerName}</p></div>
      <div class="field"><label>E-mail</label><p>${data.customerEmail}</p></div>
      <div class="field"><label>Telefone</label><p>${data.customerPhone || "Não informado"}</p></div>
      <div class="field"><label>Documento</label><p>${data.cpf ? `CPF: ${data.cpf}` : (data.passport ? `Passaporte: ${data.passport}` : "Não informado")}</p></div>
      <div class="field"><label>Código da Reserva</label><p>${data.bookingCode}</p></div>
    </div>

    <div class="section-title">Detalhes dos Serviços</div>
    <div class="grid">
      <div class="field"><label>Categoria</label><p>${data.type === "package" ? "Pacote de Experiências" : (data.type === "tour" || data.type === "passeio" ? "Passeio Turístico" : "Translado / Rota")}</p></div>
      <div class="field"><label>Serviço / Itinerário</label><p>${data.itemName}</p></div>
      <div class="field"><label>Data Agendada</label><p>${fmtDate(data.date)}</p></div>
      <div class="field"><label>Total de Passageiros</label><p>${data.guests} pessoa(s)</p></div>
    </div>

    ${data.notes ? `
    <div class="section-title">Observações Importantes</div>
    <div class="notes-container">
      <div class="notes-text">${data.notes}</div>
    </div>
    ` : ""}

    <div class="section-title">Resumo Financeiro</div>
    <div class="financial-card">
      <div class="fin-row">
        <span>${data.guests}x ${data.itemName} (${fmt(data.publicUnitPrice || data.unitPrice)})</span>
        <span>${fmt(data.publicTotal || data.total)}</span>
      </div>
      ${data.discount > 0 && !data.publicTotal ? `
      <div class="fin-row discount">
        <span>Desconto Especial (PIX/Promoção)</span>
        <span>-${fmt(data.discount)}</span>
      </div>
      ` : ""}
      <div class="fin-row">
        <span>Forma de Pagamento</span>
        <span>${payLabel(data.payMethod)}</span>
      </div>
      <div class="fin-total">
        <span>VALOR TOTAL</span>
        <span>${fmt(data.publicTotal || data.finalTotal)}</span>
      </div>
    </div>

    ${data.pixCode && data.paymentStatus !== "pago" ? `
    <div class="pix-container">
      <div class="pix-title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h7"/><path d="M16 19h6"/><path d="M19 16v6"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="12" cy="12" r="1"/></svg>
        Pagamento via PIX
      </div>
      <p style="font-size:12px;color:#166534;margin-bottom:8px;">Utilize o código abaixo para realizar o pagamento no aplicativo do seu banco:</p>
      <div class="pix-code">${data.pixCode}</div>
    </div>
    ` : ""}

    <div class="footer">
      <div class="footer-brand">${brandName}</div>
      <div class="footer-info">
        <p>${address}</p>
        <p>WhatsApp: ${phone} | E-mail: ${email}</p>
        <p>Este comprovante serve como confirmação de sua reserva e deve ser apresentado no dia do serviço.</p>
      </div>
      <div class="footer-tag">Documento Gerado Eletronicamente via Lençóis Tour</div>
    </div>
  </div>
</body>
</html>`;
}


export function printReceipt(data: ReceiptData, company?: any) {
  const html = generateReceiptHTML(data, company);
  const printWindow = window.open("", "_blank", "width=800,height=900");
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.print();
  };
}

export function downloadReceiptPDF(data: ReceiptData, company?: any) {
  // Uses print-to-PDF via browser dialog
  printReceipt(data, company);
}

interface PrintReceiptButtonProps {
  data: ReceiptData;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  label?: string;
}

export function PrintReceiptButton({ data, variant = "outline", size = "sm", className = "", label = "Imprimir Recibo" }: PrintReceiptButtonProps) {
  const [company, setCompany] = useState<any>(null);

  useEffect(() => {
    const fetchCompany = async () => {
      const { data: companyData } = await supabase.from("sgs_empresa").select("*").limit(1).maybeSingle();
      if (companyData) setCompany(companyData);
    };
    fetchCompany();
  }, []);

  return (
    <Button variant={variant} size={size} className={className} onClick={() => printReceipt(data, company)}>
      <Printer size={14} className="mr-1.5" />
      {label}
    </Button>
  );
}

export default PrintReceiptButton;
