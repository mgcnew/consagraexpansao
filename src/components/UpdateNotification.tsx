import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, X } from 'lucide-react';
import { APP_VERSION, VERSION_STORAGE_KEY } from '@/constants/version';

/**
 * Componente de notificação de atualização
 * 
 * Só mostra o modal quando:
 * 1. A versão atual (APP_VERSION) é diferente da última versão vista pelo usuário
 * 2. O usuário já tinha uma versão anterior salva (não é primeiro acesso)
 * 
 * Para disparar uma notificação de atualização:
 * 1. Altere o valor de APP_VERSION em src/constants/version.ts
 * 2. Faça o deploy
 */
const UpdateNotification: React.FC = () => {
  const [showUpdate, setShowUpdate] = useState(false);

  useEffect(() => {
    // Verificar se há uma nova versão
    const lastSeenVersion = localStorage.getItem(VERSION_STORAGE_KEY);
    
    // Se nunca viu nenhuma versão, salvar a atual e não mostrar nada
    if (!lastSeenVersion) {
      localStorage.setItem(VERSION_STORAGE_KEY, APP_VERSION);
      return;
    }
    
    // Se a versão atual é diferente da última vista, mostrar notificação
    if (lastSeenVersion !== APP_VERSION) {
      setShowUpdate(true);
    }
  }, []);

  const handleUpdate = () => {
    // Salvar que o usuário viu esta versão
    localStorage.setItem(VERSION_STORAGE_KEY, APP_VERSION);
    setShowUpdate(false);
    // Recarregar para garantir que pegou todos os assets novos
    window.location.reload();
  };

  const handleDismiss = () => {
    // Salvar que o usuário viu esta versão (mesmo sem atualizar)
    localStorage.setItem(VERSION_STORAGE_KEY, APP_VERSION);
    setShowUpdate(false);
  };

  if (!showUpdate) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[100]">
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
