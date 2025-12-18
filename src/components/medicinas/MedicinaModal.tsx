import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Sparkles } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Medicina } from '@/constants/medicinas';

interface MedicinaModalProps {
  medicina: Medicina | null;
  onClose: () => void;
}

const MedicinaModal = ({ medicina, onClose }: MedicinaModalProps) => {
  const isMobile = useIsMobile();
  
  if (!medicina) return null;

  const IconComponent = medicina.icone;

  const content = (
    <div className="space-y-6">
      <img
        src={medicina.imagem}
        alt={medicina.nome}
        className="w-full h-48 object-cover rounded-xl"
      />

      <p className="text-base leading-relaxed text-foreground/90 whitespace-pre-line">
        {medicina.detalhes}
      </p>

      <div className="bg-secondary/10 rounded-xl p-4 border border-secondary/20">
        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Principais Benefícios
        </h3>
        <ul className="space-y-2">
          {medicina.beneficios.map((beneficio, index) => (
            <li key={index} className="flex items-start gap-2 text-muted-foreground text-sm">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              <span>{beneficio}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="max-h-[90vh]">
          <div className="mx-auto w-12 h-1.5 rounded-full bg-muted-foreground/20 mb-2" />
          <DrawerHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <IconComponent className={`w-5 h-5 ${medicina.cor}`} />
              </div>
              <div>
                <DrawerTitle className="text-xl text-primary">
                  {medicina.nome}
                </DrawerTitle>
                <DrawerDescription className="text-sm">
                  {medicina.origem}
                </DrawerDescription>
              </div>
            </div>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-4 pb-6">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        <div className="p-6 pb-4 border-b">
          <DialogHeader>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <IconComponent className={`w-6 h-6 ${medicina.cor}`} />
              </div>
              <div>
                <DialogTitle className="text-2xl text-primary">
                  {medicina.nome}
                </DialogTitle>
                <DialogDescription>
                  {medicina.origem}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {content}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MedicinaModal;
