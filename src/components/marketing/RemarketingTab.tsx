import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Clock, TrendingUp, Copy, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface RemarketingRule {
  id: string;
  trigger_name: string;
  delay: string;
  channel: string;
  message: string;
  active: boolean;
  conversions: number;
}

interface RemarketingTabProps {
  rules: RemarketingRule[];
  onRefresh: () => void;
}

const RemarketingTab = ({ rules, onRefresh }: RemarketingTabProps) => {
  const [open, setOpen] = useState(false);
  const [trigger, setTrigger] = useState("");
  const [delay, setDelay] = useState("");
  const [channel, setChannel] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!trigger || !message.trim()) {
      toast.error("Preencha o gatilho e a mensagem.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("remarketing_rules").insert({
      trigger_name: trigger,
      delay: delay.trim().slice(0, 20) || "1h",
      channel: channel || "WhatsApp",
      message: message.trim().slice(0, 1000),
    });
    setSaving(false);
    if (error) toast.error("Erro ao criar automação.");
    else {
      toast.success(`Automação criada!`);
      setOpen(false);
      setTrigger(""); setDelay(""); setChannel(""); setMessage("");
      onRefresh();
    }
  };

  const handleToggle = async (id: string, current: boolean) => {
    const { error } = await supabase.from("remarketing_rules").update({ active: !current }).eq("id", id);
    if (error) toast.error("Erro ao atualizar.");
    else onRefresh();
  };

  const handleDuplicate = async (rule: RemarketingRule) => {
    const { error } = await supabase.from("remarketing_rules").insert({
      trigger_name: rule.trigger_name,
      delay: rule.delay,
      channel: rule.channel,
      message: rule.message,
      active: true,
    });
    if (error) toast.error("Erro ao duplicar.");
    else { toast.success("Automação duplicada!"); onRefresh(); }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("remarketing_rules").delete().eq("id", id);
    if (error) toast.error("Erro ao remover.");
    else { toast.success("Automação removida."); onRefresh(); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-lg text-foreground">Automações de Remarketing</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus size={16} className="mr-1" /> Nova Automação</Button></DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>Nova Automação</DialogTitle></DialogHeader>
            <div className="space-y-5 py-4">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Gatilho de Inteligência</Label>
                <Select value={trigger} onValueChange={setTrigger}>
                  <SelectTrigger className="h-11 rounded-xl border-muted-foreground/20 focus:ring-primary transition-all">
                    <SelectValue placeholder="Selecione o gatilho..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="Carrinho abandonado">🛒 Carrinho abandonado</SelectItem>
                    <SelectItem value="Visitou passeio 2x">👀 Visitou passeio 2x sem reservar</SelectItem>
                    <SelectItem value="Reserva concluída">✅ Reserva concluída</SelectItem>
                    <SelectItem value="Pós-passeio (7 dias)">🌟 Pós-passeio (Feedback 7 dias)</SelectItem>
                    <SelectItem value="Aniversário">🎂 Aniversário do cliente</SelectItem>
                    <SelectItem value="Inativo 30 dias">💤 Inativo há 30 dias</SelectItem>
                    <SelectItem value="Cliente VIP - Upgrade">💎 Upgrade para Cliente VIP</SelectItem>
                    <SelectItem value="LTV Alto - Oferta Especial">🚀 LTV Alto - Oferta de Fidelidade</SelectItem>
                    <SelectItem value="Reativação Ex-Fiel">🔄 Reativação de Cliente Fiel Sumido</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Tempo de Espera</Label>
                  <Input placeholder="Ex: 30 min, 24h, 7 dias" value={delay} onChange={(e) => setDelay(e.target.value)} maxLength={20} className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Canal de Disparo</Label>
                  <Select value={channel} onValueChange={setChannel}>
                    <SelectTrigger className="h-11 rounded-xl border-muted-foreground/20">
                      <SelectValue placeholder="Escolha o canal" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="WhatsApp">🟢 WhatsApp</SelectItem>
                      <SelectItem value="E-mail">🔵 E-mail</SelectItem>
                      <SelectItem value="WhatsApp + E-mail">🟣 Combo (WhatsApp + E-mail)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Conteúdo da Mensagem</Label>
                <Textarea 
                  rows={5} 
                  placeholder="Olá {nome}! Notamos que você é um de nossos clientes mais fiéis e preparamos algo especial..." 
                  value={message} 
                  onChange={(e) => setMessage(e.target.value)} 
                  maxLength={1000} 
                  className="rounded-xl resize-none bg-muted/20 border-muted-foreground/20 focus:ring-primary p-4"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {["{nome}", "{passeio}", "{valor_ltv}", "{link_cupom}"].map(tag => (
                    <span key={tag} className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black rounded border border-primary/20 uppercase tracking-tighter cursor-pointer hover:bg-primary hover:text-white transition-colors">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
              <Button onClick={handleCreate} disabled={saving}>Criar Automação</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-5">
        {rules.map((r) => (
          <Card key={r.id} className={`border-none shadow-sm transition-all bg-card/50 backdrop-blur-sm group hover:shadow-md ${!r.active ? "grayscale opacity-60" : ""}`}>
            <CardContent className="p-0">
              <div className="flex flex-col sm:flex-row items-stretch">
                <div className={`w-2 sm:w-3 ${r.active ? "bg-primary" : "bg-muted"} rounded-l-2xl transition-colors`} />
                <div className="flex-1 p-6 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-display font-black text-lg text-foreground tracking-tight group-hover:text-primary transition-colors">{r.trigger_name}</h3>
                        <Badge variant="outline" className={`font-black uppercase text-[10px] tracking-widest px-2.5 py-0.5 border ${r.active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-muted text-muted-foreground"}`}>
                          {r.active ? "🔥 Ativa" : "💤 Pausada"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                        <span className="flex items-center gap-1.5"><Clock size={12} className="text-primary" /> Aguardar {r.delay}</span>
                        <span className="flex items-center gap-1.5"><TrendingUp size={12} className="text-primary" /> {r.conversions} Conversões</span>
                        <span className="flex items-center gap-1.5 bg-primary/10 text-primary px-2 py-0.5 rounded-full lowercase tracking-tight">{r.channel}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-3 items-end">
                      <Switch checked={r.active} onCheckedChange={() => handleToggle(r.id, r.active)} className="data-[state=checked]:bg-primary" />
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-all" title="Duplicar Regra" onClick={() => handleDuplicate(r)}>
                          <Copy size={16} />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10 transition-all">
                              <Trash2 size={16} />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="font-black text-xl">Remover automação?</AlertDialogTitle>
                              <AlertDialogDescription className="font-medium">
                                Esta regra de remarketing será removida permanentemente do seu fluxo de marketing.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="rounded-xl font-bold">Manter Regra</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(r.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl font-bold">
                                Sim, Remover
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                  <div className="bg-muted/40 rounded-2xl p-4 border border-border/50 relative overflow-hidden group-hover:bg-muted/60 transition-colors">
                    <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Plus size={40} className="text-primary" />
                    </div>
                    <p className="text-sm text-foreground font-medium italic leading-relaxed">
                      "{r.message}"
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {rules.length === 0 && (
          <Card className="border-dashed border-2 bg-transparent">
            <CardContent className="p-12 text-center text-muted-foreground">
              <Plus size={40} className="mx-auto mb-4 opacity-20" />
              <p className="font-bold text-lg">Pronto para começar?</p>
              <p className="text-sm">Crie sua primeira automação para recuperar clientes hoje.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default RemarketingTab;
