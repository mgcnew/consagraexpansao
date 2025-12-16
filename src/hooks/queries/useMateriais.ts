import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Material, MaterialComAutor } from '@/types';

/**
 * Hook para buscar materiais publicados (usuários)
 */
export const useMateriais = (categoria?: string) => {
  return useQuery({
    queryKey: ['materiais', categoria],
    queryFn: async (): Promise<MaterialComAutor[]> => {
      let query = supabase
        .from('materiais')
        .select(`
          *,
          autor:profiles(full_name, avatar_url)
        `)
        .eq('publicado', true)
        .order('destaque', { ascending: false })
        .order('created_at', { ascending: false });

      if (categoria && categoria !== 'todas') {
        query = query.eq('categoria', categoria);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as MaterialComAutor[];
    },
  });
};

/**
 * Hook para buscar todos os materiais (admin)
 */
export const useMateriaisAdmin = () => {
  return useQuery({
    queryKey: ['materiais-admin'],
    queryFn: async (): Promise<MaterialComAutor[]> => {
      const { data, error } = await supabase
        .from('materiais')
        .select(`
          *,
          autor:profiles(full_name, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as MaterialComAutor[];
    },
  });
};

/**
 * Hook para buscar um material específico
 */
export const useMaterial = (id: string | null) => {
  return useQuery({
    queryKey: ['material', id],
    enabled: !!id,
    queryFn: async (): Promise<MaterialComAutor | null> => {
      const { data, error } = await supabase
        .from('materiais')
        .select(`
          *,
          autor:profiles(full_name, avatar_url)
        `)
        .eq('id', id!)
        .single();

      if (error) throw error;
      return data as MaterialComAutor;
    },
  });
};

/**
 * Hook para criar material
 */
export const useCreateMaterial = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (material: Omit<Material, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('materiais')
        .insert(material)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materiais'] });
      queryClient.invalidateQueries({ queryKey: ['materiais-admin'] });
    },
  });
};

/**
 * Hook para atualizar material
 */
export const useUpdateMaterial = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Material> & { id: string }) => {
      const { data, error } = await supabase
        .from('materiais')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materiais'] });
      queryClient.invalidateQueries({ queryKey: ['materiais-admin'] });
      queryClient.invalidateQueries({ queryKey: ['material'] });
    },
  });
};

/**
 * Hook para deletar material
 */
export const useDeleteMaterial = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('materiais')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materiais'] });
      queryClient.invalidateQueries({ queryKey: ['materiais-admin'] });
    },
  });
};

/**
 * Categorias disponíveis para materiais
 */
export const CATEGORIAS_MATERIAIS = [
  { value: 'integracao', label: 'Integração', icon: '🌱' },
  { value: 'medicinas', label: 'Medicinas', icon: '🍃' },
  { value: 'praticas', label: 'Práticas', icon: '🧘' },
  { value: 'reflexoes', label: 'Reflexões', icon: '💭' },
  { value: 'estudos', label: 'Estudos', icon: '📚' },
  { value: 'geral', label: 'Geral', icon: '✨' },
] as const;

export type CategoriaMaterial = typeof CATEGORIAS_MATERIAIS[number]['value'];
