import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, X } from 'lucide-react';

const UpdateNotification: React.FC = () => {
  const [showUpdate, setShowUpdate] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const setupSW = async () => {
      try {
        // Registrar o SW manualmente
        const reg = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });
        
        setRegistration(reg);

        // Verificar se já há SW em waiting
        if (reg.waiting) {
          setShowUpdate(true);
        }

        // Listener para nova versão encontrada
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Nova versão instalada e pronta
              setShowUpdate(true);
            }
          });
        });

        // Verificar atualizações periodicamente (a cada 2 minutos)
        const checkInterval = setInterval(() => {
          if (document.visibilityState === 'visible') {
            reg.update().catch(() => {});
          }
        }, 2 * 60 * 1000);

        // Verificar quando a aba volta ao foco
        const handleVisibility = () => {
          if (document.visibilityState === 'visible') {
            reg.update().catch(() => {});
          }
        };
        document.addEventListener('visibilitychange', handleVisibility);

        // Quando o novo SW assume controle, recarregar
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload();
        });

        return () => {
          clearInterval(checkInterval);
          document.removeEventListener('visibilitychange', handleVisibility);
        };
      } catch (error) {
        console.error('Erro ao registrar SW:', error);
      }
    };

    setupSW();
  }, []);

  const handleUpdate = () => {
    if (registration?.waiting) {
      // Enviar mensagem para o SW ativar
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    } else {
      // Fallback: reload forçado
      window.location.reload();
    }
  };

  const handleDismiss = () => {
    setShowUpdate(false);
  };

  if (!showUpdate) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[100] animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-primary text-primary-foreground rounded-lg shadow-lg p-4">
        <div className="flex items-start gap-3">
          <RefreshCw className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">Nova atualização disponível!</p>
            <p className="text-xs opacity-90 mt-1">
              Clique para atualizar e ter os melhores recursos.
            </p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 hover:bg-primary-foreground/20 shrink-0 -mt-1 -mr-1"
            onClick={handleDismiss}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="mt-3 flex justify-end">
          <Button
            size="sm"
            variant="secondary"
            className="h-8 px-4 text-xs"
            onClick={handleUpdate}
          >
            <RefreshCw className="w-3 h-3 mr-1.5" />
            Atualizar agora
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UpdateNotification;
