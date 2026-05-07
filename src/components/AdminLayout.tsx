import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
  Home, Compass, Car, Users, UserCheck, CreditCard, Settings,
  LogOut, Star, ShoppingCart, Menu, X, Bell, Megaphone, Bot,
  Shield, AlertTriangle, Activity, ClipboardCheck, Truck, UserCheck2,
  ChevronDown, FileText, Check, Building2, Map, ChevronRight, BarChart3,
  HelpCircle, ClipboardList
} from "lucide-react";

interface Notification {
  id: string;
  type: "warning" | "error" | "info" | "success";
  title: string;
  message: string;
  link?: string;
  time: string;
}

const mainGroups = [
  {
    title: "Gestão",
    items: [
      { icon: Home, label: "Dashboard", path: "/admin" },
      { icon: Compass, label: "Passeios", path: "/admin/passeios" },
      { icon: ShoppingCart, label: "Reservas", path: "/admin/reservas" },
      { icon: FileText, label: "Pacotes", path: "/admin/pacotes" },
      { icon: Car, label: "Translados", path: "/admin/translados" },
    ],
  },
  {
    title: "Relacionamento",
    items: [
      { icon: Users, label: "Clientes (CRM)", path: "/admin/crm" },
      { icon: UserCheck, label: "Parceiros", path: "/admin/parceiros" },
      { icon: UserCheck2, label: "Colaboradores", path: "/admin/colaboradores" },
      { icon: Star, label: "Avaliações", path: "/admin/avaliacoes" },
    ],
  },
  {
    title: "Administrativo",
    items: [
      { icon: CreditCard, label: "Financeiro", path: "/admin/financeiro" },
      { icon: Megaphone, label: "Marketing", path: "/admin/marketing" },
      { icon: FileText, label: "Documentação", path: "/admin/documentos" },
      { icon: BarChart3, label: "Relatórios", path: "/admin/relatorios" },
    ],
  },
  {
    title: "Tecnologia",
    items: [
      { icon: Bot, label: "IA Gateway", path: "/admin/ia" },
    ],
  },
];

const mainItems = mainGroups.flatMap(g => g.items);

const sgsGroups = [
  {
    title: null,
    items: [
      { icon: BarChart3, label: "Painel de Controle", path: "/admin/sgs" },
    ],
  },
  {
    title: "Documentação e Conformidade",
    items: [
      { icon: Building2, label: "Dados da Empresa", path: "/admin/sgs/empresa" },
      { icon: UserCheck, label: "Equipe (ISO 21102)", path: "/admin/sgs/equipe" },
      { icon: Truck, label: "Fornecedores", path: "/admin/sgs/fornecedores" },
      { icon: FileText, label: "PGSAT (ICMBio)", path: "/admin/sgs/pgsat" },
      { icon: ClipboardCheck, label: "Auditorias", path: "/admin/sgs/auditorias" },
    ],
  },
  {
    title: "Operação e Segurança",
    items: [
      { icon: Car, label: "Frota de Veículos", path: "/admin/sgs/veiculos" },
      { icon: UserCheck2, label: "Condutores", path: "/admin/sgs/condutores" },
      { icon: Users, label: "Visitantes", path: "/admin/sgs/condutores-visitantes" },
      { icon: Map, label: "Rotas e Trilhas", path: "/admin/sgs/rotas" },
      { icon: ClipboardCheck, label: "Checklists Operacionais", path: "/admin/sgs/checklists" },
      { icon: Shield, label: "Briefings de Segurança", path: "/admin/sgs/briefings" },
      { icon: ClipboardList, label: "Controles Internos (P5)", path: "/admin/sgs/controles" },
    ],
  },
  {
    title: "Monitoramento e Riscos",
    items: [
      { icon: AlertTriangle, label: "Matriz de Riscos", path: "/admin/sgs/riscos" },
      { icon: Activity, label: "Relatos de Ocorrências", path: "/admin/sgs/incidentes" },
      { icon: ClipboardCheck, label: "Plano de Ações", path: "/admin/sgs/acoes" },
      { icon: FileText, label: "Termos de Risco", path: "/admin/sgs/termos" },
      { icon: Star, label: "Avaliação de Segurança", path: "/admin/sgs/pesquisas" },
    ],
  },
];

const sgsItems = sgsGroups.flatMap(g => g.items);

const getBreadcrumbs = (pathname: string) => {
  const parts = pathname.split("/").filter(Boolean);
  const crumbs: { label: string; path: string }[] = [];
  if (parts[0] === "admin") {
    crumbs.push({ label: "Admin", path: "/admin" });
    if (parts[1] === "sgs") {
      crumbs.push({ label: "SGS", path: "/admin/sgs" });
      const sgsItem = sgsItems.find(i => i.path === pathname);
      if (sgsItem && sgsItem.path !== "/admin/sgs") crumbs.push({ label: sgsItem.label, path: sgsItem.path });
    } else if (parts[1]) {
      const mainItem = mainItems.find(i => i.path === pathname);
      if (mainItem) crumbs.push({ label: mainItem.label, path: mainItem.path });
      else if (parts[1] === "config") {
        crumbs.push({ label: "Configurações", path: "/admin/config" });
      }
    }
  }
  return crumbs;
};

const AdminLayout = ({ children, title }: { children: React.ReactNode; title: string }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem("admin-sidebar-collapsed") === "true");
  const [sgsOpen, setSgsOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [userRole, setUserRole] = useState<string>("operador");
  const [userPermissions, setUserPermissions] = useState<Record<string, boolean>>({});
  const notifRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { settings } = useSiteSettings();

  useEffect(() => {
    const fetch = async () => {
      if (!user?.id) return;
      const { data } = await supabase.from("user_management").select("role, permissions").eq("user_id", user.id).maybeSingle();
      if (data) { setUserRole(data.role); setUserPermissions((data.permissions as any) || {}); }
    };
    fetch();
  }, [user]);

  useEffect(() => { localStorage.setItem("admin-sidebar-collapsed", String(sidebarCollapsed)); }, [sidebarCollapsed]);

  const isSgsActive = location.pathname.startsWith("/admin/sgs");
  const breadcrumbs = getBreadcrumbs(location.pathname);

  useEffect(() => {
    const loadNotifs = async () => {
      const notifs: Notification[] = [];
      try {
        const [pendingBookings, overdueActions] = await Promise.all([
          supabase.from("bookings").select("id").eq("status", "pendente").limit(5),
          supabase.from("sgs_corrective_actions").select("id").eq("status", "pendente").lt("due_date", new Date().toISOString())
        ]);
        if (pendingBookings.data?.length) notifs.push({ id: "pb", type: "warning", title: "Reservas", message: `${pendingBookings.data.length} pendentes`, link: "/admin/reservas", time: "Agora" });
        if (overdueActions.data?.length) notifs.push({ id: "oa", type: "error", title: "SGS", message: `${overdueActions.data.length} atrasos`, link: "/admin/sgs/acoes", time: "Urgente" });
      } catch {}
      setNotifications(notifs);
    };
    loadNotifs();
  }, []);

  const activeNotifs = notifications.filter(n => !dismissed.has(n.id));
  const errorCount = activeNotifs.filter(n => n.type === "error").length;

  const SidebarLink = ({ icon: Icon, label, path, indent = false }: { icon: any; label: string; path: string; indent?: boolean }) => {
    const active = location.pathname === path;
    return (
      <Link
        to={path}
        onClick={() => setSidebarOpen(false)}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-bold transition-all duration-300 ${
          active ? "bg-white/[0.08] text-white shadow-xl shadow-black/20 translate-x-1" : "text-white/40 hover:text-white hover:bg-white/[0.05]"
        } ${sidebarCollapsed ? "justify-center px-0" : ""}`}
      >
        <Icon size={indent ? 16 : 18} className={active ? "text-primary" : ""} />
        {!sidebarCollapsed && <span className="truncate">{label}</span>}
      </Link>
    );
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-[hsl(220,30%,98%)] flex font-body">
        <aside className={`fixed inset-y-0 left-0 z-50 ${sidebarCollapsed ? "w-[80px]" : "w-[280px]"} admin-sidebar transition-all duration-500 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} flex flex-col border-r border-white/5`}>
          <div className={`px-6 py-10 border-b border-white/[0.05] ${sidebarCollapsed ? "flex justify-center" : ""}`}>
            <Link to="/" className="flex items-center gap-4 group">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-ocean flex items-center justify-center shrink-0 shadow-2xl shadow-primary/20 group-hover:rotate-6 transition-all duration-500">
                <span className="text-white font-black text-xl">LT</span>
              </div>
              {!sidebarCollapsed && (
                <div className="flex flex-col">
                  <span className="font-display text-2xl font-black text-white tracking-tighter">Lençóis<span className="text-primary">Tour</span></span>
                  <p className="text-[9px] text-white/30 uppercase font-black tracking-[0.3em]">Management Suite</p>
                </div>
              )}
            </Link>
          </div>

          <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5 scrollbar-none">
            {mainGroups.map((group, idx) => (
              <div key={idx} className={idx > 0 ? "pt-6" : ""}>
                {!sidebarCollapsed && <p className="px-4 pb-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/20">{group.title}</p>}
                {group.items.map(item => <SidebarLink key={item.path} {...item} />)}
              </div>
            ))}
            
            <div className="pt-6 border-t border-white/5 mt-6">
              <button onClick={() => setSgsOpen(!sgsOpen)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-bold text-white/40 hover:text-white hover:bg-white/[0.05] transition-all ${sidebarCollapsed ? "justify-center px-0" : ""}`}>
                <Shield size={18} />
                {!sidebarCollapsed && <span className="flex-1 text-left">SGS - Segurança</span>}
              </button>
              {sgsOpen && !sidebarCollapsed && (
                <div className="mt-2 space-y-1">
                  {sgsItems.slice(0, 5).map(item => <SidebarLink key={item.path} {...item} indent />)}
                </div>
              )}
            </div>
          </nav>

          <div className="p-4 border-t border-white/5">
            <button onClick={() => signOut()} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-bold text-rose-400 hover:bg-rose-500/10 transition-all ${sidebarCollapsed ? "justify-center px-0" : ""}`}>
              <LogOut size={18} />
              {!sidebarCollapsed && <span>Sair do Sistema</span>}
            </button>
          </div>
        </aside>

        <main className={`flex-1 flex flex-col min-w-0 transition-all duration-500 ${sidebarCollapsed ? "lg:ml-[80px]" : "lg:ml-[280px]"}`}>
          <header className="h-20 bg-white/70 backdrop-blur-xl border-b border-border/40 px-8 flex items-center justify-between sticky top-0 z-40 shadow-sm">
            <div className="flex items-center gap-6">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2.5 rounded-xl hover:bg-muted"><Menu size={22} /></button>
              <div className="hidden lg:flex items-center gap-4">
                <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-2.5 rounded-xl hover:bg-muted transition-all group">
                  {sidebarCollapsed ? <ChevronRight size={20} className="group-hover:translate-x-0.5" /> : <Menu size={20} />}
                </button>
                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
                  {breadcrumbs.map((c, i) => (
                    <React.Fragment key={c.path}>
                      {i > 0 && <span className="opacity-20">/</span>}
                      <Link to={c.path} className={`hover:text-primary transition-all ${i === breadcrumbs.length-1 ? "text-primary/80 opacity-100" : ""}`}>{c.label}</Link>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-5">
              <div className="hidden xl:flex items-center gap-3 bg-muted/30 border border-border/40 rounded-2xl px-5 py-2.5 w-72 focus-within:w-80 focus-within:bg-white focus-within:shadow-xl focus-within:shadow-primary/5 transition-all">
                <Compass size={17} className="text-muted-foreground" />
                <input type="text" placeholder="Busca Inteligente..." className="bg-transparent border-none text-[11px] font-bold focus:ring-0 w-full placeholder:text-muted-foreground/30 uppercase tracking-widest" />
              </div>
              <div className="relative" ref={notifRef}>
                <button onClick={() => setNotifOpen(!notifOpen)} className={`relative p-3 rounded-2xl transition-all ${notifOpen ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}>
                  <Bell size={22} />
                  {activeNotifs.length > 0 && <span className={`absolute top-2 right-2 w-4 h-4 rounded-full text-[9px] text-white flex items-center justify-center font-black ${errorCount > 0 ? "bg-rose-500" : "bg-primary shadow-lg shadow-primary/40"}`}>{activeNotifs.length}</span>}
                </button>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-xs border border-primary/20 shadow-inner">
                {userInitials}
              </div>
            </div>
          </header>

          <div className="p-8 max-w-[1600px] mx-auto w-full flex-1">
            {children}
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
};

export default AdminLayout;
