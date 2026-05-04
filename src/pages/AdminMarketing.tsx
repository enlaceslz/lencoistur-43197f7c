import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Users, Megaphone, TrendingUp, RefreshCw, MessageSquare, Mail, Target, Loader2, Save } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import WhatsAppTab from "@/components/marketing/WhatsAppTab";
import EmailTab from "@/components/marketing/EmailTab";
import LeadsTab from "@/components/marketing/LeadsTab";
import RemarketingTab from "@/components/marketing/RemarketingTab";
import { supabase } from "@/integrations/supabase/client";

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
    { label: "Leads Ativos", value: leads.filter((l) => l.status !== "frio").length, icon: Users, color: "text-primary", bg: "bg-primary/10" },
    { label: "Campanhas Ativas", value: campaigns.filter((c) => c.status === "ativa" || c.status === "automática").length, icon: Megaphone, color: "text-secondary", bg: "bg-secondary/10" },
    { label: "Taxa de Conversão", value: leads.length > 0 ? `${((leads.filter(l => l.status === "convertido").length / leads.length) * 100).toFixed(1)}%` : "0%", icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-100" },
    { label: "Recuperações (Mês)", value: rules.reduce((a, r) => a + (r.conversions || 0), 0), icon: RefreshCw, color: "text-blue-600", bg: "bg-blue-100" },
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
    <AdminLayout title="Marketing & Automação">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s, i) => (
          <Card key={i} className="border-none shadow-sm bg-card hover:shadow-md transition-all group">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${s.bg} ${s.color} shadow-inner group-hover:scale-110 transition-transform`}><s.icon size={24} strokeWidth={2.5} /></div>
              <div>
                <p className="text-2xl font-black text-foreground leading-none">{s.value}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-2">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col xl:flex-row gap-4 items-center justify-between mb-8 p-3 bg-card border border-border rounded-3xl shadow-sm">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar scroll-smooth w-full">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-6 h-11 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                tab === t.key 
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105" 
                  : "bg-muted/50 text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <t.icon size={16} strokeWidth={2.5} /> {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "whatsapp" && <WhatsAppTab campaigns={whatsappCampaigns} onRefresh={fetchAll} />}
      {tab === "email" && <EmailTab campaigns={emailCampaigns} onRefresh={fetchAll} />}
      {tab === "leads" && <LeadsTab leads={leads} onRefresh={fetchAll} />}
      {tab === "remarketing" && <RemarketingTab rules={rules} onRefresh={fetchAll} />}
    </AdminLayout>
  );
};

export default AdminMarketing;
