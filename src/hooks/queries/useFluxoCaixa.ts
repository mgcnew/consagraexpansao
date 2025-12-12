import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CategoriaFinanceira, TransacaoFinanceira, TransacaoComCategoria } from '@/types';

/**
 * Hook para buscar categorias financeiras
 */
export const useCategoriasFinanceiras = () => {
  return useQuery({
    queryKey: ['categorias-financeiras'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categorias_financeiras')
        .select('*')
        .eq('ativo', true)
        .order('tipo')
        .order('nome');

      if (error) throw error;
      return data as CategoriaFinanceira[];
    },
  });
};

/**
 * Hook para buscar transações com filtros
 */
export const useTransacoes = (filtros?: {
  dataInicio?: string;
  dataFim?: string;
  tipo?: 'entrada' | 'saida';
  categoriaId?: string;
}) => {
  return useQuery({
    queryKey: ['transacoes-financeiras', filtros],
    queryFn: async () => {
      let query = supabase
        .from('transacoes_financeiras')
        .select(`
          *,
          categoria:categorias_financeiras(*)
        `)
        .order('data', { ascending: false })
        .order('created_at', { ascending: false });

      if (filtros?.dataInicio) {
        query = query.gte('data', filtros.dataInicio);
      }
      if (filtros?.dataFim) {
        query = query.lte('data', filtros.dataFim);
      }
      if (filtros?.tipo) {
        query = query.eq('tipo', filtros.tipo);
      }
      if (filtros?.categoriaId) {
        query = query.eq('categoria_id', filtros.categoriaId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as TransacaoComCategoria[];
    },
  });
};

/**
 * Hook para resumo financeiro (totais)
 */
export const useResumoFinanceiro = (dataInicio?: string, dataFim?: string) => {
  return useQuery({
    queryKey: ['resumo-financeiro', dataInicio, dataFim],
    queryFn: async () => {
      let query = supabase
        .from('transacoes_financeiras')
        .select('tipo, valor');

      if (dataInicio) {
        query = query.gte('data', dataInicio);
      }
      if (dataFim) {
        query = query.lte('data', dataFim);
      }

      const { data, error } = await query;
      if (error) throw error;

      const entradas = data?.filter(t => t.tipo === 'entrada').reduce((acc, t) => acc + t.valor, 0) || 0;
      const saidas = data?.filter(t => t.tipo === 'saida').reduce((acc, t) => acc + t.valor, 0) || 0;
      const saldo = entradas - saidas;

      return { entradas, saidas, saldo };
    },
  });
};

/**
 * Hook para dados do gráfico mensal
 */
export const useDadosMensais = (ano: number) => {
  return useQuery({
    queryKey: ['dados-mensais', ano],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transacoes_financeiras')
        .select('tipo, valor, data')
        .gte('data', `${ano}-01-01`)
        .lte('data', `${ano}-12-31`);

      if (error) throw error;

      // Agrupar por mês
      const meses = Array.from({ length: 12 }, (_, i) => ({
        mes: i + 1,
        entradas: 0,
        saidas: 0,
      }));

      data?.forEach(t => {
        const mes = new Date(t.data).getMonth();
        if (t.tipo === 'entrada') {
          meses[mes].entradas += t.valor;
        } else {
          meses[mes].saidas += t.valor;
        }
      });

      return meses;
    },
  });
};

/**
 * Hook para criar transação
 */
export const useCreateTransacao = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transacao: Omit<TransacaoFinanceira, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('transacoes_financeiras')
        .insert(transacao)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transacoes-financeiras'] });
      queryClient.invalidateQueries({ queryKey: ['resumo-financeiro'] });
      queryClient.invalidateQueries({ queryKey: ['dados-mensais'] });
    },
  });
};

/**
 * Hook para atualizar transação
 */
export const useUpdateTransacao = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...transacao }: Partial<TransacaoFinanceira> & { id: string }) => {
      const { data, error } = await supabase
        .from('transacoes_financeiras')
        .update({ ...transacao, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transacoes-financeiras'] });
      queryClient.invalidateQueries({ queryKey: ['resumo-financeiro'] });
      queryClient.invalidateQueries({ queryKey: ['dados-mensais'] });
    },
  });
};

/**
 * Hook para deletar transação
 */
export const useDeleteTransacao = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('transacoes_financeiras')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transacoes-financeiras'] });
      queryClient.invalidateQueries({ queryKey: ['resumo-financeiro'] });
      queryClient.invalidateQueries({ queryKey: ['dados-mensais'] });
    },
  });
};

/**
 * Hook para criar categoria
 */
export const useCreateCategoria = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categoria: Omit<CategoriaFinanceira, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('categorias_financeiras')
        .insert(categoria)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias-financeiras'] });
    },
  });
};
