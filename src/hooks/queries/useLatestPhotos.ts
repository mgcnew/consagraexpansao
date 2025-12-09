import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { GaleriaItemComCerimonia } from '@/types';

/**
 * Hook para buscar últimas fotos da galeria
 * Requirements: 1.1 - Carrossel de Últimas Fotos
 * 
 * Retorna as últimas fotos ordenadas por data de criação (mais recente primeiro)
 * com join em cerimonias para exibir informações da cerimônia associada.
 */
export const useLatestPhotos = (limit = 10) => {
  return useQuery({
    queryKey: ['latest-photos', limit],
    queryFn: async (): Promise<GaleriaItemComCerimonia[]> => {
      const { data, error } = await supabase
        .from('galeria')
        .select(`
          *,
          cerimonias (
            id,
            nome,
            data,
            medicina_principal
          )
        `)
        .eq('tipo', 'foto')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as GaleriaItemComCerimonia[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};
