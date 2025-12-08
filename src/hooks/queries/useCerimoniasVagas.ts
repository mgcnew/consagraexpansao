import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface VagasInfo {
  cerimonia_id: string;
  total_vagas: number | null;
  inscritos: number;
  vagas_disponiveis: number;
  esgotado: boolean;
}

/**
 * Hook para buscar contagem de inscrições por cerimônia
 * Calcula: vagas_disponiveis = total_vagas - inscritos
 * Requirements: 3.1
 */
export const useVagasPorCerimonia = (cerimoniaIds: string[]) => {
  return useQuery({
    queryKey: ['vagas-cerimonias', cerimoniaIds],
    enabled: cerimoniaIds.length > 0,
    queryFn: async (): Promise<Record<string, VagasInfo>> => {
      // Buscar contagem de inscrições agrupada por cerimônia
      const { data: inscricoes, error } = await supabase
        .from('inscricoes')
        .select('cerimonia_id')
        .in('cerimonia_id', cerimoniaIds);

      if (error) throw error;

      // Contar inscrições por cerimônia
      const contagemPorCerimonia: Record<string, number> = {};
      inscricoes?.forEach((inscricao) => {
        const id = inscricao.cerimonia_id;
        contagemPorCerimonia[id] = (contagemPorCerimonia[id] || 0) + 1;
      });

      // Buscar total de vagas de cada cerimônia
      const { data: cerimonias, error: cerError } = await supabase
        .from('cerimonias')
        .select('id, vagas')
        .in('id', cerimoniaIds);

      if (cerError) throw cerError;

      // Montar objeto com informações de vagas
      const vagasInfo: Record<string, VagasInfo> = {};
      cerimonias?.forEach((cerimonia) => {
        const totalVagas = cerimonia.vagas;
        const inscritos = contagemPorCerimonia[cerimonia.id] || 0;
        const vagasDisponiveis = totalVagas !== null ? totalVagas - inscritos : null;

        vagasInfo[cerimonia.id] = {
          cerimonia_id: cerimonia.id,
          total_vagas: totalVagas,
          inscritos,
          vagas_disponiveis: vagasDisponiveis ?? 999, // Se não tem limite, considera ilimitado
          esgotado: totalVagas !== null && vagasDisponiveis !== null && vagasDisponiveis <= 0,
        };
      });

      return vagasInfo;
    },
    staleTime: 30000, // Cache por 30 segundos
  });
};

/**
 * Função utilitária para calcular vagas disponíveis
 */
export const calcularVagasDisponiveis = (
  totalVagas: number | null,
  inscritos: number
): { disponiveis: number | null; esgotado: boolean } => {
  if (totalVagas === null) {
    return { disponiveis: null, esgotado: false };
  }
  const disponiveis = totalVagas - inscritos;
  return {
    disponiveis: Math.max(0, disponiveis),
    esgotado: disponiveis <= 0,
  };
};
