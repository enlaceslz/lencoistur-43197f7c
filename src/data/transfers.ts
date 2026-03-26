export interface TransferRoute {
  id: string;
  origin: string;
  destination: string;
  duration: string;
  distance: string;
  price: number;
  vehicleType: string;
  seats: number;
  departures: string[];
}

export const transferRoutes: TransferRoute[] = [
  {
    id: "t1",
    origin: "São Luís",
    destination: "Barreirinhas",
    duration: "4h30",
    distance: "260 km",
    price: 120,
    vehicleType: "Van Executiva",
    seats: 15,
    departures: ["06:00", "08:00", "12:00", "16:00"],
  },
  {
    id: "t2",
    origin: "Barreirinhas",
    destination: "São Luís",
    duration: "4h30",
    distance: "260 km",
    price: 120,
    vehicleType: "Van Executiva",
    seats: 15,
    departures: ["06:00", "10:00", "14:00", "18:00"],
  },
  {
    id: "t3",
    origin: "Barreirinhas",
    destination: "Santo Amaro",
    duration: "3h",
    distance: "90 km",
    price: 180,
    vehicleType: "Toyota 4x4",
    seats: 8,
    departures: ["07:00", "13:00"],
  },
  {
    id: "t4",
    origin: "Santo Amaro",
    destination: "Barreirinhas",
    duration: "3h",
    distance: "90 km",
    price: 180,
    vehicleType: "Toyota 4x4",
    seats: 8,
    departures: ["08:00", "15:00"],
  },
  {
    id: "t5",
    origin: "Barreirinhas",
    destination: "Atins",
    duration: "1h30",
    distance: "Barco",
    price: 80,
    vehicleType: "Lancha Rápida",
    seats: 12,
    departures: ["08:00", "10:00", "14:00"],
  },
  {
    id: "t6",
    origin: "Atins",
    destination: "Barreirinhas",
    duration: "1h30",
    distance: "Barco",
    price: 80,
    vehicleType: "Lancha Rápida",
    seats: 12,
    departures: ["09:00", "13:00", "17:00"],
  },
  {
    id: "t7",
    origin: "São Luís (Aeroporto)",
    destination: "Barreirinhas",
    duration: "4h",
    distance: "260 km",
    price: 350,
    vehicleType: "SUV Privativo",
    seats: 4,
    departures: ["Sob demanda"],
  },
  {
    id: "t8",
    origin: "Barreirinhas",
    destination: "Caburé",
    duration: "2h",
    distance: "Barco",
    price: 60,
    vehicleType: "Voadeira",
    seats: 10,
    departures: ["08:30", "14:00"],
  },
];
