import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Star, ThumbsUp, MessageSquare, TrendingUp, Loader2, Trash2, Plus, Search, Filter, Save, MapPin, Calendar, Quote, CheckCircle2, Compass } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Review {
  id: string;
  author: string;
  rating: number;
  comment: string | null;
  country: string | null;
  tour_id: string | null;
  created_at: string;
  tour_name?: string;
}

interface TourOption {
  id: string;
  name: string;
}

const AdminAvaliacoes = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [tours, setTours] = useState<TourOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRating, setFilterRating] = useState("all");
  const [filterTour, setFilterTour] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [formAuthor, setFormAuthor] = useState("");
  const [formRating, setFormRating] = useState(5);
  const [formComment, setFormComment] = useState("");
  const [formCountry, setFormCountry] = useState("");
  const [formTourId, setFormTourId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchReviews();
    fetchTours();
  }, []);

  const fetchTours = async () => {
    const { data } = await supabase.from("tours").select("id, name").order("name");
    if (data) setTours(data);
  };

  const fetchReviews = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("reviews")
      .select("*, tours(name)")
      .order("created_at", { ascending: false });

    if (data) {
      setReviews(data.map((r: any) => ({
        ...r,
        tour_name: r.tours?.name || "Passeio Geral",
      })));
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (error) toast.error("Erro ao remover avaliação.");
    else { toast.success("Avaliação removida."); fetchReviews(); }
  };

  const handleCreate = async () => {
    if (!formAuthor.trim()) { toast.error("Informe o autor."); return; }
    setSaving(true);
    const { error } = await supabase.from("reviews").insert({
      author: formAuthor.trim().slice(0, 100),
      rating: formRating,
      comment: formComment.trim().slice(0, 1000) || null,
      country: formCountry.trim().slice(0, 50) || null,
      tour_id: formTourId || null,
    });
    setSaving(false);
    if (error) toast.error("Erro ao criar avaliação.");
    else {
      toast.success("Avaliação criada!");
      setDialogOpen(false);
      resetForm();
      fetchReviews();
    }
  };

  const resetForm = () => {
    setFormAuthor("");
    setFormRating(5);
    setFormComment("");
    setFormCountry("");
    setFormTourId("");
  };

  const filtered = reviews.filter((r) => {
    const matchSearch = search === "" ||
      r.author.toLowerCase().includes(search.toLowerCase()) ||
      (r.comment || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.country || "").toLowerCase().includes(search.toLowerCase());
    const matchRating = filterRating === "all" || r.rating === Number(filterRating);
    const matchTour = filterTour === "all" || r.tour_id === filterTour;
    return matchSearch && matchRating && matchTour;
  });

  const avgRating = reviews.length > 0
    ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1)
    : "0";
  const positiveCount = reviews.filter(r => r.rating >= 4).length;
  const satisfactionPct = reviews.length > 0 ? Math.round((positiveCount / reviews.length) * 100) : 0;

  if (loading) {
    return (
      <AdminLayout title="Avaliações">
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <Loader2 className="animate-spin text-primary" size={40} />
          <p className="text-muted-foreground animate-pulse font-black uppercase tracking-widest text-xs">Carregando Depoimentos...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Reputação Digital">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 animate-in-fade" style={{ animationDelay: '0.1s' }}>
        {[
          { label: "Média Global", value: avgRating, icon: Star, color: "from-amber-400 to-orange-600", desc: "Rating médio" },
          { label: "Reviews Totais", value: reviews.length, icon: MessageSquare, color: "from-blue-500 to-indigo-600", desc: "Volume de feedback" },
          { label: "Satisfação", value: `${satisfactionPct}%`, icon: ThumbsUp, color: "from-emerald-400 to-teal-600", desc: "NPS Estimado" },
          { label: "Crescimento", value: "+12%", icon: TrendingUp, color: "from-purple-500 to-pink-600", desc: "Últimos 30 dias" },
        ].map((stat, i) => (
          <div key={i} className="glass-card admin-card-hover rounded-[2rem] p-6 relative overflow-hidden group">
            <div className={`absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br ${stat.color} opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity`} />
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white shadow-lg shadow-primary/10 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                <stat.icon size={22} strokeWidth={2.5} />
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">{stat.desc}</div>
            </div>
            <p className="text-2xl font-black text-foreground tracking-tighter group-hover:translate-x-1 transition-transform">{stat.value}</p>
            <p className="text-[10px] font-black text-muted-foreground mt-1 uppercase tracking-[0.2em]">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="glass-card rounded-[2.5rem] p-8 mb-10 animate-in-fade border border-white/20 shadow-xl shadow-black/5" style={{ animationDelay: '0.2s' }}>
        <div className="flex flex-col xl:flex-row gap-6 items-center">
          <div className="relative flex-1 w-full group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-primary transition-colors" size={20} />
            <Input 
              placeholder="Buscar por autor, conteúdo ou localização..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="pl-14 h-14 rounded-[1.5rem] border-white/40 dark:border-white/10 bg-white/40 dark:bg-black/20 backdrop-blur-xl focus:bg-white/80 dark:focus:bg-black/40 focus:ring-4 focus:ring-primary/10 transition-all font-semibold" 
            />
          </div>
          
          <div className="flex flex-wrap gap-3 w-full xl:w-auto justify-center">
            <Select value={filterRating} onValueChange={setFilterRating}>
              <SelectTrigger className="h-14 w-44 rounded-2xl bg-white/50 border-white/20 font-black text-[10px] uppercase tracking-widest px-6 shadow-lg">
                <Filter size={14} className="mr-2 text-primary" />
                <SelectValue placeholder="Pontuação" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl">
                <SelectItem value="all">Todas Notas</SelectItem>
                {[5, 4, 3, 2, 1].map((n) => (
                  <SelectItem key={n} value={String(n)}>{n} Estrela{n > 1 ? "s" : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterTour} onValueChange={setFilterTour}>
              <SelectTrigger className="h-14 w-52 rounded-2xl bg-white/50 border-white/20 font-black text-[10px] uppercase tracking-widest px-6 shadow-lg">
                <SelectValue placeholder="Serviço" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl">
                <SelectItem value="all">Todos Serviços</SelectItem>
                {tours.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={resetForm}
                  className="h-14 px-8 rounded-[1.5rem] bg-gradient-to-r from-primary to-indigo-600 font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
                >
                  <Plus size={20} className="mr-2" strokeWidth={3} /> Nova Avaliação
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl rounded-[2.5rem] border-none shadow-2xl glass-card">
                <DialogHeader className="border-b pb-6 mb-6">
                  <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-primary/10 text-primary shadow-inner">
                      <Star size={24} strokeWidth={3} />
                    </div>
                    Registrar Depoimento
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Autor do Comentário *</Label>
                      <Input value={formAuthor} onChange={(e) => setFormAuthor(e.target.value)} placeholder="Ex: Maria Silva" className="h-12 rounded-xl bg-muted/30 font-bold" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">País/Cidade</Label>
                      <Input value={formCountry} onChange={(e) => setFormCountry(e.target.value)} placeholder="Ex: Brasil / SP" className="h-12 rounded-xl bg-muted/30 font-bold" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Serviço Avaliado</Label>
                    <Select value={formTourId} onValueChange={setFormTourId}>
                      <SelectTrigger className="h-12 rounded-xl bg-muted/30 font-bold"><SelectValue placeholder="Selecione o serviço" /></SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {tours.map((t) => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Pontuação de Experiência</Label>
                    <div className="flex gap-3 bg-muted/20 w-full justify-center py-6 rounded-[2rem] border border-dashed border-border/40">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button key={n} type="button" onClick={() => setFormRating(n)} className="focus:outline-none transition-all hover:scale-110 active:scale-90">
                          <Star size={36} className={cn(
                            "transition-all duration-300",
                            n <= formRating ? "text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]" : "text-slate-200"
                          )} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Texto do Depoimento</Label>
                    <Textarea value={formComment} onChange={(e) => setFormComment(e.target.value)} placeholder="Transcreva o que o cliente enviou..." className="min-h-[120px] rounded-2xl bg-muted/30 border-none focus:ring-primary/20 text-sm leading-relaxed" />
                  </div>
                  <Button onClick={handleCreate} disabled={saving} className="w-full h-14 rounded-2xl font-black uppercase tracking-widest bg-gradient-to-r from-primary to-indigo-600 shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all">
                    {saving ? <Loader2 className="animate-spin mr-2" size={18} /> : <CheckCircle2 size={18} className="mr-2" />}
                    Publicar Agora
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Grid of Reviews */}
      {filtered.length === 0 ? (
        <div className="col-span-full h-80 flex flex-col items-center justify-center space-y-6 bg-white/40 dark:bg-black/20 backdrop-blur-xl rounded-[3rem] border-2 border-dashed border-white/40 dark:border-white/10 animate-pulse">
          <div className="w-20 h-20 rounded-[2rem] bg-muted/20 flex items-center justify-center text-muted-foreground/40 shadow-inner">
            <MessageSquare size={40} />
          </div>
          <div className="text-center">
            <p className="text-xl font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-2">Nenhum depoimento encontrado</p>
            <p className="text-sm font-bold text-muted-foreground/40">Tente ajustar seus filtros de busca</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in-fade" style={{ animationDelay: '0.3s' }}>
          {filtered.map((r, idx) => (
            <div 
              key={r.id} 
              className="glass-card admin-card-hover rounded-[2.5rem] overflow-hidden border border-white/20 bg-white/40 dark:bg-black/20 backdrop-blur-xl shadow-2xl shadow-black/5 group flex flex-col h-full animate-in-slide-up"
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <div className="p-8 flex-1 space-y-6">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-[1.25rem] bg-primary/5 flex items-center justify-center text-primary/40 font-black text-xl border border-primary/10 shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                      {r.author.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-black text-foreground tracking-tight line-clamp-1">{r.author}</h4>
                      <div className="flex items-center gap-2">
                        <MapPin size={10} className="text-primary/60" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{r.country || "Visitante"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-amber-400/10 px-2.5 py-1 rounded-xl flex items-center gap-1">
                    <Star size={12} className="text-amber-500 fill-amber-400" />
                    <span className="text-xs font-black text-amber-600">{r.rating}</span>
                  </div>
                </div>

                <div className="relative">
                  <Quote className="absolute -left-2 -top-2 text-primary/10 w-10 h-10 -z-10" strokeWidth={3} />
                  <p className="text-sm font-medium text-foreground/70 leading-relaxed italic line-clamp-4 relative z-10 pl-4 border-l-2 border-primary/20">
                    "{r.comment || "Experiência maravilhosa, recomendo a todos!"}"
                  </p>
                </div>

                <div className="space-y-3 pt-4">
                  <div className="flex items-center gap-3 bg-white/50 dark:bg-white/5 p-3 rounded-2xl border border-white/40 dark:border-white/10 group/item">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover/item:scale-110 transition-transform">
                      <Compass size={14} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 leading-none mb-1">Referente a</p>
                      <p className="text-xs font-bold text-foreground truncate max-w-[160px]">{r.tour_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-white/50 dark:bg-white/5 p-3 rounded-2xl border border-white/40 dark:border-white/10 group/item">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover/item:scale-110 transition-transform">
                      <Calendar size={14} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 leading-none mb-1">Data</p>
                      <p className="text-xs font-bold text-foreground">{new Date(r.created_at).toLocaleDateString("pt-BR")}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white/20 dark:bg-black/20 border-t border-white/40 dark:border-white/10 flex justify-end">
                <AlertDialog>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-rose-50 text-rose-300 hover:text-rose-500 transition-all border-none">
                            <Trash2 size={18} />
                          </Button>
                        </AlertDialogTrigger>
                      </TooltipTrigger>
                      <TooltipContent className="bg-rose-500 text-white font-black text-[10px] uppercase border-none">Remover Registro</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <AlertDialogContent className="rounded-[2rem] border-none shadow-2xl glass-card">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-xl font-black text-rose-500 flex items-center gap-2">
                        <Trash2 size={24} /> Confirmar Exclusão
                      </AlertDialogTitle>
                      <AlertDialogDescription className="font-medium">
                        Esta ação removerá permanentemente o depoimento de **{r.author}** da vitrine pública e do banco de dados.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="pt-4">
                      <AlertDialogCancel className="rounded-xl font-bold">Manter Depoimento</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(r.id)} className="rounded-xl font-black uppercase text-xs bg-rose-500 hover:bg-rose-600">Sim, Remover Agora</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminAvaliacoes;
