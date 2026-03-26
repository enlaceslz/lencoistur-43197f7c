import { Building2, Users, Car, Compass } from "lucide-react";

const partnerTypes = [
  { icon: Building2, label: "Hotéis & Pousadas", count: "50+" },
  { icon: Compass, label: "Guias Turísticos", count: "120+" },
  { icon: Car, label: "Motoristas", count: "80+" },
  { icon: Users, label: "Agências", count: "30+" },
];

const PartnersSection = () => {
  return (
    <section id="parceiros" className="py-20 md:py-28 bg-foreground text-primary-foreground">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-secondary font-semibold tracking-widest uppercase text-sm mb-3">Para Parceiros</p>
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-6">
              Venda seus passeios<br />na maior plataforma<br />dos Lençóis
            </h2>
            <p className="text-primary-foreground/70 text-lg mb-8 max-w-lg">
              Cadastre sua agência, seus passeios e comece a vender automaticamente. Gestão completa de reservas, comissões e relatórios.
            </p>
            <button className="bg-secondary hover:bg-secondary/90 text-secondary-foreground px-8 py-4 rounded-xl font-semibold text-lg transition-colors">
              Seja um Parceiro
            </button>
          </div>

          <div className="grid grid-cols-2 gap-5">
            {partnerTypes.map((p) => (
              <div key={p.label} className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-6 text-center border border-primary-foreground/10 hover:border-secondary/50 transition-colors">
                <p.icon size={36} className="mx-auto mb-3 text-secondary" />
                <p className="text-2xl font-bold mb-1">{p.count}</p>
                <p className="text-primary-foreground/70 text-sm">{p.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PartnersSection;
