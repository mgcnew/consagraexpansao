import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Home,
  FileText,
  Calendar,
  Leaf,
  HelpCircle,
  Settings,
  LogOut,
  Heart,
  Shield,
  MessageSquareQuote,
  History,
  MoreHorizontal,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ModeToggle } from '@/components/mode-toggle';


import CompleteProfileDialog from '@/components/auth/CompleteProfileDialog';


const MainLayout: React.FC = () => {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  // Fechar menu ao mudar de rota
  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  // Itens principais (sempre visíveis na topbar)
  const mainNavItems = [
    { icon: Home, label: 'Início', path: '/' },
    { icon: FileText, label: 'Minha Ficha', path: '/anamnese' },
    { icon: Calendar, label: 'Cerimônias', path: '/cerimonias' },
    { icon: Leaf, label: 'Medicinas', path: '/medicinas' },
  ];

  // Itens secundários (no dropdown "Mais")
  const moreNavItems = [
    { icon: MessageSquareQuote, label: 'Depoimentos', path: '/depoimentos' },
    { icon: History, label: 'Histórico', path: '/historico' },
    { icon: HelpCircle, label: 'FAQ', path: '/faq' },
    { icon: Heart, label: 'Emergência', path: '/emergencia' },
  ];

  // Todos os itens para o menu mobile
  const allNavItems = [
    ...mainNavItems,
    ...moreNavItems,
    { icon: Settings, label: 'Configurações', path: '/configuracoes' },
  ];

  if (isAdmin) {
    allNavItems.push({ icon: Shield, label: 'Admin', path: '/admin' });
  }

  // Verifica se algum item do dropdown está ativo
  const isMoreActive = moreNavItems.some(item => location.pathname === item.path);

  return (
    <div className="min-h-screen bg-background">
      <CompleteProfileDialog />
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <img
              src="/logo-full.jpg"
              alt="Consciência Divinal"
              className="h-12 w-auto object-contain"
            />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {/* Itens principais */}
            {mainNavItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Button
                  key={item.path}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "gap-2 transition-all",
                    isActive
                      ? "bg-primary/10 text-primary font-medium hover:bg-primary/20 hover:text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                  onClick={() => navigate(item.path)}
                >
                  <item.icon className={cn("w-4 h-4", isActive && "text-primary")} />
                  {item.label}
                </Button>
              );
            })}

            {/* Dropdown "Mais" */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "gap-2 transition-all",
                    isMoreActive
                      ? "bg-primary/10 text-primary font-medium hover:bg-primary/20 hover:text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <MoreHorizontal className={cn("w-4 h-4", isMoreActive && "text-primary")} />
                  Mais
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {moreNavItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <DropdownMenuItem
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className={cn(
                        "gap-2 cursor-pointer",
                        isActive && "bg-primary/10 text-primary font-medium"
                      )}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="w-px h-6 bg-border mx-2" />

            {/* Admin (se aplicável) */}
            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "gap-2 transition-all",
                  location.pathname === '/admin'
                    ? "bg-primary/10 text-primary font-medium hover:bg-primary/20 hover:text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
                onClick={() => navigate('/admin')}
              >
                <Shield className={cn("w-4 h-4", location.pathname === '/admin' && "text-primary")} />
                Admin
              </Button>
            )}

            {/* Dropdown do usuário */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-muted-foreground hover:text-foreground hover:bg-accent"
                >
                  <User className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() => navigate('/configuracoes')}
                  className={cn(
                    "gap-2 cursor-pointer",
                    location.pathname === '/configuracoes' && "bg-primary/10 text-primary font-medium"
                  )}
                >
                  <Settings className="w-4 h-4" />
                  Configurações
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <ModeToggle />
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 lg:hidden">
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
            "lg:hidden fixed inset-0 top-16 bg-black/20 backdrop-blur-sm transition-opacity duration-300 z-40",
            isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          )}
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />

        {/* Mobile Navigation Menu */}
        <nav
          className={cn(
            "lg:hidden fixed top-16 left-0 right-0 bg-background border-b border-border shadow-lg z-50",
            "transition-all duration-300 ease-in-out transform",
            isMobileMenuOpen 
              ? "translate-y-0 opacity-100" 
              : "-translate-y-2 opacity-0 pointer-events-none"
          )}
          role="navigation"
          aria-label="Menu principal mobile"
        >
          <div className="container py-3 px-4 flex flex-col gap-1 max-h-[calc(100vh-8rem)] overflow-y-auto">
            {allNavItems.map((item, index) => {
              const isActive = location.pathname === item.path;
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
                  <item.icon className={cn("w-5 h-5", isActive && "text-primary")} />
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

      {/* Main Content */}
      <main className="pt-16 min-h-screen">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 bg-muted/30">
        <div className="container px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © 2024 Consciência Divinal. Com amor e respeito pelas medicinas ancestrais.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
