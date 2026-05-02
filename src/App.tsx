import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AdminRoute from "@/components/AdminRoute";
import Index from "./pages/Index.tsx";
import Seguranca from "./pages/Seguranca.tsx";
import ToursPage from "./pages/ToursPage.tsx";
import TourDetail from "./pages/TourDetail.tsx";
import TransfersPage from "./pages/TransfersPage.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import AdminCRM from "./pages/AdminCRM.tsx";
import AdminFinanceiro from "./pages/AdminFinanceiro.tsx";
import AdminColaboradores from "./pages/AdminColaboradores.tsx";
import AdminParceiros from "./pages/AdminParceiros.tsx";
import AdminPasseios from "./pages/AdminPasseios.tsx";
import AdminReservas from "./pages/AdminReservas.tsx";
import AdminTranslados from "./pages/AdminTranslados.tsx";
import AdminAvaliacoes from "./pages/AdminAvaliacoes.tsx";
import AdminConfig from "./pages/AdminConfig.tsx";
import AdminMarketing from "./pages/AdminMarketing.tsx";
import AdminIA from "./pages/AdminIA.tsx";
import AdminDocumentos from "./pages/AdminDocumentos.tsx";
import AdminLogin from "./pages/AdminLogin.tsx";
import CheckoutPage from "./pages/CheckoutPage.tsx";
import MinhasReservas from "./pages/MinhasReservas.tsx";
import AdminSGSDashboard from "./pages/AdminSGSDashboard.tsx";
import AdminSGSRiscos from "./pages/AdminSGSRiscos.tsx";
import AdminSGSIncidentes from "./pages/AdminSGSIncidentes.tsx";
import AdminSGSAcoes from "./pages/AdminSGSAcoes.tsx";
import AdminSGSEquipe from "./pages/AdminSGSEquipe.tsx";
import AdminSGSAuditorias from "./pages/AdminSGSAuditorias.tsx";
import AdminSGSFornecedores from "./pages/AdminSGSFornecedores.tsx";
import AdminSGSTermos from "./pages/AdminSGSTermos.tsx";
import AdminSGSBriefings from "./pages/AdminSGSBriefings.tsx";
import AdminSGSPesquisas from "./pages/AdminSGSPesquisas.tsx";
import AdminSGSEmpresa from "./pages/AdminSGSEmpresa.tsx";
import AdminSGSVeiculos from "./pages/AdminSGSVeiculos.tsx";
import AdminSGSCondutores from "./pages/AdminSGSCondutores.tsx";
import AdminSGSCondutoresVisitantes from "./pages/AdminSGSCondutoresVisitantes.tsx";
import AdminSGSChecklists from "./pages/AdminSGSChecklists.tsx";
import AdminSGSRotas from "./pages/AdminSGSRotas.tsx";
import AdminSGSPGSAT from "./pages/AdminSGSPGSAT.tsx";
import AdminSGSControles from "./pages/AdminSGSControles.tsx";
import AdminRelatorios from "./pages/AdminRelatorios.tsx";
import AdminAjuda from "./pages/AdminAjuda.tsx";
import TermoAssinatura from "./pages/TermoAssinatura.tsx";
import PackageDetail from "./pages/PackageDetail.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/seguranca" element={<Seguranca />} />
          <Route path="/passeios" element={<ToursPage />} />
          <Route path="/passeios/:slug" element={<TourDetail />} />
          <Route path="/translados" element={<TransfersPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/minhas-reservas" element={<MinhasReservas />} />
          <Route path="/pacotes/:slug" element={<PackageDetail />} />
          <Route path="/assinatura-termo" element={<TermoAssinatura />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/crm" element={<AdminRoute><AdminCRM /></AdminRoute>} />
          <Route path="/admin/financeiro" element={<AdminRoute><AdminFinanceiro /></AdminRoute>} />
          <Route path="/admin/colaboradores" element={<AdminRoute><AdminColaboradores /></AdminRoute>} />
          <Route path="/admin/parceiros" element={<AdminRoute><AdminParceiros /></AdminRoute>} />
          <Route path="/admin/passeios" element={<AdminRoute><AdminPasseios /></AdminRoute>} />
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
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
