import React, { memo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Sparkles } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Medicina } from '@/constants/medicinas';

interface MedicinaModalProps {
  medicina: Medicina | null;
  onClose: () => void;
}

const MedicinaModalContent = memo<{ medicina: Medicina }>(({ medicina }) => (
  <div className="space-y-6">
    <div className="rounded-xl overflow-hidden shadow-md">
      <img
        src={medicina.imagem}
        alt={`Imagem de ${medicina.nome}`}
        className="w-full h-48 object-cover"
        loading="lazy"
        decoding="async"
      />
    </div>

    <div className="prose dark:prose-invert max-w-none">
      <p className="text-base md:text-lg leading-relaxed text-foreground/90 whitespace-pre-line">
        {medicina.detalhes}
      </p>
    </div>

    <div className="bg-secondary/10 rounded-xl p-4 md:p-6 border border-secondary/20">
      <h3 className="font-display text-lg md:text-xl mb-4 flex items-center gap-2 text-foreground font-semibold">
        <Sparkles className="w-5 h-5" />
        Principais Benefícios
      </h3>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {medicina.beneficios.map((beneficio, index) => (
          <li key={index} className="flex items-start gap-2 text-muted-foreground text-sm md:text-base">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
            <span>{beneficio}</span>
          </li>
        ))}
      </ul>
    </div>
  </div>
));

MedicinaModalContent.displayName = 'MedicinaModalContent';

const MedicinaModal: React.FC<MedicinaModalProps> = ({ medicina, onClose }) => {
  const isMobile = useIsMobile();
  const isOpen = !!medicina;

  // Não renderizar nada se não houver medicina selecionada
  if (!medicina) {
    return null;
  }

  const IconComponent = medicina.icone;

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="max-h-[90vh]">
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted-foreground/20 mb-2" />
          <DrawerHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <IconComponent className={`w-5 h-5 ${medicina.cor}`} />
              </div>
              <div>
                <DrawerTitle className="font-display text-xl text-primary">
                  {medicina.nome}
                </DrawerTitle>
                <DrawerDescription className="text-sm">
                  {medicina.origem}
                </DrawerDescription>
              </div>
            </div>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-4 pb-6 overscroll-contain">
            <MedicinaModalContent medicina={medicina} />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 border-border/50 bg-card">
        <div className="p-6 pb-4 shrink-0 border-b border-border/10">
          <DialogHeader>
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 rounded-xl bg-primary/10">
                <IconComponent className={`w-6 h-6 ${medicina.cor}`} />
              </div>
              <div>
                <DialogTitle className="font-display text-3xl text-primary">
                  {medicina.nome}
                </DialogTitle>
                <DialogDescription className="text-base">
                  {medicina.origem}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>
        <div className="flex-grow overflow-y-auto px-6 py-6 overscroll-contain">
          <MedicinaModalContent medicina={medicina} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MedicinaModal;
