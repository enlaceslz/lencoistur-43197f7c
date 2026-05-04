import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Phone, Mail, Users, Trash2, Loader2, Calendar } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Interaction {
  id: string;
  type: string;
  content: string;
  created_at: string;
}

interface Props {
  customerId: string;
}

const CustomerInteractionHistory = ({ customerId }: Props) => {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [type, setType] = useState("note");
  const [saving, setSaving] = useState(false);

  const fetchInteractions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("customer_interactions")
      .select("*")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar histórico.");
    } else {
      setInteractions(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchInteractions();
  }, [customerId]);

  const handleSave = async () => {
    if (!content.trim()) return;

    setSaving(true);
    const { error } = await supabase.from("customer_interactions").insert({
      customer_id: customerId,
      type,
      content: content.trim(),
    });

    if (error) {
      toast.error("Erro ao salvar nota.");
    } else {
      toast.success("Nota salva com sucesso!");
      setContent("");
      fetchInteractions();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("customer_interactions").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir nota.");
    } else {
      toast.success("Nota excluída.");
      fetchInteractions();
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "call": return <Phone size={14} />;
      case "email": return <Mail size={14} />;
      case "meeting": return <Users size={14} />;
      default: return <MessageSquare size={14} />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "call": return "Ligação";
      case "email": return "E-mail";
      case "meeting": return "Reunião";
      default: return "Nota";
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex gap-2">
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="note">📝 Nota</SelectItem>
              <SelectItem value="call">📞 Ligação</SelectItem>
              <SelectItem value="email">📧 E-mail</SelectItem>
              <SelectItem value="meeting">🤝 Reunião</SelectItem>
            </SelectContent>
          </Select>
          <Textarea 
            placeholder="Adicionar observação ou registrar interação..." 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[80px] text-sm"
          />
        </div>
        <div className="flex justify-end">
          <Button size="sm" onClick={handleSave} disabled={saving || !content.trim()}>
            {saving ? <Loader2 className="animate-spin mr-2" size={14} /> : null}
            Registrar
          </Button>
        </div>
      </div>

      <div className="space-y-3 mt-6">
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="animate-spin text-primary" size={20} />
          </div>
        ) : interactions.length === 0 ? (
          <p className="text-center text-muted-foreground text-xs py-4">Nenhuma interação registrada.</p>
        ) : (
          interactions.map((i) => (
            <div key={i.id} className="bg-muted/30 rounded-lg p-3 relative group border border-border/50">
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-primary bg-primary/10 p-1 rounded">
                    {getIcon(i.type)}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {getTypeLabel(i.type)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Calendar size={10} />
                    {format(new Date(i.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </span>
                  <button 
                    onClick={() => handleDelete(i.id)}
                    className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap">{i.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CustomerInteractionHistory;
