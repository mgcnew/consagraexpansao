import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { GaleriaItemComCerimonia, GaleriaTipo } from '@/types';

/**
 * Hook para buscar itens da galeria
 * Ordenados por data de criação (mais recente primeiro)
 * @param houseId - ID da casa (opcional)
 */
export const useGaleria = (houseId?: string | null) => {
  return useQuery({
    queryKey: ['galeria', houseId],
    queryFn: async (): Promise<GaleriaItemComCerimonia[]> => {
      let query = supabase
        .from('galeria')
        .select(`
          *,
          cerimonias (
            id,
            nome,
            data,
            medicina_principal
          )
        `)
        .order('created_at', { ascending: false });

      if (houseId) {
        query = query.eq('house_id', houseId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as GaleriaItemComCerimonia[];
    },
  });
};

/**
 * Hook para buscar galeria por cerimônia
 */
export const useGaleriaByCerimonia = (cerimoniaId: string | null) => {
  return useQuery({
    queryKey: ['galeria', 'cerimonia', cerimoniaId],
    enabled: !!cerimoniaId,
    queryFn: async (): Promise<GaleriaItemComCerimonia[]> => {
      const { data, error } = await supabase
        .from('galeria')
        .select(`
          *,
          cerimonias (
            id,
            nome,
            data,
            medicina_principal
          )
        `)
        .eq('cerimonia_id', cerimoniaId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as GaleriaItemComCerimonia[];
    },
  });
};

interface UploadGaleriaParams {
  file: File;
  cerimoniaId: string | null;
  titulo?: string;
  descricao?: string;
}

/**
 * Hook para fazer upload de mídia na galeria
 */
export const useUploadGaleria = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, cerimoniaId, titulo, descricao }: UploadGaleriaParams) => {
      // Determinar tipo de mídia
      const tipo: GaleriaTipo = file.type.startsWith('video/') ? 'video' : 'foto';
      
      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${tipo}s/${fileName}`;

      // Upload para o Storage
      const { error: uploadError } = await supabase.storage
        .from('galeria')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from('galeria')
        .getPublicUrl(filePath);

      // Inserir registro na tabela
      const { data, error } = await supabase
        .from('galeria')
        .insert({
          cerimonia_id: cerimoniaId,
          titulo,
          descricao,
          tipo,
          url: urlData.publicUrl,
          uploaded_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['galeria'] });
    },
  });
};

interface UpdateGaleriaParams {
  id: string;
  titulo?: string;
  descricao?: string;
  cerimoniaId?: string | null;
}

/**
 * Hook para atualizar item da galeria
 */
export const useUpdateGaleria = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, titulo, descricao, cerimoniaId }: UpdateGaleriaParams) => {
      const { error } = await supabase
        .from('galeria')
        .update({
          titulo,
          descricao,
          cerimonia_id: cerimoniaId,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['galeria'] });
    },
  });
};

/**
 * Hook para deletar item da galeria
 */
export const useDeleteGaleria = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, url }: { id: string; url: string }) => {
      // Extrair path do arquivo da URL
      const urlParts = url.split('/galeria/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        // Deletar arquivo do Storage
        await supabase.storage.from('galeria').remove([filePath]);
      }

      // Deletar registro da tabela
      const { error } = await supabase
        .from('galeria')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['galeria'] });
    },
  });
};
