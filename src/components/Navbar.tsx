import { Menu, X, Compass, Car, Shield, User, Bell, LogOut, LayoutDashboard, Settings } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";
  const { t } = useTranslation();
  const { site: settings } = useSiteSettings();
  const { user, signOut, isAdmin } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navTheme = isHome && !scrolled && !open ? "light" : "dark";

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      isHome && !scrolled && !open 
        ? "bg-transparent py-7" 
        : "bg-white/70 backdrop-blur-xl border-b border-border/40 py-4 shadow-sm"
    }`}>
      <div className="container mx-auto flex items-center justify-between px-6 md:px-12">
        <Link to="/" className="flex items-center gap-3 group">
          {settings?.logoUrl ? (
            <img 
              src={settings.logoUrl} 
              alt={settings.titulo || "Lençóis Tour"} 
              className={`h-10 md:h-14 w-auto object-contain transition-all duration-500 group-hover:scale-105 ${navTheme === "light" ? "brightness-0 invert" : ""}`}
            />
          ) : (
            <div className={`font-display text-2xl md:text-3xl font-black tracking-tighter transition-colors duration-500 ${navTheme === "light" ? "text-white" : "text-foreground"}`}>
              Lençóis<span className="text-primary">Tour</span>
            </div>
          )}
        </Link>

        <div className={`hidden lg:flex items-center gap-10 text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-500 ${navTheme === "light" ? "text-white/90" : "text-foreground/70"}`}>
          <Link to="/passeios" className="hover:text-primary transition-all hover:translate-y-[-1px] flex items-center gap-2">
            <Compass size={14} className="opacity-50" /> {t("nav.tours")}
          </Link>
          <Link to="/translados" className="hover:text-primary transition-all hover:translate-y-[-1px] flex items-center gap-2">
            <Car size={14} className="opacity-50" /> {t("nav.transfers")}
          </Link>
          <Link to="/seguranca" className="hover:text-primary transition-all hover:translate-y-[-1px] flex items-center gap-2">
            <Shield size={14} className="opacity-50" /> {t("nav.safety")}
          </Link>
          <Link to="/minhas-reservas" className="hover:text-primary transition-all hover:translate-y-[-1px] flex items-center gap-2">
            <User size={14} className="opacity-50" /> {t("nav.myBookings")}
          </Link>
          
          <div className="flex items-center gap-6 pl-6 border-l border-current/10">
            {user && (
              <div className="flex items-center gap-4 mr-2">
                {/* Notificações */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative hover:bg-primary/10 rounded-full">
                      <Bell size={18} />
                      {unreadCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-destructive text-destructive-foreground border-2 border-white">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden rounded-2xl shadow-2xl border-border/40">
                    <div className="p-4 bg-primary/5 flex items-center justify-between border-b border-border/40">
                      <DropdownMenuLabel className="font-display font-bold p-0">Notificações</DropdownMenuLabel>
                      {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-auto p-0 text-[10px] uppercase font-bold text-primary hover:bg-transparent">
                          Marcar todas como lidas
                        </Button>
                      )}
                    </div>
                    <ScrollArea className="h-[300px]">
                      {notifications.length > 0 ? (
                        <div className="flex flex-col">
                          {notifications.map((n) => (
                            <div 
                              key={n.id} 
                              onClick={() => {
                                markAsRead(n.id);
                                if (n.link) navigate(n.link);
                              }}
                              className={`p-4 border-b border-border/20 cursor-pointer hover:bg-muted/50 transition-colors ${!n.read ? "bg-primary/5" : ""}`}
                            >
                              <div className="flex justify-between items-start mb-1">
                                <h4 className={`text-xs font-bold ${!n.read ? "text-primary" : "text-foreground"}`}>{n.title}</h4>
                                <span className="text-[9px] text-muted-foreground">
                                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                                </span>
                              </div>
                              <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{n.message}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-10 text-center flex flex-col items-center gap-2">
                          <Bell size={24} className="text-muted-foreground/30" />
                          <p className="text-xs text-muted-foreground">Nenhuma notificação por aqui.</p>
                        </div>
                      )}
                    </ScrollArea>
                    <div className="p-2 bg-muted/30 text-center border-t border-border/40">
                      <Button variant="ghost" size="sm" className="w-full text-[10px] uppercase font-bold text-muted-foreground hover:bg-transparent" onClick={() => navigate("/minhas-reservas")}>
                        Ver todas as reservas
                      </Button>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Perfil */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="p-0 hover:bg-transparent">
                      <Avatar className="h-9 w-9 border-2 border-primary/20 p-0.5 transition-transform hover:scale-105">
                        <AvatarImage src={user?.user_metadata?.avatar_url} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                          {user?.email?.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-2xl border-border/40">
                    <div className="px-2 py-3 mb-1">
                      <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 mb-1">Minha Conta</p>
                      <p className="text-sm font-bold truncate">{user?.email}</p>
                    </div>
                    <DropdownMenuSeparator className="bg-border/40" />
                    {isAdmin && (
                      <DropdownMenuItem onClick={() => navigate("/admin")} className="rounded-xl py-2.5 cursor-pointer focus:bg-primary/10 focus:text-primary">
                        <LayoutDashboard size={16} className="mr-2" />
                        <span className="font-bold text-xs uppercase tracking-wider">Painel Admin</span>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => navigate("/minhas-reservas")} className="rounded-xl py-2.5 cursor-pointer">
                      <User size={16} className="mr-2" />
                      <span className="font-bold text-xs uppercase tracking-wider">Minhas Reservas</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/admin/config")} className="rounded-xl py-2.5 cursor-pointer">
                      <Settings size={16} className="mr-2" />
                      <span className="font-bold text-xs uppercase tracking-wider">Configurações</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border/40" />
                    <DropdownMenuItem onClick={signOut} className="rounded-xl py-2.5 cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
                      <LogOut size={16} className="mr-2" />
                      <span className="font-bold text-xs uppercase tracking-wider">Sair</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
            
            <LanguageSwitcher variant={navTheme === "light" ? "light" : "dark"} />
            {!user && (
              <Link to="/admin/login" className="bg-primary hover:bg-primary/90 text-white px-7 py-3.5 rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 ml-4">
                Entrar
              </Link>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 lg:hidden">
          <LanguageSwitcher variant={navTheme === "light" ? "light" : "dark"} />
          <button onClick={() => setOpen(!open)} className={`p-2 rounded-xl transition-colors ${navTheme === "light" ? "text-white hover:bg-white/10" : "text-foreground hover:bg-muted"}`}>
            {open ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="lg:hidden fixed inset-x-0 top-[100%] h-screen bg-white/95 backdrop-blur-2xl border-t border-border/40 p-8 flex flex-col gap-6 animate-in slide-in-from-top duration-500">
          <Link to="/passeios" onClick={() => setOpen(false)} className="text-lg font-black uppercase tracking-[0.2em] text-foreground border-b border-border/50 pb-4">{t("nav.tours")}</Link>
          <Link to="/translados" onClick={() => setOpen(false)} className="text-lg font-black uppercase tracking-[0.2em] text-foreground border-b border-border/50 pb-4">{t("nav.transfers")}</Link>
          <Link to="/seguranca" onClick={() => setOpen(false)} className="text-lg font-black uppercase tracking-[0.2em] text-foreground border-b border-border/50 pb-4">{t("nav.safety")}</Link>
          <Link to="/minhas-reservas" onClick={() => setOpen(false)} className="text-lg font-black uppercase tracking-[0.2em] text-foreground border-b border-border/50 pb-4">{t("nav.myBookings")}</Link>
          {!user ? (
            <Link to="/admin/login" onClick={() => setOpen(false)} className="bg-primary text-white p-5 rounded-2xl font-black text-xs uppercase tracking-widest text-center shadow-xl shadow-primary/20 mt-4">
              Entrar
            </Link>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-2xl">
                <Avatar className="h-12 w-12 border-2 border-primary/20">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {user?.email?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{user?.email}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Minha Conta</p>
                </div>
              </div>
              
              {isAdmin && (
                <Link to="/admin" onClick={() => setOpen(false)} className="flex items-center gap-3 text-lg font-black uppercase tracking-[0.2em] text-primary border-b border-border/50 pb-4">
                  <LayoutDashboard size={20} /> Painel Admin
                </Link>
              )}
              
              <Link to="/minhas-reservas" onClick={() => setOpen(false)} className="flex items-center gap-3 text-lg font-black uppercase tracking-[0.2em] text-foreground border-b border-border/50 pb-4">
                <User size={20} /> Minhas Reservas
              </Link>

              <Link to="/admin/config" onClick={() => setOpen(false)} className="flex items-center gap-3 text-lg font-black uppercase tracking-[0.2em] text-foreground border-b border-border/50 pb-4">
                <Settings size={20} /> Configurações
              </Link>
              
              <Button onClick={() => { setOpen(false); signOut(); }} variant="destructive" className="p-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl mt-4 w-full flex items-center justify-center gap-2">
                <LogOut size={18} /> Sair
              </Button>
            </div>
          )}

        </div>
      )}
    </nav>
  );
};

export default Navbar;
