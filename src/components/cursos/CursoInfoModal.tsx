import { memo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, User, Users, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useIsMobile } from '@/hooks/useIsMobile';
import type { CursoEvento } from '@/types';

interface CursoInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  curso: CursoEvento | null;
  isInscrito: boolean;
  isEsgotado: boolean;
  vagasDisponiveis: number | null;
  onInscrever: () => void;
}

const formatarValor = (valor: number) => {
  return (valor / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const InfoContent: React.FC<{
  curso: CursoEvento;
  isInscrito: boolean;
  isEsgotado: boolean;
  vagasDisponiveis: number | null;
  onInscrever: () => void;
  onClose: () => void;
}> = ({ curso, isInscrito, isEsgotado, vagasDisponiveis, onInscrever, onClose }) => (
  <div className="space-y-4">
    {curso.banner_url && (
      <div className="rounded-lg overflow-hidden">
        <img
          src={curso.banner_url}
          alt={curso.nome}
          className="w-full h-56 object-cover"
          decoding="async"
        />
      </div>
    )}

    <Badge className={curso.gratuito ? 'bg-green-600' : 'bg-primary'}>
      {curso.gratuito ? 'Gratuito' : formatarValor(curso.valor)}
    </Badge>

    <div className="grid grid-cols-2 gap-4">
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-primary" />
        <span className="text-sm">
          {format(new Date(curso.data_inicio), "dd/MM/yyyy", { locale: ptBR })}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-primary" />
        <span className="text-sm">
          {curso.horario_inicio.slice(0, 5)}
          {curso.horario_fim && ` - ${curso.horario_fim.slice(0, 5)}`}
        </span>
      </div>
    </div>

    <div className="flex items-center gap-2">
      <User className="w-4 h-4 text-primary" />
      <span className="font-medium">{curso.responsavel}</span>
    </div>

    {curso.local && (
      <div className="flex items-start gap-2">
        <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <span>{curso.local}</span>
      </div>
    )}

    {curso.descricao && (
      <div>
        <h4 className="text-sm font-medium mb-2">Descrição</h4>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
          {curso.descricao}
        </p>
      </div>
    )}

    {curso.observacoes && (
      <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
        <h4 className="text-sm font-medium mb-1 text-amber-800 dark:text-amber-200">Observações</h4>
        <p className="text-sm text-amber-700 dark:text-amber-300 whitespace-pre-wrap">
          {curso.observacoes}
        </p>
      </div>
    )}

    {curso.vagas && (
      <div className={`flex items-center gap-2 text-sm font-medium p-3 rounded-lg ${
        isEsgotado ? 'bg-destructive/10 text-destructive' : 'bg-secondary/10'
      }`}>
        <Users className="w-4 h-4" />
        <span>
          {isEsgotado 
            ? 'Vagas Esgotadas' 
            : `${vagasDisponiveis} vagas disponíveis de ${curso.vagas}`
          }
        </span>
      </div>
    )}

    <Button
      className="w-full"
      size="lg"
      disabled={isEsgotado || isInscrito}
      onClick={() => {
        onClose();
        onInscrever();
      }}
    >
      {isInscrito ? (
        <>
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Você já está inscrito
        </>
      ) : isEsgotado ? (
        'Vagas Esgotadas'
      ) : (
        'Inscrever-se'
      )}
    </Button>
  </div>
);

const CursoInfoModal: React.FC<CursoInfoModalProps> = ({
  isOpen, onClose, curso, isInscrito, isEsgotado, vagasDisponiveis, onInscrever
}) => {
  const isMobile = useIsMobile();

  if (!isOpen || !curso) return null;

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle className="font-display text-xl text-primary">{curso.nome}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 overflow-y-auto">
            <InfoContent
              curso={curso}
              isInscrito={isInscrito}
              isEsgotado={isEsgotado}
              vagasDisponiveis={vagasDisponiveis}
              onInscrever={onInscrever}
              onClose={onClose}
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
          <DialogTitle className="font-display text-xl text-primary">{curso.nome}</DialogTitle>
        </DialogHeader>
        <InfoContent
          curso={curso}
          isInscrito={isInscrito}
          isEsgotado={isEsgotado}
          vagasDisponiveis={vagasDisponiveis}
          onInscrever={onInscrever}
          onClose={onClose}
        />
      </DialogContent>
    </Dialog>
  );
};

export default memo(CursoInfoModal);
