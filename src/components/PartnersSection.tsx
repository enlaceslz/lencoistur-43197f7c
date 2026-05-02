import { Building2, Users, Car, Compass, Loader2, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const partnerTypeKeys = [
  { icon: Building2, key: "hotels", count: "50+" },
  { icon: Compass, key: "guides", count: "120+" },
  { icon: Car, key: "drivers", count: "80+" },
  { icon: Users, key: "agencies", count: "30+" },
] as const;

const PartnersSection = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    type: "hotels",
    message: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone) {
      toast.error("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("marketing_leads").insert({
        name: form.name,
        email: form.email,
        phone: form.phone,
        source: "Seja um Parceiro",
        interest: `Parceria: ${t(`partners.types.${form.type}`)}`,
        status: "morno",
        score: 40
      });

      if (error) throw error;

      setSuccess(true);
      toast.success("Solicitação enviada com sucesso! Nossa equipe entrará em contato.");
      setForm({ name: "", email: "", phone: "", type: "hotels", message: "" });
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
      }, 3000);
    } catch (err: any) {
      console.error("Erro ao enviar lead de parceria:", err);
      toast.error("Erro ao enviar solicitação. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="parceiros" className="py-20 md:py-28 bg-foreground text-primary-foreground">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-secondary font-semibold tracking-widest uppercase text-sm mb-3">{t("partners.label")}</p>
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-6">
              {t("partners.title1")}<br />{t("partners.title2")}<br />{t("partners.title3")}
            </h2>
            <p className="text-primary-foreground/70 text-lg mb-8 max-w-lg">
              {t("partners.subtitle")}
            </p>
            
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <button className="bg-secondary hover:bg-secondary/90 text-secondary-foreground px-8 py-4 rounded-xl font-semibold text-lg transition-colors">
                  {t("partners.cta")}
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-display font-bold">Seja um Parceiro</DialogTitle>
                </DialogHeader>
                
                {success ? (
                  <div className="py-12 flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle2 size={32} className="text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Solicitação Enviada!</h3>
                      <p className="text-muted-foreground mt-2">Obrigado pelo interesse. Nossa equipe comercial entrará em contato em breve.</p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome / Empresa *</Label>
                      <Input 
                        id="name" 
                        value={form.name} 
                        onChange={(e) => setForm({...form, name: e.target.value})} 
                        placeholder="Nome completo ou Razão Social"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">E-mail *</Label>
                        <Input 
                          id="email" 
                          type="email"
                          value={form.email} 
                          onChange={(e) => setForm({...form, email: e.target.value})} 
                          placeholder="seu@email.com"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">WhatsApp *</Label>
                        <Input 
                          id="phone" 
                          value={form.phone} 
                          onChange={(e) => setForm({...form, phone: e.target.value})} 
                          placeholder="(00) 00000-0000"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type">Tipo de Parceria</Label>
                      <Select 
                        value={form.type} 
                        onValueChange={(val) => setForm({...form, type: val})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {partnerTypeKeys.map((p) => (
                            <SelectItem key={p.key} value={p.key}>
                              {t(`partners.types.${p.key}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Mensagem (opcional)</Label>
                      <textarea 
                        id="message"
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={form.message}
                        onChange={(e) => setForm({...form, message: e.target.value})}
                        placeholder="Conte-nos um pouco sobre sua operação..."
                      />
                    </div>
                    <DialogFooter className="pt-4">
                      <Button type="submit" className="w-full font-bold h-12" disabled={loading}>
                        {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                        Enviar Proposta de Parceria
                      </Button>
                    </DialogFooter>
                  </form>
                )}
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-2 gap-5">
            {partnerTypeKeys.map((p) => (
              <div key={p.key} className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-6 text-center border border-primary-foreground/10 hover:border-secondary/50 transition-colors">
                <p.icon size={36} className="mx-auto mb-3 text-secondary" />
                <p className="text-2xl font-bold mb-1">{p.count}</p>
                <p className="text-primary-foreground/70 text-sm">{t(`partners.types.${p.key}`)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PartnersSection;
