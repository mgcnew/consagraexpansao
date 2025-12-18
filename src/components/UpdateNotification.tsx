import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, X, AlertTriangle } from 'lucide-react';

// Versão do app - atualizada automaticamente a cada build pelo hash dos assets
const APP_VERSION = import.meta.env.VITE_APP_VERSION || Date.now().toString();
const VERSION_KEY = 'app-version';
const DISMISSED_VERSION_KEY = 'dismissed-update-version';

const UpdateNotification: React.FC = () => {
  const [showUpdate, setShowUpdate] = useState(false);
  const [hasWaitingSW, setHasWaitingSW] = useState(false);

  useEffect(() => {
    // Verificar se há uma versão mais nova
    const checkVersion = async () => {
      const storedVersion = localStorage.getItem(VERSION_KEY);
      const dismissedVersion = localStorage.getItem(DISMISSED_VERSION_KEY);
      
      // Se é a primeira vez, salvar versão atual
      if (!storedVersion) {
        localStorage.setItem(VERSION_KEY, APP_VERSION);
        return;
      }

      // Se a versão mudou e não foi dispensada
      if (storedVersion !== APP_VERSION && dismissedVersion !== APP_VERSION) {
        // Atualizar versão armazenada
        localStorage.setItem(VERSION_KEY, APP_VERSION);
        // Não mostrar notificação - o app já está atualizado
        return;
      }
    };

    // Verificar Service Worker
    const checkServiceWorker = async () => {
      if (!('serviceWorker' in navigator)) return;

      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (!reg) return;

        // Verificar se há SW em waiting
        const checkWaiting = () => {
          if (reg.waiting) {
            const dismissedVersion = localStorage.getItem(DISMISSED_VERSION_KEY);
            // Só mostrar se não foi dispensado para esta versão
            if (dismissedVersion !== APP_VERSION) {
              setHasWaitingSW(true);
              setShowUpdate(true);
            }
          }
        };

        // Verificar imediatamente
        checkWaiting();

        // Listener para nova versão encontrada
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setHasWaitingSW(true);
              setShowUpdate(true);
            }
          });
        });

        // Verificar atualizações periodicamente
        const handleVisibilityChange = () => {
          if (document.visibilityState === 'visible') {
            reg.update().catch(console.error);
            setTimeout(checkWaiting, 1000);
          }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Verificar a cada 2 minutos
        const interval = setInterval(() => {
          if (document.visibilityState === 'visible') {
            reg.update().catch(console.error);
            setTimeout(checkWaiting, 1000);
          }
        }, 2 * 60 * 1000);

        // Listener para quando o novo SW assume controle
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload();
        });

        return () => {
          clearInterval(interval);
          document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
      } catch (error) {
        console.error('Erro ao verificar atualizações:', error);
      }
    };

    checkVersion();
    checkServiceWorker();
  }, []);

  const handleRefresh = async () => {
    // Limpar versão dispensada
    localStorage.removeItem(DISMISSED_VERSION_KEY);

    if (hasWaitingSW) {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg?.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          // O controllerchange listener vai fazer o reload
          return;
        }
      } catch (e) {
        console.error('Erro ao ativar SW:', e);
      }
    }

    // Forçar reload sem cache
    window.location.reload();
  };

  const handleDismiss = () => {
    if (hasWaitingSW) {
      // Se há atualização pendente, salvar que foi dispensada
      localStorage.setItem(DISMISSED_VERSION_KEY, APP_VERSION);
    }
    setShowUpdate(false);
  };

  if (!showUpdate) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[100] animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-primary text-primary-foreground rounded-lg shadow-lg p-4">
        <div className="flex items-start gap-3">
          {hasWaitingSW ? (
            <RefreshCw className="w-5 h-5 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">Nova atualização disponível!</p>
            <p className="text-xs opacity-90 mt-1">
              {hasWaitingSW 
                ? 'Clique para atualizar o app.'
                : 'Atualize para ter os melhores recursos e segurança.'
              }
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
            onClick={handleRefresh}
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
