import { Card, CardContent } from "@/components/ui/card";
import { Users, Megaphone, TrendingUp, RefreshCw } from "lucide-react";

interface StatItem {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}

interface MarketingStatsProps {
  stats: StatItem[];
}

const MarketingStats = ({ stats }: MarketingStatsProps) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    {stats.map((s) => (
      <Card key={s.label} className="border-border">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
            <s.icon size={20} className={s.color} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-xl font-bold text-foreground font-display">{s.value}</p>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

export default MarketingStats;
