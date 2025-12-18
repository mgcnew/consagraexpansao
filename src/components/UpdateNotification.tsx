import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, X } from 'lucide-react';

const UPDATE_DISMISSED_KEY = 'update-notification-dismissed';

const UpdateNotification: React.FC = () => {
  const [showUpdate, setShowUpdate] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  const handleUpdate = useCallback((reg: ServiceWorkerRegistration) => {
    // Não mostrar se já foi dispensado nesta sessão
    const dismissed = sessionStorage.getItem(UPDATE_DISMISSED_KEY);
    if (dismissed) return;
    
    setRegistration(reg);
    setShowUpdate(true);
  }, []);

  useEffect(() => {
    // Verificar se Service Worker é suportado
    if (!('serviceWorker' in navigator)) return;

    let intervalId: NodeJS.Timeout;

    // Listener para quando uma nova versão está disponível
    const setupUpdateListener = async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (!reg) return;

        // Verificar imediatamente ao carregar
        reg.update().catch(console.error);

        // Listener para nova versão encontrada
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              handleUpdate(reg);
            }
          });
        });

        // Verificar se já existe uma atualização pendente
        if (reg.waiting) {
          handleUpdate(reg);
        }

        // Verificar quando volta para a aba/app (importante para PWA mobile)
        const handleVisibilityChange = () => {
          if (document.visibilityState === 'visible') {
            reg.update().catch(console.error);
          }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Para PWA: verificar quando o app volta do background
        const handleFocus = () => {
          reg.update().catch(console.error);
        };
        window.addEventListener('focus', handleFocus);

        // Verificar a cada 2 minutos (mais frequente para PWAs)
        intervalId = setInterval(() => {
          if (document.visibilityState === 'visible') {
            reg.update().catch(console.error);
          }
        }, 2 * 60 * 1000);

        return () => {
          clearInterval(intervalId);
          document.removeEventListener('visibilitychange', handleVisibilityChange);
          window.removeEventListener('focus', handleFocus);
        };
      } catch (error) {
        console.error('Erro ao verificar atualizações:', error);
      }
    };

    // Listener para quando o novo SW assume controle
    const handleControllerChange = () => {
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    setupUpdateListener();

    return () => {
      if (intervalId) clearInterval(intervalId);
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, [handleUpdate]);

  const handleRefresh = () => {
    // Limpar flag ao atualizar
    sessionStorage.removeItem(UPDATE_DISMISSED_KEY);
    
    if (registration?.waiting) {
      // Enviar mensagem para o SW ativar a nova versão
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    } else {
      window.location.reload();
    }
  };

  if (!showUpdate) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[100] animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-primary text-primary-foreground rounded-lg shadow-lg p-4 flex items-center gap-3">
        <RefreshCw className="w-5 h-5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">Nova atualização disponível!</p>
          <p className="text-xs opacity-90">Clique para atualizar o app.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="secondary"
            className="h-8 px-3 text-xs"
            onClick={handleRefresh}
          >
            Atualizar
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 hover:bg-primary-foreground/20"
            onClick={() => {
              sessionStorage.setItem(UPDATE_DISMISSED_KEY, 'true');
              setShowUpdate(false);
            }}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UpdateNotification;
