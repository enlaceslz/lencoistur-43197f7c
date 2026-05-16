import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

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
      {stats.map((s) => (
        <div
          key={s.label}
          className="bg-white border border-slate-200 rounded-lg p-6 relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 rounded bg-slate-100 flex items-center justify-center border border-slate-200 ${s.color || "text-slate-600"}`}>
              <s.icon size={24} />
            </div>
            {s.change && (
              <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                s.up ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"
              }`}>
                {s.change}
              </div>
            )}
          </div>
          
          <div>
            <p className="text-2xl font-bold text-slate-900 tracking-tight">{s.value}</p>
            <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-wider">{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
