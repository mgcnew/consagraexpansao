import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Tipos
export interface Permissao {
  id: string;
  nome: string;
  descricao: string | null;
  categoria: string;
}

export interface UserPermissao {
  id: string;
  user_id: string;
  permissao_id: string;
  concedido_por: string | null;
  created_at: string;
  permissao?: Permissao;
}

// Nomes das permissões para type-safety
export type PermissaoNome =
  | 'ver_consagradores'
  | 'editar_consagradores'
  | 'ver_cerimonias'
  | 'gerenciar_cerimonias'
  | 'ver_financeiro'
  | 'gerenciar_pagamentos'
  | 'aprovar_depoimentos'
  | 'ver_loja_admin'
  | 'gerenciar_produtos'
  | 'super_admin';

/**
 * Hook para buscar todas as permissões disponíveis
 */
export const usePermissoesDisponiveis = () => {
  return useQuery({
    queryKey: ['permissoes-disponiveis'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('permissoes')
        .select('*')
        .order('categoria', { ascending: true });
      if (error) throw error;
      return data as Permissao[];
    },
  });
};

/**
 * Hook para buscar permissões do usuário atual
 */
export const useMinhasPermissoes = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['minhas-permissoes', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_permissoes')
        .select(`
          *,
          permissao:permissoes(*)
        `)
        .eq('user_id', user!.id);
      if (error) throw error;
      return data as (UserPermissao & { permissao: Permissao })[];
    },
  });
};

/**
 * Hook para verificar se o usuário tem uma permissão específica
 */
export const useTemPermissao = (permissao: PermissaoNome): boolean => {
  const { data: permissoes, isLoading } = useMinhasPermissoes();

  if (isLoading || !permissoes) return false;

  // Super admin tem todas as permissões
  const isSuperAdmin = permissoes.some((p) => p.permissao?.nome === 'super_admin');
  if (isSuperAdmin) return true;

  return permissoes.some((p) => p.permissao?.nome === permissao);
};

/**
 * Hook para verificar múltiplas permissões (retorna true se tiver QUALQUER uma)
 */
export const useTemAlgumaPermissao = (permissoes: PermissaoNome[]): boolean => {
  const { data: minhasPermissoes, isLoading } = useMinhasPermissoes();

  if (isLoading || !minhasPermissoes) return false;

  const isSuperAdmin = minhasPermissoes.some((p) => p.permissao?.nome === 'super_admin');
  if (isSuperAdmin) return true;

  return permissoes.some((perm) => minhasPermissoes.some((p) => p.permissao?.nome === perm));
};

/**
 * Hook para buscar permissões de todos os usuários (apenas super_admin)
 */
export const useTodasPermissoesUsuarios = () => {
  return useQuery({
    queryKey: ['todas-permissoes-usuarios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_permissoes')
        .select(`
          *,
          permissao:permissoes(*)
        `);
      if (error) throw error;
      return data as (UserPermissao & { permissao: Permissao })[];
    },
  });
};

/**
 * Hook para conceder permissão a um usuário
 */
export const useConcederPermissao = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ userId, permissaoId }: { userId: string; permissaoId: string }) => {
      const { error } = await supabase.from('user_permissoes').insert({
        user_id: userId,
        permissao_id: permissaoId,
        concedido_por: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todas-permissoes-usuarios'] });
      queryClient.invalidateQueries({ queryKey: ['minhas-permissoes'] });
    },
  });
};

/**
 * Hook para revogar permissão de um usuário
 */
export const useRevogarPermissao = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, permissaoId }: { userId: string; permissaoId: string }) => {
      const { error } = await supabase
        .from('user_permissoes')
        .delete()
        .eq('user_id', userId)
        .eq('permissao_id', permissaoId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todas-permissoes-usuarios'] });
      queryClient.invalidateQueries({ queryKey: ['minhas-permissoes'] });
    },
  });
};
