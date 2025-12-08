import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Home,
  FileText,
  Calendar,
  Leaf,
  HelpCircle,
  Settings,
  LogOut,
  Menu,
  X,
  Heart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ModeToggle } from '@/components/mode-toggle';


import CompleteProfileDialog from '@/components/auth/CompleteProfileDialog';


const MainLayout: React.FC = () => {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const navItems = [
    { icon: Home, label: 'Início', path: '/' },
    { icon: FileText, label: 'Minha Ficha', path: '/anamnese' },
    { icon: Calendar, label: 'Cerimônias', path: '/cerimonias' },
    { icon: Leaf, label: 'Medicinas', path: '/medicinas' },
    { icon: HelpCircle, label: 'FAQ', path: '/faq' },
    { icon: Heart, label: 'Emergência', path: '/emergencia' },
  ];

  if (isAdmin) {
    navItems.push({ icon: Settings, label: 'Admin', path: '/admin' });
  }

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
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
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
            <div className="w-px h-6 bg-border mx-2" />
            <ModeToggle />
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground hover:text-destructive"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4" />
              Sair
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <ModeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div
          className={cn(
            "md:hidden absolute top-full left-0 right-0 bg-background border-b border-border transition-all duration-300 overflow-hidden",
            isMobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <nav className="container py-4 px-4 flex flex-col gap-1">
            {navItems.map((item) => (
              <Button
                key={item.path}
                variant="ghost"
                className="justify-start gap-3 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  navigate(item.path);
                  setIsMobileMenuOpen(false);
                }}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Button>
            ))}
            <div className="h-px bg-border my-2" />
            <Button
              variant="ghost"
              className="justify-start gap-3 text-muted-foreground hover:text-destructive"
              onClick={handleSignOut}
            >
              <LogOut className="w-5 h-5" />
              Sair
            </Button>
          </nav>
        </div>
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
