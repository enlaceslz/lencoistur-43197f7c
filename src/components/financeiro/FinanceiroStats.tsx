import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { motion } from "framer-motion";

interface StatItem {
  label: string;
  value: string;
  change: string;
  up: boolean;
  icon: React.ElementType;
  color?: string;
}

export default function FinanceiroStats({ stats }: { stats: StatItem[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((s, idx) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          className="glass-card admin-card-hover rounded-[2rem] p-6 relative overflow-hidden group"
        >
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
          
          <div className="flex items-center justify-between mb-6">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-lg bg-primary/10 ${s.color || "text-primary"} shadow-primary/10`}>
              <s.icon size={26} strokeWidth={2.5} />
            </div>
            {s.change && (
              <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                s.up ? "bg-admin-success-soft text-admin-success" : "bg-red-50 text-red-500"
              }`}>
                {s.change}
              </div>
            )}
          </div>
          
          <div className="relative">
            <p className="text-2xl font-black text-foreground tracking-tighter group-hover:translate-x-1 transition-transform">{s.value}</p>
            <p className="text-[10px] font-black text-muted-foreground mt-1 uppercase tracking-[0.2em]">{s.label}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
