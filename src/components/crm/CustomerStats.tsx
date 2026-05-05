import React from "react";
import { Users, UserPlus, DollarSign, Smartphone, Target } from "lucide-react";
import { motion } from "framer-motion";

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
    { label: "Novos (Mês)", value: newThisMonth.toString(), icon: UserPlus, color: "text-purple-500" },
    { label: "Receita Total", value: fmt(totalRevenue), icon: DollarSign, color: "text-emerald-500" },
    { label: "Ticket Médio", value: fmt(averageTicket), icon: Target, color: "text-amber-500" },
    { label: "Retenção", value: "82%", icon: Smartphone, color: "text-blue-500" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {stats.map((s, idx) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          className="glass-card admin-card-hover rounded-[1.5rem] p-5 relative overflow-hidden group border border-white/20 shadow-sm"
        >
          <div className="absolute -right-2 -top-2 w-16 h-16 bg-primary/5 rounded-full blur-xl group-hover:bg-primary/10 transition-colors" />
          
          <div className="flex flex-col gap-4 relative z-10">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 bg-primary/5 ${s.color}`}>
              <s.icon size={20} strokeWidth={2.5} />
            </div>
            
            <div>
              <p className="text-xl font-black text-foreground tracking-tighter group-hover:translate-x-1 transition-transform">{s.value}</p>
              <p className="text-[9px] font-black text-muted-foreground mt-1 uppercase tracking-[0.2em]">{s.label}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default CustomerStats;
