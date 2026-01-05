import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveHouse } from './useActiveHouse';

interface PendingRating {
  cerimonia_id: string;
  cerimonia_nome: string;
  cerimonia_data: string;
  house_id: string;
  house_name: string;
}

/**
 * Hook para buscar cerimônias que o usuário participou mas ainda não avaliou
 * Condições:
 * - Cerimônia já passou (data < hoje)
 * - Usuário compareceu (compareceu = true)
 * - Usuário ainda não avaliou essa cerimônia
 * - Cerimônia foi nos últimos 30 dias
 */
export function usePendingRatings() {
  const { user } = useAuth();
  const { data: house } = useActiveHouse();

  return useQuery({
    queryKey: ['pending-ratings', user?.id, house?.id],
    queryFn: async () => {
      if (!user?.id || !house?.id) return [];

      // Buscar cerimônias que o usuário participou nos últimos 30 dias
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: inscricoes, error } = await supabase
        .from('inscricoes')
        .select(`
          cerimonia_id,
          cerimonias!inner(
            id,
            nome,
            medicina_principal,
            data,
            house_id,
            houses!inner(id, name)
          )
        `)
        .eq('user_id', user.id)
        .eq('house_id', house.id)
        .eq('compareceu', true)
        .eq('cancelada', false);

      if (error) throw error;
      if (!inscricoes) return [];

      // Filtrar cerimônias que já passaram e estão nos últimos 30 dias
      const today = new Date().toISOString().split('T')[0];
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

      const pastCerimonias = inscricoes.filter((i: any) => {
        const cerData = i.cerimonias?.data;
        return cerData && cerData < today && cerData >= thirtyDaysAgoStr;
      });

      if (pastCerimonias.length === 0) return [];

      // Buscar avaliações já feitas pelo usuário
      const { data: existingRatings } = await supabase
        .from('house_ratings')
        .select('ceremony_id')
        .eq('user_id', user.id)
        .eq('house_id', house.id);

      const ratedCeremonies = new Set(existingRatings?.map(r => r.ceremony_id) || []);

      // Filtrar cerimônias não avaliadas
      const pending: PendingRating[] = pastCerimonias
        .filter((i: any) => !ratedCeremonies.has(i.cerimonia_id))
        .map((i: any) => ({
          cerimonia_id: i.cerimonia_id,
          cerimonia_nome: i.cerimonias?.nome || i.cerimonias?.medicina_principal || 'Cerimônia',
          cerimonia_data: i.cerimonias?.data,
          house_id: i.cerimonias?.house_id,
          house_name: i.cerimonias?.houses?.name || '',
        }));

      return pending;
    },
    enabled: !!user?.id && !!house?.id,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}
