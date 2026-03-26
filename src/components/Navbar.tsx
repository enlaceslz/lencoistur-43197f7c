import { MapPin, Phone, Menu, X } from "lucide-react";
import { useState } from "react";

const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-foreground/10 backdrop-blur-md border-b border-white/10">
      <div className="container mx-auto flex items-center justify-between py-4 px-4 md:px-8">
        <a href="/" className="font-display text-xl md:text-2xl font-bold text-primary-foreground tracking-wide">
          Lençóis<span className="text-secondary">Experience</span>
        </a>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-primary-foreground/90">
          <a href="#passeios" className="hover:text-secondary transition-colors">Passeios</a>
          <a href="#como-funciona" className="hover:text-secondary transition-colors">Como Funciona</a>
          <a href="#parceiros" className="hover:text-secondary transition-colors">Parceiros</a>
          <a href="#contato" className="hover:text-secondary transition-colors">Contato</a>
          <button className="bg-secondary hover:bg-secondary/90 text-secondary-foreground px-5 py-2.5 rounded-lg font-semibold transition-colors">
            Reservar Agora
          </button>
        </div>

        <button onClick={() => setOpen(!open)} className="md:hidden text-primary-foreground">
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-foreground/95 backdrop-blur-lg border-t border-white/10 px-6 py-6 flex flex-col gap-4 text-primary-foreground">
          <a href="#passeios" onClick={() => setOpen(false)} className="py-2">Passeios</a>
          <a href="#como-funciona" onClick={() => setOpen(false)} className="py-2">Como Funciona</a>
          <a href="#parceiros" onClick={() => setOpen(false)} className="py-2">Parceiros</a>
          <a href="#contato" onClick={() => setOpen(false)} className="py-2">Contato</a>
          <button className="bg-secondary text-secondary-foreground px-5 py-3 rounded-lg font-semibold mt-2">
            Reservar Agora
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
