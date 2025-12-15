import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Calendar, MapPin, Clock, Users, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useIsMobile } from '@/hooks/useIsMobile';
import type { Cerimonia } from '@/types';

interface CerimoniaInfoModalProps {
  cerimonia: Cerimonia | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isEsgotada: boolean;
  isInscrito: boolean;
  vagasDisponiveis: number | null;
}

// Conteúdo compartilhado entre Drawer e Dialog
const CerimoniaContent: React.FC<{
  cerimonia: Cerimonia;
  isEsgotada: boolean;
  isInscrito: boolean;
  vagasDisponiveis: number | null;
  onConfirm: () => void;
}> = ({ cerimonia, isEsgotada, isInscrito, vagasDisponiveis, onConfirm }) => (
  <div className="space-y-4">
    {cerimonia.banner_url && (
      <div className="rounded-lg overflow-hidden -mx-4 sm:mx-0">
        <img
          src={cerimonia.banner_url}
          alt={cerimonia.nome || 'Cerimônia'}
          className="w-full h-48 sm:h-56 object-cover"
          loading="lazy"
          decoding="async"
        />
      </div>
    )}

    <Badge variant="outline" className="bg-primary/10 text-primary">
      {cerimonia.medicina_principal}
    </Badge>

    <div className="grid grid-cols-2 gap-4">
      <div className="flex items-center gap-2 text-foreground">
        <Calendar className="w-4 h-4 text-primary" />
        <span className="font-medium text-sm">
          {format(new Date(cerimonia.data), "dd 'de' MMM", { locale: ptBR })}
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
      <p className="text-sm text-muted-foreground line-clamp-3">
        {cerimonia.descricao}
      </p>
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
                ? `${vagasDisponiveis} vagas disponíveis`
                : `${cerimonia.vagas} vagas`}
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

    <Button
      className="w-full"
      size="lg"
      disabled={isEsgotada || isInscrito}
      onClick={onConfirm}
    >
      {isInscrito ? (
        <>
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Você já está inscrito
        </>
      ) : isEsgotada ? (
        'Vagas Esgotadas'
      ) : (
        'Confirmar Presença'
      )}
    </Button>
  </div>
);

const CerimoniaInfoModal: React.FC<CerimoniaInfoModalProps> = ({
  cerimonia,
  isOpen,
  onClose,
  onConfirm,
  isEsgotada,
  isInscrito,
  vagasDisponiveis,
}) => {
  const isMobile = useIsMobile();

  // Não renderizar se modal fechado ou sem cerimônia
  if (!isOpen || !cerimonia) return null;

  const title = cerimonia.nome || cerimonia.medicina_principal || 'Cerimônia';

  // Mobile: usa Drawer (mais performático, gestos nativos)
  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle className="font-display text-xl text-primary">
              {title}
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 overflow-y-auto">
            <CerimoniaContent
              cerimonia={cerimonia}
              isEsgotada={isEsgotada}
              isInscrito={isInscrito}
              vagasDisponiveis={vagasDisponiveis}
              onConfirm={onConfirm}
            />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: usa Dialog
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-primary">
            {title}
          </DialogTitle>
        </DialogHeader>
        <CerimoniaContent
          cerimonia={cerimonia}
          isEsgotada={isEsgotada}
          isInscrito={isInscrito}
          vagasDisponiveis={vagasDisponiveis}
          onConfirm={onConfirm}
        />
      </DialogContent>
    </Dialog>
  );
};

export default memo(CerimoniaInfoModal);
