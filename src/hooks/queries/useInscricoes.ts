import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Inscricao, InscricaoComRelacionamentos, InscricaoComCerimonia } from '@/types';

/**
 * Hook para buscar inscricoes do usuario logado
 * Retorna apenas inscricoes confirmadas:
 * - Pagamento online: pago = true
 * - Outros metodos (pix manual, dinheiro): qualquer status de pago
 * Requirements: 6.2
 */
export const useMinhasInscricoes = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['minhas-inscricoes', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inscricoes')
        .select('cerimonia_id, forma_pagamento, pago')
        .eq('user_id', userId!)
        .or('cancelada.is.null,cancelada.eq.false');

      if (error) throw error;
      
      // Filtrar: para pagamento online, so considera se pago = true
      // Para outros metodos (pix, dinheiro), considera como inscrito
      const inscricoesConfirmadas = data.filter((i) => {
        if (i.forma_pagamento === 'online') {
          return i.pago === true;
        }
        return true; // pix manual e dinheiro sao confirmados na hora
      });
      
      return inscricoesConfirmadas.map((i) => i.cerimonia_id);
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
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
};

/**
 * Hook para buscar historico de inscricoes do usuario
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
        .or('cancelada.is.null,cancelada.eq.false')
        .order('cerimonias(data)', { ascending: false });

      if (error) throw error;
      
      // Filtrar inscricoes online nao pagas (pendentes de pagamento)
      const inscricoesValidas = (data as InscricaoComCerimonia[]).filter((i) => {
        // Se for pagamento online e nao pago, nao mostrar no historico
        if (i.forma_pagamento === 'online' && !i.pago) {
          return false;
        }
        return true;
      });
      
      return inscricoesValidas;
    },
  });
};

/**
 * Hook para buscar cerimonias proximas do usuario (proximos 3 dias)
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
        .or('cancelada.is.null,cancelada.eq.false')
        .gte('cerimonias.data', hojeStr)
        .lte('cerimonias.data', tresDiasStr);

      if (error) throw error;
      
      // Filtrar inscricoes que tem cerimonias validas e estao confirmadas
      const inscricoesComCerimonia = (data as InscricaoComCerimonia[]).filter(
        (inscricao) => {
          if (!inscricao.cerimonias) return false;
          // Se for pagamento online e nao pago, nao mostrar
          if (inscricao.forma_pagamento === 'online' && !inscricao.pago) {
            return false;
          }
          return true;
        }
      );

      // Ordenar por data da cerimonia
      return inscricoesComCerimonia.sort((a, b) => 
        new Date(a.cerimonias.data).getTime() - new Date(b.cerimonias.data).getTime()
      );
    },
  });
};
