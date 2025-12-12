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
 * Hook para buscar transações com filtros (inclui pagamentos do Mercado Pago)
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
      // Buscar transações manuais
      let queryTransacoes = supabase
        .from('transacoes_financeiras')
        .select(`
          *,
          categoria:categorias_financeiras(*)
        `)
        .order('data', { ascending: false });

      if (filtros?.dataInicio) {
        queryTransacoes = queryTransacoes.gte('data', filtros.dataInicio);
      }
      if (filtros?.dataFim) {
        queryTransacoes = queryTransacoes.lte('data', filtros.dataFim);
      }
      if (filtros?.tipo) {
        queryTransacoes = queryTransacoes.eq('tipo', filtros.tipo);
      }
      if (filtros?.categoriaId) {
        queryTransacoes = queryTransacoes.eq('categoria_id', filtros.categoriaId);
      }

      const { data: transacoes, error: errTransacoes } = await queryTransacoes;
      if (errTransacoes) throw errTransacoes;

      // Se filtro é saída, não buscar pagamentos
      if (filtros?.tipo === 'saida') {
        return transacoes as TransacaoComCategoria[];
      }

      // Buscar pagamentos aprovados do Mercado Pago
      let queryPagamentos = supabase
        .from('pagamentos')
        .select('*')
        .eq('mp_status', 'approved');

      if (filtros?.dataInicio) {
        queryPagamentos = queryPagamentos.gte('paid_at', filtros.dataInicio);
      }
      if (filtros?.dataFim) {
        queryPagamentos = queryPagamentos.lte('paid_at', filtros.dataFim + 'T23:59:59');
      }

      const { data: pagamentos, error: errPagamentos } = await queryPagamentos;
      if (errPagamentos) throw errPagamentos;

      // Converter pagamentos para formato de transação
      const pagamentosComoTransacoes: TransacaoComCategoria[] = (pagamentos || []).map(p => ({
        id: `mp-${p.id}`,
        tipo: 'entrada' as const,
        categoria_id: null,
        descricao: p.descricao || (p.tipo === 'produto' ? 'Venda Loja' : 'Pagamento Cerimônia'),
        valor: p.valor_centavos,
        data: p.paid_at ? p.paid_at.split('T')[0] : p.created_at.split('T')[0],
        forma_pagamento: p.mp_payment_method || 'Mercado Pago',
        referencia_tipo: p.tipo === 'produto' ? 'produto' : 'inscricao',
        referencia_id: p.produto_id || p.inscricao_id || null,
        observacoes: `MP ID: ${p.mp_payment_id || '-'}`,
        created_by: p.user_id,
        created_at: p.created_at,
        updated_at: p.created_at,
        categoria: {
          id: 'mp-auto',
          nome: p.tipo === 'produto' ? 'Loja (MP)' : 'Cerimônias (MP)',
          tipo: 'entrada' as const,
          cor: p.tipo === 'produto' ? '#f59e0b' : '#22c55e',
          icone: null,
          ativo: true,
          created_at: '',
        },
      }));

      // Combinar e ordenar por data
      const todas = [...(transacoes || []), ...pagamentosComoTransacoes];
      todas.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

      return todas as TransacaoComCategoria[];
    },
  });
};

/**
 * Hook para resumo financeiro (totais) - inclui pagamentos MP
 */
export const useResumoFinanceiro = (dataInicio?: string, dataFim?: string) => {
  return useQuery({
    queryKey: ['resumo-financeiro', dataInicio, dataFim],
    queryFn: async () => {
      // Transações manuais
      let queryTransacoes = supabase
        .from('transacoes_financeiras')
        .select('tipo, valor');

      if (dataInicio) {
        queryTransacoes = queryTransacoes.gte('data', dataInicio);
      }
      if (dataFim) {
        queryTransacoes = queryTransacoes.lte('data', dataFim);
      }

      const { data: transacoes, error: errT } = await queryTransacoes;
      if (errT) throw errT;

      // Pagamentos aprovados do Mercado Pago
      let queryPagamentos = supabase
        .from('pagamentos')
        .select('valor_centavos, paid_at')
        .eq('mp_status', 'approved');

      if (dataInicio) {
        queryPagamentos = queryPagamentos.gte('paid_at', dataInicio);
      }
      if (dataFim) {
        queryPagamentos = queryPagamentos.lte('paid_at', dataFim + 'T23:59:59');
      }

      const { data: pagamentos, error: errP } = await queryPagamentos;
      if (errP) throw errP;

      const entradasManuais = transacoes?.filter(t => t.tipo === 'entrada').reduce((acc, t) => acc + t.valor, 0) || 0;
      const entradasMP = pagamentos?.reduce((acc, p) => acc + p.valor_centavos, 0) || 0;
      const entradas = entradasManuais + entradasMP;
      
      const saidas = transacoes?.filter(t => t.tipo === 'saida').reduce((acc, t) => acc + t.valor, 0) || 0;
      const saldo = entradas - saidas;

      return { entradas, saidas, saldo, entradasMP, entradasManuais };
    },
  });
};

/**
 * Hook para dados do gráfico mensal - inclui pagamentos MP
 */
export const useDadosMensais = (ano: number) => {
  return useQuery({
    queryKey: ['dados-mensais', ano],
    queryFn: async () => {
      // Transações manuais
      const { data: transacoes, error: errT } = await supabase
        .from('transacoes_financeiras')
        .select('tipo, valor, data')
        .gte('data', `${ano}-01-01`)
        .lte('data', `${ano}-12-31`);

      if (errT) throw errT;

      // Pagamentos aprovados do Mercado Pago
      const { data: pagamentos, error: errP } = await supabase
        .from('pagamentos')
        .select('valor_centavos, paid_at')
        .eq('mp_status', 'approved')
        .gte('paid_at', `${ano}-01-01`)
        .lte('paid_at', `${ano}-12-31T23:59:59`);

      if (errP) throw errP;

      // Agrupar por mês
      const meses = Array.from({ length: 12 }, (_, i) => ({
        mes: i + 1,
        entradas: 0,
        saidas: 0,
      }));

      // Transações manuais
      transacoes?.forEach(t => {
        const mes = new Date(t.data).getMonth();
        if (t.tipo === 'entrada') {
          meses[mes].entradas += t.valor;
        } else {
          meses[mes].saidas += t.valor;
        }
      });

      // Pagamentos MP
      pagamentos?.forEach(p => {
        if (p.paid_at) {
          const mes = new Date(p.paid_at).getMonth();
          meses[mes].entradas += p.valor_centavos;
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


// ============================================
// Despesas Recorrentes
// ============================================

export interface DespesaRecorrente {
  id: string;
  nome: string;
  categoria_id: string | null;
  valor: number;
  dia_vencimento: number | null;
  ativo: boolean;
  observacoes: string | null;
  created_at: string;
  categoria?: {
    id: string;
    nome: string;
    cor: string | null;
  };
}

/**
 * Hook para buscar despesas recorrentes
 */
export const useDespesasRecorrentes = () => {
  return useQuery({
    queryKey: ['despesas-recorrentes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('despesas_recorrentes')
        .select(`
          *,
          categoria:categorias_financeiras(id, nome, cor)
        `)
        .eq('ativo', true)
        .order('dia_vencimento');

      if (error) throw error;
      return data as DespesaRecorrente[];
    },
  });
};

/**
 * Hook para criar despesa recorrente
 */
export const useCreateDespesaRecorrente = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (despesa: Omit<DespesaRecorrente, 'id' | 'created_at' | 'categoria'>) => {
      const { data, error } = await supabase
        .from('despesas_recorrentes')
        .insert(despesa)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['despesas-recorrentes'] });
    },
  });
};

/**
 * Hook para deletar despesa recorrente
 */
export const useDeleteDespesaRecorrente = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('despesas_recorrentes')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['despesas-recorrentes'] });
    },
  });
};

/**
 * Hook para calcular projeção mensal
 */
export const useProjecaoMensal = () => {
  const { data: despesas } = useDespesasRecorrentes();
  
  const totalRecorrente = despesas?.reduce((acc, d) => acc + d.valor, 0) || 0;
  
  return { totalRecorrente, despesas };
};


// ============================================
// Metas Financeiras
// ============================================

export interface MetaFinanceira {
  id: string;
  nome: string;
  tipo: 'receita' | 'economia' | 'reducao_despesa';
  valor_meta: number;
  valor_atual: number;
  mes: number;
  ano: number;
  categoria_id: string | null;
  descricao: string | null;
  ativo: boolean;
  created_at: string;
  categoria?: {
    id: string;
    nome: string;
    cor: string | null;
  };
}

export interface ConfigAlertaFinanceiro {
  id: string;
  tipo: 'saldo_baixo' | 'meta_atingida' | 'despesa_alta';
  valor_limite: number | null;
  percentual_limite: number | null;
  ativo: boolean;
}

/**
 * Hook para buscar metas financeiras do mês/ano
 */
export const useMetasFinanceiras = (mes?: number, ano?: number) => {
  const hoje = new Date();
  const mesAtual = mes ?? hoje.getMonth() + 1;
  const anoAtual = ano ?? hoje.getFullYear();

  return useQuery({
    queryKey: ['metas-financeiras', mesAtual, anoAtual],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('metas_financeiras')
        .select(`
          *,
          categoria:categorias_financeiras(id, nome, cor)
        `)
        .eq('mes', mesAtual)
        .eq('ano', anoAtual)
        .eq('ativo', true)
        .order('created_at');

      if (error) throw error;
      return data as MetaFinanceira[];
    },
  });
};

/**
 * Hook para criar meta financeira
 */
export const useCreateMetaFinanceira = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (meta: Omit<MetaFinanceira, 'id' | 'created_at' | 'updated_at' | 'valor_atual' | 'categoria'>) => {
      const { data, error } = await supabase
        .from('metas_financeiras')
        .insert({ ...meta, valor_atual: 0 })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metas-financeiras'] });
    },
  });
};

/**
 * Hook para deletar meta financeira
 */
export const useDeleteMetaFinanceira = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('metas_financeiras')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metas-financeiras'] });
    },
  });
};

/**
 * Hook para buscar configuração de alertas
 */
export const useConfigAlertas = () => {
  return useQuery({
    queryKey: ['config-alertas-financeiros'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('config_alertas_financeiros')
        .select('*')
        .eq('ativo', true);

      if (error) throw error;
      return data as ConfigAlertaFinanceiro[];
    },
  });
};

/**
 * Hook para atualizar configuração de alerta
 */
export const useUpdateConfigAlerta = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...config }: Partial<ConfigAlertaFinanceiro> & { id: string }) => {
      const { data, error } = await supabase
        .from('config_alertas_financeiros')
        .update({ ...config, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config-alertas-financeiros'] });
    },
  });
};

/**
 * Hook para calcular progresso das metas com base nas transações
 */
export const useProgressoMetas = (mes?: number, ano?: number) => {
  const hoje = new Date();
  const mesAtual = mes ?? hoje.getMonth() + 1;
  const anoAtual = ano ?? hoje.getFullYear();

  const { data: metas } = useMetasFinanceiras(mesAtual, anoAtual);
  
  // Calcular datas do período
  const dataInicio = `${anoAtual}-${String(mesAtual).padStart(2, '0')}-01`;
  const ultimoDia = new Date(anoAtual, mesAtual, 0).getDate();
  const dataFim = `${anoAtual}-${String(mesAtual).padStart(2, '0')}-${ultimoDia}`;

  const { data: resumo } = useResumoFinanceiro(dataInicio, dataFim);

  // Calcular progresso de cada meta
  const metasComProgresso = metas?.map(meta => {
    let valorAtual = 0;
    
    switch (meta.tipo) {
      case 'receita':
        valorAtual = resumo?.entradas || 0;
        break;
      case 'economia':
        valorAtual = Math.max(0, (resumo?.entradas || 0) - (resumo?.saidas || 0));
        break;
      case 'reducao_despesa':
        // Para redução, quanto menor a saída, melhor
        valorAtual = meta.valor_meta - (resumo?.saidas || 0);
        break;
    }

    const percentual = meta.valor_meta > 0 ? Math.min(100, (valorAtual / meta.valor_meta) * 100) : 0;
    
    return {
      ...meta,
      valor_atual: valorAtual,
      percentual,
      atingida: percentual >= 100,
    };
  });

  return { metas: metasComProgresso, resumo };
};
