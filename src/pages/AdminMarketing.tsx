import AdminLayout from "@/components/AdminLayout";
import { Users, Megaphone, TrendingUp, RefreshCw, MessageSquare, Mail, Target } from "lucide-react";
import { useState, useEffect } from "react";
import MarketingStats from "@/components/marketing/MarketingStats";
import WhatsAppTab from "@/components/marketing/WhatsAppTab";
import EmailTab from "@/components/marketing/EmailTab";
import LeadsTab from "@/components/marketing/LeadsTab";
import RemarketingTab from "@/components/marketing/RemarketingTab";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

type Tab = "whatsapp" | "email" | "leads" | "remarketing";

const AdminMarketing = () => {
  const [tab, setTab] = useState<Tab>("whatsapp");
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);

  const fetchAll = async () => {
    setLoading(true);
    const [leadsRes, campaignsRes, rulesRes] = await Promise.all([
      supabase.from("marketing_leads").select("*").order("created_at", { ascending: false }),
      supabase.from("marketing_campaigns").select("*").order("created_at", { ascending: false }),
      supabase.from("remarketing_rules").select("*").order("created_at", { ascending: false }),
    ]);
    if (leadsRes.data) setLeads(leadsRes.data);
    if (campaignsRes.data) setCampaigns(campaignsRes.data);
    if (rulesRes.data) setRules(rulesRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const whatsappCampaigns = campaigns.filter((c) => c.type === "whatsapp");
  const emailCampaigns = campaigns.filter((c) => c.type === "email");

  const stats = [
    { label: "Leads Ativos", value: leads.filter((l) => l.status !== "frio").length, icon: Users, color: "text-primary" },
    { label: "Campanhas Ativas", value: campaigns.filter((c) => c.status === "ativa" || c.status === "automática").length, icon: Megaphone, color: "text-secondary" },
    { label: "Taxa de Conversão", value: leads.length > 0 ? `${((leads.filter(l => l.status === "convertido").length / leads.length) * 100).toFixed(1)}%` : "0%", icon: TrendingUp, color: "text-green-600" },
    { label: "Recuperações (mês)", value: rules.reduce((a, r) => a + (r.conversions || 0), 0), icon: RefreshCw, color: "text-blue-600" },
  ];

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "whatsapp", label: "WhatsApp", icon: MessageSquare },
    { key: "email", label: "E-mail", icon: Mail },
    { key: "leads", label: "Leads", icon: Target },
    { key: "remarketing", label: "Remarketing", icon: RefreshCw },
  ];

  if (loading) {
    return (
      <AdminLayout title="Marketing & WhatsApp">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      </AdminLayout>
    );
  }

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

      {tab === "whatsapp" && <WhatsAppTab campaigns={whatsappCampaigns} onRefresh={fetchAll} />}
      {tab === "email" && <EmailTab campaigns={emailCampaigns} onRefresh={fetchAll} />}
      {tab === "leads" && <LeadsTab leads={leads} onRefresh={fetchAll} />}
      {tab === "remarketing" && <RemarketingTab rules={rules} onRefresh={fetchAll} />}
    </AdminLayout>
  );
};

export default AdminMarketing;
