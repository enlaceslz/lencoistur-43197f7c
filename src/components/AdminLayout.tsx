import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  Home, Compass, Car, Users, UserCheck, CreditCard, Settings,
  LogOut, Star, ShoppingCart, Menu, X, Bell, Megaphone, Bot,
  Shield, AlertTriangle, Activity, ClipboardCheck, Truck, UserCheck2,
  ChevronDown, FileText, Check, Building2, Map
} from "lucide-react";

interface Notification {
  id: string;
  type: "warning" | "error" | "info";
  title: string;
  message: string;
  link?: string;
  time: string;
}

const mainItems = [
  { icon: Home, label: "Dashboard", path: "/admin" },
  { icon: Compass, label: "Passeios", path: "/admin/passeios" },
  { icon: ShoppingCart, label: "Reservas", path: "/admin/reservas" },
  { icon: Car, label: "Translados", path: "/admin/translados" },
  { icon: Users, label: "Clientes (CRM)", path: "/admin/crm" },
  { icon: UserCheck, label: "Parceiros", path: "/admin/parceiros" },
  { icon: CreditCard, label: "Financeiro", path: "/admin/financeiro" },
  { icon: Star, label: "Avaliações", path: "/admin/avaliacoes" },
  { icon: Megaphone, label: "Marketing", path: "/admin/marketing" },
  { icon: Bot, label: "Inteligência Artificial", path: "/admin/ia" },
  { icon: FileText, label: "Documentação", path: "/admin/documentos" },
];

const sgsItems = [
  { icon: Shield, label: "Dashboard", path: "/admin/sgs" },
  { icon: Building2, label: "Empresa", path: "/admin/sgs/empresa" },
  { icon: Car, label: "Veículos / Frota", path: "/admin/sgs/veiculos" },
  { icon: UserCheck2, label: "Condutores", path: "/admin/sgs/condutores" },
  { icon: Users, label: "Visitantes", path: "/admin/sgs/condutores-visitantes" },
  { icon: AlertTriangle, label: "Matriz de Riscos", path: "/admin/sgs/riscos" },
  { icon: ClipboardCheck, label: "Checklists", path: "/admin/sgs/checklists" },
  { icon: Activity, label: "Ocorrências", path: "/admin/sgs/incidentes" },
  { icon: ClipboardCheck, label: "Ações Corretivas", path: "/admin/sgs/acoes" },
  { icon: UserCheck, label: "Equipe (ISO 21102)", path: "/admin/sgs/equipe" },
  { icon: ClipboardCheck, label: "Auditorias", path: "/admin/sgs/auditorias" },
  { icon: Truck, label: "Fornecedores", path: "/admin/sgs/fornecedores" },
  { icon: Map, label: "Rotas / Trilhas", path: "/admin/sgs/rotas" },
  { icon: FileText, label: "PGSAT (ICMBio)", path: "/admin/sgs/pgsat" },
  { icon: FileText, label: "Termos de Risco", path: "/admin/sgs/termos" },
  { icon: Shield, label: "Briefings", path: "/admin/sgs/briefings" },
  { icon: Star, label: "Pesquisas", path: "/admin/sgs/pesquisas" },
];

const AdminLayout = ({ children, title }: { children: React.ReactNode; title: string }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sgsOpen, setSgsOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const notifRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  const isSgsActive = location.pathname.startsWith("/admin/sgs");

  // Load notifications from real data
  useEffect(() => {
    const loadNotifications = async () => {
      const notifs: Notification[] = [];
      const now = new Date();
      const soon = new Date();
      soon.setDate(soon.getDate() + 30);

      try {
        // 1. Pending bookings
        const { data: pendingBookings } = await supabase
          .from("bookings")
          .select("id, booking_code, created_at")
          .eq("status", "pendente")
          .eq("payment_status", "pendente")
          .order("created_at", { ascending: false })
          .limit(5);

        if (pendingBookings?.length) {
          notifs.push({
            id: "pending_bookings",
            type: "warning",
            title: "Reservas Pendentes",
            message: `${pendingBookings.length} reserva(s) aguardando confirmação de pagamento.`,
            link: "/admin/reservas",
            time: "Agora",
          });
        }

        // 2. Overdue corrective actions
        const { data: overdueActions } = await supabase
          .from("sgs_corrective_actions")
          .select("id, action_code, due_date")
          .in("status", ["pendente", "em_andamento"])
          .lt("due_date", now.toISOString().split("T")[0]);

        if (overdueActions?.length) {
          notifs.push({
            id: "overdue_actions",
            type: "error",
            title: "Ações Corretivas Atrasadas",
            message: `${overdueActions.length} ação(ões) com prazo vencido.`,
            link: "/admin/sgs/acoes",
            time: "Urgente",
          });
        }

        // 3. Expiring documents
        const { data: expiringDocs } = await supabase
          .from("documents")
          .select("id, name, expiry_date")
          .not("expiry_date", "is", null)
          .lte("expiry_date", soon.toISOString().split("T")[0])
          .eq("status", "vigente");

        if (expiringDocs?.length) {
          const expired = expiringDocs.filter(d => new Date(d.expiry_date!) < now);
          const expiring = expiringDocs.filter(d => new Date(d.expiry_date!) >= now);
          if (expired.length) {
            notifs.push({
              id: "expired_docs",
              type: "error",
              title: "Documentos Vencidos",
              message: `${expired.length} documento(s) com validade expirada.`,
              link: "/admin/documentos",
              time: "Urgente",
            });
          }
          if (expiring.length) {
            notifs.push({
              id: "expiring_docs",
              type: "warning",
              title: "Documentos Vencendo",
              message: `${expiring.length} documento(s) vencem nos próximos 30 dias.`,
              link: "/admin/documentos",
              time: "Atenção",
            });
          }
        }

        // 4. Expired staff trainings
        const { data: expiredTrainings } = await supabase
          .from("sgs_staff_trainings")
          .select("id, training_name")
          .eq("status", "vencido");

        if (expiredTrainings?.length) {
          notifs.push({
            id: "expired_trainings",
            type: "warning",
            title: "Treinamentos Vencidos",
            message: `${expiredTrainings.length} treinamento(s) de equipe vencido(s).`,
            link: "/admin/sgs/equipe",
            time: "Atenção",
          });
        }

        // 5. Open incidents
        const { data: openIncidents } = await supabase
          .from("sgs_incidents")
          .select("id")
          .eq("status", "aberto");

        if (openIncidents?.length) {
          notifs.push({
            id: "open_incidents",
            type: "info",
            title: "Incidentes Abertos",
            message: `${openIncidents.length} incidente(s) em aberto.`,
            link: "/admin/sgs/incidentes",
            time: "Info",
          });
        }

        // 6. Blocked suppliers
        const { data: blockedSuppliers } = await supabase
          .from("sgs_supplier_compliance")
          .select("id")
          .eq("blocked", true);

        if (blockedSuppliers?.length) {
          notifs.push({
            id: "blocked_suppliers",
            type: "error",
            title: "Fornecedores Bloqueados",
            message: `${blockedSuppliers.length} fornecedor(es) bloqueado(s).`,
            link: "/admin/sgs/fornecedores",
            time: "Alerta",
          });
        }
      } catch (err) {
        console.error("Error loading notifications:", err);
      }

      setNotifications(notifs);
    };

    loadNotifications();
    const interval = setInterval(loadNotifications, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const activeNotifs = notifications.filter(n => !dismissed.has(n.id));
  const errorCount = activeNotifs.filter(n => n.type === "error").length;
  const warningCount = activeNotifs.filter(n => n.type === "warning").length;

  const dismissNotif = (id: string) => {
    setDismissed(prev => new Set(prev).add(id));
  };

  const dismissAll = () => {
    setDismissed(new Set(notifications.map(n => n.id)));
    setNotifOpen(false);
  };

  const typeStyles: Record<string, { bg: string; border: string; icon: typeof AlertTriangle }> = {
    error: { bg: "bg-destructive/10", border: "border-l-destructive", icon: AlertTriangle },
    warning: { bg: "bg-secondary/10", border: "border-l-secondary", icon: Bell },
    info: { bg: "bg-primary/10", border: "border-l-primary", icon: Activity },
  };

  const userInitials = user?.email ? user.email.substring(0, 2).toUpperCase() : "AD";

  return (
    <div className="min-h-screen bg-muted flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-6 border-b border-border">
          <Link to="/" className="font-display text-xl font-bold text-foreground">
            Lençóis<span className="text-secondary">Tour</span>
          </Link>
          <p className="text-xs text-muted-foreground mt-1">Painel Administrativo</p>
        </div>
        <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-10rem)]">
          {mainItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.label}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}

          {/* SGS Module */}
          <button
            onClick={() => setSgsOpen(!sgsOpen)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
              isSgsActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Shield size={18} />
            <span className="flex-1 text-left">SGS - Segurança</span>
            <ChevronDown size={16} className={`transition-transform ${sgsOpen || isSgsActive ? "rotate-180" : ""}`} />
          </button>
          {(sgsOpen || isSgsActive) && (
            <div className="ml-4 pl-4 border-l border-border space-y-0.5">
              {sgsItems.map((item) => {
                const active = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <item.icon size={16} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          )}

          <Link
            to="/admin/config"
            onClick={() => setSidebarOpen(false)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
              location.pathname === "/admin/config" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Settings size={18} />
            Configurações
          </Link>
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-card">
          <div className="flex items-center gap-3 px-4 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
              {userInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{user?.email || "Admin"}</p>
              <p className="text-[10px] text-muted-foreground">Administrador</p>
            </div>
          </div>
          <button
            onClick={async () => { await signOut(); navigate("/admin/login"); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-foreground/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <main className="flex-1 lg:ml-64">
        <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-foreground">
              <Menu size={24} />
            </button>
            <h1 className="font-display text-xl font-bold text-foreground">{title}</h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className={`relative p-2 rounded-xl transition-colors ${notifOpen ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
              >
                <Bell size={20} />
                {activeNotifs.length > 0 && (
                  <span className={`absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] text-primary-foreground flex items-center justify-center font-bold ${errorCount > 0 ? "bg-destructive" : "bg-secondary"}`}>
                    {activeNotifs.length}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-card border border-border rounded-2xl shadow-lg overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                    <h3 className="font-display font-bold text-foreground text-sm">Notificações</h3>
                    {activeNotifs.length > 0 && (
                      <button onClick={dismissAll} className="text-xs text-primary hover:underline font-medium">
                        Limpar tudo
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {activeNotifs.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <Check size={32} className="mx-auto text-primary mb-2" />
                        <p className="text-sm text-muted-foreground">Nenhuma notificação pendente</p>
                      </div>
                    ) : (
                      activeNotifs.map((n) => {
                        const style = typeStyles[n.type];
                        const Icon = style.icon;
                        return (
                          <div
                            key={n.id}
                            className={`px-4 py-3 border-l-4 ${style.border} ${style.bg} hover:brightness-95 transition-all cursor-pointer flex gap-3 items-start`}
                            onClick={() => {
                              if (n.link) navigate(n.link);
                              setNotifOpen(false);
                            }}
                          >
                            <Icon size={16} className="mt-0.5 shrink-0 text-foreground" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-foreground">{n.title}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-[10px] text-muted-foreground">{n.time}</span>
                              <button
                                onClick={(e) => { e.stopPropagation(); dismissNotif(n.id); }}
                                className="p-1 rounded hover:bg-muted transition-colors"
                              >
                                <X size={12} className="text-muted-foreground" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
              {userInitials}
            </div>
          </div>
        </header>

        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
