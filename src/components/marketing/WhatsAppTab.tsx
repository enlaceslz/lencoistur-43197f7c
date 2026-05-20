import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Send, CheckCircle, Zap, Trash2 } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { statusColors } from "./statusColors";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Campaign {
  id: string;
  name: string;
  status: string;
  sent: number;
  delivered: number;
  read_count: number;
  clicks: number;
  created_at: string;
}

interface WhatsAppTabProps {
  campaigns: Campaign[];
  onRefresh: () => void;
}

const WhatsAppTab = ({ campaigns, onRefresh }: WhatsAppTabProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [audience, setAudience] = useState("");
  const [message, setMessage] = useState("");
  const [scheduleType, setScheduleType] = useState("now");
  const [saving, setSaving] = useState(false);

  const totalSent = campaigns.reduce((a, c) => a + c.sent, 0);
  const totalRead = campaigns.reduce((a, c) => a + c.read_count, 0);
  const totalClicked = campaigns.reduce((a, c) => a + c.clicks, 0);

  const handleCreate = async () => {
    if (!name.trim() || !message.trim()) {
      toast.error("Preencha o nome e a mensagem da campanha.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("marketing_campaigns").insert({
      name: name.trim().slice(0, 100),
      type: "whatsapp",
      status: scheduleType === "scheduled" ? "agendada" : scheduleType === "auto" ? "automática" : "ativa",
      audience: audience || null,
      message: message.trim().slice(0, 2000),
    });
    setSaving(false);
    if (error) toast.error("Erro ao criar campanha.");
    else {
      toast.success(`Campanha "${name}" criada!`);
      setOpen(false);
      setName(""); setAudience(""); setMessage(""); setScheduleType("now");
      onRefresh();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("marketing_campaigns").delete().eq("id", id);
    if (error) toast.error("Erro ao remover.");
    else { toast.success("Campanha removida."); onRefresh(); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-black text-xl text-foreground tracking-tight">Campanhas WhatsApp</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <DialogTrigger asChild>
                  <Button className="rounded-2xl h-11 px-6 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20"><Plus size={16} className="mr-2" /> Nova Campanha</Button>
                </DialogTrigger>
              </TooltipTrigger>
              <TooltipContent className="rounded-xl font-bold text-[10px] uppercase tracking-widest">
                <p>Configurar nova campanha em massa</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>Nova Campanha WhatsApp</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div><Label>Nome da campanha</Label><Input placeholder="Ex: Promo Julho" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} /></div>
              <div><Label>Audiência</Label>
                <Select value={audience} onValueChange={setAudience}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os contatos</SelectItem>
                    <SelectItem value="leads-quentes">Leads quentes</SelectItem>
                    <SelectItem value="clientes">Clientes anteriores</SelectItem>
                    <SelectItem value="carrinho">Carrinho abandonado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Mensagem</Label>
                <Textarea rows={4} placeholder="Olá {nome}! ..." value={message} onChange={(e) => setMessage(e.target.value)} maxLength={2000} />
                <p className="text-xs text-muted-foreground mt-1">Use {"{nome}"}, {"{passeio}"}, {"{link}"} como variáveis.</p>
              </div>
              <div><Label>Envio</Label>
                <Select value={scheduleType} onValueChange={setScheduleType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="now">Enviar agora</SelectItem>
                    <SelectItem value="scheduled">Agendar</SelectItem>
                    <SelectItem value="auto">Automático (trigger)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
              <Button onClick={handleCreate} disabled={saving}>Criar Campanha</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border overflow-hidden rounded-[2rem] glass-card">
        <div className="overflow-x-auto">
          <Table>
          <TableHeader>
            <TableRow className="border-b border-border/40 hover:bg-transparent">
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-6 py-4">Campanha</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-6 py-4">Status</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-6 py-4 text-center">Enviadas</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-6 py-4 text-center">Lidas</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-6 py-4 text-center">Cliques</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-6 py-4 text-center">Taxa</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-6 py-4">Data</TableHead>
              <TableHead className="px-6 py-4" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-semibold text-foreground">{c.name}</TableCell>
                <TableCell><Badge variant="outline" className={statusColors[c.status] || ""}>{c.status}</Badge></TableCell>
                <TableCell className="text-center text-foreground">{c.sent.toLocaleString("pt-BR")}</TableCell>
                <TableCell className="text-center text-foreground">{c.read_count.toLocaleString("pt-BR")}</TableCell>
                <TableCell className="text-center text-foreground">{c.clicks.toLocaleString("pt-BR")}</TableCell>
                <TableCell className="text-center font-semibold text-primary">
                  {c.sent > 0 ? `${((c.clicks / c.sent) * 100).toFixed(1)}%` : "—"}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">{new Date(c.created_at).toLocaleDateString("pt-BR")}</TableCell>
                <TableCell>
                  <AlertDialog>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 size={14} className="text-destructive" /></Button></AlertDialogTrigger>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Remover permanentemente</p>
                      </TooltipContent>
                    </Tooltip>
                    <AlertDialogContent>
                      <AlertDialogHeader><AlertDialogTitle>Remover campanha?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
                      <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(c.id)}>Remover</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
            {campaigns.length === 0 && (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Nenhuma campanha cadastrada.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="glass-card rounded-3xl border-none shadow-sm group hover:bg-primary/5 transition-all">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Send size={24} />
            </div>
            <p className="text-3xl font-black text-foreground tracking-tighter">{totalSent.toLocaleString("pt-BR")}</p>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Mensagens enviadas</p>
          </CardContent>
        </Card>
        <Card className="glass-card rounded-3xl border-none shadow-sm group hover:bg-emerald-500/5 transition-all">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600 mx-auto mb-4 group-hover:scale-110 transition-transform">
              <CheckCircle size={24} />
            </div>
            <p className="text-3xl font-black text-foreground tracking-tighter">{totalSent > 0 ? ((totalRead / totalSent) * 100).toFixed(1) : 0}%</p>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Taxa de leitura</p>
          </CardContent>
        </Card>
        <Card className="glass-card rounded-3xl border-none shadow-sm group hover:bg-blue-500/5 transition-all">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-600 mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Zap size={24} />
            </div>
            <p className="text-3xl font-black text-foreground tracking-tighter">{totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(1) : 0}%</p>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Taxa de clique</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WhatsAppTab;
