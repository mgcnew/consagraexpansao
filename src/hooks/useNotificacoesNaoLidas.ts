import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useNotificacoesNaoLidas = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['notificacoes-nao-lidas', user?.id],
    queryFn: async () => {
      if (!user?.id) return { count: 0, notificacoes: [] };

      const { data, error, count } = await supabase
        .from('notificacoes')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('lida', false)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      return {
        count: count || 0,
        notificacoes: data || [],
      };
    },
    enabled: !!user?.id,
    refetchInterval: 60000, // Refetch a cada 1 minuto
  });
};

export const useMarcarNotificacaoLida = () => {
  const marcarLida = async (notificacaoId: string) => {
    const { error } = await supabase
      .from('notificacoes')
      .update({ lida: true })
      .eq('id', notificacaoId);

    if (error) throw error;
  };

  const marcarTodasLidas = async (userId: string) => {
    const { error } = await supabase
      .from('notificacoes')
      .update({ lida: true })
      .eq('user_id', userId)
      .eq('lida', false);

    if (error) throw error;
  };

  return { marcarLida, marcarTodasLidas };
};
