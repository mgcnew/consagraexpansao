import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Bell, X } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export const NotificationPermission: React.FC = () => {
  const { permission, isSupported, requestPermission } = usePushNotifications();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Mostrar prompt apenas se suportado e ainda não decidido
    if (isSupported && permission === 'default') {
      // Verificar se já foi dispensado recentemente
      const dismissed = localStorage.getItem('notification-prompt-dismissed');
      if (!dismissed || Date.now() - parseInt(dismissed) > 3 * 24 * 60 * 60 * 1000) {
        // Aguardar um pouco antes de mostrar
        const timer = setTimeout(() => setShowPrompt(true), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [isSupported, permission]);

  const handleEnable = async () => {
    const granted = await requestPermission();
    if (granted) {
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('notification-prompt-dismissed', Date.now().toString());
  };

  if (!showPrompt || permission !== 'default') return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
      <Card className="border-primary/30 bg-card shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-foreground text-sm">Ativar Notificações</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Receba avisos sobre cerimônias e atualizações importantes
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="text-muted-foreground hover:text-foreground p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-2 mt-3">
            <Button size="sm" variant="outline" onClick={handleDismiss} className="flex-1">
              Agora não
            </Button>
            <Button size="sm" onClick={handleEnable} className="flex-1">
              <Bell className="w-4 h-4 mr-1" />
              Ativar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationPermission;
