import { useState, useEffect, useCallback } from 'react';
import { playNotificationBeep } from '@/lib/notification-sound';

interface PushNotificationState {
  permission: NotificationPermission | 'unsupported';
  isSupported: boolean;
}

/**
 * Hook simplificado para notificações.
 * O OneSignal cuida das push notifications (app aberto ou fechado).
 * Este hook apenas gerencia permissão e som.
 */
export const usePushNotifications = () => {
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

  return {
    ...state,
    requestPermission,
    playNotificationSound,
  };
};

export default usePushNotifications;
