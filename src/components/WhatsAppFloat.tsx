import { useState, useEffect } from "react";
import { X, MessageSquare } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const WhatsAppFloat = () => {
  const { t } = useTranslation();
  const { site: settings } = useSiteSettings();
  const [showBubble, setShowBubble] = useState(false);
  const [msgIndex, setMsgIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  const smartMessages = (t("whatsappFloat.messages", { returnObjects: true }) as unknown as string[]) || [];

  useEffect(() => {
    const timer = setTimeout(() => setShowBubble(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!showBubble || dismissed) return;
    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % smartMessages.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [showBubble, dismissed, smartMessages.length]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {showBubble && !dismissed && (
        <div className="relative bg-card border border-border rounded-2xl shadow-xl p-4 max-w-[260px] animate-in slide-in-from-bottom-4 fade-in duration-500">
          <button
            onClick={() => setDismissed(true)}
            className="absolute -top-2 -right-2 w-6 h-6 bg-muted rounded-full flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
          >
            <X size={12} />
          </button>
          <p className="text-sm font-semibold text-foreground mb-2">{smartMessages[msgIndex]}</p>
          <a
            href={settings?.whatsappUrl ? `${settings.whatsappUrl}${settings.whatsappUrl.includes('?') ? '&' : '?'}text=${encodeURIComponent("Olá! Vi a promoção no site e gostaria de mais informações!")}` : "https://wa.me/5598985880954?text=Olá! Vi a promoção no site e gostaria de mais informações!"}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-whatsapp hover:bg-whatsapp-hover text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
          >
            <MessageSquare size={14} /> {t("whatsappFloat.talkNow")}
          </a>
        </div>
      )}

      <a
        href={settings?.whatsappUrl ? `${settings.whatsappUrl}${settings.whatsappUrl.includes('?') ? '&' : '?'}text=${encodeURIComponent("Olá! Gostaria de informações sobre passeios nos Lençóis Maranhenses.")}` : "https://wa.me/5598985880954?text=Olá! Gostaria de informações sobre passeios nos Lençóis Maranhenses."}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-whatsapp hover:bg-whatsapp-hover text-primary-foreground w-16 h-16 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-all duration-300"
        aria-label="WhatsApp"
      >
        <svg viewBox="0 0 32 32" className="w-8 h-8 fill-current">
          <path d="M16.004 0h-.008C7.174 0 0 7.176 0 16c0 3.5 1.132 6.744 3.052 9.38L1.056 31.2l6.076-1.952A15.914 15.914 0 0 0 16.004 32C24.824 32 32 24.824 32 16S24.824 0 16.004 0zm9.304 22.588c-.392 1.1-1.932 2.016-3.148 2.28-.832.18-1.916.324-5.568-1.196-4.676-1.944-7.688-6.688-7.924-6.996-.228-.308-1.872-2.492-1.872-4.756 0-2.264 1.184-3.38 1.604-3.84.392-.428.924-.58 1.188-.58.148 0 .28.004.4.012.428.016.644.04 1.004.86.228.52 1.14 2.776 1.24 2.976.104.2.172.432.036.692-.14.264-.208.392-.408.604-.2.212-.42.472-.6.632-.2.18-.408.376-.176.74.232.36 1.032 1.708 2.216 2.768 1.524 1.368 2.808 1.792 3.208 1.992.4.2.632.168.864-.1.236-.272 1.012-1.176 1.28-1.58.264-.4.532-.332.896-.2.368.136 2.32 1.096 2.716 1.296.4.2.664.3.764.468.096.168.096.968-.296 2.068z" />
        </svg>
        {!dismissed && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full flex items-center justify-center text-[10px] font-bold text-destructive-foreground">
            1
          </span>
        )}
      </a>
    </div>
  );
};

export default WhatsAppFloat;
