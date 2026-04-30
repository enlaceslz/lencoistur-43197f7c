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
import { Star, ThumbsUp, MessageSquare, TrendingUp, Loader2, Trash2, Plus, Search, Filter } from "lucide-react";
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
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-muted text-amber-600"><Star size={22} /></div>
            <div>
              <p className="text-2xl font-bold text-foreground">{avgRating}</p>
              <p className="text-xs text-muted-foreground">Nota Média</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-muted text-primary"><MessageSquare size={22} /></div>
            <div>
              <p className="text-2xl font-bold text-foreground">{reviews.length}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-muted text-green-600"><ThumbsUp size={22} /></div>
            <div>
              <p className="text-2xl font-bold text-foreground">{positiveCount}</p>
              <p className="text-xs text-muted-foreground">Positivas (4-5★)</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-muted text-blue-600"><TrendingUp size={22} /></div>
            <div>
              <p className="text-2xl font-bold text-foreground">{satisfactionPct}%</p>
              <p className="text-xs text-muted-foreground">Satisfação</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input placeholder="Buscar autor, comentário, país..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterRating} onValueChange={setFilterRating}>
          <SelectTrigger className="w-full md:w-40">
            <Filter size={14} className="mr-1" />
            <SelectValue placeholder="Nota" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas notas</SelectItem>
            {[5, 4, 3, 2, 1].map((n) => (
              <SelectItem key={n} value={String(n)}>{n} estrela{n > 1 ? "s" : ""}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterTour} onValueChange={setFilterTour}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Passeio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos passeios</SelectItem>
            {tours.map((t) => (
              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <Tooltip>
            <TooltipTrigger asChild>
              <DialogTrigger asChild>
                <Button onClick={resetForm}><Plus size={16} className="mr-1" /> Nova Avaliação</Button>
              </DialogTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Cadastrar avaliação manual de cliente</p>
            </TooltipContent>
          </Tooltip>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova Avaliação</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Autor *</Label>
                <Input value={formAuthor} onChange={(e) => setFormAuthor(e.target.value)} maxLength={100} placeholder="Nome do cliente" />
              </div>
              <div>
                <Label>Passeio</Label>
                <Select value={formTourId} onValueChange={setFormTourId}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {tours.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Nota</Label>
                <div className="flex gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" onClick={() => setFormRating(n)} className="focus:outline-none">
                      <Star size={24} className={n <= formRating ? "text-amber-500 fill-amber-500" : "text-muted-foreground"} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Comentário</Label>
                <Textarea value={formComment} onChange={(e) => setFormComment(e.target.value)} maxLength={1000} rows={3} placeholder="Comentário do cliente" />
              </div>
              <div>
                <Label>País</Label>
                <Input value={formCountry} onChange={(e) => setFormCountry(e.target.value)} maxLength={50} placeholder="Ex: Brasil" />
              </div>
              <Button onClick={handleCreate} disabled={saving} className="w-full">
                {saving ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                Salvar Avaliação
              </Button>
            </div>
            </DialogContent>
        </Dialog>
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
