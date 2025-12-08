import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Notificacao } from '@/types';

/**
 * Hook para buscar notificações recentes (Admin)
 * Requirements: 6.2
 */
export const useNotificacoes = (limit: number = 20) => {
  return useQuery({
    queryKey: ['admin-notificacoes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notificacoes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data as Notificacao[];
    },
  });
};

/**
 * Helper para contar notificações não lidas
 */
export const getUnreadCount = (notificacoes: Notificacao[] | undefined): number => {
  return notificacoes?.filter(n => !n.lida).length || 0;
};
