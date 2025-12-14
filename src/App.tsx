import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import MainLayout from "@/components/layout/MainLayout";
import PWAInstallPrompt from "@/components/pwa/PWAInstallPrompt";
import NotificationPermission from "@/components/pwa/NotificationPermission";
import OneSignalInit from "@/components/pwa/OneSignalInit";
import { ROUTES } from "@/constants";
import Auth from "./pages/Auth";
import Index from "./pages/Index";
import Anamnese from "./pages/Anamnese";
import Cerimonias from "./pages/Cerimonias";
import Cursos from "./pages/Cursos";
import Medicinas from "./pages/Medicinas";
import Partilhas from "./pages/Depoimentos";
import Galeria from "./pages/Galeria";
import Loja from "./pages/Loja";
import Biblioteca from "./pages/Biblioteca";
import Leitura from "./pages/Leitura";
import SobreNos from "./pages/SobreNos";
import Historico from "./pages/Historico";
import FAQ from "./pages/FAQ";
import Emergencia from "./pages/Emergencia";
import Admin from "./pages/Admin";
import Settings from "./pages/Settings";
import Chat from "./pages/Chat";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <NotificationProvider>
        <TooltipProvider>
          <Toaster />
          <PWAInstallPrompt />
          <NotificationPermission />
          <OneSignalInit />
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
              <Route path={ROUTES.CURSOS} element={<Cursos />} />
              <Route path={ROUTES.MEDICINAS} element={<Medicinas />} />
              <Route path={ROUTES.PARTILHAS} element={<Partilhas />} />
              <Route path={ROUTES.GALERIA} element={<Galeria />} />
              <Route path={ROUTES.LOJA} element={<Loja />} />
              <Route path={ROUTES.BIBLIOTECA} element={<Biblioteca />} />
              <Route path={`${ROUTES.LEITURA}/:ebookId`} element={<Leitura />} />
              <Route path={ROUTES.SOBRE_NOS} element={<SobreNos />} />
              <Route path={ROUTES.HISTORICO} element={<Historico />} />
              <Route path={ROUTES.FAQ} element={<FAQ />} />
              <Route path={ROUTES.EMERGENCIA} element={<Emergencia />} />
              <Route path={ROUTES.CONFIGURACOES} element={<Settings />} />
              <Route path={ROUTES.CHAT} element={<Chat />} />
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
      </NotificationProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
