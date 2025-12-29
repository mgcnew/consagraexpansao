import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { HouseProvider } from "@/contexts/HouseContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import MainLayout from "@/components/layout/MainLayout";
import PWAInstallPrompt from "@/components/pwa/PWAInstallPrompt";
import NotificationPermission from "@/components/pwa/NotificationPermission";
import UpdateNotification from "@/components/UpdateNotification";
import { ROUTES } from "@/constants";

// Páginas críticas - carregamento imediato
import Auth from "./pages/Auth";
import Index from "./pages/Index";
import Landing from "./pages/Landing";

// Lazy loading para páginas secundárias
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const RecuperarSenha = lazy(() => import("./pages/RecuperarSenha"));
const Anamnese = lazy(() => import("./pages/Anamnese"));
const Cerimonias = lazy(() => import("./pages/Cerimonias"));
const Cursos = lazy(() => import("./pages/Cursos"));
const Medicinas = lazy(() => import("./pages/Medicinas"));
const Partilhas = lazy(() => import("./pages/Depoimentos"));
const Galeria = lazy(() => import("./pages/Galeria"));
const Loja = lazy(() => import("./pages/Loja"));
const Biblioteca = lazy(() => import("./pages/Biblioteca"));
const Leitura = lazy(() => import("./pages/Leitura"));
const Estudos = lazy(() => import("./pages/Estudos"));
const SobreNos = lazy(() => import("./pages/SobreNos"));
const Historico = lazy(() => import("./pages/Historico"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Emergencia = lazy(() => import("./pages/Emergencia"));
const Admin = lazy(() => import("./pages/Admin"));
const Settings = lazy(() => import("./pages/Settings"));
const Chat = lazy(() => import("./pages/Chat"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Novas páginas do portal multi-tenant
const BuscarCasas = lazy(() => import("./pages/BuscarCasas"));
const CasaPublica = lazy(() => import("./pages/CasaPublica"));
const EntrarConsagrador = lazy(() => import("./pages/EntrarConsagrador"));

// Portal SuperAdmin
const PortalLayout = lazy(() => import("./pages/portal/PortalLayout"));
const PortalDashboard = lazy(() => import("./pages/portal/PortalDashboard"));
const PortalCasas = lazy(() => import("./pages/portal/PortalCasas"));
const PortalPlanos = lazy(() => import("./pages/portal/PortalPlanos"));
const PortalUsuarios = lazy(() => import("./pages/portal/PortalUsuarios"));
const PortalConfig = lazy(() => import("./pages/portal/PortalConfig"));
const PortalFinanceiro = lazy(() => import("./pages/portal/PortalFinanceiro"));

// Loading fallback minimalista
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

// QueryClient otimizado para mobile
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos - reduz refetches
      gcTime: 1000 * 60 * 30, // 30 minutos em cache
      refetchOnWindowFocus: false, // Evita refetch ao voltar para aba
      retry: 1, // Menos retries = mais rápido em caso de erro
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <NotificationProvider>
        <HouseProvider>
          <TooltipProvider>
            <Toaster />
            <PWAInstallPrompt />
            <NotificationPermission />
            <UpdateNotification />
            <BrowserRouter>
            <Routes>
              {/* Rotas públicas do portal */}
              <Route path={ROUTES.LANDING} element={<Landing />} />
              <Route path={ROUTES.AUTH} element={<Auth />} />
              <Route path="/auth/callback" element={<Suspense fallback={<PageLoader />}><AuthCallback /></Suspense>} />
              <Route path="/auth/reset-password" element={<Suspense fallback={<PageLoader />}><RecuperarSenha /></Suspense>} />
              <Route path="/recuperar-senha" element={<Suspense fallback={<PageLoader />}><RecuperarSenha /></Suspense>} />
              <Route path="/entrar" element={<Suspense fallback={<PageLoader />}><EntrarConsagrador /></Suspense>} />
              <Route path={ROUTES.BUSCAR_CASAS} element={<Suspense fallback={<PageLoader />}><BuscarCasas /></Suspense>} />
              
              {/* Página pública da casa (vitrine simplificada) */}
              <Route path="/casa/:slug" element={<Suspense fallback={<PageLoader />}><CasaPublica /></Suspense>} />

              {/* Portal SuperAdmin */}
              <Route path="/portal" element={<Suspense fallback={<PageLoader />}><PortalLayout /></Suspense>}>
                <Route index element={<Suspense fallback={<PageLoader />}><PortalDashboard /></Suspense>} />
                <Route path="casas" element={<Suspense fallback={<PageLoader />}><PortalCasas /></Suspense>} />
                <Route path="planos" element={<Suspense fallback={<PageLoader />}><PortalPlanos /></Suspense>} />
                <Route path="usuarios" element={<Suspense fallback={<PageLoader />}><PortalUsuarios /></Suspense>} />
                <Route path="config" element={<Suspense fallback={<PageLoader />}><PortalConfig /></Suspense>} />
                <Route path="financeiro" element={<Suspense fallback={<PageLoader />}><PortalFinanceiro /></Suspense>} />
              </Route>

              {/* Rotas legadas (área logada - manter compatibilidade) */}
              <Route
                element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/app" element={<Index />} />
                <Route path={ROUTES.ANAMNESE} element={<Suspense fallback={<PageLoader />}><Anamnese /></Suspense>} />
                <Route path={ROUTES.CERIMONIAS} element={<Suspense fallback={<PageLoader />}><Cerimonias /></Suspense>} />
                <Route path={ROUTES.CURSOS} element={<Suspense fallback={<PageLoader />}><Cursos /></Suspense>} />
                <Route path={ROUTES.MEDICINAS} element={<Suspense fallback={<PageLoader />}><Medicinas /></Suspense>} />
                <Route path={ROUTES.PARTILHAS} element={<Suspense fallback={<PageLoader />}><Partilhas /></Suspense>} />
                <Route path={ROUTES.GALERIA} element={<Suspense fallback={<PageLoader />}><Galeria /></Suspense>} />
                <Route path={ROUTES.LOJA} element={<Suspense fallback={<PageLoader />}><Loja /></Suspense>} />
                <Route path={ROUTES.BIBLIOTECA} element={<Suspense fallback={<PageLoader />}><Biblioteca /></Suspense>} />
                <Route path={`${ROUTES.LEITURA}/:ebookId`} element={<Suspense fallback={<PageLoader />}><Leitura /></Suspense>} />
                <Route path={ROUTES.ESTUDOS} element={<Suspense fallback={<PageLoader />}><Estudos /></Suspense>} />
                <Route path={ROUTES.SOBRE_NOS} element={<Suspense fallback={<PageLoader />}><SobreNos /></Suspense>} />
                <Route path={ROUTES.HISTORICO} element={<Suspense fallback={<PageLoader />}><Historico /></Suspense>} />
                <Route path={ROUTES.FAQ} element={<Suspense fallback={<PageLoader />}><FAQ /></Suspense>} />
                <Route path={ROUTES.EMERGENCIA} element={<Suspense fallback={<PageLoader />}><Emergencia /></Suspense>} />
                <Route path={ROUTES.CONFIGURACOES} element={<Suspense fallback={<PageLoader />}><Settings /></Suspense>} />
                <Route path={ROUTES.CHAT} element={<Suspense fallback={<PageLoader />}><Chat /></Suspense>} />
                <Route
                  path={ROUTES.ADMIN}
                  element={
                    <ProtectedRoute requireAdmin>
                      <Suspense fallback={<PageLoader />}><Admin /></Suspense>
                    </ProtectedRoute>
                  }
                />
              </Route>
              <Route path="*" element={<Suspense fallback={<PageLoader />}><NotFound /></Suspense>} />
            </Routes>
          </BrowserRouter>
          </TooltipProvider>
        </HouseProvider>
      </NotificationProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
