import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AdminRoute from "@/components/AdminRoute";
import LanguageLayout from "@/components/LanguageLayout";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";

// Public routes — keep eager for fast first paint on marketing site
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";

// Public but heavier — lazy
const Seguranca = lazy(() => import("./pages/Seguranca.tsx"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy.tsx"));
const ToursPage = lazy(() => import("./pages/ToursPage.tsx"));
const TourDetail = lazy(() => import("./pages/TourDetail.tsx"));
const TransfersPage = lazy(() => import("./pages/TransfersPage.tsx"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage.tsx"));
const MinhasReservas = lazy(() => import("./pages/MinhasReservas.tsx"));
const PackageDetail = lazy(() => import("./pages/PackageDetail.tsx"));
const TermoAssinatura = lazy(() => import("./pages/TermoAssinatura.tsx"));
const VoucherPage = lazy(() => import("./pages/VoucherPage.tsx"));
const AdminLogin = lazy(() => import("./pages/AdminLogin.tsx"));

// Admin routes — all lazy (never loaded for public visitors)
const AdminDashboard = lazy(() => import("./pages/AdminDashboard.tsx"));
const AdminCRM = lazy(() => import("./pages/AdminCRM.tsx"));
const AdminFinanceiro = lazy(() => import("./pages/AdminFinanceiro.tsx"));
const AdminColaboradores = lazy(() => import("./pages/AdminColaboradores.tsx"));
const AdminParceiros = lazy(() => import("./pages/AdminParceiros.tsx"));
const AdminPasseios = lazy(() => import("./pages/AdminPasseios.tsx"));
const AdminPacotes = lazy(() => import("./pages/AdminPacotes.tsx"));
const AdminReservas = lazy(() => import("./pages/AdminReservas.tsx"));
const AdminTranslados = lazy(() => import("./pages/AdminTranslados.tsx"));
const AdminAvaliacoes = lazy(() => import("./pages/AdminAvaliacoes.tsx"));
const AdminConfig = lazy(() => import("./pages/AdminConfig.tsx"));
const AdminMarketing = lazy(() => import("./pages/AdminMarketing.tsx"));
const AdminIA = lazy(() => import("./pages/AdminIA.tsx"));
const AdminDocumentos = lazy(() => import("./pages/AdminDocumentos.tsx"));
const AdminSGSDashboard = lazy(() => import("./pages/AdminSGSDashboard.tsx"));
const AdminSGSRiscos = lazy(() => import("./pages/AdminSGSRiscos.tsx"));
const AdminSGSIncidentes = lazy(() => import("./pages/AdminSGSIncidentes.tsx"));
const AdminSGSAcoes = lazy(() => import("./pages/AdminSGSAcoes.tsx"));
const AdminSGSEquipe = lazy(() => import("./pages/AdminSGSEquipe.tsx"));
const AdminSGSAuditorias = lazy(() => import("./pages/AdminSGSAuditorias.tsx"));
const AdminSGSFornecedores = lazy(() => import("./pages/AdminSGSFornecedores.tsx"));
const AdminSGSTermos = lazy(() => import("./pages/AdminSGSTermos.tsx"));
const AdminSGSBriefings = lazy(() => import("./pages/AdminSGSBriefings.tsx"));
const AdminSGSPesquisas = lazy(() => import("./pages/AdminSGSPesquisas.tsx"));
const AdminSGSEmpresa = lazy(() => import("./pages/AdminSGSEmpresa.tsx"));
const AdminSGSVeiculos = lazy(() => import("./pages/AdminSGSVeiculos.tsx"));
const AdminSGSCondutores = lazy(() => import("./pages/AdminSGSCondutores.tsx"));
const AdminSGSCondutoresVisitantes = lazy(() => import("./pages/AdminSGSCondutoresVisitantes.tsx"));
const AdminSGSChecklists = lazy(() => import("./pages/AdminSGSChecklists.tsx"));
const AdminSGSRotas = lazy(() => import("./pages/AdminSGSRotas.tsx"));
const AdminSGSPGSAT = lazy(() => import("./pages/AdminSGSPGSAT.tsx"));
const AdminSGSControles = lazy(() => import("./pages/AdminSGSControles.tsx"));
const AdminRelatorios = lazy(() => import("./pages/AdminRelatorios.tsx"));
const AdminAjuda = lazy(() => import("./pages/AdminAjuda.tsx"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const RouteFallback = () => (
  <div className="flex min-h-[60vh] items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <CookieConsentBanner />
      <BrowserRouter>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/seguranca" element={<Seguranca />} />
            <Route path="/politica-de-privacidade" element={<PrivacyPolicy />} />
            <Route path="/passeios" element={<ToursPage />} />
            <Route path="/passeios/:slug" element={<TourDetail />} />
            <Route path="/translados" element={<TransfersPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/minhas-reservas" element={<MinhasReservas />} />
            <Route path="/pacotes/:slug" element={<PackageDetail />} />
            <Route path="/assinatura-termo" element={<TermoAssinatura />} />
            <Route path="/voucher" element={<VoucherPage />} />

            <Route path="/admin/login" element={<AdminLogin />} />

            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/crm" element={<AdminRoute><AdminCRM /></AdminRoute>} />
            <Route path="/admin/financeiro" element={<AdminRoute><AdminFinanceiro /></AdminRoute>} />
            <Route path="/admin/colaboradores" element={<AdminRoute><AdminColaboradores /></AdminRoute>} />
            <Route path="/admin/parceiros" element={<AdminRoute><AdminParceiros /></AdminRoute>} />
            <Route path="/admin/passeios" element={<AdminRoute><AdminPasseios /></AdminRoute>} />
            <Route path="/admin/pacotes" element={<AdminRoute><AdminPacotes /></AdminRoute>} />
            <Route path="/admin/reservas" element={<AdminRoute><AdminReservas /></AdminRoute>} />
            <Route path="/admin/translados" element={<AdminRoute><AdminTranslados /></AdminRoute>} />
            <Route path="/admin/avaliacoes" element={<AdminRoute><AdminAvaliacoes /></AdminRoute>} />
            <Route path="/admin/config" element={<AdminRoute><AdminConfig /></AdminRoute>} />
            <Route path="/admin/marketing" element={<AdminRoute><AdminMarketing /></AdminRoute>} />
            <Route path="/admin/ia" element={<AdminRoute><AdminIA /></AdminRoute>} />
            <Route path="/admin/documentos" element={<AdminRoute><AdminDocumentos /></AdminRoute>} />
            <Route path="/admin/sgs" element={<AdminRoute><AdminSGSDashboard /></AdminRoute>} />
            <Route path="/admin/sgs/empresa" element={<AdminRoute><AdminSGSEmpresa /></AdminRoute>} />
            <Route path="/admin/sgs/veiculos" element={<AdminRoute><AdminSGSVeiculos /></AdminRoute>} />
            <Route path="/admin/sgs/condutores" element={<AdminRoute><AdminSGSCondutores /></AdminRoute>} />
            <Route path="/admin/sgs/condutores-visitantes" element={<AdminRoute><AdminSGSCondutoresVisitantes /></AdminRoute>} />
            <Route path="/admin/sgs/riscos" element={<AdminRoute><AdminSGSRiscos /></AdminRoute>} />
            <Route path="/admin/sgs/checklists" element={<AdminRoute><AdminSGSChecklists /></AdminRoute>} />
            <Route path="/admin/sgs/incidentes" element={<AdminRoute><AdminSGSIncidentes /></AdminRoute>} />
            <Route path="/admin/sgs/acoes" element={<AdminRoute><AdminSGSAcoes /></AdminRoute>} />
            <Route path="/admin/sgs/equipe" element={<AdminRoute><AdminSGSEquipe /></AdminRoute>} />
            <Route path="/admin/sgs/auditorias" element={<AdminRoute><AdminSGSAuditorias /></AdminRoute>} />
            <Route path="/admin/sgs/fornecedores" element={<AdminRoute><AdminSGSFornecedores /></AdminRoute>} />
            <Route path="/admin/sgs/rotas" element={<AdminRoute><AdminSGSRotas /></AdminRoute>} />
            <Route path="/admin/sgs/pgsat" element={<AdminRoute><AdminSGSPGSAT /></AdminRoute>} />
            <Route path="/admin/sgs/termos" element={<AdminRoute><AdminSGSTermos /></AdminRoute>} />
            <Route path="/admin/sgs/controles" element={<AdminRoute><AdminSGSControles /></AdminRoute>} />
            <Route path="/admin/sgs/briefings" element={<AdminRoute><AdminSGSBriefings /></AdminRoute>} />
            <Route path="/admin/sgs/pesquisas" element={<AdminRoute><AdminSGSPesquisas /></AdminRoute>} />
            <Route path="/admin/relatorios" element={<AdminRoute><AdminRelatorios /></AdminRoute>} />
            <Route path="/admin/ajuda" element={<AdminRoute><AdminAjuda /></AdminRoute>} />

            <Route path="/:lang" element={<LanguageLayout />}>
              <Route index element={<Index />} />
              <Route path="seguranca" element={<Seguranca />} />
              <Route path="politica-de-privacidade" element={<PrivacyPolicy />} />
              <Route path="passeios" element={<ToursPage />} />
              <Route path="passeios/:slug" element={<TourDetail />} />
              <Route path="translados" element={<TransfersPage />} />
              <Route path="checkout" element={<CheckoutPage />} />
              <Route path="minhas-reservas" element={<MinhasReservas />} />
              <Route path="pacotes/:slug" element={<PackageDetail />} />
              <Route path="assinatura-termo" element={<TermoAssinatura />} />
              <Route path="voucher" element={<VoucherPage />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
