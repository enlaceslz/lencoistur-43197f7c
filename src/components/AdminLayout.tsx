import { useState, useEffect, useRef } from "react";
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
  type: "warning" | "error" | "info";
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

// Flat list for breadcrumb lookup
const sgsItems = sgsGroups.flatMap(g => g.items);

// Breadcrumb helper
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
      else if (parts[1] === "config") crumbs.push({ label: "Configurações", path: "/admin/config" });
    }
  }
  return crumbs;
};

const AdminLayout = ({ children, title }: { children: React.ReactNode; title: string }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem("admin-sidebar-collapsed");
    return saved === "true";
  });
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
    const fetchUserPermissions = async () => {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from("user_management")
        .select("role, permissions")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (data) {
        setUserRole(data.role);
        setUserPermissions((data.permissions as Record<string, boolean>) || {});
      }
    };
    fetchUserPermissions();
  }, [user]);

  useEffect(() => {
    localStorage.setItem("admin-sidebar-collapsed", String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const isSgsActive = location.pathname.startsWith("/admin/sgs");
  const breadcrumbs = getBreadcrumbs(location.pathname);

  // Load notifications
  useEffect(() => {
    const loadNotifications = async () => {
      const notifs: Notification[] = [];
      const now = new Date();
      const soon = new Date();
      soon.setDate(soon.getDate() + 30);

      try {
        const [pendingBookings, overdueActions, expiringDocs, expiredTrainings, openIncidents, blockedSuppliers, pendingSgsTerms, systemNotifs] = await Promise.all([
          supabase.from("bookings").select("id").eq("status", "pendente").eq("payment_status", "pendente").limit(5),
          supabase.from("sgs_corrective_actions").select("id").in("status", ["pendente", "em_andamento"]).lt("due_date", now.toISOString().split("T")[0]),
          supabase.from("documents").select("id, name, expiry_date").not("expiry_date", "is", null).lte("expiry_date", soon.toISOString().split("T")[0]).eq("status", "vigente"),
          supabase.from("sgs_staff_trainings").select("id").eq("status", "vencido"),
          supabase.from("sgs_incidents").select("id").eq("status", "aberto"),
          supabase.from("sgs_supplier_compliance").select("id").eq("blocked", true),
          supabase.from("sgs_risk_terms").select("id").eq("accepted", false),
          supabase.from("notifications").select("*").eq("read", false).order("created_at", { ascending: false }).limit(10),
        ]);

        if (systemNotifs.data?.length) {
          systemNotifs.data.forEach(n => {
            notifs.push({
              id: n.id,
              type: n.type as "info" | "warning" | "error",
              title: n.title,
              message: n.message,
              link: n.link || undefined,
              time: new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
          });
        }

        if (pendingBookings.data?.length) notifs.push({ id: "pending_bookings", type: "warning", title: "Reservas Pendentes", message: `${pendingBookings.data.length} reserva(s) aguardando pagamento.`, link: "/admin/reservas", time: "Agora" });
        if (overdueActions.data?.length) notifs.push({ id: "overdue_actions", type: "error", title: "Ações Atrasadas", message: `${overdueActions.data.length} ação(ões) com prazo vencido.`, link: "/admin/sgs/acoes", time: "Urgente" });

        if (expiringDocs.data?.length) {
          const expired = expiringDocs.data.filter(d => new Date(d.expiry_date!) < now);
          const expiring = expiringDocs.data.filter(d => new Date(d.expiry_date!) >= now);
          if (expired.length) notifs.push({ id: "expired_docs", type: "error", title: "Documentos Vencidos", message: `${expired.length} documento(s) expirado(s).`, link: "/admin/documentos", time: "Urgente" });
          if (expiring.length) notifs.push({ id: "expiring_docs", type: "warning", title: "Documentos Vencendo", message: `${expiring.length} documento(s) vencem em 30 dias.`, link: "/admin/documentos", time: "Atenção" });
        }

        if (expiredTrainings.data?.length) notifs.push({ id: "expired_trainings", type: "warning", title: "Treinamentos Vencidos", message: `${expiredTrainings.data.length} treinamento(s) vencido(s).`, link: "/admin/sgs/equipe", time: "Atenção" });
        if (openIncidents.data?.length) notifs.push({ id: "open_incidents", type: "info", title: "Incidentes Abertos", message: `${openIncidents.data.length} incidente(s) em aberto.`, link: "/admin/sgs/incidentes", time: "Info" });
        if (blockedSuppliers.data?.length) notifs.push({ id: "blocked_suppliers", type: "error", title: "Fornecedores Bloqueados", message: `${blockedSuppliers.data.length} fornecedor(es) bloqueado(s).`, link: "/admin/sgs/fornecedores", time: "Alerta" });
        if (pendingSgsTerms.data?.length) notifs.push({ id: "pending_sgs_terms", type: "warning", title: "Termos Pendentes", message: `${pendingSgsTerms.data.length} termo(s) de risco pendente(s) de assinatura.`, link: "/admin/sgs/termos", time: "Atenção" });
      } catch (err) {
        console.error("Error loading notifications:", err);
      }
      setNotifications(notifs);
    };

    loadNotifications();
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const activeNotifs = notifications.filter(n => !dismissed.has(n.id));
  const errorCount = activeNotifs.filter(n => n.type === "error").length;

  const dismissNotif = (id: string) => setDismissed(prev => new Set(prev).add(id));
  const dismissAll = () => { setDismissed(new Set(notifications.map(n => n.id))); setNotifOpen(false); };

  const typeStyles: Record<string, { bg: string; border: string; icon: typeof AlertTriangle; dot: string }> = {
    error: { bg: "bg-red-50", border: "border-l-red-500", icon: AlertTriangle, dot: "bg-red-500" },
    warning: { bg: "bg-amber-50", border: "border-l-amber-500", icon: Bell, dot: "bg-amber-500" },
    info: { bg: "bg-blue-50", border: "border-l-blue-500", icon: Activity, dot: "bg-blue-500" },
    success: { bg: "bg-green-50", border: "border-l-green-500", icon: Check, dot: "bg-green-500" },
  };

  const userInitials = user?.email ? user.email.substring(0, 2).toUpperCase() : "AD";

  const SidebarLink = ({ icon: Icon, label, path, indent = false }: { icon: any; label: string; path: string; indent?: boolean }) => {
    const active = location.pathname === path;
    return (
      <Link
        to={path}
        onClick={() => setSidebarOpen(false)}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 ${
          active
            ? "admin-sidebar-item-active text-white bg-white/[0.08]"
            : "text-[hsl(220,15%,65%)] hover:text-white hover:bg-white/[0.06]"
        } ${indent ? "ml-3 pl-4" : ""} ${sidebarCollapsed ? "justify-center px-0" : ""}`}
        title={sidebarCollapsed ? label : ""}
      >
        <Icon size={indent ? 15 : 17} className={`${active ? "text-[hsl(217,91%,60%)]" : ""} shrink-0`} />
        {!sidebarCollapsed && <span className="truncate">{label}</span>}
      </Link>
    );
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-[hsl(220,20%,96%)] flex">
      {/* === SIDEBAR === */}
      <aside className={`fixed inset-y-0 left-0 z-50 ${sidebarCollapsed ? "w-[80px]" : "w-[260px]"} admin-sidebar transform transition-all duration-200 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} flex flex-col`}>
        {/* Brand */}
        <div className={`px-5 py-5 border-b border-white/[0.08] ${sidebarCollapsed ? "flex justify-center" : ""}`}>
          <Link to="/" className="flex items-center gap-2">
            {settings?.logoUrl ? (
              <img 
                src={settings.logoUrl} 
                alt={settings.titulo || "LençóisTour"} 
                className={`${sidebarCollapsed ? "h-6" : "h-10"} w-auto object-contain brightness-0 invert`} 
              />
            ) : (
              <>
                <div className="w-8 h-8 rounded-lg bg-[hsl(217,91%,60%)] flex items-center justify-center shrink-0">
                  <span className="text-white font-bold text-sm">LT</span>
                </div>
                {!sidebarCollapsed && (
                  <div>
                    <span className="font-display text-base font-bold text-white tracking-tight">Lençóis</span>
                    <span className="font-display text-base font-bold text-[hsl(217,91%,60%)]">Tour</span>
                    <p className="text-[10px] text-[hsl(220,15%,50%)] -mt-0.5 font-medium">Painel Administrativo</p>
                  </div>
                )}
              </>
            )}
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5 scrollbar-thin">
          {mainGroups.map((group, idx) => {
            const filteredItems = group.items.filter(item => {
              if (userRole === "administrador") return true;
              
              const moduleKey = Object.entries({
                dashboard: "/admin",
                passeios: "/admin/passeios",
                reservas: "/admin/reservas",
                translados: "/admin/translados",
                crm: "/admin/crm",
                parceiros: "/admin/parceiros",
                colaboradores: "/admin/colaboradores",
                financeiro: "/admin/financeiro",
                marketing: "/admin/marketing",
                documentos: "/admin/documentos",
                relatorios: "/admin/relatorios",
                ia: "/admin/ia",
                configuracoes: "/admin/config"
              }).find(([_, path]) => item.path === path)?.[0];

              return !moduleKey || userPermissions[moduleKey];
            });

            if (filteredItems.length === 0) return null;

            return (
              <div key={idx} className={idx > 0 ? "pt-2" : ""}>
                {!sidebarCollapsed && (
                  <p className="px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[hsl(220,15%,45%)] opacity-80">
                    {group.title}
                  </p>
                )}
                {filteredItems.map(item => <SidebarLink key={item.path} {...item} />)}
              </div>
            );
          })}

          {/* SGS Section */}
          {(userRole === "administrador" || userPermissions.sgs) && (
            <div className="pt-2 border-t border-white/[0.05] mt-2">
              <button
                onClick={() => setSgsOpen(!sgsOpen)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                  isSgsActive
                    ? "text-[hsl(217,91%,60%)] bg-white/[0.06]"
                    : "text-[hsl(220,15%,65%)] hover:text-white hover:bg-white/[0.06]"
                } ${sidebarCollapsed ? "justify-center px-0" : ""}`}
                title={sidebarCollapsed ? "SGS — Segurança" : ""}
              >
                <Shield size={17} className="shrink-0" />
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1 text-left">SGS — Segurança</span>
                    <ChevronDown size={14} className={`transition-transform duration-200 ${sgsOpen || isSgsActive ? "rotate-180" : ""}`} />
                  </>
                )}
              </button>
              {(sgsOpen || isSgsActive) && !sidebarCollapsed && (
                <div className="mt-1 border-l border-white/[0.06] ml-6">
                  {sgsGroups.map((group, gi) => (
                    <div key={gi}>
                      {group.title && (
                        <p className="px-4 pt-2.5 pb-1 text-[9px] font-semibold uppercase tracking-wider text-[hsl(220,15%,38%)]">
                          {group.title}
                        </p>
                      )}
                      <div className="space-y-0.5">
                        {group.items.map(item => <SidebarLink key={item.path} {...item} indent />)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="pt-3">
            {!sidebarCollapsed && <p className="px-4 pt-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[hsl(220,15%,40%)]">Sistema</p>}
            {(userRole === "administrador" || userPermissions.configuracoes) && (
              <>
                <SidebarLink icon={Users} label="Usuários" path="/admin/config?tab=usuarios" />
                <SidebarLink icon={Settings} label="Configurações" path="/admin/config" />
              </>
            )}
            <SidebarLink icon={HelpCircle} label="Ajuda" path="/admin/ajuda" />
          </div>
        </nav>

        {/* User */}
        <div className={`border-t border-white/[0.08] p-3 ${sidebarCollapsed ? "flex justify-center" : ""}`}>
          <div className="flex items-center gap-3 px-3 py-2">
            <div className={`w-8 h-8 rounded-full bg-[hsl(217,91%,60%)] flex items-center justify-center text-white font-bold text-xs shrink-0 ${sidebarCollapsed ? "cursor-pointer" : ""}`}
              onClick={() => sidebarCollapsed && setSidebarCollapsed(false)}>
              {userInitials}
            </div>
            {!sidebarCollapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white/80 truncate">{user?.email || "Admin"}</p>
                  <p className="text-[10px] text-[hsl(220,15%,45%)] capitalize">{userRole}</p>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={async () => { await signOut(); navigate("/admin/login"); }}
                      className="p-1.5 rounded-lg text-[hsl(220,15%,50%)] hover:text-white hover:bg-white/[0.08] transition-colors"
                    >
                      <LogOut size={16} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Sair do Sistema</p>
                  </TooltipContent>
                </Tooltip>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* === MAIN === */}
      <main className={`flex-1 ${sidebarCollapsed ? "lg:ml-[80px]" : "lg:ml-[260px]"} min-h-screen flex flex-col transition-all duration-200`}>
        {/* Header */}
        <header className="bg-white border-b border-[hsl(220,20%,92%)] px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-[0_1px_3px_hsl(220,20%,90%)]">
          <div className="flex items-center gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={() => {
                    if (window.innerWidth >= 1024) {
                      setSidebarCollapsed(!sidebarCollapsed);
                    } else {
                      setSidebarOpen(true);
                    }
                  }} 
                  className="p-1.5 rounded-lg text-[hsl(220,15%,40%)] hover:bg-[hsl(220,20%,96%)]"
                >
                  <Menu size={22} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{sidebarCollapsed ? "Expandir Menu" : "Recolher Menu"}</p>
              </TooltipContent>
            </Tooltip>

            <div className="hidden sm:flex items-center gap-1.5 text-xs text-[hsl(220,15%,55%)]">
              {breadcrumbs.map((crumb, i) => (
                <span key={crumb.path} className="flex items-center gap-1.5">
                  {i > 0 && <ChevronRight size={12} className="text-[hsl(220,15%,75%)]" />}
                  {i === breadcrumbs.length - 1 ? (
                    <span className="font-medium text-[hsl(220,25%,20%)]">{crumb.label}</span>
                  ) : (
                    <Link to={crumb.path} className="hover:text-[hsl(217,91%,60%)] transition-colors">{crumb.label}</Link>
                  )}
                </span>
              ))}
            </div>
            <h1 className="sm:hidden font-display text-lg font-bold text-[hsl(220,25%,18%)]">{title}</h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setNotifOpen(!notifOpen)}
                    className={`relative p-2 rounded-lg transition-colors ${notifOpen ? "bg-[hsl(220,20%,94%)] text-[hsl(220,25%,20%)]" : "text-[hsl(220,15%,50%)] hover:text-[hsl(220,25%,20%)] hover:bg-[hsl(220,20%,96%)]"}`}
                  >
                    <Bell size={19} />
                    {activeNotifs.length > 0 && (
                  <span className={`absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 rounded-full text-[9px] text-white flex items-center justify-center font-bold ${errorCount > 0 ? "bg-red-500" : "bg-amber-500"}`}>
                    {activeNotifs.length}
                  </span>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Notificações</p>
              </TooltipContent>
            </Tooltip>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-[hsl(220,20%,92%)] rounded-xl shadow-xl overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-[hsl(220,20%,94%)] flex items-center justify-between bg-[hsl(220,20%,98%)]">
                    <h3 className="font-semibold text-[hsl(220,25%,18%)] text-sm">Notificações</h3>
                    {activeNotifs.length > 0 && (
                      <button onClick={dismissAll} className="text-xs text-[hsl(217,91%,60%)] hover:underline font-medium">Limpar tudo</button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {activeNotifs.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <Check size={32} className="mx-auto text-[hsl(152,60%,42%)] mb-2" />
                        <p className="text-sm text-[hsl(220,15%,55%)]">Tudo em ordem!</p>
                      </div>
                    ) : (
                      activeNotifs.map((n) => {
                        const style = typeStyles[n.type];
                        const Icon = style.icon;
                        return (
                          <div
                            key={n.id}
                            className={`px-4 py-3 border-l-[3px] ${style.border} ${style.bg} hover:brightness-[0.97] transition-all cursor-pointer flex gap-3 items-start`}
                            onClick={() => { if (n.link) navigate(n.link); setNotifOpen(false); }}
                          >
                            <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${style.dot}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-[hsl(220,25%,18%)]">{n.title}</p>
                              <p className="text-xs text-[hsl(220,15%,50%)] mt-0.5">{n.message}</p>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); dismissNotif(n.id); }}
                              className="p-1 rounded hover:bg-black/5 transition-colors shrink-0"
                            >
                              <X size={12} className="text-[hsl(220,15%,60%)]" />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="hidden sm:block h-6 w-px bg-[hsl(220,20%,90%)]" />
            <div className="hidden sm:flex items-center gap-2 pl-1">
              <div className="w-8 h-8 rounded-full bg-[hsl(217,91%,60%)] flex items-center justify-center text-white font-bold text-xs">
                {userInitials}
              </div>
            </div>
          </div>
        </header>

        {/* Title bar */}
        <div className="hidden sm:block px-6 pt-5 pb-1">
          <h1 className="font-display text-xl font-bold text-[hsl(220,25%,18%)] tracking-tight">{title}</h1>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 sm:p-6">
          {children}
        </div>
      </main>
      </div>
    </TooltipProvider>
  );
};

export default AdminLayout;
