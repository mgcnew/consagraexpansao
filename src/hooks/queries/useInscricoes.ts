import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Inscricao, InscricaoComRelacionamentos, InscricaoComCerimonia } from '@/types';

/**
 * Hook para buscar inscrições do usuário logado
 * Requirements: 6.2
 */
export const useMinhasInscricoes = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['minhas-inscricoes', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inscricoes')
        .select('cerimonia_id')
        .eq('user_id', userId!);

      if (error) throw error;
      return data.map((i) => i.cerimonia_id);
    },
  });
};

/**
 * Hook para buscar todas as inscrições com relacionamentos (Admin)
 * Requirements: 6.2
 */
export const useInscricoesAdmin = () => {
  return useQuery({
    queryKey: ['admin-inscricoes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inscricoes')
        .select(`
          *,
          profiles:user_id (*),
          cerimonias:cerimonia_id (*)
        `)
        .order('data_inscricao', { ascending: false });
      if (error) throw error;
      return data as InscricaoComRelacionamentos[];
    },
  });
};

/**
 * Hook para buscar histórico de inscrições do usuário
 * Requirements: 4.1, 4.2, 6.2
 */
export const useHistoricoInscricoes = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['historico-inscricoes', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inscricoes')
        .select(`
          *,
          cerimonias (
            id,
            nome,
            data,
            horario,
            local,
            medicina_principal,
            banner_url
          )
        `)
        .eq('user_id', userId!)
        .order('cerimonias(data)', { ascending: false });

      if (error) throw error;
      return data as InscricaoComCerimonia[];
    },
  });
};

/**
 * Hook para buscar cerimônias próximas do usuário (próximos 3 dias)
 * Requirements: 8.2
 */
export const useCerimoniasProximas = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['cerimonias-proximas', userId],
    enabled: !!userId,
    queryFn: async () => {
      const hoje = new Date();
      const tresDias = new Date();
      tresDias.setDate(hoje.getDate() + 3);

      const hojeStr = hoje.toISOString().split('T')[0];
      const tresDiasStr = tresDias.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('inscricoes')
        .select(`
          *,
          cerimonias (
            id,
            nome,
            data,
            horario,
            local,
            medicina_principal,
            banner_url
          )
        `)
        .eq('user_id', userId!)
        .gte('cerimonias.data', hojeStr)
        .lte('cerimonias.data', tresDiasStr);

      if (error) throw error;
      
      // Filtrar inscrições que têm cerimônias válidas (dentro do período)
      const inscricoesComCerimonia = (data as InscricaoComCerimonia[]).filter(
        (inscricao) => inscricao.cerimonias !== null
      );

      // Ordenar por data da cerimônia
      return inscricoesComCerimonia.sort((a, b) => 
        new Date(a.cerimonias.data).getTime() - new Date(b.cerimonias.data).getTime()
      );
    },
  });
};
