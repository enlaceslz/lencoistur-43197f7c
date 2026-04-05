import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Eye, Send, CheckCircle, Zap } from "lucide-react";
import { statusColors } from "./statusColors";

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
}

const WhatsAppTab = ({ campaigns }: WhatsAppTabProps) => {
  const totalSent = campaigns.reduce((a, c) => a + c.sent, 0);
  const totalRead = campaigns.reduce((a, c) => a + c.read, 0);
  const totalClicked = campaigns.reduce((a, c) => a + c.clicked, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-lg text-foreground">Campanhas WhatsApp</h2>
        <Button className="bg-whatsapp hover:bg-whatsapp-hover text-primary-foreground rounded-xl">
          <Plus size={16} /> Nova Campanha
        </Button>
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
            <p className="text-2xl font-bold text-foreground font-display">
              {totalSent.toLocaleString("pt-BR")}
            </p>
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
