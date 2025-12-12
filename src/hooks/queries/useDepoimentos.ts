import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Depoimento, DepoimentoComRelacionamentos } from '@/types';

const PAGE_SIZE = 10;

/**
 * Hook para buscar depoimentos aprovados com paginação infinita
 * Requirements: 6.2
 */
export const useDepoimentosInfinito = () => {
  return useInfiniteQuery({
    queryKey: ['depoimentos-infinito'],
    queryFn: async ({ pageParam = 0 }) => {
      const from = pageParam * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error, count } = await supabase
        .from('depoimentos')
        .select(`
          *,
          profiles:user_id (full_name, avatar_url),
          cerimonias:cerimonia_id (nome, medicina_principal, data)
        `, { count: 'exact' })
        .eq('aprovado', true)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      return { 
        data: data as DepoimentoComRelacionamentos[], 
        count: count || 0, 
        nextPage: pageParam + 1 
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loadedCount = allPages.reduce((acc, page) => acc + page.data.length, 0);
      if (loadedCount < lastPage.count) {
        return lastPage.nextPage;
      }
      return undefined;
    },
  });
};

/**
 * Hook para buscar depoimentos pendentes (Admin)
 * Requirements: 1.2, 6.2
 */
export const useDepoimentosPendentes = () => {
  return useQuery({
    queryKey: ['admin-depoimentos-pendentes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('depoimentos')
        .select(`
          *,
          profiles:user_id (full_name),
          cerimonias:cerimonia_id (nome, medicina_principal, data)
        `)
        .eq('aprovado', false)
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Erro ao carregar depoimentos:', error);
        throw error;
      }
      return data as DepoimentoComRelacionamentos[];
    },
  });
};

/**
 * Hook para buscar depoimentos pendentes do usuário
 * Requirements: 6.2
 */
export const useMeusDepoimentosPendentes = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['meus-depoimentos'],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('depoimentos')
        .select('id')
        .eq('user_id', userId!)
        .eq('aprovado', false);
      if (error) throw error;
      return data;
    },
  });
};

/**
 * Hook para buscar depoimentos aprovados do usuário
 * Requirements: 4.3, 6.2
 */
export const useMeusDepoimentosAprovados = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['meus-depoimentos-aprovados', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('depoimentos')
        .select('*')
        .eq('user_id', userId!)
        .eq('aprovado', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Depoimento[];
    },
  });
};
