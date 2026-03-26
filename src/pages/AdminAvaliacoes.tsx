import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, ThumbsUp, MessageSquare, TrendingUp } from "lucide-react";

const reviews = [
  { id: 1, client: "João Silva", tour: "Lagoas Azul e Bonita", rating: 5, comment: "Experiência incrível! Guia muito atencioso e as lagoas são de tirar o fôlego.", date: "2024-03-10", status: "publicada" },
  { id: 2, client: "Maria Santos", tour: "Rio Preguiças", rating: 5, comment: "Passeio maravilhoso, valeu cada centavo. Os faróis e Caburé são incríveis.", date: "2024-03-08", status: "publicada" },
  { id: 3, client: "John Smith", tour: "Trekking Lençóis", rating: 4, comment: "Amazing trekking experience. The guide was very knowledgeable.", date: "2024-03-06", status: "publicada" },
  { id: 4, client: "Ana Costa", tour: "Quadriciclo", rating: 5, comment: "Adrenalina pura! Muito divertido e seguro. Super recomendo!", date: "2024-03-04", status: "publicada" },
  { id: 5, client: "Pedro Lima", tour: "Passeio de Lancha", rating: 3, comment: "Bom passeio mas o tempo estava nublado. Equipe muito profissional.", date: "2024-03-02", status: "pendente" },
  { id: 6, client: "Sophie Martin", tour: "Lagoas Azul e Bonita", rating: 5, comment: "Un endroit magique! Le guide parlait français, c'était parfait.", date: "2024-02-28", status: "publicada" },
];

const avgRating = (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1);

const AdminAvaliacoes = () => {
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
              <p className="text-2xl font-bold text-foreground">{reviews.filter(r => r.rating >= 4).length}</p>
              <p className="text-xs text-muted-foreground">Positivas (4-5★)</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-muted text-blue-600"><TrendingUp size={22} /></div>
            <div>
              <p className="text-2xl font-bold text-foreground">{Math.round((reviews.filter(r => r.rating >= 4).length / reviews.length) * 100)}%</p>
              <p className="text-xs text-muted-foreground">Satisfação</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {reviews.map((r) => (
          <Card key={r.id}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-foreground">{r.client}</p>
                  <p className="text-sm text-muted-foreground">{r.tour} • {new Date(r.date).toLocaleDateString("pt-BR")}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={16} className={i < r.rating ? "text-amber-500 fill-amber-500" : "text-muted-foreground"} />
                    ))}
                  </div>
                  <Badge variant="secondary" className={r.status === "publicada" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"}>
                    {r.status}
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{r.comment}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminLayout>
  );
};

export default AdminAvaliacoes;
