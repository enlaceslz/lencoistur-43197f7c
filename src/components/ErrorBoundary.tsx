import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * App-level safety net. A single render-time exception (e.g. mapping over a
 * null value from Supabase) used to unmount the entire React tree and leave a
 * blank white page. This boundary catches it, logs it, and shows a friendly
 * fallback with a retry — keeping the site usable instead of dead.
 *
 * It also auto-recovers whenever the user navigates (client-side route change),
 * so a transient error on one page doesn't trap the visitor on the error screen.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary] Render error captured:", error, info.componentStack);
  }

  componentDidMount() {
    // Reset the boundary on any client-side navigation (back/forward/link click).
    window.addEventListener("popstate", this.handleRouteChange);
    const originalPush = window.history.pushState;
    const originalReplace = window.history.replaceState;
    window.history.pushState = (...args: Parameters<typeof originalPush>) => {
      const result = originalPush.apply(window.history, args);
      this.handleRouteChange();
      return result;
    };
    window.history.replaceState = (...args: Parameters<typeof originalReplace>) => {
      const result = originalReplace.apply(window.history, args);
      this.handleRouteChange();
      return result;
    };
  }

  componentWillUnmount() {
    window.removeEventListener("popstate", this.handleRouteChange);
  }

  handleRouteChange = () => {
    if (this.state.hasError) this.setState({ hasError: false, error: null });
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleHome = () => {
    window.location.href = "/";
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
        <div className="w-20 h-20 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-6">
          <AlertTriangle size={40} />
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground mb-2">
          Ops! Algo deu errado
        </h1>
        <p className="text-muted-foreground max-w-md mb-2">
          Encontramos um erro inesperado ao exibir esta página. Você pode tentar novamente ou voltar ao início.
        </p>
        {this.state.error?.message && (
          <p className="text-xs text-muted-foreground/70 max-w-md mb-8 font-mono break-words">
            {this.state.error.message}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={this.handleRetry}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-bold transition-colors hover:bg-primary/90"
          >
            <RotateCcw size={16} /> Tentar novamente
          </button>
          <button
            onClick={this.handleHome}
            className="inline-flex items-center gap-2 border border-border text-foreground px-6 py-3 rounded-lg font-bold transition-colors hover:bg-muted"
          >
            <Home size={16} /> Voltar ao início
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
