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
import { Plus, Mail, MousePointer, AlertTriangle, Trash2 } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { statusColors } from "./statusColors";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface EmailCampaign {
  id: string;
  name: string;
  status: string;
  sent: number;
  read_count: number;
  clicks: number;
  bounces: number;
  subject: string | null;
  created_at: string;
}

interface EmailTabProps {
  campaigns: EmailCampaign[];
  onRefresh: () => void;
}

const EmailTab = ({ campaigns, onRefresh }: EmailTabProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [audience, setAudience] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  const totalSent = campaigns.reduce((a, c) => a + c.sent, 0);
  const totalReads = campaigns.reduce((a, c) => a + c.read_count, 0);
  const totalClicks = campaigns.reduce((a, c) => a + c.clicks, 0);
  const totalBounces = campaigns.reduce((a, c) => a + c.bounces, 0);

  const handleCreate = async () => {
    if (!name.trim() || !subject.trim()) {
      toast.error("Preencha o nome e o assunto.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("marketing_campaigns").insert({
      name: name.trim().slice(0, 100),
      type: "email",
      status: "rascunho",
      subject: subject.trim().slice(0, 200),
      audience: audience || null,
      message: body.trim().slice(0, 5000) || null,
    });
    setSaving(false);
    if (error) toast.error("Erro ao criar campanha.");
    else {
      toast.success(`Campanha "${name}" criada!`);
      setOpen(false);
      setName(""); setSubject(""); setAudience(""); setBody("");
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
        <h2 className="font-display font-bold text-lg text-foreground">Campanhas de E-mail</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <Tooltip>
            <TooltipTrigger asChild>
              <DialogTrigger asChild><Button><Plus size={16} className="mr-1" /> Nova Campanha</Button></DialogTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Criar nova campanha de e-mail marketing</p>
            </TooltipContent>
          </Tooltip>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>Nova Campanha de E-mail</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div><Label>Nome</Label><Input placeholder="Ex: Newsletter Abril" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} /></div>
              <div><Label>Assunto</Label><Input placeholder="Ex: Novidades 🌊" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} /></div>
              <div><Label>Audiência</Label>
                <Select value={audience} onValueChange={setAudience}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os assinantes</SelectItem>
                    <SelectItem value="clientes">Clientes anteriores</SelectItem>
                    <SelectItem value="leads">Leads cadastrados</SelectItem>
                    <SelectItem value="inativos">Inativos (30+ dias)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Corpo</Label><Textarea rows={5} placeholder="Conteúdo..." value={body} onChange={(e) => setBody(e.target.value)} maxLength={5000} /></div>
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
              <TableHead className="text-muted-foreground text-center">Enviados</TableHead>
              <TableHead className="text-muted-foreground text-center">Aberturas</TableHead>
              <TableHead className="text-muted-foreground text-center">Cliques</TableHead>
              <TableHead className="text-muted-foreground text-center">Bounces</TableHead>
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
                <TableCell className="text-center text-foreground">{c.sent || "—"}</TableCell>
                <TableCell className="text-center text-foreground">{c.read_count || "—"}</TableCell>
                <TableCell className="text-center text-foreground">{c.clicks || "—"}</TableCell>
                <TableCell className="text-center text-muted-foreground">{c.bounces || "—"}</TableCell>
                <TableCell className="text-center font-semibold text-primary">
                  {c.sent > 0 ? `${((c.read_count / c.sent) * 100).toFixed(1)}%` : "—"}
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
              <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Nenhuma campanha cadastrada.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Mail className="text-primary" size={24} />
          <div><p className="text-sm text-muted-foreground">Enviados</p><p className="text-xl font-bold text-foreground">{totalSent.toLocaleString("pt-BR")}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Mail className="text-green-600" size={24} />
          <div><p className="text-sm text-muted-foreground">Abertura</p><p className="text-xl font-bold text-foreground">{totalSent > 0 ? `${((totalReads / totalSent) * 100).toFixed(1)}%` : "—"}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <MousePointer className="text-blue-600" size={24} />
          <div><p className="text-sm text-muted-foreground">Clique</p><p className="text-xl font-bold text-foreground">{totalSent > 0 ? `${((totalClicks / totalSent) * 100).toFixed(1)}%` : "—"}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <AlertTriangle className="text-destructive" size={24} />
          <div><p className="text-sm text-muted-foreground">Bounces</p><p className="text-xl font-bold text-foreground">{totalBounces}</p></div>
        </CardContent></Card>
      </div>
    </div>
  );
};

export default EmailTab;
