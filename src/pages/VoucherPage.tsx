import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ReceiptData, printReceipt } from "@/components/BookingReceipt";
import { Loader2 } from "lucide-react";

const VoucherPage = () => {
  const [params] = useSearchParams();
  const id = params.get("id");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBooking = async () => {
      if (!id) {
        navigate("/");
        return;
      }

      const { data, error } = await supabase.rpc("get_public_booking_v2", {
        p_booking_id: id
      });

      if (error || !data || (data as any).length === 0) {
        console.error("Error fetching booking for voucher:", error);
        navigate("/");
        return;
      }

      const bookingData = (data as any)[0];


      const { data: company } = await supabase.from("sgs_empresa").select("*").limit(1).maybeSingle();

      const receiptData: ReceiptData = {
        bookingCode: bookingData.booking_code,
        customerName: bookingData.customer_name || "Cliente",
        customerEmail: bookingData.customer_email || "",
        customerPhone: bookingData.customer_phone || "",
        itemName: bookingData.item_name,
        type: bookingData.type as any,
        date: bookingData.date,
        guests: bookingData.guests,
        unitPrice: bookingData.unit_price,
        total: bookingData.total,
        discount: bookingData.discount,
        finalTotal: bookingData.final_total,
        payMethod: bookingData.pay_method as any,
        paymentStatus: bookingData.payment_status as any,
        status: bookingData.status as any,
        pixCode: bookingData.pix_code,
        createdAt: bookingData.created_at,
        notes: bookingData.notes,
        cpf: bookingData.customer_cpf,
        passport: bookingData.customer_passport
      };


      // Since this page's purpose is to show the receipt, we trigger the print logic
      // and then we can also show a "Download" view if the print is cancelled.
      printReceipt(receiptData, company);
      setLoading(false);
    };

    fetchBooking();
  }, [id, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
      {loading ? (
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-primary mx-auto" size={40} />
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Gerando Comprovante...</p>
        </div>
      ) : (
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <Loader2 size={32} />
          </div>
          <h1 className="text-xl font-black text-slate-900">Comprovante Gerado</h1>
          <p className="text-slate-500 text-sm">O comprovante foi aberto em uma nova aba para impressão. Caso não tenha aparecido, verifique as permissões de pop-up do seu navegador.</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-primary text-white font-bold py-3 rounded-2xl shadow-lg"
          >
            Tentar Novamente
          </button>
        </div>
      )}
    </div>
  );
};

export default VoucherPage;
