import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Types
export interface Curtida {
  id: string;
  material_id: string;
  user_id: string;
  created_at: string;
}

export interface CurtidaComUsuario extends Curtida {
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export interface Comentario {
  id: string;
  material_id: string;
  user_id: string;
  texto: string;
  created_at: string;
  updated_at: string;
}

export interface ComentarioComUsuario extends Comentario {
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

// Hook para buscar curtidas de um material
export const useCurtidasMaterial = (materialId: string | undefined) => {
  return useQuery({
    queryKey: ['materiais-curtidas', materialId],
    queryFn: async () => {
      if (!materialId) return [];
      
      // Buscar curtidas
      const { data: curtidas, error: curtidasError } = await supabase
        .from('materiais_curtidas')
        .select('*')
        .eq('material_id', materialId)
        .order('created_at', { ascending: false });

      if (curtidasError) throw curtidasError;
      if (!curtidas || curtidas.length === 0) return [];

      // Buscar profiles dos usuários que curtiram
      const userIds = curtidas.map(c => c.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Combinar dados
      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);
      return curtidas.map(c => ({
        ...c,
        profiles: profilesMap.get(c.user_id) || null,
      })) as CurtidaComUsuario[];
    },
    enabled: !!materialId,
  });
};

// Hook para verificar se usuário curtiu
export const useUsuarioCurtiu = (materialId: string | undefined) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['materiais-curtidas', materialId, 'usuario', user?.id],
    queryFn: async () => {
      if (!materialId || !user?.id) return false;
      
      const { data, error } = await supabase
        .from('materiais_curtidas')
        .select('id')
        .eq('material_id', materialId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!materialId && !!user?.id,
  });
};

// Hook para curtir/descurtir
export const useToggleCurtida = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ materialId, curtido }: { materialId: string; curtido: boolean }) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      if (curtido) {
        // Remover curtida
        const { error } = await supabase
          .from('materiais_curtidas')
          .delete()
          .eq('material_id', materialId)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        // Adicionar curtida
        const { error } = await supabase
          .from('materiais_curtidas')
          .insert({ material_id: materialId, user_id: user.id });
        if (error) throw error;
      }
      return materialId;
    },
    onSuccess: (materialId) => {
      // Invalidar queries específicas do material
      queryClient.invalidateQueries({ queryKey: ['materiais-curtidas', materialId] });
      // Invalidar também a query de verificação do usuário
      queryClient.invalidateQueries({ queryKey: ['materiais-curtidas', materialId, 'usuario'] });
    },
  });
};

// Hook para buscar comentários de um material
export const useComentariosMaterial = (materialId: string | undefined) => {
  return useQuery({
    queryKey: ['materiais-comentarios', materialId],
    queryFn: async () => {
      if (!materialId) return [];
      
      // Buscar comentários
      const { data: comentarios, error: comentariosError } = await supabase
        .from('materiais_comentarios')
        .select('*')
        .eq('material_id', materialId)
        .order('created_at', { ascending: true });

      if (comentariosError) throw comentariosError;
      if (!comentarios || comentarios.length === 0) return [];

      // Buscar profiles dos usuários que comentaram
      const userIds = comentarios.map(c => c.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Combinar dados
      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);
      return comentarios.map(c => ({
        ...c,
        profiles: profilesMap.get(c.user_id) || null,
      })) as ComentarioComUsuario[];
    },
    enabled: !!materialId,
  });
};

// Hook para criar comentário
export const useCreateComentario = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ materialId, texto }: { materialId: string; texto: string }) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('materiais_comentarios')
        .insert({ material_id: materialId, user_id: user.id, texto })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { materialId }) => {
      queryClient.invalidateQueries({ queryKey: ['materiais-comentarios', materialId] });
    },
  });
};

// Hook para deletar comentário
export const useDeleteComentario = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ comentarioId, materialId }: { comentarioId: string; materialId: string }) => {
      const { error } = await supabase
        .from('materiais_comentarios')
        .delete()
        .eq('id', comentarioId);

      if (error) throw error;
      return materialId;
    },
    onSuccess: (materialId) => {
      queryClient.invalidateQueries({ queryKey: ['materiais-comentarios', materialId] });
    },
  });
};
