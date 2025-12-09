import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import MainLayout from "@/components/layout/MainLayout";
import { ROUTES } from "@/constants";
import Auth from "./pages/Auth";
import Index from "./pages/Index";
import Anamnese from "./pages/Anamnese";
import Cerimonias from "./pages/Cerimonias";
import Medicinas from "./pages/Medicinas";
import Partilhas from "./pages/Depoimentos";
import Galeria from "./pages/Galeria";
import Loja from "./pages/Loja";
import SobreNos from "./pages/SobreNos";
import Historico from "./pages/Historico";
import FAQ from "./pages/FAQ";
import Emergencia from "./pages/Emergencia";
import Admin from "./pages/Admin";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path={ROUTES.AUTH} element={<Auth />} />
            <Route
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route path={ROUTES.HOME} element={<Index />} />
              <Route path={ROUTES.ANAMNESE} element={<Anamnese />} />
              <Route path={ROUTES.CERIMONIAS} element={<Cerimonias />} />
              <Route path={ROUTES.MEDICINAS} element={<Medicinas />} />
              <Route path={ROUTES.PARTILHAS} element={<Partilhas />} />
              <Route path={ROUTES.GALERIA} element={<Galeria />} />
              <Route path={ROUTES.LOJA} element={<Loja />} />
              <Route path={ROUTES.SOBRE_NOS} element={<SobreNos />} />
              <Route path={ROUTES.HISTORICO} element={<Historico />} />
              <Route path={ROUTES.FAQ} element={<FAQ />} />
              <Route path={ROUTES.EMERGENCIA} element={<Emergencia />} />
              <Route path={ROUTES.CONFIGURACOES} element={<Settings />} />
              <Route
                path={ROUTES.ADMIN}
                element={
                  <ProtectedRoute requireAdmin>
                    <Admin />
                  </ProtectedRoute>
                }
              />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
