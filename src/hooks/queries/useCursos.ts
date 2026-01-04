import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CursoEvento, InscricaoCurso, InscricaoCursoComRelacionamentos } from '@/types';

/**
 * Hook para buscar cursos/eventos futuros (públicos)
 * @param houseId - ID da casa (opcional)
 */
export const useCursosFuturos = (houseId?: string | null) => {
  return useQuery({
    queryKey: ['cursos-futuros', houseId],
    queryFn: async () => {
      let query = supabase
        .from('cursos_eventos')
        .select('*')
        .eq('ativo', true)
        .gte('data_inicio', new Date().toISOString().split('T')[0])
        .order('data_inicio', { ascending: true });

      if (houseId) {
        query = query.eq('house_id', houseId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as CursoEvento[];
    },
    enabled: !!houseId,
  });
};

/**
 * Hook para buscar cursos/eventos passados (historico)
 * @param houseId - ID da casa (opcional)
 */
export const useCursosPassados = (houseId?: string | null) => {
  return useQuery({
    queryKey: ['cursos-passados', houseId],
    queryFn: async () => {
      let query = supabase
        .from('cursos_eventos')
        .select('*')
        .lt('data_inicio', new Date().toISOString().split('T')[0])
        .order('data_inicio', { ascending: false });

      if (houseId) {
        query = query.eq('house_id', houseId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as CursoEvento[];
    },
    enabled: !!houseId,
  });
};

/**
 * Hook para buscar todos os cursos (Admin)
 * @param houseId - ID da casa (opcional)
 */
export const useCursosAdmin = (houseId?: string | null) => {
  return useQuery({
    queryKey: ['admin-cursos', houseId],
    queryFn: async () => {
      let query = supabase
        .from('cursos_eventos')
        .select('*')
        .order('data_inicio', { ascending: false });

      if (houseId) {
        query = query.eq('house_id', houseId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as CursoEvento[];
    },
  });
};

/**
 * Hook para buscar inscrições do usuário em cursos
 */
export const useMinhasInscricoesCursos = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['minhas-inscricoes-cursos', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inscricoes_cursos')
        .select('curso_id')
        .eq('user_id', userId!);

      if (error) throw error;
      return data.map(i => i.curso_id);
    },
  });
};

/**
 * Hook para buscar todas as inscrições em cursos (Admin)
 * @param houseId - ID da casa (opcional)
 */
export const useInscricoesCursosAdmin = (houseId?: string | null) => {
  return useQuery({
    queryKey: ['admin-inscricoes-cursos', houseId],
    queryFn: async () => {
      let query = supabase
        .from('inscricoes_cursos')
        .select(`
          *,
          profiles:user_id(id, full_name),
          cursos_eventos:curso_id(*)
        `)
        .order('data_inscricao', { ascending: false });

      if (houseId) {
        query = query.eq('house_id', houseId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as InscricaoCursoComRelacionamentos[];
    },
  });
};

/**
 * Hook para contar vagas disponíveis por curso
 */
export const useVagasCursos = (cursoIds: string[]) => {
  return useQuery({
    queryKey: ['vagas-cursos', cursoIds],
    enabled: cursoIds.length > 0,
    queryFn: async () => {
      const { data: inscricoes, error } = await supabase
        .from('inscricoes_cursos')
        .select('curso_id')
        .in('curso_id', cursoIds);

      if (error) throw error;

      const contagem: Record<string, number> = {};
      inscricoes?.forEach(i => {
        contagem[i.curso_id] = (contagem[i.curso_id] || 0) + 1;
      });

      return contagem;
    },
  });
};

/**
 * Hook para criar curso (Admin)
 */
export const useCreateCurso = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (curso: Omit<CursoEvento, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('cursos_eventos')
        .insert(curso)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cursos-futuros'] });
      queryClient.invalidateQueries({ queryKey: ['admin-cursos'] });
    },
  });
};

/**
 * Hook para atualizar curso (Admin)
 */
export const useUpdateCurso = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...curso }: Partial<CursoEvento> & { id: string }) => {
      const { data, error } = await supabase
        .from('cursos_eventos')
        .update({ ...curso, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cursos-futuros'] });
      queryClient.invalidateQueries({ queryKey: ['admin-cursos'] });
    },
  });
};

/**
 * Hook para deletar curso (Admin)
 */
export const useDeleteCurso = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cursoId: string) => {
      const { error } = await supabase
        .from('cursos_eventos')
        .delete()
        .eq('id', cursoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cursos-futuros'] });
      queryClient.invalidateQueries({ queryKey: ['admin-cursos'] });
    },
  });
};

/**
 * Hook para inscrever em curso
 */
export const useInscreverCurso = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cursoId, userId, formaPagamento }: { 
      cursoId: string; 
      userId: string; 
      formaPagamento?: string;
    }) => {
      // Verificar se usuário está bloqueado para cursos
      const { data: profile } = await supabase
        .from('profiles')
        .select('bloqueado, bloqueado_cursos')
        .eq('id', userId)
        .single();
      
      if (profile?.bloqueado && profile?.bloqueado_cursos) {
        throw new Error('Você está bloqueado e não pode se inscrever em cursos. Entre em contato com a administração.');
      }
      
      const { data, error } = await supabase
        .from('inscricoes_cursos')
        .insert({
          curso_id: cursoId,
          user_id: userId,
          forma_pagamento: formaPagamento,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['minhas-inscricoes-cursos'] });
      queryClient.invalidateQueries({ queryKey: ['vagas-cursos'] });
      queryClient.invalidateQueries({ queryKey: ['admin-inscricoes-cursos'] });
    },
  });
};

/**
 * Hook para cancelar inscrição em curso
 */
export const useCancelarInscricaoCurso = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cursoId, userId }: { cursoId: string; userId: string }) => {
      const { error } = await supabase
        .from('inscricoes_cursos')
        .delete()
        .eq('curso_id', cursoId)
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['minhas-inscricoes-cursos'] });
      queryClient.invalidateQueries({ queryKey: ['vagas-cursos'] });
      queryClient.invalidateQueries({ queryKey: ['admin-inscricoes-cursos'] });
    },
  });
};

/**
 * Hook para atualizar pagamento de inscrição (Admin)
 */
export const useAtualizarPagamentoCurso = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ inscricaoId, pago }: { inscricaoId: string; pago: boolean }) => {
      const { error } = await supabase
        .from('inscricoes_cursos')
        .update({ pago })
        .eq('id', inscricaoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-inscricoes-cursos'] });
    },
  });
};
