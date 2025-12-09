import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Cerimonia } from '@/types';

/**
 * Cerimônia com vagas disponíveis calculadas
 */
export interface CerimoniasComVagas extends Cerimonia {
  vagas_disponiveis: number;
}

/**
 * Hook para buscar próximas cerimônias com inscrições abertas
 * Requirements: 2.1 - Seção de Últimas Consagrações
 * 
 * Retorna cerimônias futuras com inscrições abertas,
 * ordenadas por data (mais próxima primeiro) e calcula vagas disponíveis.
 */
export const useUpcomingCeremonies = (limit = 3) => {
  return useQuery({
    queryKey: ['upcoming-ceremonies', limit],
    queryFn: async (): Promise<CerimoniasComVagas[]> => {
      // Buscar cerimônias futuras com inscrições abertas
      const { data: cerimonias, error: cerimoniasError } = await supabase
        .from('cerimonias')
        .select('*')
        .gte('data', new Date().toISOString().split('T')[0])
        .order('data', { ascending: true })
        .limit(limit);

      if (cerimoniasError) throw cerimoniasError;
      if (!cerimonias || cerimonias.length === 0) return [];

      // Buscar contagem de inscrições para cada cerimônia
      const cerimoniasComVagas = await Promise.all(
        cerimonias.map(async (cerimonia) => {
          const { count, error: countError } = await supabase
            .from('inscricoes')
            .select('*', { count: 'exact', head: true })
            .eq('cerimonia_id', cerimonia.id);

          if (countError) throw countError;

          const vagasTotais = cerimonia.vagas || 0;
          const inscricoesCount = count || 0;
          const vagasDisponiveis = Math.max(0, vagasTotais - inscricoesCount);

          return {
            ...cerimonia,
            vagas_disponiveis: vagasDisponiveis,
          } as CerimoniasComVagas;
        })
      );

      return cerimoniasComVagas;
    },
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
};
