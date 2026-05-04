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
import { Star, ThumbsUp, MessageSquare, TrendingUp, Loader2, Trash2, Plus, Search, Filter, Save } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
        tour_name: r.tours?.name || "—",
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
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Avaliações">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Nota Média", value: avgRating, icon: Star, color: "text-amber-600", bg: "bg-amber-100" },
          { label: "Total Reviews", value: reviews.length, icon: MessageSquare, color: "text-primary", bg: "bg-primary/10" },
          { label: "Positivas (4-5★)", value: positiveCount, icon: ThumbsUp, color: "text-emerald-600", bg: "bg-emerald-100" },
          { label: "Nível Satisfação", value: `${satisfactionPct}%`, icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-100" },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm bg-card hover:shadow-md transition-all">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} shadow-inner`}><stat.icon size={24} strokeWidth={2.5} /></div>
              <div>
                <p className="text-2xl font-black text-foreground leading-none">{stat.value}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-2">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col xl:flex-row gap-4 items-center justify-between mb-8 p-4 sm:p-6 bg-card border border-border rounded-3xl shadow-sm">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
          <Input 
            placeholder="Buscar autor, comentário, país..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="pl-12 h-12 rounded-2xl border-muted-foreground/20 focus:ring-primary/20 bg-muted/30 transition-all text-sm font-medium" 
          />
        </div>
        
        <div className="flex gap-2 flex-wrap justify-center">
          <Select value={filterRating} onValueChange={setFilterRating}>
            <SelectTrigger className="h-10 w-40 rounded-xl font-bold">
              <Filter size={14} className="mr-2" />
              <SelectValue placeholder="Filtrar Nota" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas notas</SelectItem>
              {[5, 4, 3, 2, 1].map((n) => (
                <SelectItem key={n} value={String(n)}>{n} estrela{n > 1 ? "s" : ""}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterTour} onValueChange={setFilterTour}>
            <SelectTrigger className="h-10 w-48 rounded-xl font-bold">
              <SelectValue placeholder="Passeio Específico" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos passeios</SelectItem>
              {tours.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DialogTrigger asChild>
                    <button 
                      onClick={resetForm}
                      className="flex-1 md:flex-none bg-primary hover:bg-primary/90 text-primary-foreground h-12 px-8 rounded-2xl text-sm font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-primary/20 transition-all active:scale-95"
                    >
                      <Plus size={20} strokeWidth={3} /> Nova Avaliação
                    </button>
                  </DialogTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Cadastrar avaliação manual</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <DialogContent className="rounded-3xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-black">Nova Avaliação</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Autor do Comentário *</Label>
                  <Input value={formAuthor} onChange={(e) => setFormAuthor(e.target.value)} maxLength={100} placeholder="Nome do cliente" className="rounded-xl h-11 border-border/50" />
                </div>
                <div>
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Passeio Relacionado</Label>
                  <Select value={formTourId} onValueChange={setFormTourId}>
                    <SelectTrigger className="rounded-xl h-11 border-border/50"><SelectValue placeholder="Selecione o passeio" /></SelectTrigger>
                    <SelectContent>
                      {tours.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Pontuação (Estrelas)</Label>
                  <div className="flex gap-2 mt-2 bg-muted/30 w-fit p-2 rounded-2xl border border-border/40">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} type="button" onClick={() => setFormRating(n)} className="focus:outline-none transition-transform active:scale-90">
                        <Star size={28} className={n <= formRating ? "text-amber-500 fill-amber-500" : "text-muted-foreground/30"} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Depoimento do Cliente</Label>
                  <Textarea value={formComment} onChange={(e) => setFormComment(e.target.value)} maxLength={1000} rows={4} placeholder="O que o cliente disse sobre a experiência..." className="rounded-2xl border-border/50 bg-muted/10" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Origem (País/Cidade)</Label>
                    <Input value={formCountry} onChange={(e) => setFormCountry(e.target.value)} maxLength={50} placeholder="Ex: Brasil" className="rounded-xl h-11 border-border/50" />
                  </div>
                </div>
                <Button onClick={handleCreate} disabled={saving} className="w-full h-12 rounded-2xl font-black uppercase tracking-widest bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all mt-4">
                  {saving ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save size={18} className="mr-2" />}
                  Publicar Avaliação
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <Card>
          <div className="p-12 text-center text-muted-foreground">
            <Star className="mx-auto mb-3 opacity-40" size={40} />
            <p className="font-medium">Nenhuma avaliação encontrada</p>
            <p className="text-sm mt-1">As avaliações dos clientes aparecerão aqui.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-foreground">{r.author}</p>
                    <p className="text-sm text-muted-foreground">
                      {r.tour_name} • {new Date(r.created_at).toLocaleDateString("pt-BR")}
                      {r.country && ` • ${r.country}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={16} className={i < r.rating ? "text-amber-500 fill-amber-500" : "text-muted-foreground"} />
                      ))}
                    </div>
                    <AlertDialog>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 size={14} className="text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Remover permanentemente esta avaliação</p>
                        </TooltipContent>
                      </Tooltip>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remover avaliação?</AlertDialogTitle>
                          <AlertDialogDescription>Esta ação não pode ser desfeita. A avaliação de "{r.author}" será removida permanentemente.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(r.id)}>Remover</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminAvaliacoes;
