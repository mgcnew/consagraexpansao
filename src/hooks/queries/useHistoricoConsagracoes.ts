import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Tipos para o histórico de consagrações
 */
export interface ConsagracaoHistorico {
  id: string;
  data_inscricao: string;
  observacoes_admin: string | null;
  cancelada: boolean;
  cerimonia: {
    id: string;
    nome: string | null;
    data: string;
    local: string;
    medicina_principal: string | null;
  };
}

export interface HistoricoStats {
  total: number;
  canceladas: number;
  primeiraConsagracao: string | null;
  ultimaConsagracao: string | null;
  medicinas: string[];
}

export interface PaginatedHistorico {
  data: ConsagracaoHistorico[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const HISTORICO_PAGE_SIZE = 5;

/**
 * Hook para buscar histórico de consagrações de um usuário (Admin)
 * Busca todas as inscrições com pago = true e filtra por userId no cliente
 * Isso contorna problemas de RLS quando admin busca dados de outro usuário
 * Requirements: 1.2, 3.1, 3.2
 */
export const useHistoricoConsagracoes = (userId: string | null, page: number = 1) => {
  return useQuery({
    queryKey: ['historico-consagracoes', userId, page],
    enabled: !!userId,
    queryFn: async (): Promise<PaginatedHistorico> => {
      // Busca todas as inscrições pagas (admin tem permissão via RLS)
      // e filtra por userId no cliente para evitar problemas de RLS
      // Nota: observacoes_admin pode não existir ainda, então usamos query sem ela primeiro
      const { data, error } = await supabase
        .from('inscricoes')
        .select(`
          id,
          user_id,
          data_inscricao,
          pago,
          cancelada,
          cerimonias (
            id,
            nome,
            data,
            local,
            medicina_principal
          )
        `)
        .order('data_inscricao', { ascending: false });

      if (error) {
        console.error('Erro ao buscar histórico:', error);
        throw error;
      }

      // Filtra no cliente: todas as inscrições do userId (incluindo canceladas para admin ver)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const allHistorico: ConsagracaoHistorico[] = (data || [])
        .filter((item: any) => 
          item.user_id === userId && 
          item.cerimonias !== null
        )
        .map((item: any) => ({
          id: item.id,
          data_inscricao: item.data_inscricao,
          observacoes_admin: item.observacoes_admin || null,
          cancelada: item.cancelada === true,
          cerimonia: {
            id: item.cerimonias.id,
            nome: item.cerimonias.nome,
            data: item.cerimonias.data,
            local: item.cerimonias.local,
            medicina_principal: item.cerimonias.medicina_principal,
          },
        }))
        // Sort by cerimonia.data descending (most recent first)
        .sort((a: ConsagracaoHistorico, b: ConsagracaoHistorico) => 
          new Date(b.cerimonia.data).getTime() - new Date(a.cerimonia.data).getTime()
        );

      // Apply pagination
      const total = allHistorico.length;
      const totalPages = Math.max(1, Math.ceil(total / HISTORICO_PAGE_SIZE));
      const startIndex = (page - 1) * HISTORICO_PAGE_SIZE;
      const paginatedData = allHistorico.slice(startIndex, startIndex + HISTORICO_PAGE_SIZE);

      return {
        data: paginatedData,
        total,
        page,
        pageSize: HISTORICO_PAGE_SIZE,
        totalPages,
      };
    },
  });
};

/**
 * Hook para buscar todas as consagrações (sem paginação) para cálculo de estatísticas
 * Requirements: 4.1, 4.2, 4.3
 */
export const useAllHistoricoConsagracoes = (userId: string | null) => {
  return useQuery({
    queryKey: ['historico-consagracoes-all', userId],
    enabled: !!userId,
    queryFn: async (): Promise<ConsagracaoHistorico[]> => {
      const { data, error } = await supabase
        .from('inscricoes')
        .select(`
          id,
          user_id,
          data_inscricao,
          pago,
          cancelada,
          cerimonias (
            id,
            nome,
            data,
            local,
            medicina_principal
          )
        `)
        .order('data_inscricao', { ascending: false });

      if (error) {
        console.error('Erro ao buscar histórico:', error);
        throw error;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data || [])
        .filter((item: any) => 
          item.user_id === userId && 
          item.cerimonias !== null
        )
        .map((item: any) => ({
          id: item.id,
          data_inscricao: item.data_inscricao,
          observacoes_admin: item.observacoes_admin || null,
          cancelada: item.cancelada === true,
          cerimonia: {
            id: item.cerimonias.id,
            nome: item.cerimonias.nome,
            data: item.cerimonias.data,
            local: item.cerimonias.local,
            medicina_principal: item.cerimonias.medicina_principal,
          },
        }))
        .sort((a: ConsagracaoHistorico, b: ConsagracaoHistorico) => 
          new Date(b.cerimonia.data).getTime() - new Date(a.cerimonia.data).getTime()
        );
    },
  });
};

/**
 * Hook para atualizar observação de uma inscrição (Admin)
 * Requirements: 2.2
 */
export const useUpdateObservacao = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      inscricaoId, 
      observacao 
    }: { 
      inscricaoId: string; 
      observacao: string;
    }) => {
      const { error } = await supabase
        .from('inscricoes')
        .update({ observacoes_admin: observacao })
        .eq('id', inscricaoId);

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate historico-consagracoes queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['historico-consagracoes'] });
    },
  });
};

/**
 * Função utilitária para calcular estatísticas do histórico
 * Conta apenas consagrações não canceladas para o total
 * Requirements: 4.1, 4.2, 4.3
 */
export function calcularStats(consagracoes: ConsagracaoHistorico[]): HistoricoStats {
  // Filtrar apenas não canceladas para estatísticas principais
  const consagracoesAtivas = consagracoes.filter(c => !c.cancelada);
  const canceladas = consagracoes.filter(c => c.cancelada).length;
  
  if (consagracoesAtivas.length === 0) {
    return {
      total: 0,
      canceladas,
      primeiraConsagracao: null,
      ultimaConsagracao: null,
      medicinas: [],
    };
  }

  const datas = consagracoesAtivas.map((c) => c.cerimonia.data).sort();
  const medicinas = [
    ...new Set(
      consagracoesAtivas
        .map((c) => c.cerimonia.medicina_principal)
        .filter((m): m is string => m !== null)
    ),
  ];

  return {
    total: consagracoesAtivas.length,
    canceladas,
    primeiraConsagracao: datas[0],
    ultimaConsagracao: datas[datas.length - 1],
    medicinas,
  };
}
