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
  const { permission, requestPermission, showNotification, playNotificationSound } = usePushNotifications();

  // Escutar notificações em tempo real
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`user-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notificacoes',
        },
        (payload) => {
          const notification = payload.new as any;
          
          // Invalidar cache de notificações
          queryClient.invalidateQueries({ queryKey: ['admin-notificacoes'] });
          
          // Tocar som
          playNotificationSound();
          
          // Mostrar notificação push se permitido
          if (permission === 'granted') {
            showNotification(notification.titulo, {
              body: notification.mensagem,
              tag: notification.id,
              playSound: false, // Já tocamos acima
            });
          }
          
          // Mostrar toast também (para quando app está em foco)
          toast.info(notification.titulo, {
            description: notification.mensagem,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, permission, showNotification, playNotificationSound, queryClient]);

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
    
    if (permission === 'granted') {
      showNotification('Teste de Notificação', {
        body: 'As notificações estão funcionando corretamente!',
        playSound: false,
      });
    }
    
    toast.success('Teste de Notificação', {
      description: 'As notificações estão funcionando!',
    });
  }, [permission, showNotification, playNotificationSound]);

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
