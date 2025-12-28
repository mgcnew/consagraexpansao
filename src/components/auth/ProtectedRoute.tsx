import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveHouse } from '@/hooks/useActiveHouse';
import { Loader2 } from 'lucide-react';
import { ROUTES } from '@/constants';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
  const { user, isLoading, isAdmin } = useAuth();
  const { data: activeHouse, isLoading: isLoadingHouse } = useActiveHouse();
  const location = useLocation();

  // Verifica se é owner da casa (também é considerado admin)
  const isHouseOwner = Boolean(activeHouse && user && activeHouse.owner_id === user.id);
  const hasAdminAccess = isAdmin || isHouseOwner;

  if (isLoading || (requireAdmin && isLoadingHouse)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground font-body">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={ROUTES.AUTH} state={{ from: location }} replace />;
  }

  if (requireAdmin && !hasAdminAccess) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
