import React, { createContext, useContext, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { toast } from 'sonner';

interface NotificationContextType {
  permission: NotificationPermission | 'unsupported';
  requestPermission: () => Promise<boolean>;
  sendTestNotification: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { permission, requestPermission, playNotificationSound } = usePushNotifications();

  // Escutar notificações em tempo real para atualizar UI
  // As push notifications são enviadas pelo OneSignal via Edge Function
  useEffect(() => {
    if (!user?.id) return;

    console.log('[Notifications] Iniciando listener para user:', user.id);

    const channel = supabase
      .channel(`user-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notificacoes',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[Notifications] Nova notificação recebida:', payload);
          const notification = payload.new as any;
          
          // Invalidar cache de notificações para atualizar badge e lista
          queryClient.invalidateQueries({ queryKey: ['admin-notificacoes'] });
          queryClient.invalidateQueries({ queryKey: ['notificacoes'] });
          queryClient.invalidateQueries({ queryKey: ['notificacoes-nao-lidas'] });
          
          // Tocar som quando app está em foco
          playNotificationSound();
          
          // Mostrar toast (feedback visual quando app está em foco)
          toast.info(notification.titulo, {
            description: notification.mensagem,
          });
        }
      )
      .subscribe((status) => {
        console.log('[Notifications] Status do canal:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, playNotificationSound, queryClient]);

  // Escutar novas inscrições (para admin)
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('inscricoes-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'inscricoes',
        },
        () => {
          // Invalidar queries relacionadas
          queryClient.invalidateQueries({ queryKey: ['admin-inscricoes'] });
          queryClient.invalidateQueries({ queryKey: ['vagas-cerimonias'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  const sendTestNotification = useCallback(() => {
    playNotificationSound();
    toast.success('Teste de Notificação', {
      description: 'Som e toast funcionando! Push notifications são enviadas pelo OneSignal.',
    });
  }, [playNotificationSound]);

  return (
    <NotificationContext.Provider value={{ permission, requestPermission, sendTestNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within NotificationProvider');
  }
  return context;
};

export default NotificationProvider;
