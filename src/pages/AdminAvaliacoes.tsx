import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, ThumbsUp, MessageSquare, TrendingUp, Loader2, Trash2 } from "lucide-react";
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

const AdminAvaliacoes = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchReviews(); }, []);

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
    if (error) { toast.error("Erro ao remover avaliação."); } 
    else { toast.success("Avaliação removida."); fetchReviews(); }
  };

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
              <p className="text-xs text-muted-foreground">Total Avaliações</p>
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

      {reviews.length === 0 ? (
        <Card>
          <div className="p-12 text-center text-muted-foreground">
            <Star className="mx-auto mb-3 opacity-40" size={40} />
            <p className="font-medium">Nenhuma avaliação encontrada</p>
            <p className="text-sm mt-1">As avaliações dos clientes aparecerão aqui.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
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
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id)}>
                      <Trash2 size={14} className="text-destructive" />
                    </Button>
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
