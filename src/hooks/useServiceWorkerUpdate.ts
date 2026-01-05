import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

/**
 * Hook para gerenciar atualizações do Service Worker
 * Quando uma nova versão é detectada, recarrega automaticamente a página
 */
export function useServiceWorkerUpdate() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      console.log('[PWA] SW registrado:', swUrl);
      
      // Verificar atualizações a cada 1 hora
      if (registration) {
        setInterval(() => {
          console.log('[PWA] Verificando atualizações...');
          registration.update();
        }, 60 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.error('[PWA] Erro ao registrar SW:', error);
    },
    onNeedRefresh() {
      console.log('[PWA] Nova versão disponível!');
    },
    onOfflineReady() {
      console.log('[PWA] App pronto para uso offline');
    },
  });

  // Quando detectar nova versão, atualizar automaticamente
  useEffect(() => {
    if (needRefresh) {
      console.log('[PWA] Atualizando para nova versão...');
      // Pequeno delay para garantir que o usuário veja a mensagem (se houver)
      setTimeout(() => {
        updateServiceWorker(true);
      }, 500);
    }
  }, [needRefresh, updateServiceWorker]);

  return { needRefresh };
}
