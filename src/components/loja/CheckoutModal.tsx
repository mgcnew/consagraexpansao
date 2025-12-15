import React, { useState, memo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, Loader2, Minus, Plus, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/useIsMobile';
import type { Produto } from '@/types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  produto: Produto | null;
  userId: string;
  userEmail: string;
  userName: string;
}

// Conteúdo compartilhado
const CheckoutContent: React.FC<{
  produto: Produto;
  quantidade: number;
  maxQuantidade: number;
  valorUnitario: number;
  valorTotal: number;
  onQuantidadeChange: (delta: number) => void;
  setQuantidade: (q: number) => void;
}> = ({ produto, quantidade, maxQuantidade, valorUnitario, valorTotal, onQuantidadeChange, setQuantidade }) => (
  <div className="space-y-4">
    <div className="flex gap-4">
      {produto.imagem_url && (
        <img
          src={produto.imagem_url}
          alt={produto.nome}
          className="w-20 h-20 object-cover rounded-lg"
          decoding="async"
        />
      )}
      <div className="flex-1">
        <h4 className="font-medium">{produto.nome}</h4>
        <p className="text-sm text-muted-foreground">
          {valorUnitario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} cada
        </p>
      </div>
    </div>

    <div className="space-y-2">
      <Label>Quantidade</Label>
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onQuantidadeChange(-1)}
          disabled={quantidade <= 1}
        >
          <Minus className="w-4 h-4" />
        </Button>
        <Input
          type="number"
          value={quantidade}
          onChange={(e) => {
            const val = parseInt(e.target.value);
            if (val >= 1 && val <= maxQuantidade) setQuantidade(val);
          }}
          className="w-20 text-center"
          min={1}
          max={maxQuantidade}
        />
        <Button
          variant="outline"
          size="icon"
          onClick={() => onQuantidadeChange(1)}
          disabled={quantidade >= maxQuantidade}
        >
          <Plus className="w-4 h-4" />
        </Button>
        <span className="text-sm text-muted-foreground">({produto.estoque} disponíveis)</span>
      </div>
    </div>

    <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
      <div className="flex justify-between items-center">
        <span className="text-muted-foreground">Total:</span>
        <span className="text-2xl font-bold text-primary">
          {valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </span>
      </div>
    </div>

    <div className="bg-green-500/10 p-3 rounded-lg border border-green-500/20">
      <div className="flex items-center gap-2 text-sm">
        <CreditCard className="w-4 h-4 text-green-600" />
        <span>Pagamento seguro via Mercado Pago</span>
      </div>
      <p className="text-xs text-muted-foreground mt-1">Pix, cartão de crédito, débito ou boleto</p>
    </div>
  </div>
);

const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  produto,
  userId,
  userEmail,
  userName,
}) => {
  const isMobile = useIsMobile();
  const [quantidade, setQuantidade] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!produto) return null;

  // preco já está em centavos
  const precoEmCentavos = produto.preco_promocional || produto.preco;
  const valorUnitario = precoEmCentavos / 100;
  const valorTotal = valorUnitario * quantidade;
  const maxQuantidade = Math.min(produto.estoque || 10, 10);

  const handleQuantidadeChange = (delta: number) => {
    const novaQuantidade = quantidade + delta;
    if (novaQuantidade >= 1 && novaQuantidade <= maxQuantidade) setQuantidade(novaQuantidade);
  };

  const handleComprar = async () => {
    setIsProcessing(true);
    try {
      const response = await supabase.functions.invoke('create-checkout', {
        body: {
          tipo: 'produto',
          produto_id: produto.id,
          produto_nome: produto.nome,
          quantidade,
          valor_centavos: precoEmCentavos * quantidade,
          user_email: userEmail,
          user_name: userName,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const { checkout_url, sandbox_url } = response.data;
      const url = checkout_url || sandbox_url;

      if (url) {
        window.location.href = url;
      } else {
        throw new Error('URL de checkout não retornada');
      }
    } catch (error) {
      console.error('Erro ao criar checkout:', error);
      toast.error('Erro ao processar compra', {
        description: 'Tente novamente mais tarde.',
      });
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setQuantidade(1);
    onClose();
  };

  const buttons = (
    <>
      <Button variant="outline" onClick={handleClose} className={isMobile ? "w-full" : ""}>
        Cancelar
      </Button>
      <Button onClick={handleComprar} disabled={isProcessing} className={isMobile ? "w-full" : ""}>
        {isProcessing ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processando...</>
        ) : (
          <><CreditCard className="w-4 h-4 mr-2" />Pagar {valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</>
        )}
      </Button>
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-primary" />
              Finalizar Compra
            </DrawerTitle>
            <DrawerDescription>Confirme os detalhes do seu pedido</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-2 overflow-y-auto">
            <CheckoutContent
              produto={produto}
              quantidade={quantidade}
              maxQuantidade={maxQuantidade}
              valorUnitario={valorUnitario}
              valorTotal={valorTotal}
              onQuantidadeChange={handleQuantidadeChange}
              setQuantidade={setQuantidade}
            />
          </div>
          <DrawerFooter>{buttons}</DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" />
            Finalizar Compra
          </DialogTitle>
          <DialogDescription>Confirme os detalhes do seu pedido</DialogDescription>
        </DialogHeader>
        <CheckoutContent
          produto={produto}
          quantidade={quantidade}
          maxQuantidade={maxQuantidade}
          valorUnitario={valorUnitario}
          valorTotal={valorTotal}
          onQuantidadeChange={handleQuantidadeChange}
          setQuantidade={setQuantidade}
        />
        <DialogFooter className="gap-2">{buttons}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default memo(CheckoutModal);
