import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users, UserPlus, DollarSign, Smartphone } from "lucide-react";

interface StatsProps {
  totalCustomers: number;
  newThisMonth: number;
  totalRevenue: number;
  averageTicket: number;
  fmt: (v: number) => string;
}

const CustomerStats = ({ totalCustomers, newThisMonth, totalRevenue, averageTicket, fmt }: StatsProps) => {
  const stats = [
    { label: "Total de Clientes", value: totalCustomers.toString(), icon: Users, color: "text-primary" },
    { label: "Novos (Mês)", value: newThisMonth.toString(), icon: UserPlus, color: "text-purple-600" },
    { label: "Receita Total", value: fmt(totalRevenue), icon: DollarSign, color: "text-blue-600" },
    { label: "Ticket Médio", value: fmt(averageTicket), icon: Smartphone, color: "text-amber-600" },
    { label: "Taxa Retenção", value: "82%", icon: Users, color: "text-teal-600" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s) => (
        <Card key={s.label} className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center gap-4">
            <div className={`p-3 rounded-xl bg-muted/50 ${s.color}`}>
              <s.icon size={22} />
            </div>
            <div>
              <p className="text-2xl font-black text-foreground">{s.value}</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{s.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default CustomerStats;
