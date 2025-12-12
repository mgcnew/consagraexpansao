import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ListaEsperaItem {
  id: string;
  user_id: string;
  cerimonia_id: string;
  posicao: number;
  notificado: boolean;
  created_at: string;
}

// Buscar posição do usuário na lista de espera de uma cerimônia
export function useMinhaListaEspera(userId?: string) {
  return useQuery({
    queryKey: ['minha-lista-espera', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('lista_espera_cerimonias')
        .select('*')
        .eq('user_id', userId);
      if (error) throw error;
      return data as ListaEsperaItem[];
    },
    enabled: !!userId,
  });
}

// Verificar se usuário está na lista de espera de uma cerimônia específica
export function usePosicaoListaEspera(userId?: string, cerimoniaId?: string) {
  return useQuery({
    queryKey: ['posicao-lista-espera', userId, cerimoniaId],
    queryFn: async () => {
      if (!userId || !cerimoniaId) return null;
      const { data, error } = await supabase
        .from('lista_espera_cerimonias')
        .select('posicao')
        .eq('user_id', userId)
        .eq('cerimonia_id', cerimoniaId)
        .maybeSingle();
      if (error) throw error;
      return data?.posicao ?? null;
    },
    enabled: !!userId && !!cerimoniaId,
  });
}

// Entrar na lista de espera
export function useEntrarListaEspera() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, cerimoniaId }: { userId: string; cerimoniaId: string }) => {
      const { data, error } = await supabase
        .from('lista_espera_cerimonias')
        .insert({ user_id: userId, cerimonia_id: cerimoniaId })
        .select('posicao')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success('Você entrou na lista de espera!', {
        description: `Sua posição na fila: ${data.posicao}º lugar`,
      });
      queryClient.invalidateQueries({ queryKey: ['minha-lista-espera'] });
      queryClient.invalidateQueries({ queryKey: ['posicao-lista-espera'] });
    },
    onError: (error: Error) => {
      if (error.message.includes('duplicate')) {
        toast.info('Você já está na lista de espera desta cerimônia');
      } else {
        toast.error('Erro ao entrar na lista de espera');
      }
    },
  });
}

// Sair da lista de espera
export function useSairListaEspera() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, cerimoniaId }: { userId: string; cerimoniaId: string }) => {
      const { error } = await supabase
        .from('lista_espera_cerimonias')
        .delete()
        .eq('user_id', userId)
        .eq('cerimonia_id', cerimoniaId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Você saiu da lista de espera');
      queryClient.invalidateQueries({ queryKey: ['minha-lista-espera'] });
      queryClient.invalidateQueries({ queryKey: ['posicao-lista-espera'] });
    },
    onError: () => {
      toast.error('Erro ao sair da lista de espera');
    },
  });
}
