import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveHouse } from '@/hooks/useActiveHouse';

// Tipos simples
export interface Conversa {
  id: string;
  participante_1: string;
  participante_2: string;
  house_id: string;
  ultima_mensagem_at: string;
  ultima_mensagem_preview: string | null;
  created_at: string;
  outro_nome: string;
  outro_avatar: string | null;
  nao_lidas: number;
}

export interface Mensagem {
  id: string;
  conversa_id: string;
  autor_id: string;
  conteudo: string;
  lida: boolean;
  created_at: string;
}

// Hook para listar conversas
export function useConversas() {
  const { user } = useAuth();
  const { data: house } = useActiveHouse();

  return useQuery({
    queryKey: ['conversas', user?.id, house?.id],
    queryFn: async (): Promise<Conversa[]> => {
      if (!user?.id || !house?.id) return [];

      // Buscar conversas da casa onde o usuário participa
      const { data: conversas, error } = await supabase
        .from('conversas')
        .select('*')
        .eq('house_id', house.id)
        .or(`participante_1.eq.${user.id},participante_2.eq.${user.id}`)
        .order('ultima_mensagem_at', { ascending: false });

      if (error) {
        console.error('[Chat] Erro ao buscar conversas:', error);
        return [];
      }

      if (!conversas || conversas.length === 0) return [];

      // Buscar dados dos outros participantes
      const resultado: Conversa[] = [];

      for (const conv of conversas) {
        const outroId = conv.participante_1 === user.id ? conv.participante_2 : conv.participante_1;

        // Buscar perfil
        const { data: perfil } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', outroId)
          .single();

        // Contar não lidas
        const { count } = await supabase
          .from('mensagens')
          .select('*', { count: 'exact', head: true })
          .eq('conversa_id', conv.id)
          .eq('lida', false)
          .neq('autor_id', user.id);

        resultado.push({
          id: conv.id,
          participante_1: conv.participante_1,
          participante_2: conv.participante_2,
          house_id: conv.house_id,
          ultima_mensagem_at: conv.ultima_mensagem_at,
          ultima_mensagem_preview: conv.ultima_mensagem_preview,
          created_at: conv.created_at,
          outro_nome: perfil?.full_name || 'Usuário',
          outro_avatar: perfil?.avatar_url || null,
          nao_lidas: count || 0,
        });
      }

      return resultado;
    },
    enabled: !!user?.id && !!house?.id,
  });
}

// Hook para mensagens de uma conversa
export function useMensagens(conversaId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['mensagens', conversaId],
    queryFn: async (): Promise<Mensagem[]> => {
      if (!conversaId) return [];

      const { data, error } = await supabase
        .from('mensagens')
        .select('id, conversa_id, autor_id, conteudo, lida, created_at')
        .eq('conversa_id', conversaId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('[Chat] Erro ao buscar mensagens:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!conversaId,
  });

  // Marcar como lidas ao abrir
  useEffect(() => {
    if (!conversaId || !user?.id) return;

    supabase
      .from('mensagens')
      .update({ lida: true })
      .eq('conversa_id', conversaId)
      .neq('autor_id', user.id)
      .eq('lida', false)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['conversas'] });
      });
  }, [conversaId, user?.id, queryClient]);

  // Realtime
  useEffect(() => {
    if (!conversaId) return;

    const channel = supabase
      .channel(`chat-${conversaId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'mensagens',
        filter: `conversa_id=eq.${conversaId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['mensagens', conversaId] });
        queryClient.invalidateQueries({ queryKey: ['conversas'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversaId, queryClient]);

  return query;
}

// Hook para enviar mensagem
export function useEnviarMensagem() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversaId, conteudo }: { conversaId: string; conteudo: string }) => {
      if (!user?.id) throw new Error('Não autenticado');

      // Inserir mensagem
      const { error: msgError } = await supabase
        .from('mensagens')
        .insert({
          conversa_id: conversaId,
          autor_id: user.id,
          conteudo: conteudo.trim(),
        });

      if (msgError) throw msgError;

      // Atualizar preview da conversa
      await supabase
        .from('conversas')
        .update({
          ultima_mensagem_at: new Date().toISOString(),
          ultima_mensagem_preview: conteudo.trim().substring(0, 100),
        })
        .eq('id', conversaId);
    },
    onSuccess: (_, { conversaId }) => {
      queryClient.invalidateQueries({ queryKey: ['mensagens', conversaId] });
      queryClient.invalidateQueries({ queryKey: ['conversas'] });
    },
  });
}

// Hook para criar conversa (só admin)
export function useCriarConversa() {
  const { user } = useAuth();
  const { data: house } = useActiveHouse();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (outroUserId: string): Promise<string> => {
      if (!user?.id || !house?.id) throw new Error('Não autenticado');

      // Verificar se já existe conversa
      const { data: existente } = await supabase
        .from('conversas')
        .select('id')
        .eq('house_id', house.id)
        .or(`and(participante_1.eq.${user.id},participante_2.eq.${outroUserId}),and(participante_1.eq.${outroUserId},participante_2.eq.${user.id})`)
        .single();

      if (existente) return existente.id;

      // Criar nova conversa
      const { data, error } = await supabase
        .from('conversas')
        .insert({
          house_id: house.id,
          participante_1: user.id,
          participante_2: outroUserId,
          ultima_mensagem_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversas'] });
    },
  });
}

// Hook para buscar membros da casa (para iniciar conversa)
export function useMembrosParaChat() {
  const { user } = useAuth();
  const { data: house } = useActiveHouse();

  return useQuery({
    queryKey: ['membros-chat', house?.id],
    queryFn: async () => {
      if (!house?.id || !user?.id) return [];

      const membros: { id: string; nome: string; avatar: string | null; tipo: string }[] = [];
      const ids = new Set<string>();

      // Dono da casa
      if (house.owner_id && house.owner_id !== user.id) {
        const { data: owner } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .eq('id', house.owner_id)
          .single();

        if (owner) {
          membros.push({
            id: owner.id,
            nome: owner.full_name || 'Dono',
            avatar: owner.avatar_url,
            tipo: 'Dono',
          });
          ids.add(owner.id);
        }
      }

      // Equipe (house_members)
      const { data: equipe } = await supabase
        .from('house_members')
        .select('user_id, role')
        .eq('house_id', house.id)
        .eq('active', true);

      if (equipe) {
        for (const m of equipe) {
          if (m.user_id !== user.id && !ids.has(m.user_id)) {
            const { data: perfil } = await supabase
              .from('profiles')
              .select('id, full_name, avatar_url')
              .eq('id', m.user_id)
              .single();

            if (perfil) {
              membros.push({
                id: perfil.id,
                nome: perfil.full_name || 'Membro',
                avatar: perfil.avatar_url,
                tipo: m.role === 'admin' ? 'Admin' : 'Equipe',
              });
              ids.add(perfil.id);
            }
          }
        }
      }

      // Consagradores (user_houses)
      const { data: consagradores } = await supabase
        .from('user_houses')
        .select('user_id')
        .eq('house_id', house.id)
        .eq('status', 'active');

      if (consagradores) {
        for (const c of consagradores) {
          if (c.user_id !== user.id && !ids.has(c.user_id)) {
            const { data: perfil } = await supabase
              .from('profiles')
              .select('id, full_name, avatar_url')
              .eq('id', c.user_id)
              .single();

            if (perfil) {
              membros.push({
                id: perfil.id,
                nome: perfil.full_name || 'Consagrador',
                avatar: perfil.avatar_url,
                tipo: 'Consagrador',
              });
              ids.add(perfil.id);
            }
          }
        }
      }

      return membros;
    },
    enabled: !!house?.id && !!user?.id,
  });
}

// Hook para total de mensagens não lidas (para o badge no menu)
export function useTotalNaoLidas() {
  const { user } = useAuth();
  const { data: house } = useActiveHouse();

  return useQuery({
    queryKey: ['total-nao-lidas', user?.id, house?.id],
    queryFn: async (): Promise<number> => {
      if (!user?.id || !house?.id) return 0;

      // Buscar conversas do usuário na casa
      const { data: conversas } = await supabase
        .from('conversas')
        .select('id')
        .eq('house_id', house.id)
        .or(`participante_1.eq.${user.id},participante_2.eq.${user.id}`);

      if (!conversas || conversas.length === 0) return 0;

      // Contar mensagens não lidas
      const { count } = await supabase
        .from('mensagens')
        .select('*', { count: 'exact', head: true })
        .in('conversa_id', conversas.map(c => c.id))
        .eq('lida', false)
        .neq('autor_id', user.id);

      return count || 0;
    },
    enabled: !!user?.id && !!house?.id,
    refetchInterval: 30000, // Atualizar a cada 30s
  });
}
