import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Depoimento do usuário
 */
export interface MyTestimonial {
  id: string;
  texto: string;
  aprovado: boolean;
  created_at: string;
}

/**
 * Hook para buscar últimos depoimentos do usuário
 * Requirements: 4.1 - Seção Minhas Partilhas
 * 
 * Retorna os últimos depoimentos do usuário ordenados por data de criação
 * (mais recente primeiro).
 */
export const useMyTestimonials = (userId: string | undefined, limit = 3) => {
  return useQuery({
    queryKey: ['my-testimonials', userId, limit],
    enabled: !!userId,
    queryFn: async (): Promise<MyTestimonial[]> => {
      const { data, error } = await supabase
        .from('depoimentos')
        .select('id, texto, aprovado, created_at')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as MyTestimonial[];
    },
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
};
