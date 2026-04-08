import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Mail, MousePointer, AlertTriangle } from "lucide-react";
import { statusColors } from "./statusColors";
import { useState } from "react";
import { toast } from "sonner";

interface EmailCampaign {
  id: number;
  name: string;
  status: string;
  recipients: number;
  opens: number;
  clicks: number;
  bounces: number;
  date: string;
}

interface EmailTabProps {
  campaigns: EmailCampaign[];
  onAdd?: React.Dispatch<React.SetStateAction<EmailCampaign[]>>;
}

const EmailTab = ({ campaigns, onAdd }: EmailTabProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [audience, setAudience] = useState("");
  const [body, setBody] = useState("");

  const totalRecipients = campaigns.reduce((a, c) => a + c.recipients, 0);
  const totalOpens = campaigns.reduce((a, c) => a + c.opens, 0);
  const totalClicks = campaigns.reduce((a, c) => a + c.clicks, 0);
  const totalBounces = campaigns.reduce((a, c) => a + c.bounces, 0);

  const handleCreate = () => {
    if (!name.trim() || !subject.trim()) {
      toast.error("Preencha o nome e o assunto da campanha.");
      return;
    }
    const newCampaign: EmailCampaign = {
      id: Date.now(),
      name: name.trim(),
      status: "rascunho",
      recipients: 0,
      opens: 0,
      clicks: 0,
      bounces: 0,
      date: new Date().toISOString().split("T")[0],
    };
    onAdd?.((prev) => [newCampaign, ...prev]);
    toast.success(`Campanha de e-mail "${name}" criada com sucesso!`);
    setOpen(false);
    setName("");
    setSubject("");
    setAudience("");
    setBody("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-lg text-foreground">Campanhas de E-mail</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl">
              <Plus size={16} /> Nova Campanha
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-display">Nova Campanha de E-mail</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="email-name">Nome da campanha</Label>
                <Input id="email-name" placeholder="Ex: Newsletter Abril" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-subject">Assunto do e-mail</Label>
                <Input id="email-subject" placeholder="Ex: Novidades da Rota das Emoções 🌊" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} />
              </div>
              <div className="space-y-2">
                <Label>Audiência</Label>
                <Select value={audience} onValueChange={setAudience}>
                  <SelectTrigger><SelectValue placeholder="Selecione a audiência" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os assinantes</SelectItem>
                    <SelectItem value="clientes">Clientes anteriores</SelectItem>
                    <SelectItem value="leads">Leads cadastrados</SelectItem>
                    <SelectItem value="inativos">Inativos (30+ dias)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-body">Corpo do e-mail</Label>
                <Textarea id="email-body" rows={5} placeholder="Conteúdo do e-mail..." value={body} onChange={(e) => setBody(e.target.value)} maxLength={5000} />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
              <Button onClick={handleCreate}>Criar Campanha</Button>
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
              <TableHead className="text-muted-foreground text-center">Destinatários</TableHead>
              <TableHead className="text-muted-foreground text-center">Aberturas</TableHead>
              <TableHead className="text-muted-foreground text-center">Cliques</TableHead>
              <TableHead className="text-muted-foreground text-center">Bounces</TableHead>
              <TableHead className="text-muted-foreground text-center">Taxa Abertura</TableHead>
              <TableHead className="text-muted-foreground">Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.map((c) => (
              <TableRow key={c.id} className="border-border">
                <TableCell className="font-semibold text-foreground">{c.name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={statusColors[c.status]}>{c.status}</Badge>
                </TableCell>
                <TableCell className="text-center text-foreground">{c.recipients || "—"}</TableCell>
                <TableCell className="text-center text-foreground">{c.opens || "—"}</TableCell>
                <TableCell className="text-center text-foreground">{c.clicks || "—"}</TableCell>
                <TableCell className="text-center text-muted-foreground">{c.bounces || "—"}</TableCell>
                <TableCell className="text-center font-semibold text-primary">
                  {c.recipients > 0 ? `${((c.opens / c.recipients) * 100).toFixed(1)}%` : "—"}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(c.date).toLocaleDateString("pt-BR")}
                </TableCell>
              </TableRow>
            ))}
            {campaigns.length === 0 && (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Nenhuma campanha cadastrada.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <Mail className="text-primary" size={24} />
            <div>
              <p className="text-sm text-muted-foreground">Total Enviados</p>
              <p className="text-xl font-bold text-foreground">{totalRecipients.toLocaleString("pt-BR")}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <Mail className="text-green-600" size={24} />
            <div>
              <p className="text-sm text-muted-foreground">Taxa Abertura</p>
              <p className="text-xl font-bold text-foreground">{totalRecipients > 0 ? `${((totalOpens / totalRecipients) * 100).toFixed(1)}%` : "—"}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <MousePointer className="text-blue-600" size={24} />
            <div>
              <p className="text-sm text-muted-foreground">Taxa Clique</p>
              <p className="text-xl font-bold text-foreground">{totalRecipients > 0 ? `${((totalClicks / totalRecipients) * 100).toFixed(1)}%` : "—"}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="text-destructive" size={24} />
            <div>
              <p className="text-sm text-muted-foreground">Bounces</p>
              <p className="text-xl font-bold text-foreground">{totalBounces}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmailTab;
