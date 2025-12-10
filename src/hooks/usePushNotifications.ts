import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { playNotificationBeep } from '@/lib/notification-sound';

interface PushNotificationState {
  permission: NotificationPermission | 'unsupported';
  isSupported: boolean;
}

export const usePushNotifications = () => {
  const { user } = useAuth();
  const [state, setState] = useState<PushNotificationState>({
    permission: 'default',
    isSupported: false,
  });

  useEffect(() => {
    if ('Notification' in window) {
      setState({
        permission: Notification.permission,
        isSupported: true,
      });
    } else {
      setState({
        permission: 'unsupported',
        isSupported: false,
      });
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setState(prev => ({ ...prev, permission }));
      return permission === 'granted';
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
      return false;
    }
  }, []);

  const playNotificationSound = useCallback(() => {
    playNotificationBeep();
  }, []);

  const showNotification = useCallback((title: string, options?: NotificationOptions & { playSound?: boolean }) => {
    const { playSound = true, ...notificationOptions } = options || {};

    if (state.permission !== 'granted') {
      console.log('Permissão de notificação não concedida');
      return null;
    }

    try {
      // Tocar som se habilitado
      if (playSound) {
        playNotificationSound();
      }

      // Criar notificação
      const notification = new Notification(title, {
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        ...notificationOptions,
      });

      // Fechar automaticamente após 5 segundos
      setTimeout(() => notification.close(), 5000);

      return notification;
    } catch (error) {
      console.error('Erro ao mostrar notificação:', error);
      return null;
    }
  }, [state.permission, playNotificationSound]);

  return {
    ...state,
    requestPermission,
    showNotification,
    playNotificationSound,
  };
};

// Hook para escutar notificações em tempo real do Supabase
export const useRealtimeNotifications = (onNotification?: (notification: any) => void) => {
  const { user } = useAuth();
  const { showNotification, permission } = usePushNotifications();

  useEffect(() => {
    if (!user?.id || permission !== 'granted') return;

    // Escutar novas notificações via Supabase Realtime
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notificacoes',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const notification = payload.new as any;
          
          // Mostrar notificação push
          showNotification(notification.titulo, {
            body: notification.mensagem,
            tag: notification.id,
            data: { url: notification.url || '/' },
          });

          // Callback opcional
          onNotification?.(notification);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, permission, showNotification, onNotification]);
};

export default usePushNotifications;
