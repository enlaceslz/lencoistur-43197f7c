import AdminLayout from "@/components/AdminLayout";
import { Users, Megaphone, TrendingUp, RefreshCw, MessageSquare, Mail, Target } from "lucide-react";
import { useState } from "react";
import MarketingStats from "@/components/marketing/MarketingStats";
import WhatsAppTab from "@/components/marketing/WhatsAppTab";
import EmailTab from "@/components/marketing/EmailTab";
import LeadsTab from "@/components/marketing/LeadsTab";
import RemarketingTab from "@/components/marketing/RemarketingTab";
import { whatsappCampaigns, emailCampaigns, leads, remarketingRules } from "@/components/marketing/marketingData";

type Tab = "whatsapp" | "email" | "leads" | "remarketing";

const AdminMarketing = () => {
  const [tab, setTab] = useState<Tab>("whatsapp");

  const stats = [
    { label: "Leads Ativos", value: leads.filter(l => l.status !== "frio").length, icon: Users, color: "text-primary" },
    { label: "Campanhas Ativas", value: whatsappCampaigns.filter(c => c.status === "ativa" || c.status === "automática").length + emailCampaigns.filter(c => c.status === "automática").length, icon: Megaphone, color: "text-secondary" },
    { label: "Taxa de Conversão", value: "12.8%", icon: TrendingUp, color: "text-green-600" },
    { label: "Recuperações (mês)", value: remarketingRules.reduce((a, r) => a + r.conversions, 0), icon: RefreshCw, color: "text-blue-600" },
  ];

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "whatsapp", label: "WhatsApp", icon: MessageSquare },
    { key: "email", label: "E-mail", icon: Mail },
    { key: "leads", label: "Leads", icon: Target },
    { key: "remarketing", label: "Remarketing", icon: RefreshCw },
  ];

  return (
    <AdminLayout title="Marketing & WhatsApp">
      <MarketingStats stats={stats} />

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap ${
              tab === t.key ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {tab === "whatsapp" && <WhatsAppTab campaigns={whatsappCampaigns} />}
      {tab === "email" && <EmailTab campaigns={emailCampaigns} />}
      {tab === "leads" && <LeadsTab leads={leads} />}
      {tab === "remarketing" && <RemarketingTab rules={remarketingRules} />}
    </AdminLayout>
  );
};

export default AdminMarketing;
