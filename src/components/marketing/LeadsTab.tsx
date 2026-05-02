import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Smartphone, Trash2, Search, UserPlus, Loader2, ExternalLink } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { statusColors } from "./statusColors";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Lead {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  source: string;
  interest: string | null;
  status: string;
  last_contact: string | null;
  score: number;
  converted_customer_id?: string | null;
}

interface LeadsTabProps {
  leads: Lead[];
  onRefresh: () => void;
}

const getScoreColor = (score: number) => {
  if (score >= 80) return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
  if (score >= 50) return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
  return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
};

const LeadsTab = ({ leads, onRefresh }: LeadsTabProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [source, setSource] = useState("");
  const [interest, setInterest] = useState("");
  const [score, setScore] = useState("50");
  const [status, setStatus] = useState("morno");
  const [saving, setSaving] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!name.trim() || (!phone.trim() && !email.trim())) {
      toast.error("Preencha o nome e ao menos um contato.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("marketing_leads").insert({
      name: name.trim().slice(0, 100),
      phone: phone.trim().slice(0, 20) || null,
      email: email.trim().slice(0, 100) || null,
      source: source || "Manual",
      interest: interest.trim().slice(0, 100) || null,
      status,
      score: Math.min(100, Math.max(0, Number(score) || 50)),
    });
    setSaving(false);
    if (error) toast.error("Erro ao criar lead.");
    else {
      toast.success(`Lead "${name}" adicionado!`);
      setOpen(false);
      setName(""); setPhone(""); setEmail(""); setSource(""); setInterest(""); setScore("50"); setStatus("morno");
      onRefresh();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("marketing_leads").delete().eq("id", id);
    if (error) toast.error("Erro ao remover.");
    else { toast.success("Lead removido."); onRefresh(); }
  };

  const handleApproveAsPartner = async (lead: Lead) => {
    setApprovingId(lead.id);
    try {
      // 1. Create the partner
      const { error: partnerError } = await supabase.from("partners").insert({
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        active: true,
        type: lead.interest?.toLowerCase().includes("guia") ? "guia" : 
              lead.interest?.toLowerCase().includes("motorista") ? "motorista" : "hotel",
        contact_name: lead.name.split(" ")[0],
      });

      if (partnerError) throw partnerError;

      // 2. Update lead status to "convertido"
      const { error: leadError } = await supabase
        .from("marketing_leads")
        .update({ status: "convertido", score: 100 })
        .eq("id", lead.id);

      if (leadError) throw leadError;

      toast.success(`"${lead.name}" agora é um parceiro oficial!`);
      onRefresh();
    } catch (err: any) {
      console.error("Erro ao aprovar parceiro:", err);
      toast.error("Erro ao converter lead em parceiro.");
    } finally {
      setApprovingId(null);
    }
  };

  const filtered = leads.filter((l) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return l.name.toLowerCase().includes(s) || (l.email || "").toLowerCase().includes(s) || (l.phone || "").includes(s);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <h2 className="font-display font-bold text-lg text-foreground">Gestão de Leads</h2>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DialogTrigger asChild><Button><Plus size={16} className="mr-1" /> Lead</Button></DialogTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Adicionar lead manualmente</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader><DialogTitle>Adicionar Lead</DialogTitle></DialogHeader>
              <div className="space-y-4 py-2">
                <div><Label>Nome *</Label><Input placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Telefone</Label><Input placeholder="(98) 99999-0000" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} /></div>
                  <div><Label>E-mail</Label><Input type="email" placeholder="email@ex.com" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={100} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Origem</Label>
                    <Select value={source} onValueChange={setSource}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                        <SelectItem value="Site">Site</SelectItem>
                        <SelectItem value="Instagram">Instagram</SelectItem>
                        <SelectItem value="Google Ads">Google Ads</SelectItem>
                        <SelectItem value="Indicação">Indicação</SelectItem>
                        <SelectItem value="Manual">Manual</SelectItem>
                        <SelectItem value="Seja um Parceiro">Seja um Parceiro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Status</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="quente">Quente</SelectItem>
                        <SelectItem value="morno">Morno</SelectItem>
                        <SelectItem value="frio">Frio</SelectItem>
                        <SelectItem value="convertido">Convertido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Interesse</Label><Input placeholder="Ex: Lençóis Completo" value={interest} onChange={(e) => setInterest(e.target.value)} maxLength={100} /></div>
                  <div><Label>Score (0-100)</Label><Input type="number" min={0} max={100} value={score} onChange={(e) => setScore(e.target.value)} /></div>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                <Button onClick={handleCreate} disabled={saving}>Adicionar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-muted-foreground">Nome</TableHead>
              <TableHead className="text-muted-foreground">Contato</TableHead>
              <TableHead className="text-muted-foreground">Origem</TableHead>
              <TableHead className="text-muted-foreground">Interesse</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground text-center">Score</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((l) => (
              <TableRow key={l.id}>
                <TableCell className="font-semibold text-foreground">
                  <div className="flex flex-col">
                    <span>{l.name}</span>
                    {l.source === "Seja um Parceiro" && (
                      <span className="text-[10px] font-black uppercase text-secondary tracking-widest bg-secondary/10 px-1.5 py-0.5 rounded w-fit mt-1">
                        Candidato a Parceiro
                      </span>
                    )}
                    {l.converted_customer_id && (
                      <a href={`/admin/crm?id=${l.converted_customer_id}`} className="text-[10px] font-black uppercase text-primary tracking-widest bg-primary/10 px-1.5 py-0.5 rounded w-fit mt-1 flex items-center gap-1 hover:underline">
                        Cliente Convertido <ExternalLink size={8} />
                      </a>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {l.phone && <p className="text-foreground">{l.phone}</p>}
                    {l.email && <p className="text-muted-foreground text-xs">{l.email}</p>}
                  </div>
                </TableCell>
                <TableCell><Badge variant="outline" className="bg-muted text-muted-foreground">{l.source}</Badge></TableCell>
                <TableCell className="text-foreground text-sm">{l.interest || "—"}</TableCell>
                <TableCell><Badge variant="outline" className={statusColors[l.status] || ""}>{l.status}</Badge></TableCell>
                <TableCell className="text-center">
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold ${getScoreColor(l.score)}`}>{l.score}</div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {l.source === "Seja um Parceiro" && l.status !== "convertido" && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-secondary hover:text-secondary hover:bg-secondary/10"
                              onClick={() => handleApproveAsPartner(l)}
                              disabled={approvingId === l.id}
                            >
                              {approvingId === l.id ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Aprovar como Parceiro Oficial</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    
                    {l.phone && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <a href={`https://wa.me/55${l.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá ${l.name.split(" ")[0]}! Tudo bem?`)}`} target="_blank" rel="noopener noreferrer">
                              <Button variant="ghost" size="icon" className="h-8 w-8"><Smartphone size={16} className="text-green-600" /></Button>
                            </a>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Iniciar conversa no WhatsApp</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    <AlertDialog>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><Trash2 size={14} className="text-destructive" /></Button></AlertDialogTrigger>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Remover permanentemente</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Remover lead?</AlertDialogTitle><AlertDialogDescription>"{l.name}" será removido permanentemente.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(l.id)}>Remover</AlertDialogAction></AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhum lead encontrado.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default LeadsTab;