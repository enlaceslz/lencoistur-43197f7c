import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 ${isHome ? "bg-foreground/10" : "bg-card/95 shadow-sm"} backdrop-blur-md border-b ${isHome ? "border-white/10" : "border-border"}`}>
      <div className="container mx-auto flex items-center justify-between py-4 px-4 md:px-8">
        <Link to="/" className={`font-display text-xl md:text-2xl font-bold tracking-wide ${isHome ? "text-primary-foreground" : "text-foreground"}`}>
          Lençóis<span className="text-secondary">Experience</span>
        </Link>

        <div className={`hidden md:flex items-center gap-8 text-sm font-medium ${isHome ? "text-primary-foreground/90" : "text-foreground/80"}`}>
          <Link to="/passeios" className="hover:text-secondary transition-colors">Passeios</Link>
          <Link to="/translados" className="hover:text-secondary transition-colors">Translados</Link>
          {isHome && (
            <>
              <a href="#como-funciona" className="hover:text-secondary transition-colors">Como Funciona</a>
              <a href="#parceiros" className="hover:text-secondary transition-colors">Parceiros</a>
            </>
          )}
          <Link to="/passeios" className="bg-secondary hover:bg-secondary/90 text-secondary-foreground px-5 py-2.5 rounded-lg font-semibold transition-colors">
            Reservar Agora
          </Link>
        </div>

        <button onClick={() => setOpen(!open)} className={`md:hidden ${isHome ? "text-primary-foreground" : "text-foreground"}`}>
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <div className={`md:hidden ${isHome ? "bg-foreground/95 text-primary-foreground" : "bg-card text-foreground"} backdrop-blur-lg border-t border-border px-6 py-6 flex flex-col gap-4`}>
          <Link to="/passeios" onClick={() => setOpen(false)} className="py-2">Passeios</Link>
          <Link to="/translados" onClick={() => setOpen(false)} className="py-2">Translados</Link>
          <Link to="/" onClick={() => setOpen(false)} className="py-2">Início</Link>
          <Link to="/passeios" onClick={() => setOpen(false)} className="bg-secondary text-secondary-foreground px-5 py-3 rounded-lg font-semibold mt-2 text-center">
            Reservar Agora
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
