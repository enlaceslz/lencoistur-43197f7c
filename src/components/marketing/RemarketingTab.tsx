import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Clock, TrendingUp, Copy, BarChart3 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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

const RemarketingTab = ({ rules }: RemarketingTabProps) => {
  const [open, setOpen] = useState(false);
  const [trigger, setTrigger] = useState("");
  const [delay, setDelay] = useState("");
  const [channel, setChannel] = useState("");
  const [message, setMessage] = useState("");

  const handleCreate = () => {
    if (!trigger.trim() || !message.trim()) {
      toast.error("Preencha o gatilho e a mensagem da automação.");
      return;
    }
    toast.success(`Automação "${trigger}" criada com sucesso!`);
    setOpen(false);
    setTrigger("");
    setDelay("");
    setChannel("");
    setMessage("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-lg text-foreground">Automações de Remarketing</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl">
              <Plus size={16} /> Nova Automação
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-display">Nova Automação de Remarketing</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Gatilho</Label>
                <Select value={trigger} onValueChange={setTrigger}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o gatilho" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Carrinho abandonado">Carrinho abandonado</SelectItem>
                    <SelectItem value="Visitou passeio 2x sem reservar">Visitou passeio 2x sem reservar</SelectItem>
                    <SelectItem value="Reserva concluída">Reserva concluída</SelectItem>
                    <SelectItem value="Pós-passeio (7 dias)">Pós-passeio (7 dias)</SelectItem>
                    <SelectItem value="Aniversário do cliente">Aniversário do cliente</SelectItem>
                    <SelectItem value="Inativo 30 dias">Inativo há 30 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rm-delay">Delay</Label>
                  <Input id="rm-delay" placeholder="Ex: 30 min, 24h, 7 dias" value={delay} onChange={(e) => setDelay(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Canal</Label>
                  <Select value={channel} onValueChange={setChannel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Canal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                      <SelectItem value="E-mail">E-mail</SelectItem>
                      <SelectItem value="E-mail + WhatsApp">E-mail + WhatsApp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rm-message">Mensagem</Label>
                <Textarea id="rm-message" rows={4} placeholder="Olá {nome}! ..." value={message} onChange={(e) => setMessage(e.target.value)} />
                <p className="text-xs text-muted-foreground">Use {"{nome}"}, {"{passeio}"}, {"{link}"} como variáveis.</p>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button onClick={handleCreate}>Criar Automação</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
};

export default RemarketingTab;
