import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Eye, Smartphone } from "lucide-react";
import { statusColors } from "./statusColors";

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

const LeadsTab = ({ leads }: LeadsTabProps) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h2 className="font-display font-bold text-lg text-foreground">Gestão de Leads</h2>
      <Button className="rounded-xl">
        <Plus size={16} /> Adicionar Lead
      </Button>
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

export default LeadsTab;
