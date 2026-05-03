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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s, idx) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
        >
          <Card className="hover:shadow-md transition-shadow border-none bg-gradient-to-br from-card to-muted/50 overflow-hidden group">
            <CardContent className="p-5 relative">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-3 rounded-xl bg-muted/50 ${s.color || "text-primary"} group-hover:bg-primary group-hover:text-white transition-all duration-300`}>
                  <s.icon size={20} />
                </div>
                {s.change && (
                  <span className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-lg border ${
                    s.up 
                      ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30" 
                      : "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-900/30"
                  }`}>
                    {s.change}
                  </span>
                )}
              </div>
              <p className="text-2xl font-black text-foreground tracking-tight">{s.value}</p>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1 opacity-80">{s.label}</p>
              
              {/* Decorative background shape */}
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <s.icon size={80} />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
