import React, { useState, memo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, CreditCard, Loader2, Minus, Plus, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/useIsMobile';
import PaymentMethodSelector from '@/components/payment/PaymentMethodSelector';
import type { Produto } from '@/types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  produto: Produto | null;
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
  userEmail,
  userName,
}) => {
  const isMobile = useIsMobile();
  const [quantidade, setQuantidade] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [valorComTaxa, setValorComTaxa] = useState(0);

  if (!produto) return null;

  // preco já está em centavos
  const precoEmCentavos = produto.preco_promocional || produto.preco;
  const valorUnitario = precoEmCentavos / 100;
  const valorTotalBase = precoEmCentavos * quantidade;
  const valorTotal = valorUnitario * quantidade;
  const maxQuantidade = Math.min(produto.estoque || 10, 10);

  const handleQuantidadeChange = (delta: number) => {
    const novaQuantidade = quantidade + delta;
    if (novaQuantidade >= 1 && novaQuantidade <= maxQuantidade) setQuantidade(novaQuantidade);
  };

  const handlePaymentMethodSelect = (forma: string, valorFinal: number) => {
    setSelectedPaymentMethod(forma);
    setValorComTaxa(valorFinal);
  };

  const handleContinueToPayment = () => {
    setShowPaymentOptions(true);
  };

  const handleBackFromPayment = () => {
    setShowPaymentOptions(false);
    setSelectedPaymentMethod('');
    setValorComTaxa(0);
  };

  const handleComprar = async () => {
    if (!selectedPaymentMethod || valorComTaxa <= 0) return;
    
    setIsProcessing(true);
    try {
      const response = await supabase.functions.invoke('create-checkout', {
        body: {
          tipo: 'produto',
          produto_id: produto.id,
          produto_nome: produto.nome,
          quantidade,
          valor_centavos: valorComTaxa, // Valor com taxa
          valor_original: valorTotalBase, // Valor original
          forma_pagamento_mp: selectedPaymentMethod,
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
    setShowPaymentOptions(false);
    setSelectedPaymentMethod('');
    setValorComTaxa(0);
    onClose();
  };

  const getButtonText = () => {
    if (isProcessing) return <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processando...</>;
    if (!showPaymentOptions) return <>Continuar para pagamento</>;
    if (selectedPaymentMethod && valorComTaxa > 0) {
      return <><CreditCard className="w-4 h-4 mr-2" />Pagar {(valorComTaxa / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</>;
    }
    return <>Selecione uma forma de pagamento</>;
  };

  const handleButtonClick = () => {
    if (!showPaymentOptions) {
      handleContinueToPayment();
    } else {
      handleComprar();
    }
  };

  const buttons = (
    <>
      <Button variant="outline" onClick={handleClose} className={isMobile ? "w-full" : ""}>
        Cancelar
      </Button>
      <Button 
        onClick={handleButtonClick} 
        disabled={isProcessing || (showPaymentOptions && !selectedPaymentMethod)} 
        className={isMobile ? "w-full" : ""}
      >
        {getButtonText()}
      </Button>
    </>
  );

  // Conteúdo da seleção de pagamento
  const paymentContent = (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={handleBackFromPayment} className="-ml-2">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Voltar
      </Button>
      
      <div className="text-center mb-4">
        <p className="text-sm text-muted-foreground">Escolha como pagar</p>
        <p className="text-lg font-semibold">{produto.nome} ({quantidade}x)</p>
      </div>

      <PaymentMethodSelector
        valorBase={valorTotalBase}
        onSelect={handlePaymentMethodSelect}
        selectedMethod={selectedPaymentMethod}
      />

      {selectedPaymentMethod && valorComTaxa > 0 && (
        <div className="bg-green-500/10 p-3 rounded-lg border border-green-500/20 text-center">
          <p className="text-xs text-muted-foreground">Total a pagar</p>
          <p className="text-2xl font-bold text-green-600">
            {(valorComTaxa / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
          <p className="text-xs text-green-600 mt-1">✓ Pagamento seguro via Mercado Pago</p>
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-primary" />
              {showPaymentOptions ? 'Forma de Pagamento' : 'Finalizar Compra'}
            </DrawerTitle>
            <DrawerDescription>
              {showPaymentOptions ? 'Escolha como deseja pagar' : 'Confirme os detalhes do seu pedido'}
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-2 overflow-y-auto">
            {showPaymentOptions ? paymentContent : (
              <CheckoutContent
                produto={produto}
                quantidade={quantidade}
                maxQuantidade={maxQuantidade}
                valorUnitario={valorUnitario}
                valorTotal={valorTotal}
                onQuantidadeChange={handleQuantidadeChange}
                setQuantidade={setQuantidade}
              />
            )}
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
            {showPaymentOptions ? 'Forma de Pagamento' : 'Finalizar Compra'}
          </DialogTitle>
          <DialogDescription>
            {showPaymentOptions ? 'Escolha como deseja pagar' : 'Confirme os detalhes do seu pedido'}
          </DialogDescription>
        </DialogHeader>
        {showPaymentOptions ? paymentContent : (
          <CheckoutContent
            produto={produto}
            quantidade={quantidade}
            maxQuantidade={maxQuantidade}
            valorUnitario={valorUnitario}
            valorTotal={valorTotal}
            onQuantidadeChange={handleQuantidadeChange}
            setQuantidade={setQuantidade}
          />
        )}
        <DialogFooter className="gap-2">{buttons}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default memo(CheckoutModal);
