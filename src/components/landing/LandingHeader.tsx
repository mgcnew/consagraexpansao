import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MapPin, Play, LogOut, LayoutDashboard } from 'lucide-react';
import { ROUTES } from '@/constants';
import { ModeToggle } from '@/components/mode-toggle';

interface LandingHeaderProps {
  user: { id: string } | null;
  isAdmin: boolean;
  signOut: () => void;
}

export const LandingHeader = memo(({ user, isAdmin, signOut }: LandingHeaderProps) => (
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
        {user ? (
          <>
            {isAdmin && (
              <Link to="/portal">
                <Button variant="ghost" size="sm" className="hidden sm:flex">
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
          </>
        ) : (
          <>
            <Link to={ROUTES.AUTH}>
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex">Entrar</Button>
              <Button size="sm" className="sm:hidden">Entrar</Button>
            </Link>
            <Link to={ROUTES.AUTH + '?demo=true'} className="hidden sm:block">
              <Button size="sm" className="gap-2">
                <Play className="h-3 w-3" />
                Testar Grátis
              </Button>
            </Link>
          </>
        )}
      </div>
    </div>
  </header>
));

LandingHeader.displayName = 'LandingHeader';
