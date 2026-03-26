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
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/crm" element={<AdminCRM />} />
          <Route path="/admin/financeiro" element={<AdminFinanceiro />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
