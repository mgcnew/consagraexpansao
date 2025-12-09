import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Heart, ArrowRight, Package } from "lucide-react";

interface SuccessModalProps {
  isOpen: boolean;
  onComplete: () => void;
  ceremonyName: string;
}

const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onComplete,
  ceremonyName
}) => {
  const [step, setStep] = useState<1 | 2>(1);

  const handleNext = () => {
    setStep(2);
  };

  const handleFinish = () => {
    setStep(1); // Reset para próxima vez
    onComplete();
  };

  // Prevenir fechar clicando fora
  const handleOpenChange = (open: boolean) => {
    if (!open) return; // Não permite fechar
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border text-center [&>button]:hidden">
        {step === 1 ? (
          <>
            <DialogHeader className="space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center animate-pulse">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              
              <DialogTitle className="font-display text-2xl text-primary">
                🎉 Parabéns!
              </DialogTitle>
              
              <DialogDescription className="text-base text-foreground space-y-3">
                <p className="font-medium">
                  Sua presença está confirmada para <span className="text-primary">{ceremonyName}</span>
                </p>
                
                <div className="bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 p-4 rounded-lg border border-primary/10">
                  <Heart className="w-5 h-5 text-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground italic leading-relaxed">
                    "Uma nova jornada se inicia a partir desta decisão. Cada passo no caminho da cura é um ato de coragem e amor próprio. Que esta cerimônia traga luz, clareza e as transformações que sua alma busca."
                  </p>
                </div>
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="mt-4">
              <Button
                onClick={handleNext}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
              >
                Próximo
                <ArrowRight className="w-4 h-4" />
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader className="space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-secondary/20 to-primary/20 flex items-center justify-center">
                <Package className="w-8 h-8 text-secondary" />
              </div>
              
              <DialogTitle className="font-display text-2xl text-secondary">
                📝 O que levar?
              </DialogTitle>
              
              <DialogDescription className="text-base text-foreground space-y-3">
                <p className="text-sm text-muted-foreground mb-3">
                  Para ajudar no bom funcionamento do trabalho, pedimos que traga:
                </p>
                
                <div className="bg-secondary/5 p-4 rounded-lg border border-secondary/20 space-y-3 text-left">
                  <div className="flex items-start gap-3">
                    <span className="text-lg">🧻</span>
                    <div>
                      <p className="font-medium text-foreground">2 rolos de papel higiênico</p>
                      <p className="text-xs text-muted-foreground">Item essencial para o espaço</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <span className="text-lg">🍎</span>
                    <div>
                      <p className="font-medium text-foreground">Alimentos para partilha</p>
                      <p className="text-xs text-muted-foreground">Se possível, leve frutas ou lanches para compartilhar</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <span className="text-lg">🕯️</span>
                    <div>
                      <p className="font-medium text-foreground">Uma vela</p>
                      <p className="text-xs text-muted-foreground">Usamos velas nos trabalhos para iluminar o templo</p>
                    </div>
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground italic">
                  Sua contribuição ajuda a manter o espaço sagrado e acolhedor para todos.
                </p>
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="mt-4">
              <Button
                onClick={handleFinish}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
              >
                Entendi, ver orientações
                <ArrowRight className="w-4 h-4" />
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SuccessModal;
