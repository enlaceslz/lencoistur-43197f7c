import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { motion } from "framer-motion";

interface StatItem {
  label: string;
  value: string;
  change: string;
  up: boolean;
  icon: React.ElementType;
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
                <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                  <s.icon size={20} />
                </div>
                {s.change && (
                  <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
                    s.up 
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                      : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                  }`}>
                    {s.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {s.change}
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-foreground tracking-tight">{s.value}</p>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-1">{s.label}</p>
              
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
