import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Calendar, MapPin, Clock, Users, AlertCircle, Leaf } from 'lucide-react';
import { useIsMobile } from '@/hooks/useIsMobile';
import { formatDateCurtoBR } from '@/lib/date-utils';
import type { Cerimonia } from '@/types';

interface CerimoniaInfoModalProps {
  cerimonia: Cerimonia | null;
  isOpen: boolean;
  onClose: () => void;
  isEsgotada: boolean;
  vagasDisponiveis: number | null;
}

// Conteúdo compartilhado entre Drawer e Dialog
const CerimoniaContent: React.FC<{
  cerimonia: Cerimonia;
  isEsgotada: boolean;
  vagasDisponiveis: number | null;
}> = ({ cerimonia, isEsgotada, vagasDisponiveis }) => (
  <div className="space-y-4">
    {cerimonia.banner_url && (
      <div className="rounded-lg overflow-hidden">
        <img
          src={cerimonia.banner_url}
          alt={cerimonia.nome || 'Cerimônia'}
          className="w-full h-48 sm:h-56 object-cover"
          loading="lazy"
          decoding="async"
        />
      </div>
    )}

    <div className="flex items-center gap-2">
      <Leaf className="w-4 h-4 text-primary" />
      <Badge variant="outline" className="bg-primary/10 text-primary">
        {cerimonia.medicina_principal}
      </Badge>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div className="flex items-center gap-2 text-foreground">
        <Calendar className="w-4 h-4 text-primary" />
        <span className="font-medium text-sm">
          {formatDateCurtoBR(cerimonia.data)}
        </span>
      </div>
      <div className="flex items-center gap-2 text-foreground">
        <Clock className="w-4 h-4 text-primary" />
        <span className="font-medium">{cerimonia.horario.slice(0, 5)}</span>
      </div>
    </div>

    <div className="flex items-start gap-2 text-muted-foreground">
      <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
      <span className="text-sm">{cerimonia.local}</span>
    </div>

    {cerimonia.descricao && (
      <div>
        <h4 className="text-sm font-medium mb-1">Descrição</h4>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
          {cerimonia.descricao}
        </p>
      </div>
    )}

    {cerimonia.observacoes && (
      <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
        <h4 className="text-sm font-medium mb-1 text-amber-800 dark:text-amber-200">Observações</h4>
        <p className="text-sm text-amber-700 dark:text-amber-300 whitespace-pre-wrap">
          {cerimonia.observacoes}
        </p>
      </div>
    )}

    {cerimonia.vagas && (
      <div
        className={`flex items-center gap-2 text-sm font-medium p-3 rounded-lg ${
          isEsgotada ? 'bg-destructive/10 text-destructive' : 'bg-secondary/10 text-foreground'
        }`}
      >
        {isEsgotada ? (
          <>
            <AlertCircle className="w-4 h-4" />
            <span>Vagas Esgotadas</span>
          </>
        ) : (
          <>
            <Users className="w-4 h-4 text-primary" />
            <span>
              {vagasDisponiveis !== null
                ? `${vagasDisponiveis} vagas disponíveis de ${cerimonia.vagas}`
                : `${cerimonia.vagas} vagas totais`}
            </span>
          </>
        )}
      </div>
    )}

    {cerimonia.valor && (
      <div className="bg-primary/10 p-3 rounded-lg border border-primary/20">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground text-sm">Contribuição:</span>
          <span className="text-xl font-bold text-primary">
            {(cerimonia.valor / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
        </div>
      </div>
    )}
  </div>
);

const CerimoniaInfoModal: React.FC<CerimoniaInfoModalProps> = ({
  cerimonia,
  isOpen,
  onClose,
  isEsgotada,
  vagasDisponiveis,
}) => {
  const isMobile = useIsMobile();

  if (!isOpen || !cerimonia) return null;

  const title = cerimonia.nome || cerimonia.medicina_principal || 'Cerimônia';

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle className="font-display text-xl text-primary">{title}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 overflow-y-auto">
            <CerimoniaContent
              cerimonia={cerimonia}
              isEsgotada={isEsgotada}
              vagasDisponiveis={vagasDisponiveis}
            />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-primary">{title}</DialogTitle>
        </DialogHeader>
        <CerimoniaContent
          cerimonia={cerimonia}
          isEsgotada={isEsgotada}
          vagasDisponiveis={vagasDisponiveis}
        />
      </DialogContent>
    </Dialog>
  );
};

export default memo(CerimoniaInfoModal);
