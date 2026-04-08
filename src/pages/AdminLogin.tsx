import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, MapPin, Shield, AlertTriangle, Waves } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading, signIn, signOut } = useAuth();
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

  const isNonAdmin = !authLoading && user && !isAdmin;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || trimmedEmail.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("E-mail inválido.");
      setLoading(false);
      return;
    }

    if (password.length < 6 || password.length > 128) {
      setError("A senha deve ter entre 6 e 128 caracteres.");
      setLoading(false);
      return;
    }

    const { error } = await signIn(trimmedEmail, password);
    if (error) {
      setError("Credenciais inválidas. Verifique email e senha.");
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a1628] via-[#0d2847] to-[#0a1628]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-t-2 border-secondary" />
          <span className="text-white/50 text-sm">Carregando...</span>
        </div>
      </div>
    );
  }

  if (isNonAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-[#0a1628] via-[#0d2847] to-[#0a1628] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-secondary/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        <div className="w-full max-w-md text-center relative z-10">
          <div className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl p-8 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} className="text-destructive" />
            </div>
            <h2 className="font-display text-xl font-bold text-foreground mb-2">Acesso Negado</h2>
            <p className="text-muted-foreground text-sm mb-6">
              A conta <strong className="text-foreground">{user?.email}</strong> não possui permissão de administrador.
            </p>
            <button
              onClick={() => signOut()}
              className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground py-3 rounded-xl font-semibold transition-all active:scale-[0.98]"
            >
              Sair e usar outra conta
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-[#0a1628] via-[#0d2847] to-[#0a1628] relative overflow-hidden">
      {/* Ambient effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-secondary/8 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[200px] bg-blue-500/5 rounded-full blur-[80px]" />
        <div className="absolute top-1/3 right-0 w-[300px] h-[300px] bg-teal-500/5 rounded-full blur-[80px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-secondary to-secondary/80 shadow-lg shadow-secondary/20 mb-5 relative">
            <Waves size={36} className="text-secondary-foreground" />
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-[#0d2847] flex items-center justify-center">
              <Shield size={10} className="text-white" />
            </div>
          </div>
          <h1 className="font-display text-3xl font-bold text-white tracking-tight">
            Lençóis<span className="text-secondary">Tour</span>
          </h1>
          <p className="text-white/40 text-sm mt-2 flex items-center justify-center gap-1.5">
            <Lock size={13} />
            Painel Administrativo
          </p>
        </div>

        {/* Card */}
        <div className="bg-card/90 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl shadow-black/20">
          <div className="text-center mb-6">
            <h2 className="font-display text-xl font-bold text-foreground">Bem-vindo de volta</h2>
            <p className="text-muted-foreground text-sm mt-1">Faça login para acessar o painel</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="login-email" className="text-sm font-semibold text-foreground mb-1.5 block">
                E-mail
              </label>
              <div className="relative group">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-secondary transition-colors pointer-events-none" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full bg-muted/50 border border-border/50 rounded-xl pl-11 pr-4 py-3 text-foreground text-sm outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary/50 placeholder:text-muted-foreground/40 transition-all"
                  required
                  autoComplete="email"
                  maxLength={255}
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="text-sm font-semibold text-foreground mb-1.5 block">
                Senha
              </label>
              <div className="relative group">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-secondary transition-colors pointer-events-none" />
                <input
                  id="login-password"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-muted/50 border border-border/50 rounded-xl pl-11 pr-12 py-3 text-foreground text-sm outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary/50 placeholder:text-muted-foreground/40 transition-all"
                  required
                  minLength={6}
                  maxLength={128}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPass ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 border border-destructive/20 rounded-lg py-2.5 px-3 animate-in fade-in slide-in-from-top-1 duration-200">
                <AlertTriangle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-secondary to-secondary/90 hover:from-secondary/90 hover:to-secondary/80 text-secondary-foreground py-3.5 rounded-xl font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-secondary/20 hover:shadow-xl hover:shadow-secondary/30 active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-secondary-foreground" />
                  Entrando...
                </span>
              ) : (
                "Entrar"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-white/25 text-xs mt-6">
          © 2026 LençóisTour · Santo Amaro, MA
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
