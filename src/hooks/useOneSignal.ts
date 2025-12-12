import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  initOneSignal,
  requestNotificationPermission,
  isPushEnabled,
  setExternalUserId,
  removeExternalUserId,
  setUserTags,
} from '@/lib/onesignal';

export function useOneSignal() {
  const { user } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  // Inicializar OneSignal
  useEffect(() => {
    const init = async () => {
      await initOneSignal();
      setIsInitialized(true);
      
      const enabled = await isPushEnabled();
      setPermissionGranted(enabled);
    };
    
    init();
  }, []);

  // Vincular usuário ao OneSignal quando logar
  useEffect(() => {
    if (!isInitialized) return;

    const syncUser = async () => {
      if (user?.id) {
        await setExternalUserId(user.id);
        // Adicionar tags úteis para segmentação
        await setUserTags({
          user_id: user.id,
          email: user.email || '',
        });
      } else {
        await removeExternalUserId();
      }
    };

    syncUser();
  }, [user?.id, user?.email, isInitialized]);

  // Solicitar permissão de notificação
  const requestPermission = useCallback(async () => {
    const granted = await requestNotificationPermission();
    setPermissionGranted(granted);
    return granted;
  }, []);

  return {
    isInitialized,
    permissionGranted,
    requestPermission,
  };
}

export default useOneSignal;
