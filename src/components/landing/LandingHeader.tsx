import { memo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { MapPin, Play, LogOut, LayoutDashboard, Menu } from 'lucide-react';
import { ROUTES } from '@/constants';
import { ModeToggle } from '@/components/mode-toggle';

interface LandingHeaderProps {
  user: { id: string } | null;
  isAdmin: boolean;
  signOut: () => void;
}

export const LandingHeader = memo(({ user, isAdmin, signOut }: LandingHeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = useCallback(() => setIsMenuOpen(false), []);

  const handleNavClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    closeMenu();
    // Scroll suave para a seção
    const href = e.currentTarget.getAttribute('href');
    if (href?.startsWith('#')) {
      e.preventDefault();
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [closeMenu]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 md:bg-background/80 md:backdrop-blur-md border-b border-border/50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img 
            src="/logo-full.png" 
            alt="Consciência Divinal" 
            className="h-9 w-auto"
            loading="eager"
            onError={(e) => {
              e.currentTarget.src = '/logo-topbar.png';
            }}
          />
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#recursos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Recursos
          </a>
          <a href="#precos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Preços
          </a>
          <a href="#duvidas" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Dúvidas
          </a>
          <Link to={ROUTES.BUSCAR_CASAS} className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            Encontrar Casas
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <ModeToggle />
          
          {/* Mobile Menu - visível apenas em telas < 768px */}
          <div className="block md:hidden">
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Abrir menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
            <SheetContent side="right" className="w-[280px] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-4 mt-6">
                <a 
                  href="#recursos" 
                  onClick={handleNavClick}
                  className="text-base text-foreground hover:text-primary py-2 border-b border-border/50"
                >
                  Recursos
                </a>
                <a 
                  href="#precos" 
                  onClick={handleNavClick}
                  className="text-base text-foreground hover:text-primary py-2 border-b border-border/50"
                >
                  Preços
                </a>
                <a 
                  href="#duvidas" 
                  onClick={handleNavClick}
                  className="text-base text-foreground hover:text-primary py-2 border-b border-border/50"
                >
                  Dúvidas
                </a>
                <Link 
                  to={ROUTES.BUSCAR_CASAS} 
                  onClick={closeMenu}
                  className="text-base text-foreground hover:text-primary py-2 border-b border-border/50 flex items-center gap-2"
                >
                  <MapPin className="h-4 w-4" />
                  Encontrar Casas
                </Link>
                
                <div className="pt-4 space-y-3">
                  {user ? (
                    <>
                      {isAdmin && (
                        <Link to="/portal" onClick={closeMenu}>
                          <Button variant="outline" className="w-full justify-start gap-2">
                            <LayoutDashboard className="h-4 w-4" />
                            Portal Admin
                          </Button>
                        </Link>
                      )}
                      <Link to="/app" onClick={closeMenu}>
                        <Button className="w-full">Acessar App</Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start gap-2 text-muted-foreground"
                        onClick={() => { signOut(); closeMenu(); }}
                      >
                        <LogOut className="h-4 w-4" />
                        Sair
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link to={ROUTES.AUTH} onClick={closeMenu}>
                        <Button variant="outline" className="w-full">Entrar</Button>
                      </Link>
                      <Link to={ROUTES.AUTH + '?demo=true'} onClick={closeMenu}>
                        <Button className="w-full gap-2">
                          <Play className="h-4 w-4" />
                          Testar Grátis
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
          </div>

          {/* Desktop Auth Buttons */}
          {user ? (
            <div className="hidden md:flex items-center gap-2">
              {isAdmin && (
                <Link to="/portal">
                  <Button variant="ghost" size="sm">
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Portal
                  </Button>
                </Link>
              )}
              <Link to="/app">
                <Button size="sm">Acessar</Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => signOut()}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link to={ROUTES.AUTH}>
                <Button size="sm">Entrar</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
});

LandingHeader.displayName = 'LandingHeader';
