import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CategoriaFinanceira, TransacaoFinanceira, TransacaoComCategoria } from '@/types';

/**
 * Hook para buscar categorias financeiras
 */
export const useCategoriasFinanceiras = (houseId?: string) => {
  return useQuery({
    queryKey: ['categorias-financeiras', houseId],
    queryFn: async () => {
      if (!houseId) return [];
      
      const { data, error } = await supabase
        .from('categorias_financeiras')
        .select('*')
        .eq('house_id', houseId)
        .eq('ativo', true)
        .order('tipo')
        .order('nome');

      if (error) throw error;
      return data as CategoriaFinanceira[];
    },
    enabled: !!houseId,
  });
};

/**
 * Hook para buscar transacoes com filtros (inclui pagamentos do Mercado Pago)
 */
export const useTransacoes = (filtros?: {
  houseId?: string;
  dataInicio?: string;
  dataFim?: string;
  tipo?: 'entrada' | 'saida';
  categoriaId?: string;
}) => {
  return useQuery({
    queryKey: ['transacoes-financeiras', filtros],
    queryFn: async () => {
      if (!filtros?.houseId) return [];
      
      // Buscar transacoes manuais
      let queryTransacoes = supabase
        .from('transacoes_financeiras')
        .select(`
          *,
          categoria:categorias_financeiras(*)
        `)
        .eq('house_id', filtros.houseId)
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

      // Se filtro e saida, nao buscar pagamentos
      if (filtros?.tipo === 'saida') {
        return transacoes as TransacaoComCategoria[];
      }

      // Buscar pagamentos aprovados do Mercado Pago
      let queryPagamentos = supabase
        .from('pagamentos')
        .select('*')
        .eq('house_id', filtros.houseId)
        .eq('mp_status', 'approved');

      if (filtros?.dataInicio) {
        queryPagamentos = queryPagamentos.gte('paid_at', filtros.dataInicio);
      }
      if (filtros?.dataFim) {
        queryPagamentos = queryPagamentos.lte('paid_at', filtros.dataFim + 'T23:59:59');
      }

      const { data: pagamentos, error: errPagamentos } = await queryPagamentos;
      if (errPagamentos) throw errPagamentos;

      // Converter pagamentos para formato de transacao
      const pagamentosComoTransacoes: TransacaoComCategoria[] = (pagamentos || []).map(p => ({
        id: `mp-${p.id}`,
        house_id: p.house_id,
        tipo: 'entrada' as const,
        categoria_id: null,
        descricao: p.descricao || (p.tipo === 'produto' ? 'Venda Loja' : 'Pagamento Cerimonia'),
        valor: p.valor_centavos,
        data: p.paid_at ? p.paid_at.split('T')[0] : p.created_at.split('T')[0],
        forma_pagamento: p.mp_payment_method || 'Mercado Pago',
        referencia_tipo: p.tipo === 'produto' ? 'produto' : 'inscricao',
        referencia_id: p.produto_id || p.inscricao_id || null,
        observacoes: `MP ID: ${p.mp_payment_id || '-'}`,
        created_by: p.user_id,
        created_at: p.created_at,
        updated_at: p.created_at,
        reconciliada: true, // Pagamentos MP sao automaticamente reconciliados
        reconciliada_em: p.paid_at || null,
        reconciliada_por: null,
        categoria: {
          id: 'mp-auto',
          house_id: p.house_id,
          nome: p.tipo === 'produto' ? 'Loja (MP)' : 'Cerimonias (MP)',
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
    enabled: !!filtros?.houseId,
  });
};

/**
 * Hook para resumo financeiro (totais) - inclui pagamentos MP
 */
export const useResumoFinanceiro = (houseId?: string, dataInicio?: string, dataFim?: string) => {
  return useQuery({
    queryKey: ['resumo-financeiro', houseId, dataInicio, dataFim],
    queryFn: async () => {
      if (!houseId) return { entradas: 0, saidas: 0, saldo: 0, entradasMP: 0, entradasManuais: 0 };
      
      // Transacoes manuais
      let queryTransacoes = supabase
        .from('transacoes_financeiras')
        .select('tipo, valor')
        .eq('house_id', houseId);

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
        .eq('house_id', houseId)
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
    enabled: !!houseId,
  });
};

/**
 * Hook para dados do grafico mensal - inclui pagamentos MP
 */
export const useDadosMensais = (houseId?: string, ano?: number) => {
  const anoAtual = ano ?? new Date().getFullYear();
  
  return useQuery({
    queryKey: ['dados-mensais', houseId, anoAtual],
    queryFn: async () => {
      if (!houseId) return Array.from({ length: 12 }, (_, i) => ({ mes: i + 1, entradas: 0, saidas: 0 }));
      
      // Transacoes manuais
      const { data: transacoes, error: errT } = await supabase
        .from('transacoes_financeiras')
        .select('tipo, valor, data')
        .eq('house_id', houseId)
        .gte('data', `${anoAtual}-01-01`)
        .lte('data', `${anoAtual}-12-31`);

      if (errT) throw errT;

      // Pagamentos aprovados do Mercado Pago
      const { data: pagamentos, error: errP } = await supabase
        .from('pagamentos')
        .select('valor_centavos, paid_at')
        .eq('house_id', houseId)
        .eq('mp_status', 'approved')
        .gte('paid_at', `${anoAtual}-01-01`)
        .lte('paid_at', `${anoAtual}-12-31T23:59:59`);

      if (errP) throw errP;

      // Agrupar por mes
      const meses = Array.from({ length: 12 }, (_, i) => ({
        mes: i + 1,
        entradas: 0,
        saidas: 0,
      }));

      // Transacoes manuais
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
    enabled: !!houseId,
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
  house_id: string;
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
export const useDespesasRecorrentes = (houseId?: string) => {
  return useQuery({
    queryKey: ['despesas-recorrentes', houseId],
    queryFn: async () => {
      if (!houseId) return [];
      
      const { data, error } = await supabase
        .from('despesas_recorrentes')
        .select(`
          *,
          categoria:categorias_financeiras(id, nome, cor)
        `)
        .eq('house_id', houseId)
        .eq('ativo', true)
        .order('dia_vencimento');

      if (error) throw error;
      return data as DespesaRecorrente[];
    },
    enabled: !!houseId,
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
  house_id: string;
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
  house_id: string;
  tipo: 'saldo_baixo' | 'meta_atingida' | 'despesa_alta';
  valor_limite: number | null;
  percentual_limite: number | null;
  ativo: boolean;
}

/**
 * Hook para buscar metas financeiras do mes/ano
 */
export const useMetasFinanceiras = (houseId?: string, mes?: number, ano?: number) => {
  const hoje = new Date();
  const mesAtual = mes ?? hoje.getMonth() + 1;
  const anoAtual = ano ?? hoje.getFullYear();

  return useQuery({
    queryKey: ['metas-financeiras', houseId, mesAtual, anoAtual],
    queryFn: async () => {
      if (!houseId) return [];
      
      const { data, error } = await supabase
        .from('metas_financeiras')
        .select(`
          *,
          categoria:categorias_financeiras(id, nome, cor)
        `)
        .eq('house_id', houseId)
        .eq('mes', mesAtual)
        .eq('ano', anoAtual)
        .eq('ativo', true)
        .order('created_at');

      if (error) throw error;
      return data as MetaFinanceira[];
    },
    enabled: !!houseId,
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
 * Hook para buscar configuracao de alertas
 */
export const useConfigAlertas = (houseId?: string) => {
  return useQuery({
    queryKey: ['config-alertas-financeiros', houseId],
    queryFn: async () => {
      if (!houseId) return [];
      
      const { data, error } = await supabase
        .from('config_alertas_financeiros')
        .select('*')
        .eq('house_id', houseId)
        .eq('ativo', true);

      if (error) throw error;
      return data as ConfigAlertaFinanceiro[];
    },
    enabled: !!houseId,
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
 * Hook para calcular progresso das metas com base nas transacoes
 */
export const useProgressoMetas = (houseId?: string, mes?: number, ano?: number) => {
  const hoje = new Date();
  const mesAtual = mes ?? hoje.getMonth() + 1;
  const anoAtual = ano ?? hoje.getFullYear();

  const { data: metas } = useMetasFinanceiras(houseId, mesAtual, anoAtual);
  
  // Calcular datas do periodo
  const dataInicio = `${anoAtual}-${String(mesAtual).padStart(2, '0')}-01`;
  const ultimoDia = new Date(anoAtual, mesAtual, 0).getDate();
  const dataFim = `${anoAtual}-${String(mesAtual).padStart(2, '0')}-${ultimoDia}`;

  const { data: resumo } = useResumoFinanceiro(houseId, dataInicio, dataFim);

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


// ============================================
// Anexos de Transações
// ============================================

export interface AnexoTransacao {
  id: string;
  transacao_id: string;
  nome_arquivo: string;
  url: string;
  tipo_arquivo: string | null;
  tamanho: number | null;
  descricao: string | null;
  created_at: string;
  created_by: string | null;
}

/**
 * Hook para buscar anexos de uma transação
 */
export const useAnexosTransacao = (transacaoId: string | null) => {
  return useQuery({
    queryKey: ['anexos-transacao', transacaoId],
    queryFn: async () => {
      if (!transacaoId) return [];
      
      const { data, error } = await supabase
        .from('anexos_transacoes')
        .select('*')
        .eq('transacao_id', transacaoId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AnexoTransacao[];
    },
    enabled: !!transacaoId,
  });
};

/**
 * Hook para fazer upload de anexo
 */
export const useUploadAnexo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      transacaoId, 
      file, 
      descricao 
    }: { 
      transacaoId: string; 
      file: File; 
      descricao?: string;
    }) => {
      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${transacaoId}/${Date.now()}.${fileExt}`;

      // Upload para o storage
      const { error: uploadError } = await supabase.storage
        .from('comprovantes')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from('comprovantes')
        .getPublicUrl(fileName);

      // Salvar registro no banco
      const { data, error } = await supabase
        .from('anexos_transacoes')
        .insert({
          transacao_id: transacaoId,
          nome_arquivo: file.name,
          url: urlData.publicUrl,
          tipo_arquivo: file.type,
          tamanho: file.size,
          descricao: descricao || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['anexos-transacao', variables.transacaoId] });
    },
  });
};

/**
 * Hook para deletar anexo
 */
export const useDeleteAnexo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, url, transacaoId }: { id: string; url: string; transacaoId: string }) => {
      // Extrair path do arquivo da URL
      const urlParts = url.split('/comprovantes/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage.from('comprovantes').remove([filePath]);
      }

      // Deletar registro
      const { error } = await supabase
        .from('anexos_transacoes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return transacaoId;
    },
    onSuccess: (transacaoId) => {
      queryClient.invalidateQueries({ queryKey: ['anexos-transacao', transacaoId] });
    },
  });
};

/**
 * Hook para contar anexos de uma transação
 */
export const useContarAnexos = (transacaoIds: string[]) => {
  return useQuery({
    queryKey: ['contar-anexos', transacaoIds],
    queryFn: async () => {
      if (!transacaoIds.length) return {};

      const { data, error } = await supabase
        .from('anexos_transacoes')
        .select('transacao_id')
        .in('transacao_id', transacaoIds);

      if (error) throw error;

      // Contar por transação
      const contagem: Record<string, number> = {};
      data?.forEach(a => {
        contagem[a.transacao_id] = (contagem[a.transacao_id] || 0) + 1;
      });

      return contagem;
    },
    enabled: transacaoIds.length > 0,
  });
};


// ============================================
// Reconciliação de Transações
// ============================================

export interface FechamentoMensal {
  id: string;
  mes: number;
  ano: number;
  total_entradas: number;
  total_saidas: number;
  saldo: number;
  total_transacoes: number;
  transacoes_reconciliadas: number;
  status: 'aberto' | 'em_revisao' | 'fechado';
  observacoes: string | null;
  fechado_em: string | null;
  fechado_por: string | null;
  created_at: string;
}

/**
 * Hook para reconciliar/desreconciliar transação
 */
export const useReconciliarTransacao = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reconciliada, userId }: { id: string; reconciliada: boolean; userId: string }) => {
      const { data, error } = await supabase
        .from('transacoes_financeiras')
        .update({
          reconciliada,
          reconciliada_em: reconciliada ? new Date().toISOString() : null,
          reconciliada_por: reconciliada ? userId : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transacoes-financeiras'] });
      queryClient.invalidateQueries({ queryKey: ['fechamento-mensal'] });
    },
  });
};

/**
 * Hook para reconciliar múltiplas transações de uma vez
 */
export const useReconciliarLote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ids, reconciliada, userId }: { ids: string[]; reconciliada: boolean; userId: string }) => {
      const { error } = await supabase
        .from('transacoes_financeiras')
        .update({
          reconciliada,
          reconciliada_em: reconciliada ? new Date().toISOString() : null,
          reconciliada_por: reconciliada ? userId : null,
          updated_at: new Date().toISOString(),
        })
        .in('id', ids);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transacoes-financeiras'] });
      queryClient.invalidateQueries({ queryKey: ['fechamento-mensal'] });
    },
  });
};

/**
 * Hook para buscar fechamento mensal
 */
export const useFechamentoMensal = (mes: number, ano: number) => {
  return useQuery({
    queryKey: ['fechamento-mensal', mes, ano],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fechamentos_mensais')
        .select('*')
        .eq('mes', mes)
        .eq('ano', ano)
        .maybeSingle();

      if (error) throw error;
      return data as FechamentoMensal | null;
    },
  });
};

/**
 * Hook para criar/atualizar fechamento mensal
 */
export const useUpsertFechamento = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fechamento: Omit<FechamentoMensal, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('fechamentos_mensais')
        .upsert(
          { ...fechamento, updated_at: new Date().toISOString() },
          { onConflict: 'mes,ano' }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fechamento-mensal'] });
    },
  });
};

/**
 * Hook para estatisticas de reconciliacao do periodo
 */
export const useEstatisticasReconciliacao = (houseId?: string, dataInicio?: string, dataFim?: string) => {
  return useQuery({
    queryKey: ['estatisticas-reconciliacao', houseId, dataInicio, dataFim],
    queryFn: async () => {
      if (!houseId || !dataInicio || !dataFim) {
        return { total: 0, reconciliadas: 0, pendentes: 0, percentual: 0, valorReconciliado: 0, valorPendente: 0 };
      }
      
      const { data, error } = await supabase
        .from('transacoes_financeiras')
        .select('id, reconciliada, valor, tipo')
        .eq('house_id', houseId)
        .gte('data', dataInicio)
        .lte('data', dataFim);

      if (error) throw error;

      const total = data?.length || 0;
      const reconciliadas = data?.filter(t => t.reconciliada).length || 0;
      const pendentes = total - reconciliadas;
      const percentual = total > 0 ? (reconciliadas / total) * 100 : 0;

      const valorReconciliado = data
        ?.filter(t => t.reconciliada)
        .reduce((acc, t) => acc + (t.tipo === 'entrada' ? t.valor : -t.valor), 0) || 0;

      const valorPendente = data
        ?.filter(t => !t.reconciliada)
        .reduce((acc, t) => acc + (t.tipo === 'entrada' ? t.valor : -t.valor), 0) || 0;

      return {
        total,
        reconciliadas,
        pendentes,
        percentual,
        valorReconciliado,
        valorPendente,
      };
    },
    enabled: !!houseId && !!dataInicio && !!dataFim,
  });
};
