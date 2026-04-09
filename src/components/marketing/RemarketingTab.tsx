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
            <div className="space-y-4 py-2">
              <div><Label>Gatilho</Label>
                <Select value={trigger} onValueChange={setTrigger}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Carrinho abandonado">Carrinho abandonado</SelectItem>
                    <SelectItem value="Visitou passeio 2x">Visitou passeio 2x sem reservar</SelectItem>
                    <SelectItem value="Reserva concluída">Reserva concluída</SelectItem>
                    <SelectItem value="Pós-passeio (7 dias)">Pós-passeio (7 dias)</SelectItem>
                    <SelectItem value="Aniversário">Aniversário do cliente</SelectItem>
                    <SelectItem value="Inativo 30 dias">Inativo há 30 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Delay</Label><Input placeholder="Ex: 30 min, 24h" value={delay} onChange={(e) => setDelay(e.target.value)} maxLength={20} /></div>
                <div><Label>Canal</Label>
                  <Select value={channel} onValueChange={setChannel}>
                    <SelectTrigger><SelectValue placeholder="Canal" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                      <SelectItem value="E-mail">E-mail</SelectItem>
                      <SelectItem value="E-mail + WhatsApp">E-mail + WhatsApp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Mensagem</Label>
                <Textarea rows={4} placeholder="Olá {nome}! ..." value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1000} />
                <p className="text-xs text-muted-foreground mt-1">Use {"{nome}"}, {"{passeio}"}, {"{link}"}</p>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
              <Button onClick={handleCreate} disabled={saving}>Criar Automação</Button>
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
                    <h3 className="font-display font-bold text-foreground">{r.trigger_name}</h3>
                    <Badge variant="outline" className={r.active ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-muted text-muted-foreground"}>
                      {r.active ? "Ativa" : "Inativa"}
                    </Badge>
                    <Badge variant="outline" className="bg-muted text-muted-foreground">{r.channel}</Badge>
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
                  <Switch checked={r.active} onCheckedChange={() => handleToggle(r.id, r.active)} />
                  <Button variant="ghost" size="icon" className="h-8 w-8" title="Duplicar" onClick={() => handleDuplicate(r)}>
                    <Copy size={16} className="text-muted-foreground" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><Trash2 size={14} className="text-destructive" /></Button></AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader><AlertDialogTitle>Remover automação?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
                      <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(r.id)}>Remover</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {rules.length === 0 && (
          <Card><CardContent className="p-8 text-center text-muted-foreground">Nenhuma automação cadastrada.</CardContent></Card>
        )}
      </div>
    </div>
  );
};

export default RemarketingTab;
