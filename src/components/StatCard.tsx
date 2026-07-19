import { cn } from "@/lib/utils";

export interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  /** Classe completa do container do ícone (ex.: "text-white bg-blue-500" ou gradiente). */
  iconClassName?: string;
  /** Cor do blur de fundo (ex.: "bg-blue-500/5"). */
  blurClassName?: string;
  desc?: string;
  className?: string;
}

/**
 * Card de métrica reutilizável (responsabilidade única: exibir um indicador).
 * Usado em listagens administrativas no padrão "grid de 4 estatísticas".
 */
export const StatCard = ({
  label,
  value,
  icon: Icon,
  iconClassName,
  blurClassName = "bg-primary/5",
  desc,
  className,
}: StatCardProps) => {
  return (
    <div className={cn("bg-white border border-border shadow-sm rounded-lg p-6 relative overflow-hidden group", className)}>
      <div className={cn("absolute -right-4 -top-4 w-24 h-24 rounded-full blur-2xl group-hover:opacity-10 transition-all", blurClassName)} />
      <div className="flex items-center justify-between mb-4">
        <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center border shadow-sm border-border", iconClassName || "text-primary bg-slate-50")}>
          <Icon size={22} strokeWidth={2.5} />
        </div>
        {desc && (
          <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">{desc}</div>
        )}
      </div>
      <p className="text-2xl font-black text-foreground tracking-tighter">{value}</p>
      <p className="text-[10px] font-black text-muted-foreground mt-1 uppercase tracking-[0.2em]">{label}</p>
    </div>
  );
};
