import { memo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, CreditCard, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/useIsMobile';
import PaymentMethodSelector from '@/components/payment/PaymentMethodSelector';
import type { CursoEvento } from '@/types';

interface CursoPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  curso: CursoEvento | null;
  formaPagamento: string;
  setFormaPagamento: (v: string) => void;
  onConfirm: () => void;
  isPending: boolean;
  userId: string;
  userEmail: string;
  userName: string;
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
              <RadioGroupItem value="online" id="online" />
              <Label htmlFor="online" className="text-sm flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Pagar Online (Pix, Cartão)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="pix" id="pix" />
              <Label htmlFor="pix" className="text-sm">PIX Manual</Label>
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

        {formaPagamento === 'online' && (
          <div className="bg-green-500/10 p-3 rounded-lg border border-green-500/20 space-y-2">
            <p className="text-sm font-medium text-foreground flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-green-600" />
              Pagamento Seguro
            </p>
            <p className="text-xs text-muted-foreground">
              Escolha entre PIX, Cartão de crédito ou débito.
            </p>
            <p className="text-xs text-green-600 font-medium">
              ✓ Confirmação automática após pagamento
            </p>
          </div>
        )}
      </>
    )}
  </div>
);

const CursoPaymentModal: React.FC<CursoPaymentModalProps> = ({
  isOpen, onClose, curso, formaPagamento, setFormaPagamento, onConfirm, isPending,
  userId, userEmail, userName
}) => {
  const isMobile = useIsMobile();
  const [showMPOptions, setShowMPOptions] = useState(false);
  const [selectedMPMethod, setSelectedMPMethod] = useState('');
  const [valorComTaxa, setValorComTaxa] = useState(0);
  const [isProcessingOnline, setIsProcessingOnline] = useState(false);

  if (!isOpen || !curso) return null;

  const handleMPMethodSelect = (forma: string, valorFinal: number) => {
    setSelectedMPMethod(forma);
    setValorComTaxa(valorFinal);
  };

  const handleBackFromMP = () => {
    setShowMPOptions(false);
    setSelectedMPMethod('');
    setValorComTaxa(0);
  };

  const handleClose = () => {
    setShowMPOptions(false);
    setSelectedMPMethod('');
    setValorComTaxa(0);
    setIsProcessingOnline(false);
    onClose();
  };

  const handleConfirm = async () => {
    // Se escolheu online mas ainda não selecionou a forma de pagamento MP
    if (formaPagamento === 'online' && !showMPOptions) {
      setShowMPOptions(true);
      return;
    }

    // Pagamento online com forma selecionada
    if (formaPagamento === 'online' && selectedMPMethod && valorComTaxa > 0) {
      setIsProcessingOnline(true);
      try {
        // Primeiro cria a inscrição
        const { data: inscricao, error: inscricaoError } = await supabase
          .from('inscricoes_cursos')
          .insert({ user_id: userId, curso_id: curso.id, forma_pagamento: 'online' })
          .select('id')
          .single();

        if (inscricaoError) throw inscricaoError;

        const response = await supabase.functions.invoke('create-checkout', {
          body: {
            tipo: 'curso',
            inscricao_curso_id: inscricao.id,
            curso_id: curso.id,
            curso_nome: curso.nome,
            valor_centavos: valorComTaxa,
            valor_original: curso.valor,
            forma_pagamento_mp: selectedMPMethod,
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

    onConfirm();
  };

  const getButtonText = () => {
    if (isProcessingOnline) return <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Redirecionando...</>;
    if (isPending) return 'Inscrevendo...';
    if (formaPagamento === 'online' && !showMPOptions) return 'Escolher forma de pagamento';
    if (formaPagamento === 'online' && showMPOptions && selectedMPMethod) return 'Pagar Agora';
    if (formaPagamento === 'online' && showMPOptions && !selectedMPMethod) return 'Selecione uma opção';
    return 'Confirmar';
  };

  const isButtonDisabled = () => {
    if (!formaPagamento || isPending || isProcessingOnline) return true;
    if (formaPagamento === 'online' && showMPOptions && !selectedMPMethod) return true;
    return false;
  };

  // Conteúdo da seleção de pagamento MP
  const mpOptionsContent = (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={handleBackFromMP} className="-ml-2">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Voltar
      </Button>
      
      <div className="text-center mb-4">
        <p className="text-sm text-muted-foreground">Escolha como pagar</p>
        <p className="text-lg font-semibold">{curso.nome}</p>
      </div>

      <PaymentMethodSelector
        valorBase={curso.valor}
        onSelect={handleMPMethodSelect}
        selectedMethod={selectedMPMethod}
      />

      {selectedMPMethod && valorComTaxa > 0 && (
        <div className="bg-green-500/10 p-3 rounded-lg border border-green-500/20 text-center">
          <p className="text-xs text-muted-foreground">Total a pagar</p>
          <p className="text-2xl font-bold text-green-600">{formatarValor(valorComTaxa)}</p>
          <p className="text-xs text-green-600 mt-1">✓ Confirmação automática</p>
        </div>
      )}
    </div>
  );

  const buttons = (
    <>
      <Button variant="outline" onClick={handleClose} className={isMobile ? "w-full" : ""}>Cancelar</Button>
      <Button onClick={handleConfirm} disabled={isButtonDisabled()} className={isMobile ? "w-full" : ""}>
        {getButtonText()}
      </Button>
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle className="text-primary">
              {showMPOptions ? 'Forma de Pagamento' : 'Confirmar Inscrição'}
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-2 overflow-y-auto">
            {showMPOptions ? mpOptionsContent : (
              <PaymentContent curso={curso} formaPagamento={formaPagamento} setFormaPagamento={setFormaPagamento} />
            )}
          </div>
          <DrawerFooter>{buttons}</DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{showMPOptions ? 'Forma de Pagamento' : 'Confirmar Inscrição'}</DialogTitle>
        </DialogHeader>
        {showMPOptions ? mpOptionsContent : (
          <PaymentContent curso={curso} formaPagamento={formaPagamento} setFormaPagamento={setFormaPagamento} />
        )}
        <DialogFooter className="gap-2">{buttons}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default memo(CursoPaymentModal);
