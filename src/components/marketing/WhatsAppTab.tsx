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
        <h2 className="font-display font-bold text-lg text-foreground">Campanhas WhatsApp</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus size={16} className="mr-1" /> Nova Campanha</Button>
          </DialogTrigger>
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

      <Card className="border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-muted-foreground">Campanha</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground text-center">Enviadas</TableHead>
              <TableHead className="text-muted-foreground text-center">Lidas</TableHead>
              <TableHead className="text-muted-foreground text-center">Cliques</TableHead>
              <TableHead className="text-muted-foreground text-center">Taxa</TableHead>
              <TableHead className="text-muted-foreground">Data</TableHead>
              <TableHead />
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
                    <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 size={14} className="text-destructive" /></Button></AlertDialogTrigger>
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
      </Card>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-4 text-center">
          <Send size={24} className="mx-auto text-primary mb-2" />
          <p className="text-2xl font-bold text-foreground">{totalSent.toLocaleString("pt-BR")}</p>
          <p className="text-xs text-muted-foreground">Mensagens enviadas</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <CheckCircle size={24} className="mx-auto text-green-600 mb-2" />
          <p className="text-2xl font-bold text-foreground">{totalSent > 0 ? ((totalRead / totalSent) * 100).toFixed(1) : 0}%</p>
          <p className="text-xs text-muted-foreground">Taxa de leitura</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <Zap size={24} className="mx-auto text-blue-600 mb-2" />
          <p className="text-2xl font-bold text-foreground">{totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(1) : 0}%</p>
          <p className="text-xs text-muted-foreground">Taxa de clique</p>
        </CardContent></Card>
      </div>
    </div>
  );
};

export default WhatsAppTab;
