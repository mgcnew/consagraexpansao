import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Hook para confirmar presença em uma cerimônia
export const useConfirmarPresenca = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inscricaoId: string) => {
      const { data, error } = await supabase
        .from('inscricoes')
        .update({
          presenca_confirmada: true,
          confirmado_em: new Date().toISOString(),
        })
        .eq('id', inscricaoId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Presença confirmada!', {
        description: 'Obrigado por confirmar. Nos vemos na cerimônia!',
      });
      queryClient.invalidateQueries({ queryKey: ['minhas-inscricoes'] });
      queryClient.invalidateQueries({ queryKey: ['inscricoes'] });
    },
    onError: (error) => {
      console.error('Erro ao confirmar presença:', error);
      toast.error('Erro ao confirmar presença');
    },
  });
};

// Hook para verificar se usuário já partilhou sobre uma cerimônia
export const useVerificarPartilha = (userId: string | undefined, cerimoniaId: string | undefined) => {
  return {
    queryKey: ['partilha-cerimonia', userId, cerimoniaId],
    queryFn: async () => {
      if (!userId || !cerimoniaId) return null;

      const { data, error } = await supabase
        .from('depoimentos')
        .select('id')
        .eq('user_id', userId)
        .eq('cerimonia_id', cerimoniaId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!userId && !!cerimoniaId,
  };
};
