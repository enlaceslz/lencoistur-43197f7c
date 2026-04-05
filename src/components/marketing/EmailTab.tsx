import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
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
}

const EmailTab = ({ campaigns }: EmailTabProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [audience, setAudience] = useState("");
  const [body, setBody] = useState("");

  const handleCreate = () => {
    if (!name.trim() || !subject.trim()) {
      toast.error("Preencha o nome e o assunto da campanha.");
      return;
    }
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
                <Input id="email-name" placeholder="Ex: Newsletter Abril" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-subject">Assunto do e-mail</Label>
                <Input id="email-subject" placeholder="Ex: Novidades da Rota das Emoções 🌊" value={subject} onChange={(e) => setSubject(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Audiência</Label>
                <Select value={audience} onValueChange={setAudience}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a audiência" />
                  </SelectTrigger>
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
                <Textarea id="email-body" rows={5} placeholder="Conteúdo do e-mail..." value={body} onChange={(e) => setBody(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
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
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default EmailTab;
