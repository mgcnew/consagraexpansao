import { memo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
import { LanguageSelector } from '@/components/LanguageSelector';

interface LandingHeaderProps {
  user: { id: string } | null;
  isAdmin: boolean;
  signOut: () => void;
}

// Logo do app
const AppLogo = () => (
  <Link to={ROUTES.LANDING} className="flex items-center group">
    <img 
      src="/logo.png" 
      alt="Ahoo" 
      className="h-16 w-auto -my-3"
      loading="eager"
    />
  </Link>
);

export const LandingHeader = memo(({ user, isAdmin, signOut }: LandingHeaderProps) => {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = useCallback(() => setIsMenuOpen(false), []);

  const handleNavClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    closeMenu();
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
        <AppLogo />
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#recursos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            {t('landing.nav.features')}
          </a>
          <a href="#precos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            {t('landing.nav.pricing')}
          </a>
          <a href="#duvidas" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            {t('landing.nav.faq')}
          </a>
          <Link to={ROUTES.BUSCAR_CASAS} className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {t('landing.nav.findHouses')}
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSelector />
          <ModeToggle />
          
          {/* Mobile Menu */}
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
                  {t('landing.nav.features')}
                </a>
                <a 
                  href="#precos" 
                  onClick={handleNavClick}
                  className="text-base text-foreground hover:text-primary py-2 border-b border-border/50"
                >
                  {t('landing.nav.pricing')}
                </a>
                <a 
                  href="#duvidas" 
                  onClick={handleNavClick}
                  className="text-base text-foreground hover:text-primary py-2 border-b border-border/50"
                >
                  {t('landing.nav.faq')}
                </a>
                <Link 
                  to={ROUTES.BUSCAR_CASAS} 
                  onClick={closeMenu}
                  className="text-base text-foreground hover:text-primary py-2 border-b border-border/50 flex items-center gap-2"
                >
                  <MapPin className="h-4 w-4" />
                  {t('landing.nav.findHouses')}
                </Link>
                
                <div className="pt-4 space-y-3">
                  {user ? (
                    <>
                      {isAdmin && (
                        <Link to="/portal" onClick={closeMenu}>
                          <Button variant="outline" className="w-full justify-start gap-2">
                            <LayoutDashboard className="h-4 w-4" />
                            {t('landing.nav.portal')}
                          </Button>
                        </Link>
                      )}
                      <Link to="/app" onClick={closeMenu}>
                        <Button className="w-full">{t('landing.nav.access')}</Button>
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
                        <Button variant="outline" className="w-full">{t('landing.nav.login')}</Button>
                      </Link>
                      <Link to={ROUTES.AUTH + '?demo=true'} onClick={closeMenu}>
                        <Button className="w-full gap-2">
                          <Play className="h-4 w-4" />
                          {t('landing.nav.tryFree')}
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
                    {t('landing.nav.portal')}
                  </Button>
                </Link>
              )}
              <Link to="/app">
                <Button size="sm">{t('landing.nav.access')}</Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => signOut()}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link to={ROUTES.AUTH}>
                <Button size="sm">{t('landing.nav.login')}</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
});

LandingHeader.displayName = 'LandingHeader';
