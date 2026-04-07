import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  Home, Compass, Car, Users, UserCheck, CreditCard, Settings,
  LogOut, Star, ShoppingCart, Menu, X, Bell, Megaphone, Bot,
  Shield, AlertTriangle, Activity, ClipboardCheck, Truck, UserCheck2,
  ChevronDown, FileText
} from "lucide-react";

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
];

const sgsItems = [
  { icon: Shield, label: "Dashboard", path: "/admin/sgs" },
  { icon: AlertTriangle, label: "Matriz de Riscos", path: "/admin/sgs/riscos" },
  { icon: Activity, label: "Incidentes", path: "/admin/sgs/incidentes" },
  { icon: ClipboardCheck, label: "Ações Corretivas", path: "/admin/sgs/acoes" },
  { icon: UserCheck2, label: "Equipe (ISO 21102)", path: "/admin/sgs/equipe" },
  { icon: ClipboardCheck, label: "Auditorias", path: "/admin/sgs/auditorias" },
  { icon: Truck, label: "Fornecedores", path: "/admin/sgs/fornecedores" },
  { icon: FileText, label: "Termos de Risco", path: "/admin/sgs/termos" },
  { icon: Shield, label: "Resumos", path: "/admin/sgs/briefings" },
  { icon: Star, label: "Pesquisas", path: "/admin/sgs/pesquisas" },
];

const AdminLayout = ({ children, title }: { children: React.ReactNode; title: string }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sgsOpen, setSgsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  const isSgsActive = location.pathname.startsWith("/admin/sgs");

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
          <div className="flex items-center gap-4">
            <button className="relative text-muted-foreground hover:text-foreground transition-colors">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full text-[10px] text-primary-foreground flex items-center justify-center font-bold">3</span>
            </button>
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
              AD
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
