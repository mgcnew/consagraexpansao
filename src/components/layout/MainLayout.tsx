import React from 'react';
import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ModeToggle } from '@/components/mode-toggle';
import { ROUTES } from '@/constants';
import NotificationBell from '@/components/layout/NotificationBell';
import Sidebar from '@/components/layout/Sidebar';
import { WelcomeModal, InstallPWAPrompt } from '@/components/shared';
import { getAllNavItems } from '@/constants/navigation';
import { useUserAnamnese } from '@/hooks/queries/useProfiles';

const SIDEBAR_COLLAPSED_KEY = 'sidebar-collapsed';

const MainLayout: React.FC = () => {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [userName, setUserName] = React.useState<string>('');
  const [userAvatar, setUserAvatar] = React.useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(() => {
    const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    return saved === 'true';
  });

  // Verificar se usuário tem anamnese preenchida
  const { data: anamnese, isLoading: isLoadingAnamnese } = useUserAnamnese(user?.id);
  
  // Páginas que não requerem anamnese (a própria página de anamnese e auth)
  const isAnamnesePage = location.pathname === ROUTES.ANAMNESE;
  const requiresAnamnese = !isAnamnesePage && !isLoadingAnamnese && !anamnese;

  // Buscar nome e avatar do usuário do perfil e salvar dados do pré-cadastro
  React.useEffect(() => {
    const fetchAndUpdateProfile = async () => {
      if (!user?.id) return;
      
      try {
        // Verificar se há dados de pré-cadastro no localStorage
        const preRegisterData = localStorage.getItem('pre_register_data');
        
        if (preRegisterData) {
          const { nome, dataNascimento } = JSON.parse(preRegisterData);
          
          // Atualizar profile com dados do pré-cadastro
          await supabase
            .from('profiles')
            .update({
              full_name: nome,
              birth_date: dataNascimento,
            })
            .eq('id', user.id);
          
          // Limpar dados do localStorage
          localStorage.removeItem('pre_register_data');
          
          setUserName(nome);
        }

        // Buscar dados do profile
        const { data } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', user.id)
          .single();
        
        if (data?.full_name) {
          setUserName(data.full_name);
        }
        if (data?.avatar_url) {
          setUserAvatar(data.avatar_url);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchAndUpdateProfile();
  }, [user?.id]);

  // Fechar menu ao mudar de rota
  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    navigate(ROUTES.AUTH);
  };

  const handleToggleSidebar = () => {
    setSidebarCollapsed(prev => {
      const newValue = !prev;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(newValue));
      return newValue;
    });
  };

  const allNavItems = getAllNavItems(isAdmin);

  // Se está carregando a verificação de anamnese, mostrar loading
  if (isLoadingAnamnese && !isAnamnesePage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Se não tem anamnese e não está na página de anamnese, redirecionar
  if (requiresAnamnese) {
    return <Navigate to={ROUTES.ANAMNESE} replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <WelcomeModal />
      <InstallPWAPrompt />
      
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          isAdmin={isAdmin}
          collapsed={sidebarCollapsed}
          onToggle={handleToggleSidebar}
          onSignOut={handleSignOut}
        />
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 px-2 pt-2">
        <header className="mx-auto rounded-2xl border border-border/50 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 shadow-lg shadow-black/5">
          <div className="flex h-14 items-center justify-between px-4">
            <div
              className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate(ROUTES.ANAMNESE)}
            >
              <Avatar className="w-9 h-9 border-2 border-primary/20">
                <AvatarImage src={userAvatar || undefined} alt={userName} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                  {userName?.charAt(0)?.toUpperCase() || <User className="w-4 h-4" />}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-0">
                <span className="text-[10px] text-muted-foreground font-medium">Bem-vindo</span>
                <span className="text-sm font-semibold text-foreground truncate max-w-[120px]">
                  {userName?.split(' ')[0] || 'Usuário'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <NotificationBell />
              <ModeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="relative w-10 h-10 p-2"
                aria-label={isMobileMenuOpen ? "Fechar menu" : "Abrir menu"}
                aria-expanded={isMobileMenuOpen}
              >
                <span className="sr-only">{isMobileMenuOpen ? "Fechar menu" : "Abrir menu"}</span>
                <div className="relative w-5 h-5">
                  <span
                    className={cn(
                      "absolute left-0 w-5 h-0.5 bg-current transition-all duration-300 ease-in-out",
                      isMobileMenuOpen ? "top-[9px] rotate-45" : "top-1 rotate-0"
                    )}
                  />
                  <span
                    className={cn(
                      "absolute left-0 top-[9px] w-5 h-0.5 bg-current transition-all duration-200",
                      isMobileMenuOpen ? "opacity-0 scale-0" : "opacity-100 scale-100"
                    )}
                  />
                  <span
                    className={cn(
                      "absolute left-0 w-5 h-0.5 bg-current transition-all duration-300 ease-in-out",
                      isMobileMenuOpen ? "top-[9px] -rotate-45" : "top-[17px] rotate-0"
                    )}
                  />
                </div>
              </Button>
            </div>
          </div>

          {/* Mobile Navigation Overlay */}
          <div
            className={cn(
              "fixed inset-0 top-20 bg-black/20 backdrop-blur-sm transition-opacity duration-300 z-40",
              isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            )}
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Mobile Navigation Menu */}
          <nav
            className={cn(
              "absolute top-full left-0 right-0 mt-2 mx-0 rounded-xl bg-background border border-border/50 shadow-lg",
              "transition-all duration-300 ease-in-out transform",
              isMobileMenuOpen 
                ? "translate-y-0 opacity-100" 
                : "-translate-y-2 opacity-0 pointer-events-none"
            )}
            role="navigation"
            aria-label="Menu principal mobile"
          >
            <div className="py-3 px-4 flex flex-col gap-1 max-h-[calc(100vh-8rem)] overflow-y-auto">
              {allNavItems.map((item, index) => {
                const isActive = location.pathname === item.path;
                const isHighlight = item.highlight;
                return (
                  <Button
                    key={item.path}
                    variant="ghost"
                    className={cn(
                      "justify-start gap-3 h-12 text-base transition-all duration-200",
                      "transform",
                      isMobileMenuOpen 
                        ? "translate-x-0 opacity-100" 
                        : "-translate-x-4 opacity-0",
                      isActive 
                        ? "bg-primary/10 text-primary font-medium" 
                        : isHighlight
                          ? "text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    )}
                    style={{
                      transitionDelay: isMobileMenuOpen ? `${index * 30}ms` : '0ms'
                    }}
                    onClick={() => {
                      navigate(item.path);
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <item.icon className={cn(
                      "w-5 h-5", 
                      isActive && "text-primary",
                      isHighlight && !isActive && "text-red-500"
                    )} />
                    {item.label}
                  </Button>
                );
              })}
              <div className="h-px bg-border my-2" />
              <Button
                variant="ghost"
                className={cn(
                  "justify-start gap-3 h-12 text-base text-muted-foreground hover:text-destructive hover:bg-destructive/10",
                  "transform transition-all duration-200",
                  isMobileMenuOpen 
                    ? "translate-x-0 opacity-100" 
                    : "-translate-x-4 opacity-0"
                )}
                style={{
                  transitionDelay: isMobileMenuOpen ? `${allNavItems.length * 30}ms` : '0ms'
                }}
                onClick={handleSignOut}
              >
                <LogOut className="w-5 h-5" />
                Sair
              </Button>
            </div>
          </nav>
        </header>
      </div>

      {/* Desktop Topbar (minimal) */}
      <div className={cn(
        "hidden lg:block fixed top-0 right-0 z-30 h-14 border-b border-border bg-background/95 backdrop-blur-md transition-all duration-300",
        sidebarCollapsed ? "left-16" : "left-56"
      )}>
        <div className="flex h-full items-center justify-between px-6">
          <div 
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate(ROUTES.ANAMNESE)}
          >
            <Avatar className="w-9 h-9 border-2 border-primary/20">
              <AvatarImage src={userAvatar || undefined} alt={userName} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                {userName?.charAt(0)?.toUpperCase() || <User className="w-4 h-4" />}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-0">
              <span className="text-xs text-muted-foreground font-medium">Bem-vindo</span>
              <span className="text-sm font-semibold text-foreground">
                {userName || 'Usuário'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <ModeToggle />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className={cn(
        "min-h-screen transition-all duration-300",
        "pt-20 lg:pt-14",
        sidebarCollapsed ? "lg:pl-16" : "lg:pl-56"
      )}>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className={cn(
        "border-t border-border py-8 bg-muted/30 transition-all duration-300",
        sidebarCollapsed ? "lg:pl-16" : "lg:pl-56"
      )}>
        <div className="container text-center">
          <p className="text-sm text-muted-foreground">
            © 2024 Consciência Divinal. Com amor e respeito pelas medicinas ancestrais.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
