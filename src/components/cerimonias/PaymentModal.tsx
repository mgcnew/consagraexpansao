import { useState, useEffect, useCallback, memo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/components/ui/drawer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, Copy, CreditCard, Loader2 } from "lucide-react";
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { APP_CONFIG } from '@/config/app';
import { useIsMobile } from '@/hooks/useIsMobile';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (paymentMethod: string) => void;
  ceremonyTitle: string;
  ceremonyValue: number | null;
  ceremonyId: string;
  userId: string;
  userEmail: string;
  userName: string;
  isPending: boolean;
}

const PIX_KEY = APP_CONFIG.pix.chave;
const PIX_NOME = APP_CONFIG.pix.favorecido;
const PIX_BANCO = APP_CONFIG.pix.banco;

const formatValue = (centavos: number | null): string => {
  if (!centavos) return 'A consultar';
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

// Conteúdo compartilhado
const PaymentContent: React.FC<{
  ceremonyTitle: string;
  ceremonyValue: number | null;
  paymentMethod: string;
  setPaymentMethod: (v: string) => void;
  handleCopyPixKey: () => void;
}> = ({ ceremonyTitle, ceremonyValue, paymentMethod, setPaymentMethod, handleCopyPixKey }) => (
  <div className="space-y-4">
    <div className="bg-primary/10 p-3 rounded-lg border border-primary/20 text-center">
      <p className="text-xs text-muted-foreground mb-1">Contribuição</p>
      <p className="text-xl font-bold text-primary font-display">{formatValue(ceremonyValue)}</p>
    </div>

    <div className="bg-secondary/10 p-3 rounded-lg border border-secondary/20 flex gap-2">
      <AlertCircle className="w-5 h-5 text-secondary shrink-0" />
      <p className="text-xs text-foreground">
        Vaga garantida mediante pagamento até <span className="font-bold">5 dias antes</span>.
      </p>
    </div>

    <div className="space-y-2">
      <Label htmlFor="payment" className="text-sm">Forma de Pagamento</Label>
      <Select onValueChange={setPaymentMethod} value={paymentMethod}>
        <SelectTrigger id="payment" className="w-full">
          <SelectValue placeholder="Selecione como pagar" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="online">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Pagar Online (Pix, Cartão)
            </div>
          </SelectItem>
          <SelectItem value="pix">Pix Manual</SelectItem>
          <SelectItem value="dinheiro">Dinheiro (no local)</SelectItem>
        </SelectContent>
      </Select>
    </div>

    {paymentMethod === 'online' && (
      <div className="bg-green-500/10 p-3 rounded-lg border border-green-500/20 space-y-2">
        <p className="text-sm font-medium text-foreground flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-green-600" />
          Pagamento Seguro
        </p>
        <p className="text-xs text-muted-foreground">
          Pix, Cartão de crédito (até 12x), débito ou boleto.
        </p>
        <p className="text-xs text-green-600 font-medium">
          ✓ Confirmação automática após pagamento
        </p>
      </div>
    )}

    {paymentMethod === 'pix' && (
      <div className="bg-primary/5 p-3 rounded-lg border border-primary/20 space-y-2">
        <p className="text-sm font-medium text-foreground flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-primary" />
          Dados Pix
        </p>
        <div className="bg-background p-2 rounded border border-border space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs text-muted-foreground">Chave Pix</p>
              <code className="text-sm font-mono">{PIX_KEY}</code>
            </div>
            <Button size="sm" variant="ghost" onClick={handleCopyPixKey}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <div className="pt-2 border-t border-border text-xs">
            <span className="text-muted-foreground">Favorecido: </span>
            <span className="font-medium">{PIX_NOME}</span>
          </div>
        </div>
      </div>
    )}
  </div>
);

// Botões compartilhados
const PaymentButtons: React.FC<{
  onClose: () => void;
  handleConfirm: () => void;
  paymentMethod: string;
  isPending: boolean;
  isProcessingOnline: boolean;
  isMobile?: boolean;
}> = ({ onClose, handleConfirm, paymentMethod, isPending, isProcessingOnline, isMobile }) => (
  <>
    <Button variant="outline" onClick={onClose} className={isMobile ? "w-full" : ""}>
      Cancelar
    </Button>
    <Button
      onClick={handleConfirm}
      disabled={!paymentMethod || isPending || isProcessingOnline}
      className={isMobile ? "w-full" : ""}
    >
      {isProcessingOnline ? (
        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Redirecionando...</>
      ) : isPending ? "Confirmando..." : paymentMethod === 'online' ? "Pagar Agora" : "Confirmar"}
    </Button>
  </>
);

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen, onClose, onConfirm, ceremonyTitle, ceremonyValue,
  ceremonyId, userId, userEmail, userName, isPending
}) => {
  const isMobile = useIsMobile();
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [isProcessingOnline, setIsProcessingOnline] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setPaymentMethod("");
      setIsProcessingOnline(false);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (!paymentMethod) return;

    if (paymentMethod === 'online' && ceremonyValue) {
      setIsProcessingOnline(true);
      try {
        const { data: inscricao, error: inscricaoError } = await supabase
          .from('inscricoes')
          .insert({ user_id: userId, cerimonia_id: ceremonyId, forma_pagamento: 'online' })
          .select('id')
          .single();

        if (inscricaoError) throw inscricaoError;

        const response = await supabase.functions.invoke('create-checkout', {
          body: {
            inscricao_id: inscricao.id,
            cerimonia_id: ceremonyId,
            cerimonia_nome: ceremonyTitle,
            valor_centavos: ceremonyValue,
            user_email: userEmail,
            user_name: userName,
          },
        });

        if (response.error) throw new Error(response.error.message);

        const url = response.data.checkout_url || response.data.sandbox_url;
        if (url) window.location.href = url;
        else throw new Error('URL de checkout não retornada');
      } catch (error) {
        console.error('Erro ao criar checkout:', error);
        toast.error('Erro ao processar pagamento', {
          description: 'Tente novamente ou escolha outra forma de pagamento.',
        });
        setIsProcessingOnline(false);
      }
      return;
    }

    onConfirm(paymentMethod);
  };

  const handleCopyPixKey = useCallback(() => {
    navigator.clipboard.writeText(PIX_KEY);
    toast.success('Chave Pix copiada!');
  }, []);

  if (!isOpen) return null;

  // Mobile: Drawer
  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle className="font-display text-xl text-primary">Confirmar Presença</DrawerTitle>
            <DrawerDescription className="text-sm">{ceremonyTitle}</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-2 overflow-y-auto">
            <PaymentContent
              ceremonyTitle={ceremonyTitle}
              ceremonyValue={ceremonyValue}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              handleCopyPixKey={handleCopyPixKey}
            />
          </div>
          <DrawerFooter>
            <PaymentButtons
              onClose={onClose}
              handleConfirm={handleConfirm}
              paymentMethod={paymentMethod}
              isPending={isPending}
              isProcessingOnline={isProcessingOnline}
              isMobile
            />
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Dialog
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-primary">Confirmar Presença</DialogTitle>
          <DialogDescription>{ceremonyTitle}</DialogDescription>
        </DialogHeader>
        <PaymentContent
          ceremonyTitle={ceremonyTitle}
          ceremonyValue={ceremonyValue}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          handleCopyPixKey={handleCopyPixKey}
        />
        <DialogFooter className="gap-2">
          <PaymentButtons
            onClose={onClose}
            handleConfirm={handleConfirm}
            paymentMethod={paymentMethod}
            isPending={isPending}
            isProcessingOnline={isProcessingOnline}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default memo(PaymentModal);
