import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import { statusColors } from "./statusColors";

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

const EmailTab = ({ campaigns }: EmailTabProps) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h2 className="font-display font-bold text-lg text-foreground">Campanhas de E-mail</h2>
      <Button className="rounded-xl">
        <Plus size={16} /> Nova Campanha
      </Button>
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

export default EmailTab;
