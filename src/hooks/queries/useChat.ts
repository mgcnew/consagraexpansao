import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Tipos
export interface Conversa {
  id: string;
  participante_1: string;
  participante_2: string;
  ultima_mensagem_at: string;
  ultima_mensagem_preview: string | null;
  created_at: string;
  // Dados do outro participante (join)
  outro_participante?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  mensagens_nao_lidas?: number;
}

export interface Mensagem {
  id: string;
  conversa_id: string;
  autor_id: string;
  conteudo: string;
  lida: boolean;
  created_at: string;
  // Dados do autor (join)
  autor?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

// Hook para listar conversas do usuário
export const useConversas = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['conversas', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Buscar conversas onde o usuário é participante
      const { data: conversas, error } = await supabase
        .from('conversas')
        .select('*')
        .or(`participante_1.eq.${user.id},participante_2.eq.${user.id}`)
        .order('ultima_mensagem_at', { ascending: false });

      if (error) throw error;
      if (!conversas) return [];

      // Para cada conversa, buscar dados do outro participante e contagem de não lidas
      const conversasComDados = await Promise.all(
        conversas.map(async (conversa) => {
          const outroId = conversa.participante_1 === user.id 
            ? conversa.participante_2 
            : conversa.participante_1;

          // Buscar perfil do outro participante
          const { data: perfil } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .eq('id', outroId)
            .single();

          // Contar mensagens não lidas
          const { count } = await supabase
            .from('mensagens')
            .select('*', { count: 'exact', head: true })
            .eq('conversa_id', conversa.id)
            .eq('lida', false)
            .neq('autor_id', user.id);

          return {
            ...conversa,
            outro_participante: perfil || { id: outroId, full_name: null, avatar_url: null },
            mensagens_nao_lidas: count || 0,
          } as Conversa;
        })
      );

      return conversasComDados;
    },
    enabled: !!user?.id,
  });

  // Realtime para novas conversas
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('conversas-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversas',
          filter: `participante_1=eq.${user.id}`,
        },
        () => queryClient.invalidateQueries({ queryKey: ['conversas'] })
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversas',
          filter: `participante_2=eq.${user.id}`,
        },
        () => queryClient.invalidateQueries({ queryKey: ['conversas'] })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  return query;
};

// Hook para mensagens de uma conversa específica
export const useMensagens = (conversaId: string | null) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['mensagens', conversaId],
    queryFn: async () => {
      if (!conversaId) return [];

      const { data, error } = await supabase
        .from('mensagens')
        .select('*')
        .eq('conversa_id', conversaId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Buscar dados dos autores
      const mensagensComAutor = await Promise.all(
        (data || []).map(async (msg) => {
          const { data: perfil } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .eq('id', msg.autor_id)
            .single();

          return {
            ...msg,
            autor: perfil || { id: msg.autor_id, full_name: null, avatar_url: null },
          } as Mensagem;
        })
      );

      return mensagensComAutor;
    },
    enabled: !!conversaId,
  });

  // Realtime para novas mensagens
  useEffect(() => {
    if (!conversaId) return;

    const channel = supabase
      .channel(`mensagens-${conversaId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensagens',
          filter: `conversa_id=eq.${conversaId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['mensagens', conversaId] });
          queryClient.invalidateQueries({ queryKey: ['conversas'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversaId, queryClient]);

  // Marcar mensagens como lidas quando abrir a conversa
  useEffect(() => {
    if (!conversaId || !user?.id) return;

    const marcarComoLidas = async () => {
      await supabase
        .from('mensagens')
        .update({ lida: true })
        .eq('conversa_id', conversaId)
        .neq('autor_id', user.id)
        .eq('lida', false);
      
      queryClient.invalidateQueries({ queryKey: ['conversas'] });
      queryClient.invalidateQueries({ queryKey: ['total-nao-lidas'] });
    };

    marcarComoLidas();
  }, [conversaId, user?.id, queryClient]);

  return query;
};

// Hook para enviar mensagem
export const useEnviarMensagem = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversaId, conteudo }: { conversaId: string; conteudo: string }) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('mensagens')
        .insert({
          conversa_id: conversaId,
          autor_id: user.id,
          conteudo: conteudo.trim(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['mensagens', variables.conversaId] });
      queryClient.invalidateQueries({ queryKey: ['conversas'] });
    },
  });
};

// Hook para criar ou obter conversa
export const useGetOrCreateConversa = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (outroUserId: string) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .rpc('get_or_create_conversa', {
          user_1: user.id,
          user_2: outroUserId,
        });

      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversas'] });
    },
  });
};

// Hook para total de mensagens não lidas
export const useTotalNaoLidas = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['total-nao-lidas', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;

      // Buscar todas as conversas do usuário
      const { data: conversas } = await supabase
        .from('conversas')
        .select('id')
        .or(`participante_1.eq.${user.id},participante_2.eq.${user.id}`);

      if (!conversas || conversas.length === 0) return 0;

      // Contar mensagens não lidas em todas as conversas
      const { count } = await supabase
        .from('mensagens')
        .select('*', { count: 'exact', head: true })
        .in('conversa_id', conversas.map(c => c.id))
        .eq('lida', false)
        .neq('autor_id', user.id);

      return count || 0;
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Atualizar a cada 30s
  });

  // Realtime para atualizar contador
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('mensagens-nao-lidas')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensagens',
        },
        () => queryClient.invalidateQueries({ queryKey: ['total-nao-lidas'] })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  return query;
};
