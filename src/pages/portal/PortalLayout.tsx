import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveHouse } from '@/hooks/useActiveHouse';
import { useUserHouses, setLastAccessedHouse } from '@/hooks/useUserHouses';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Home,
  DollarSign,
  Receipt,
  Activity,
  AlertTriangle,
  ChevronDown,
  BookOpen,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/constants';
import { addDays } from 'date-fns';

const baseMenuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/portal', alertKey: 'dashboard' },
  { icon: Building2, label: 'Casas', path: '/portal/casas', alertKey: 'casas' },
  { icon: CreditCard, label: 'Planos', path: '/portal/planos' },
  { icon: DollarSign, label: 'Financeiro', path: '/portal/financeiro' },
  { icon: Receipt, label: 'Assinaturas', path: '/portal/assinaturas' },
  { icon: Users, label: 'Usuarios', path: '/portal/usuarios' },
  { icon: BookOpen, label: 'Blog', path: '/portal/blog' },
  { icon: Activity, label: 'Logs', path: '/portal/logs' },
  { icon: Settings, label: 'Configuracoes', path: '/portal/config' },
];

const PortalLayout = () => {
  const { user, isLoading, isAdmin, signOut } = useAuth();
  const { data: activeHouse } = useActiveHouse();
  const { data: userHouses } = useUserHouses();
  const queryClient = useQueryClient();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Query para buscar todas as casas (para super admin)
  const { data: allHouses } = useQuery({
    queryKey: ['portal-all-houses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('houses')
        .select('id, name, slug, logo_url')
        .eq('active', true)
        .order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: isAdmin,
  });

  // Query para contar trials expirando em 7 dias
  const { data: expiringTrialsCount } = useQuery({
    queryKey: ['portal-expiring-trials-count'],
    queryFn: async () => {
      const sevenDaysFromNow = addDays(new Date(), 7).toISOString();
      const { count, error } = await supabase
        .from('houses')
        .select('*', { count: 'exact', head: true })
        .eq('subscription_status', 'trial')
        .lte('trial_ends_at', sevenDaysFromNow);
      if (error) throw error;
      return count || 0;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    enabled: true,
  });

  // Menu items com alertas dinâmicos
  const menuItems = useMemo(() => {
    return baseMenuItems.map(item => ({
      ...item,
      alertCount: item.alertKey === 'dashboard' || item.alertKey === 'casas' 
        ? expiringTrialsCount 
        : undefined,
    }));
  }, [expiringTrialsCount]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
    );
  }

  // Apenas super admins podem acessar o portal
  if (!user || !isAdmin) {
    return <Navigate to={ROUTES.AUTH} replace />;
  }

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b z-50 flex items-center px-4">
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
          <Menu className="h-5 w-5" />
        </Button>
        <span className="ml-4 font-semibold">Portal Admin</span>
      </header>

      {/* Sidebar Overlay (Mobile) */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 h-full w-64 bg-card border-r z-50 transition-transform lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between h-16 px-4 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold">Ahoo Portal</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path !== '/portal' && location.pathname.startsWith(item.path));
            
            return (
              <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3",
                    isActive && "bg-primary/10 text-primary"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                  {item.alertCount && item.alertCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="ml-auto h-5 min-w-5 px-1.5 text-xs flex items-center justify-center gap-1"
                    >
                      <AlertTriangle className="h-3 w-3" />
                      {item.alertCount}
                    </Badge>
                  )}
                  {isActive && !item.alertCount && <ChevronRight className="h-4 w-4 ml-auto" />}
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t space-y-3">
          {/* Dropdown para selecionar e acessar uma casa */}
          {allHouses && allHouses.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full gap-2 text-primary border-primary/30 hover:bg-primary/10">
                  <Home className="h-4 w-4 shrink-0" />
                  <span className="truncate flex-1 text-left">
                    {activeHouse ? `Ir para ${activeHouse.name}` : 'Acessar Casa'}
                  </span>
                  <ChevronDown className="h-4 w-4 shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 max-h-64 overflow-y-auto">
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Selecione uma casa
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {allHouses.map((house) => (
                  <DropdownMenuItem
                    key={house.id}
                    onClick={() => {
                      setLastAccessedHouse(house.id);
                      queryClient.invalidateQueries({ queryKey: ['active-house'] });
                      setSidebarOpen(false);
                      window.location.href = '/app';
                    }}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-2 w-full">
                      <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-xs font-medium text-primary shrink-0">
                        {house.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="truncate">{house.name}</span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-primary font-medium">
                {user.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.email}</p>
              <p className="text-xs text-muted-foreground">Super Admin</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="w-full gap-2"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
};

export default PortalLayout;
