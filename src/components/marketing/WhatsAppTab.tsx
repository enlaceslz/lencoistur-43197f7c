import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Eye, Send, CheckCircle, Zap } from "lucide-react";
import { statusColors } from "./statusColors";
import { useState } from "react";
import { toast } from "sonner";

interface Campaign {
  id: number;
  name: string;
  status: string;
  sent: number;
  delivered: number;
  read: number;
  clicked: number;
  date: string;
}

interface WhatsAppTabProps {
  campaigns: Campaign[];
  onAdd?: React.Dispatch<React.SetStateAction<Campaign[]>>;
}

const WhatsAppTab = ({ campaigns, onAdd }: WhatsAppTabProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [audience, setAudience] = useState("");
  const [message, setMessage] = useState("");
  const [scheduleType, setScheduleType] = useState("now");

  const totalSent = campaigns.reduce((a, c) => a + c.sent, 0);
  const totalRead = campaigns.reduce((a, c) => a + c.read, 0);
  const totalClicked = campaigns.reduce((a, c) => a + c.clicked, 0);

  const handleCreate = () => {
    if (!name.trim() || !message.trim()) {
      toast.error("Preencha o nome e a mensagem da campanha.");
      return;
    }
    toast.success(`Campanha "${name}" criada com sucesso!`);
    setOpen(false);
    setName("");
    setAudience("");
    setMessage("");
    setScheduleType("now");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-lg text-foreground">Campanhas WhatsApp</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-whatsapp hover:bg-whatsapp-hover text-primary-foreground rounded-xl">
              <Plus size={16} /> Nova Campanha
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-display">Nova Campanha WhatsApp</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="wa-name">Nome da campanha</Label>
                <Input id="wa-name" placeholder="Ex: Promo Julho Lençóis" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wa-audience">Audiência</Label>
                <Select value={audience} onValueChange={setAudience}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a audiência" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os contatos</SelectItem>
                    <SelectItem value="leads-quentes">Leads quentes</SelectItem>
                    <SelectItem value="clientes">Clientes anteriores</SelectItem>
                    <SelectItem value="carrinho">Carrinho abandonado</SelectItem>
                    <SelectItem value="custom">Segmento personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="wa-message">Mensagem</Label>
                <Textarea id="wa-message" rows={4} placeholder="Olá {nome}! Confira nossa promoção especial..." value={message} onChange={(e) => setMessage(e.target.value)} />
                <p className="text-xs text-muted-foreground">Use {"{nome}"}, {"{passeio}"}, {"{link}"} como variáveis.</p>
              </div>
              <div className="space-y-2">
                <Label>Envio</Label>
                <Select value={scheduleType} onValueChange={setScheduleType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="now">Enviar agora</SelectItem>
                    <SelectItem value="scheduled">Agendar</SelectItem>
                    <SelectItem value="auto">Automático (trigger)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button onClick={handleCreate} className="bg-whatsapp hover:bg-whatsapp-hover text-primary-foreground">
                Criar Campanha
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border">
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
              <TableRow key={c.id} className="border-border">
                <TableCell className="font-semibold text-foreground">{c.name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={statusColors[c.status]}>{c.status}</Badge>
                </TableCell>
                <TableCell className="text-center text-foreground">{c.sent.toLocaleString("pt-BR")}</TableCell>
                <TableCell className="text-center text-foreground">{c.read.toLocaleString("pt-BR")}</TableCell>
                <TableCell className="text-center text-foreground">{c.clicked.toLocaleString("pt-BR")}</TableCell>
                <TableCell className="text-center font-semibold text-primary">
                  {c.sent > 0 ? `${((c.clicked / c.sent) * 100).toFixed(1)}%` : "—"}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(c.date).toLocaleDateString("pt-BR")}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Eye size={16} className="text-muted-foreground" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="border-border">
          <CardContent className="p-4 text-center">
            <Send size={24} className="mx-auto text-whatsapp mb-2" />
            <p className="text-2xl font-bold text-foreground font-display">{totalSent.toLocaleString("pt-BR")}</p>
            <p className="text-xs text-muted-foreground">Mensagens enviadas (mês)</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 text-center">
            <CheckCircle size={24} className="mx-auto text-green-600 mb-2" />
            <p className="text-2xl font-bold text-foreground font-display">
              {totalSent > 0 ? ((totalRead / totalSent) * 100).toFixed(1) : 0}%
            </p>
            <p className="text-xs text-muted-foreground">Taxa de leitura média</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 text-center">
            <Zap size={24} className="mx-auto text-secondary mb-2" />
            <p className="text-2xl font-bold text-foreground font-display">
              {totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(1) : 0}%
            </p>
            <p className="text-xs text-muted-foreground">Taxa de clique média</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WhatsAppTab;
