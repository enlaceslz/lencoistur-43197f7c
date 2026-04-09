import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

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
      {stats.map((s) => (
        <Card key={s.label}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-xl bg-muted text-primary"><s.icon size={20} /></div>
              {s.change && (
                <span className={`flex items-center gap-1 text-xs font-semibold ${s.up ? "text-green-600" : "text-amber-600"}`}>
                  {s.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {s.change}
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
