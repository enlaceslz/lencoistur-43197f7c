import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Eye, Smartphone } from "lucide-react";
import { statusColors } from "./statusColors";
import { useState } from "react";
import { toast } from "sonner";

interface Lead {
  id: number;
  name: string;
  phone: string;
  email: string;
  source: string;
  interest: string;
  status: string;
  lastContact: string;
  score: number;
}

interface LeadsTabProps {
  leads: Lead[];
}

const getScoreColor = (score: number) => {
  if (score >= 80) return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
  if (score >= 50) return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
  return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
};

const LeadsTab = ({ leads }: LeadsTabProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [source, setSource] = useState("");
  const [interest, setInterest] = useState("");

  const handleCreate = () => {
    if (!name.trim() || (!phone.trim() && !email.trim())) {
      toast.error("Preencha o nome e ao menos um contato (telefone ou e-mail).");
      return;
    }
    toast.success(`Lead "${name}" adicionado com sucesso!`);
    setOpen(false);
    setName("");
    setPhone("");
    setEmail("");
    setSource("");
    setInterest("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-lg text-foreground">Gestão de Leads</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl">
              <Plus size={16} /> Adicionar Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-display">Adicionar Lead</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="lead-name">Nome completo</Label>
                <Input id="lead-name" placeholder="Nome do lead" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lead-phone">Telefone</Label>
                  <Input id="lead-phone" placeholder="(98) 99999-0000" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lead-email">E-mail</Label>
                  <Input id="lead-email" type="email" placeholder="email@exemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Origem</Label>
                  <Select value={source} onValueChange={setSource}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                      <SelectItem value="Site">Site</SelectItem>
                      <SelectItem value="Instagram">Instagram</SelectItem>
                      <SelectItem value="Google Ads">Google Ads</SelectItem>
                      <SelectItem value="Indicação">Indicação</SelectItem>
                      <SelectItem value="Outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lead-interest">Interesse</Label>
                  <Input id="lead-interest" placeholder="Ex: Lençóis Completo" value={interest} onChange={(e) => setInterest(e.target.value)} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button onClick={handleCreate}>Adicionar Lead</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              <TableHead className="text-muted-foreground">Nome</TableHead>
              <TableHead className="text-muted-foreground">Contato</TableHead>
              <TableHead className="text-muted-foreground">Origem</TableHead>
              <TableHead className="text-muted-foreground">Interesse</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground text-center">Score</TableHead>
              <TableHead className="text-muted-foreground">Último Contato</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((l) => (
              <TableRow key={l.id} className="border-border">
                <TableCell className="font-semibold text-foreground">{l.name}</TableCell>
                <TableCell>
                  <div className="text-sm">
                    <p className="text-foreground">{l.phone}</p>
                    <p className="text-muted-foreground text-xs">{l.email}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-muted text-muted-foreground">{l.source}</Badge>
                </TableCell>
                <TableCell className="text-foreground text-sm">{l.interest}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={statusColors[l.status]}>{l.status}</Badge>
                </TableCell>
                <TableCell className="text-center">
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold ${getScoreColor(l.score)}`}>
                    {l.score}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(l.lastContact).toLocaleDateString("pt-BR")}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <a
                      href={`https://wa.me/55${l.phone.replace(/\D/g, "")}?text=Olá ${l.name.split(" ")[0]}! Tudo bem?`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-whatsapp/10">
                        <Smartphone size={16} className="text-whatsapp" />
                      </Button>
                    </a>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Eye size={16} className="text-muted-foreground" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default LeadsTab;
