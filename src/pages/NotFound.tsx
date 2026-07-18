import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import SEO from "@/components/SEO";
import { useLocalizedPath } from "@/lib/useLocalizedPath";

const NotFound = () => {
  const location = useLocation();
  const loc = useLocalizedPath();

  useEffect(() => {
    console.error("404: rota inexistente acessada:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <SEO
        title="Página não encontrada (404) | Lençóis Tour"
        description="A página que você procura não existe ou foi movida. Volte ao início para encontrar os melhores passeios nos Lençóis Maranhenses."
        path="/404"
      />
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Página não encontrada</p>
        <Link to={loc("/")} className="text-primary underline hover:text-primary/90">
          Voltar ao início
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
