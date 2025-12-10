import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, X, Share, Plus } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Detectar iOS
const isIOS = () => {
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent);
};

// Detectar se está em modo standalone (já instalado)
const isStandalone = () => {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
};

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);

  useEffect(() => {
    // Se já está instalado, não mostrar nada
    if (isStandalone()) return;

    // Verificar se foi dispensado recentemente
    const dismissed = localStorage.getItem('pwa-prompt-dismissed');
    const recentlyDismissed = dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000;

    if (recentlyDismissed) return;

    // iOS: mostrar instruções manuais
    if (isIOS()) {
      // Aguardar um pouco antes de mostrar
      const timer = setTimeout(() => setShowIOSPrompt(true), 2000);
      return () => clearTimeout(timer);
    }

    // Android/Desktop: usar beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIOSPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
  };

  // Prompt para iOS com instruções
  if (showIOSPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
        <Card className="border-primary/30 bg-card shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Download className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground text-sm">Instalar App</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Adicione à tela inicial do seu iPhone
                </p>
              </div>
              <button
                onClick={handleDismiss}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Instruções para iOS */}
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                  <Share className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-foreground">1. Toque em Compartilhar</p>
                  <p className="text-xs text-muted-foreground">No menu inferior do Safari</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
                  <Plus className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-foreground">2. Adicionar à Tela Inicial</p>
                  <p className="text-xs text-muted-foreground">Role e toque na opção</p>
                </div>
              </div>
            </div>

            <Button size="sm" variant="outline" onClick={handleDismiss} className="w-full mt-4">
              Entendi
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Prompt padrão para Android/Desktop
  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
      <Card className="border-primary/30 bg-card shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Download className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-foreground text-sm">Instalar App</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Adicione à tela inicial para acesso rápido
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
            <Button size="sm" onClick={handleInstall} className="flex-1">
              Instalar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PWAInstallPrompt;
