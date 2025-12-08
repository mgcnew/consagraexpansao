import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Cerimonia } from '@/types';

/**
 * Hook para buscar cerimônias futuras (públicas)
 * Requirements: 6.2
 */
export const useCerimoniasFuturas = () => {
  return useQuery({
    queryKey: ['cerimonias'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cerimonias')
        .select('*')
        .gte('data', new Date().toISOString().split('T')[0])
        .order('data', { ascending: true });

      if (error) throw error;
      return data as Cerimonia[];
    },
  });
};

/**
 * Hook para buscar todas as cerimônias (Admin)
 * Requirements: 6.2
 */
export const useCerimoniasAdmin = () => {
  return useQuery({
    queryKey: ['admin-cerimonias'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cerimonias')
        .select('*')
        .order('data', { ascending: false });
      if (error) throw error;
      return data as Cerimonia[];
    },
  });
};

/**
 * Hook para buscar cerimônias para select (simplificado)
 * Requirements: 6.2
 */
export const useCerimoniasSelect = (limit: number = 20) => {
  return useQuery({
    queryKey: ['cerimonias-select'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cerimonias')
        .select('id, nome, medicina_principal, data')
        .order('data', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data as Pick<Cerimonia, 'id' | 'nome' | 'medicina_principal' | 'data'>[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};
