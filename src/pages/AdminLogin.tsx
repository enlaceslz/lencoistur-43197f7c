import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, MapPin } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user && isAdmin) {
      navigate("/admin", { replace: true });
    }
  }, [authLoading, user, isAdmin, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await signIn(email, password);
    if (error) {
      setError("Credenciais inválidas. Verifique email e senha.");
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsl(174, 62%, 28%), hsl(195, 80%, 35%))" }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "linear-gradient(135deg, hsl(174, 62%, 28%), hsl(195, 80%, 35%))" }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
              <MapPin size={24} className="text-secondary-foreground" />
            </div>
          </div>
          <h1 className="font-display text-3xl font-bold text-white">
            Lençóis<span className="text-secondary">Tour</span>
          </h1>
          <p className="text-white/60 text-sm mt-2">Painel Administrativo</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <h2 className="font-display text-xl font-bold text-foreground">Bem-vindo de volta</h2>
            <p className="text-muted-foreground text-sm mt-1">Faça login para acessar o painel</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="text-sm font-semibold text-foreground mb-1.5 block">E-mail</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@lencoistour.com"
                  className="w-full bg-muted border border-border rounded-xl pl-11 pr-4 py-3 text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/50"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground mb-1.5 block">Senha</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-muted border border-border rounded-xl pl-11 pr-12 py-3 text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/50"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-destructive text-sm text-center bg-destructive/10 rounded-lg py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground py-3.5 rounded-xl font-semibold transition-colors disabled:opacity-60"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>

        <p className="text-center text-white/40 text-xs mt-6">
          © 2026 LençóisTour. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
