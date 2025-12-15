import { memo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/useIsMobile';
import type { Produto } from '@/types';

interface LojaInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  produto: Produto | null;
  onComprar: () => void;
}

const formatPrice = (centavos: number): string => {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const InfoContent: React.FC<{
  produto: Produto;
  onComprar: () => void;
  onClose: () => void;
}> = ({ produto, onComprar, onClose }) => (
  <div className="space-y-4">
    {produto.imagem_url && (
      <div className="rounded-lg overflow-hidden">
        <img
          src={produto.imagem_url}
          alt={produto.nome}
          className="w-full h-56 object-cover"
          decoding="async"
        />
      </div>
    )}

    {produto.categoria && (
      <Badge variant="outline" className="bg-primary/10 text-primary">
        {produto.categoria}
      </Badge>
    )}

    {produto.descricao && (
      <div>
        <h4 className="text-sm font-medium text-foreground mb-1">Descrição</h4>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
          {produto.descricao}
        </p>
      </div>
    )}

    <div className="flex items-baseline gap-3 pt-2 border-t">
      {produto.preco_promocional ? (
        <>
          <span className="text-2xl font-bold text-primary">
            {formatPrice(produto.preco_promocional)}
          </span>
          <span className="text-base text-muted-foreground line-through">
            {formatPrice(produto.preco)}
          </span>
          <Badge className="bg-red-500 text-white border-none">
            {Math.round((1 - produto.preco_promocional / produto.preco) * 100)}% OFF
          </Badge>
        </>
      ) : (
        <span className="text-2xl font-bold text-primary">
          {formatPrice(produto.preco)}
        </span>
      )}
    </div>

    <div className="text-sm">
      {produto.estoque > 5 ? (
        <span className="text-green-600">✓ Em estoque</span>
      ) : produto.estoque > 0 ? (
        <span className="text-amber-600">⚠ Apenas {produto.estoque} em estoque</span>
      ) : (
        <span className="text-destructive">✗ Esgotado</span>
      )}
    </div>

    <Button
      className="w-full"
      size="lg"
      disabled={produto.estoque === 0}
      onClick={() => {
        onClose();
        onComprar();
      }}
    >
      {produto.estoque === 0 ? 'Esgotado' : 'Comprar'}
    </Button>
  </div>
);

const LojaInfoModal: React.FC<LojaInfoModalProps> = ({
  isOpen, onClose, produto, onComprar
}) => {
  const isMobile = useIsMobile();

  if (!isOpen || !produto) return null;

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle className="font-display text-xl text-primary">{produto.nome}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 overflow-y-auto">
            <InfoContent produto={produto} onComprar={onComprar} onClose={onClose} />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-primary">{produto.nome}</DialogTitle>
        </DialogHeader>
        <InfoContent produto={produto} onComprar={onComprar} onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
};

export default memo(LojaInfoModal);
