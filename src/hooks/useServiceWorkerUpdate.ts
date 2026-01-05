import { useEffect, useRef } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { toast } from 'sonner';

const SW_VERSION_KEY = 'app_sw_version';
const SW_LAST_UPDATE_KEY = 'app_sw_last_update';
const MIN_UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutos entre atualizações

/**
 * Hook para gerenciar atualizações do Service Worker
 * - Mostra toast antes de atualizar
 * - Evita atualizações repetidas usando localStorage
 * - Só atualiza se passou tempo mínimo desde última atualização
 */
export function useServiceWorkerUpdate() {
  const isUpdating = useRef(false);
  
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      console.log('[PWA] SW registrado:', swUrl);
      
      // Verificar atualizações a cada 30 minutos (não 1 hora)
      if (registration) {
        setInterval(() => {
          console.log('[PWA] Verificando atualizações...');
          registration.update();
        }, 30 * 60 * 1000);
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

  // Quando detectar nova versão, verificar se deve atualizar
  useEffect(() => {
    if (!needRefresh || isUpdating.current) return;
    
    const lastUpdate = localStorage.getItem(SW_LAST_UPDATE_KEY);
    const now = Date.now();
    
    // Evitar atualizações muito frequentes
    if (lastUpdate && (now - parseInt(lastUpdate)) < MIN_UPDATE_INTERVAL) {
      console.log('[PWA] Atualização ignorada - muito recente');
      return;
    }
    
    // Gerar versão única baseada no timestamp
    const newVersion = now.toString();
    const currentVersion = localStorage.getItem(SW_VERSION_KEY);
    
    // Se já atualizou para esta "sessão", não atualizar novamente
    if (currentVersion === newVersion) {
      console.log('[PWA] Já atualizado nesta sessão');
      return;
    }
    
    isUpdating.current = true;
    
    // Mostrar toast informativo
    toast.info('Atualizando para nova versão...', {
      duration: 2000,
      id: 'sw-update',
    });
    
    console.log('[PWA] Iniciando atualização...');
    
    // Salvar no localStorage antes de atualizar
    localStorage.setItem(SW_VERSION_KEY, newVersion);
    localStorage.setItem(SW_LAST_UPDATE_KEY, now.toString());
    
    // Aguardar toast ser exibido, depois atualizar
    setTimeout(() => {
      updateServiceWorker(true);
    }, 1500);
    
  }, [needRefresh, updateServiceWorker]);

  return { needRefresh };
}
