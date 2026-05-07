import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Share2, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ShareWithFriendProps {
  itemName: string;
  itemUrl: string;
}

export const ShareWithFriend = ({ itemName, itemUrl }: ShareWithFriendProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [friendName, setFriendName] = useState("");
  const [friendPhone, setFriendPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleShare = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // If name and phone are provided, save as lead
    if (friendName && friendPhone) {
      setLoading(true);
      try {
        const { error } = await supabase.from("marketing_leads").insert({
          name: friendName,
          phone: friendPhone,
          source: "share_with_friend",
          interest: `Compartilhamento: ${itemName}`,
          status: "novo",
        });

        if (error) {
          console.error("Error saving lead:", error);
          // We still proceed to share even if lead saving fails
        }
      } catch (err) {
        console.error("Unexpected error saving lead:", err);
      } finally {
        setLoading(false);
      }
    }

    const message = encodeURIComponent(
      `Olá${friendName ? ` ${friendName}` : ""}! Olha que incrível esse passeio que encontrei na Lençóis Tour: ${itemName}. Confira aqui: ${itemUrl}`
    );
    
    const whatsappUrl = friendPhone 
      ? `https://wa.me/${friendPhone.replace(/\D/g, "")}?text=${message}`
      : `https://wa.me/?text=${message}`;

    window.open(whatsappUrl, "_blank");
    setIsOpen(false);
    
    if (friendName && friendPhone) {
      toast.success("Link compartilhado! Lead registrado.");
    }
  };

  const handleQuickShare = () => {
    const message = encodeURIComponent(
      `Olha que incrível esse passeio que encontrei na Lençóis Tour: ${itemName}. Confira aqui: ${itemUrl}`
    );
    const whatsappUrl = `https://wa.me/?text=${message}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <>
      <div className="flex flex-col gap-2 w-full">
        <Button
          variant="outline"
          className="w-full flex items-center justify-center gap-2 py-6 rounded-xl border-primary/20 hover:bg-primary/5 text-primary font-bold"
          onClick={() => setIsOpen(true)}
        >
          <Share2 size={20} />
          Compartilhar com Amigo
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground hover:text-primary transition-colors"
          onClick={handleQuickShare}
        >
          Compartilhar rápido (sem identificar amigo)
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="text-primary" />
              Compartilhar no WhatsApp
            </DialogTitle>
            <DialogDescription>
              Identifique seu amigo para personalizar a mensagem ou compartilhe diretamente.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleShare} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="friendName">Nome do Amigo(a)</Label>
              <Input
                id="friendName"
                placeholder="Ex: João Silva"
                value={friendName}
                onChange={(e) => setFriendName(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="friendPhone">WhatsApp do Amigo(a)</Label>
              <Input
                id="friendPhone"
                placeholder="Ex: 98985880954"
                value={friendPhone}
                onChange={(e) => setFriendPhone(e.target.value)}
                className="rounded-xl"
              />
              <p className="text-[10px] text-muted-foreground italic">
                Dica: Digite apenas números com DDD.
              </p>
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleShare()}
                className="flex-1 rounded-xl"
              >
                Compartilhar Direto
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-primary hover:bg-primary/90 rounded-xl font-bold"
                disabled={loading || !friendName || !friendPhone}
              >
                {loading ? "Salvando..." : "Enviar p/ Amigo"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
