import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, X } from 'lucide-react';

const UpdateNotification: React.FC = () => {
  const [showUpdate, setShowUpdate] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Verificar se Service Worker é suportado
    if (!('serviceWorker' in navigator)) return;

    const handleUpdate = (reg: ServiceWorkerRegistration) => {
      setRegistration(reg);
      setShowUpdate(true);
    };

    // Listener para quando uma nova versão está disponível
    const checkForUpdates = async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (!reg) return;

        // Verificar atualizações periodicamente
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Nova versão disponível
              handleUpdate(reg);
            }
          });
        });

        // Verificar se já existe uma atualização pendente
        if (reg.waiting) {
          handleUpdate(reg);
        }

        // Verificar atualizações quando o usuário volta para a aba (mais eficiente)
        const handleVisibilityChange = () => {
          if (document.visibilityState === 'visible') {
            reg.update().catch(console.error);
          }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Verificar também a cada 5 minutos (apenas se a aba estiver ativa)
        const interval = setInterval(() => {
          if (document.visibilityState === 'visible') {
            reg.update().catch(console.error);
          }
        }, 5 * 60 * 1000); // 5 minutos

        return () => {
          clearInterval(interval);
          document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
      } catch (error) {
        console.error('Erro ao verificar atualizações:', error);
      }
    };

    // Listener para mensagens do Service Worker
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // Recarregar quando o novo SW assumir
      window.location.reload();
    });

    checkForUpdates();
  }, []);

  const handleRefresh = () => {
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
            onClick={() => setShowUpdate(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UpdateNotification;
