import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import ToursPage from "./pages/ToursPage.tsx";
import TourDetail from "./pages/TourDetail.tsx";
import TransfersPage from "./pages/TransfersPage.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import AdminCRM from "./pages/AdminCRM.tsx";
import AdminFinanceiro from "./pages/AdminFinanceiro.tsx";
import AdminParceiros from "./pages/AdminParceiros.tsx";
import AdminPasseios from "./pages/AdminPasseios.tsx";
import AdminReservas from "./pages/AdminReservas.tsx";
import AdminTranslados from "./pages/AdminTranslados.tsx";
import AdminAvaliacoes from "./pages/AdminAvaliacoes.tsx";
import AdminConfig from "./pages/AdminConfig.tsx";
import AdminMarketing from "./pages/AdminMarketing.tsx";
import AdminLogin from "./pages/AdminLogin.tsx";
import CheckoutPage from "./pages/CheckoutPage.tsx";
import MinhasReservas from "./pages/MinhasReservas.tsx";
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
          <Route path="/passeios" element={<ToursPage />} />
          <Route path="/passeios/:slug" element={<TourDetail />} />
          <Route path="/translados" element={<TransfersPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/minhas-reservas" element={<MinhasReservas />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/crm" element={<AdminCRM />} />
          <Route path="/admin/financeiro" element={<AdminFinanceiro />} />
          <Route path="/admin/parceiros" element={<AdminParceiros />} />
          <Route path="/admin/passeios" element={<AdminPasseios />} />
          <Route path="/admin/reservas" element={<AdminReservas />} />
          <Route path="/admin/translados" element={<AdminTranslados />} />
          <Route path="/admin/avaliacoes" element={<AdminAvaliacoes />} />
          <Route path="/admin/config" element={<AdminConfig />} />
          <Route path="/admin/marketing" element={<AdminMarketing />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
