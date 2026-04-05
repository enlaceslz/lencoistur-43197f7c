import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Plus, Clock, TrendingUp, Copy, BarChart3 } from "lucide-react";

interface RemarketingRule {
  id: number;
  trigger: string;
  delay: string;
  channel: string;
  message: string;
  active: boolean;
  conversions: number;
}

interface RemarketingTabProps {
  rules: RemarketingRule[];
}

const RemarketingTab = ({ rules }: RemarketingTabProps) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h2 className="font-display font-bold text-lg text-foreground">Automações de Remarketing</h2>
      <Button className="rounded-xl">
        <Plus size={16} /> Nova Automação
      </Button>
    </div>

    <div className="grid gap-4">
      {rules.map((r) => (
        <Card key={r.id} className={`border-border transition-opacity ${!r.active ? "opacity-60" : ""}`}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="font-display font-bold text-foreground">{r.trigger}</h3>
                  <Badge variant="outline" className={r.active ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-muted text-muted-foreground"}>
                    {r.active ? "Ativa" : "Inativa"}
                  </Badge>
                  <Badge variant="outline" className="bg-muted text-muted-foreground">
                    {r.channel}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock size={14} /> Delay: {r.delay}</span>
                  <span className="flex items-center gap-1"><TrendingUp size={14} /> {r.conversions} conversões</span>
                </div>

                <div className="bg-muted rounded-xl p-3">
                  <p className="text-sm text-foreground italic">"{r.message}"</p>
                </div>
              </div>

              <div className="flex flex-col gap-2 shrink-0 items-center">
                <Switch checked={r.active} />
                <Button variant="ghost" size="icon" className="h-8 w-8" title="Métricas">
                  <BarChart3 size={16} className="text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" title="Duplicar">
                  <Copy size={16} className="text-muted-foreground" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

export default RemarketingTab;
