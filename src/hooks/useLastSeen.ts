import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook para atualizar o last_seen_at do usuário periodicamente
 * Atualiza a cada 2 minutos enquanto o usuário está ativo
 */
export const useLastSeen = () => {
  const { user } = useAuth();

  const updateLastSeen = useCallback(async () => {
    if (!user?.id) return;
    
    await supabase
      .from('profiles')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', user.id);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    // Atualizar imediatamente ao montar
    updateLastSeen();

    // Atualizar a cada 2 minutos
    const interval = setInterval(updateLastSeen, 2 * 60 * 1000);

    // Atualizar quando a janela ganha foco
    const handleFocus = () => updateLastSeen();
    window.addEventListener('focus', handleFocus);

    // Atualizar antes de fechar
    const handleBeforeUnload = () => updateLastSeen();
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user?.id, updateLastSeen]);
};

/**
 * Formata o tempo desde o último acesso
 */
export const formatLastSeen = (lastSeenAt: string | null): string => {
  if (!lastSeenAt) return 'Nunca acessou';

  const now = new Date();
  const lastSeen = new Date(lastSeenAt);
  const diffMs = now.getTime() - lastSeen.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Online se visto nos últimos 5 minutos
  if (diffMinutes < 5) return 'Online';
  if (diffMinutes < 60) return `Visto há ${diffMinutes} min`;
  if (diffHours < 24) return `Visto há ${diffHours}h`;
  if (diffDays === 1) return 'Visto ontem';
  if (diffDays < 7) return `Visto há ${diffDays} dias`;
  
  return `Visto em ${lastSeen.toLocaleDateString('pt-BR')}`;
};

/**
 * Verifica se o usuário está online (visto nos últimos 5 minutos)
 */
export const isUserOnline = (lastSeenAt: string | null): boolean => {
  if (!lastSeenAt) return false;
  
  const now = new Date();
  const lastSeen = new Date(lastSeenAt);
  const diffMinutes = (now.getTime() - lastSeen.getTime()) / (1000 * 60);
  
  return diffMinutes < 5;
};
