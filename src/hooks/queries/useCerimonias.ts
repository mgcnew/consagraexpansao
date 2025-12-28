import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Cerimonia } from '@/types';

/**
 * Hook para buscar cerimônias futuras (públicas)
 * @param houseId - ID da casa (opcional, se não informado busca todas)
 * Requirements: 6.2
 */
export const useCerimoniasFuturas = (houseId?: string | null) => {
  return useQuery({
    queryKey: ['cerimonias', houseId],
    queryFn: async () => {
      let query = supabase
        .from('cerimonias')
        .select('*')
        .gte('data', new Date().toISOString().split('T')[0])
        .order('data', { ascending: true });

      // Filtrar por casa se informado
      if (houseId) {
        query = query.eq('house_id', houseId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Cerimonia[];
    },
  });
};

/**
 * Hook para buscar todas as cerimônias (Admin)
 * @param houseId - ID da casa (opcional, se não informado busca todas)
 * Requirements: 6.2
 */
export const useCerimoniasAdmin = (houseId?: string | null) => {
  return useQuery({
    queryKey: ['admin-cerimonias', houseId],
    queryFn: async () => {
      let query = supabase
        .from('cerimonias')
        .select('*')
        .order('data', { ascending: false });

      if (houseId) {
        query = query.eq('house_id', houseId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Cerimonia[];
    },
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
};

/**
 * Hook para buscar cerimônias para select (simplificado)
 * @param houseId - ID da casa (opcional)
 * @param limit - Limite de resultados
 * Requirements: 6.2
 */
export const useCerimoniasSelect = (houseId?: string | null, limit: number = 20) => {
  return useQuery({
    queryKey: ['cerimonias-select', houseId],
    queryFn: async () => {
      let query = supabase
        .from('cerimonias')
        .select('id, nome, medicina_principal, data')
        .order('data', { ascending: false })
        .limit(limit);

      if (houseId) {
        query = query.eq('house_id', houseId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Pick<Cerimonia, 'id' | 'nome' | 'medicina_principal' | 'data'>[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};
