import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotificationContext } from '@/contexts/NotificationContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Bell, 
  Download, 
  Smartphone,
  CheckCircle2,
  X
} from 'lucide-react';

const INSTALL_PROMPT_KEY = 'pwa_install_prompt_shown';
const NOTIFICATION_PROMPT_KEY = 'notification_prompt_shown';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallPWAPrompt: React.FC = () => {
  const { user } = useAuth();
  const { permission, requestPermission } = useNotificationContext();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  // Detectar se já está instalado como PWA
  useEffect(() => {
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone === true;
    setIsStandalone(isInStandaloneMode);
  }, []);

  // Capturar evento de instalação
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Mostrar prompt de instalação após login
  useEffect(() => {
    if (!user || isStandalone) return;

    const hasShownInstall = localStorage.getItem(INSTALL_PROMPT_KEY);
    
    if (!hasShownInstall && deferredPrompt) {
      const timer = setTimeout(() => {
        setShowInstallDialog(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [user, deferredPrompt, isStandalone]);

  // Mostrar prompt de notificação após instalação ou se já instalado
  useEffect(() => {
    if (!user) return;
    if (permission === 'granted' || permission === 'denied') return;

    const hasShownNotification = localStorage.getItem(NOTIFICATION_PROMPT_KEY);
    
    if (!hasShownNotification && (isStandalone || !deferredPrompt)) {
      const timer = setTimeout(() => {
        setShowNotificationDialog(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [user, permission, isStandalone, deferredPrompt]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      localStorage.setItem(INSTALL_PROMPT_KEY, 'true');
    }
    
    setShowInstallDialog(false);
  };

  const handleDismissInstall = () => {
    localStorage.setItem(INSTALL_PROMPT_KEY, 'true');
    setShowInstallDialog(false);
  };

  const handleEnableNotifications = async () => {
    const granted = await requestPermission();
    localStorage.setItem(NOTIFICATION_PROMPT_KEY, 'true');
    setShowNotificationDialog(false);
  };

  const handleDismissNotification = () => {
    localStorage.setItem(NOTIFICATION_PROMPT_KEY, 'true');
    setShowNotificationDialog(false);
  };

  return (
    <>
      {/* Dialog de Instalação do PWA */}
      <Dialog open={showInstallDialog} onOpenChange={setShowInstallDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Smartphone className="w-8 h-8 text-primary" />
            </div>
            <DialogTitle className="text-xl font-display">
              Instalar Aplicativo
            </DialogTitle>
            <DialogDescription className="text-center">
              Instale o app na sua tela inicial para uma experiência melhor e receber notificações.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
              <span className="text-sm">Acesso rápido pela tela inicial</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
              <span className="text-sm">Notificações como WhatsApp</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
              <span className="text-sm">Funciona offline</span>
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button onClick={handleInstall} className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Instalar Agora
            </Button>
            <Button variant="ghost" onClick={handleDismissInstall} className="w-full">
              Agora não
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Permissão de Notificações */}
      <Dialog open={showNotificationDialog} onOpenChange={setShowNotificationDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Bell className="w-8 h-8 text-amber-500" />
            </div>
            <DialogTitle className="text-xl font-display">
              Ativar Notificações
            </DialogTitle>
            <DialogDescription className="text-center">
              Receba avisos sobre cerimônias, mensagens e atualizações importantes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <Bell className="w-5 h-5 text-amber-500 shrink-0" />
              <span className="text-sm">Novas cerimônias disponíveis</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <Bell className="w-5 h-5 text-amber-500 shrink-0" />
              <span className="text-sm">Lembretes de eventos</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <Bell className="w-5 h-5 text-amber-500 shrink-0" />
              <span className="text-sm">Mensagens da comunidade</span>
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button onClick={handleEnableNotifications} className="w-full bg-amber-600 hover:bg-amber-700">
              <Bell className="w-4 h-4 mr-2" />
              Ativar Notificações
            </Button>
            <Button variant="ghost" onClick={handleDismissNotification} className="w-full">
              Agora não
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InstallPWAPrompt;
