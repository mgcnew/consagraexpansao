import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Role, UserRole } from '@/types';

/**
 * Hook para buscar todos os roles disponíveis (Admin)
 * Requirements: 6.2
 */
export const useRoles = () => {
  return useQuery({
    queryKey: ['admin-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roles')
        .select('*');
      if (error) throw error;
      return data as Role[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutos - roles mudam raramente
  });
};

/**
 * Hook para buscar associações de usuários com roles (Admin)
 * Requirements: 6.2
 */
export const useUserRoles = () => {
  return useQuery({
    queryKey: ['admin-user-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*');
      if (error) throw error;
      return data as UserRole[];
    },
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
};

/**
 * Helper para obter o role de um usuário específico
 */
export const getUserRoleFromData = (
  userId: string,
  userRoles: UserRole[] | undefined,
  roles: Role[] | undefined
): string => {
  const userRole = userRoles?.find(ur => ur.user_id === userId);
  if (!userRole) return 'consagrador';
  const role = roles?.find(r => r.id === userRole.role_id);
  return role?.role || 'consagrador';
};
