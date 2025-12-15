import { memo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useIsMobile } from '@/hooks/useIsMobile';
import type { CursoEvento } from '@/types';

interface CursoPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  curso: CursoEvento | null;
  formaPagamento: string;
  setFormaPagamento: (v: string) => void;
  onConfirm: () => void;
  isPending: boolean;
}

const formatarValor = (valor: number) => {
  return (valor / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const PaymentContent: React.FC<{
  curso: CursoEvento;
  formaPagamento: string;
  setFormaPagamento: (v: string) => void;
}> = ({ curso, formaPagamento, setFormaPagamento }) => (
  <div className="space-y-4">
    <div className="bg-muted/50 p-3 rounded-lg">
      <h4 className="font-medium">{curso.nome}</h4>
      <p className="text-sm text-muted-foreground">
        {format(new Date(curso.data_inicio), "dd/MM/yyyy", { locale: ptBR })}
        {' às '}{curso.horario_inicio.slice(0, 5)}
      </p>
    </div>

    {curso.gratuito ? (
      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
        <Badge className="bg-green-600 text-white text-lg px-4 py-1">Evento Gratuito</Badge>
      </div>
    ) : (
      <>
        <div className="bg-primary/10 p-3 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground text-sm">Valor:</span>
            <span className="text-xl font-bold text-primary">{formatarValor(curso.valor)}</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm">Forma de Pagamento</Label>
          <RadioGroup value={formaPagamento} onValueChange={setFormaPagamento}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="pix" id="pix" />
              <Label htmlFor="pix" className="text-sm">PIX</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="dinheiro" id="dinheiro" />
              <Label htmlFor="dinheiro" className="text-sm">Dinheiro (no local)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="cartao" id="cartao" />
              <Label htmlFor="cartao" className="text-sm">Cartão (no local)</Label>
            </div>
          </RadioGroup>
        </div>
      </>
    )}
  </div>
);

const CursoPaymentModal: React.FC<CursoPaymentModalProps> = ({
  isOpen, onClose, curso, formaPagamento, setFormaPagamento, onConfirm, isPending
}) => {
  const isMobile = useIsMobile();

  if (!isOpen || !curso) return null;

  const buttons = (
    <>
      <Button variant="outline" onClick={onClose} className={isMobile ? "w-full" : ""}>Cancelar</Button>
      <Button onClick={onConfirm} disabled={isPending} className={isMobile ? "w-full" : ""}>
        {isPending ? 'Inscrevendo...' : 'Confirmar'}
      </Button>
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle className="text-primary">Confirmar Inscrição</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-2">
            <PaymentContent curso={curso} formaPagamento={formaPagamento} setFormaPagamento={setFormaPagamento} />
          </div>
          <DrawerFooter>{buttons}</DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar Inscrição</DialogTitle>
        </DialogHeader>
        <PaymentContent curso={curso} formaPagamento={formaPagamento} setFormaPagamento={setFormaPagamento} />
        <DialogFooter className="gap-2">{buttons}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default memo(CursoPaymentModal);
