import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, MapPin, Clock, Users, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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

const CerimoniaInfoModal: React.FC<CerimoniaInfoModalProps> = ({
  cerimonia,
  isOpen,
  onClose,
  onConfirm,
  isEsgotada,
  isInscrito,
  vagasDisponiveis,
}) => {
  if (!cerimonia) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-primary">
            {cerimonia.nome || cerimonia.medicina_principal || 'Cerimônia'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {cerimonia.banner_url && (
            <div className="rounded-lg overflow-hidden">
              <img
                src={cerimonia.banner_url}
                alt={cerimonia.nome || 'Cerimônia'}
                className="w-full h-56 object-cover"
              />
            </div>
          )}

          <Badge variant="outline" className="bg-primary/10 text-primary">
            {cerimonia.medicina_principal}
          </Badge>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-foreground">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="font-medium">
                {format(new Date(cerimonia.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </span>
            </div>
            <div className="flex items-center gap-2 text-foreground">
              <Clock className="w-4 h-4 text-primary" />
              <span className="font-medium">{cerimonia.horario.slice(0, 5)}</span>
            </div>
          </div>

          <div className="flex items-start gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <span>{cerimonia.local}</span>
          </div>

          {cerimonia.descricao && (
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">Sobre a Cerimônia</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {cerimonia.descricao}
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
            <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Contribuição:</span>
                <span className="text-2xl font-bold text-primary">
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
      </DialogContent>
    </Dialog>
  );
};

export default CerimoniaInfoModal;
