import { useState } from "react";
import { Link } from "react-router-dom";
import { transferRoutes } from "@/data/transfers";
import { ArrowRight, Clock, MapPin, Users, Car, Ship, ChevronDown } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const TransfersPage = () => {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [passengers, setPassengers] = useState(1);

  const origins = [...new Set(transferRoutes.map((r) => r.origin))];
  const destinations = origin
    ? [...new Set(transferRoutes.filter((r) => r.origin === origin).map((r) => r.destination))]
    : [...new Set(transferRoutes.map((r) => r.destination))];

  const filtered = transferRoutes.filter((r) => {
    if (origin && r.origin !== origin) return false;
    if (destination && r.destination !== destination) return false;
    return true;
  });

  const getIcon = (vehicle: string) => {
    if (vehicle.toLowerCase().includes("lancha") || vehicle.toLowerCase().includes("voadeira") || vehicle.toLowerCase().includes("barco"))
      return Ship;
    return Car;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-24 pb-10 bg-gradient-sand">
        <div className="container mx-auto px-4">
          <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-3">Translados</h1>
          <p className="text-muted-foreground text-lg">Transporte seguro e confortável entre os principais destinos</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        {/* Search */}
        <div className="bg-card border border-border rounded-2xl p-5 mb-10 grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Origem</label>
            <select
              value={origin}
              onChange={(e) => { setOrigin(e.target.value); setDestination(""); }}
              className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground text-sm outline-none appearance-none"
            >
              <option value="">Todas</option>
              {origins.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            <ChevronDown size={16} className="absolute right-3 bottom-3.5 text-muted-foreground pointer-events-none" />
          </div>
          <div className="relative">
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Destino</label>
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground text-sm outline-none appearance-none"
            >
              <option value="">Todos</option>
              {destinations.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <ChevronDown size={16} className="absolute right-3 bottom-3.5 text-muted-foreground pointer-events-none" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Data</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground text-sm outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Passageiros</label>
            <input
              type="number"
              min={1}
              max={20}
              value={passengers}
              onChange={(e) => setPassengers(Number(e.target.value))}
              className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground text-sm outline-none"
            />
          </div>
          <div className="flex items-end">
            <button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-xl font-semibold transition-colors">
              Buscar Translados
            </button>
          </div>
        </div>

        {/* Results */}
        <p className="text-muted-foreground text-sm mb-6">{filtered.length} rota(s) disponível(is)</p>

        <div className="space-y-4">
          {filtered.map((route) => {
            const Icon = getIcon(route.vehicleType);
            return (
              <div key={route.id} className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  {/* Route */}
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-xl bg-ocean-light flex items-center justify-center shrink-0">
                      <Icon size={24} className="text-primary" />
                    </div>
                    <div className="flex items-center gap-3 flex-1">
                      <div>
                        <p className="font-display font-bold text-foreground">{route.origin}</p>
                        <p className="text-xs text-muted-foreground">Partida</p>
                      </div>
                      <ArrowRight size={20} className="text-secondary shrink-0" />
                      <div>
                        <p className="font-display font-bold text-foreground">{route.destination}</p>
                        <p className="text-xs text-muted-foreground">Chegada</p>
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5"><Clock size={14} className="text-primary" />{route.duration}</span>
                    <span className="flex items-center gap-1.5"><MapPin size={14} className="text-primary" />{route.distance}</span>
                    <span className="flex items-center gap-1.5"><Users size={14} className="text-primary" />{route.seats} vagas</span>
                  </div>

                  {/* Price & Book */}
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{route.vehicleType}</p>
                      <p className="font-display text-2xl font-bold text-primary">R$ {route.price}</p>
                      <p className="text-xs text-muted-foreground">por pessoa</p>
                    </div>
                    <Link
                      to={`/checkout?type=transfer&transfer=${route.id}&pax=${passengers}&date=${date}`}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl font-semibold transition-colors whitespace-nowrap"
                    >
                      Reservar
                    </Link>
                  </div>
                </div>

                {/* Departures */}
                <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-2">
                  <span className="text-xs text-muted-foreground mr-2">Horários:</span>
                  {route.departures.map((dep) => (
                    <span key={dep} className="text-xs bg-muted text-foreground px-3 py-1.5 rounded-full font-medium">
                      {dep}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default TransfersPage;
