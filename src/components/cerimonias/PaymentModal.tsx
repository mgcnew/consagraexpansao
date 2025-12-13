import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, Copy, CreditCard, Loader2 } from "lucide-react";
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { APP_CONFIG } from '@/config/app';

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

// Dados PIX para pagamento manual (da configuração centralizada)
const PIX_KEY = APP_CONFIG.pix.chave;
const PIX_NOME = APP_CONFIG.pix.favorecido;
const PIX_BANCO = APP_CONFIG.pix.banco;

const PaymentModal: React.FC<PaymentModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    ceremonyTitle,
    ceremonyValue,
    ceremonyId,
    userId,
    userEmail,
    userName,
    isPending
}) => {
    const [paymentMethod, setPaymentMethod] = useState<string>("");
    const [isProcessingOnline, setIsProcessingOnline] = useState(false);

    // Formatar valor de centavos para Real
    const formatValue = (centavos: number | null): string => {
        if (!centavos) return 'A consultar';
        return (centavos / 100).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        });
    };

    const handleConfirm = async () => {
        if (!paymentMethod) return;

        // Se for pagamento online, criar inscrição e redirecionar para Mercado Pago
        if (paymentMethod === 'online' && ceremonyValue) {
            setIsProcessingOnline(true);
            try {
                // Primeiro criar a inscrição
                const { data: inscricao, error: inscricaoError } = await supabase
                    .from('inscricoes')
                    .insert({
                        user_id: userId,
                        cerimonia_id: ceremonyId,
                        forma_pagamento: 'online'
                    })
                    .select('id')
                    .single();

                if (inscricaoError) throw inscricaoError;
                
                // Depois criar o checkout no Mercado Pago
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

                if (response.error) {
                    throw new Error(response.error.message);
                }

                const { checkout_url, sandbox_url } = response.data;
                
                // Usar sandbox_url em desenvolvimento, checkout_url em produção
                const url = checkout_url || sandbox_url;
                
                if (url) {
                    window.location.href = url;
                } else {
                    throw new Error('URL de checkout não retornada');
                }
            } catch (error) {
                console.error('Erro ao criar checkout:', error);
                toast.error('Erro ao processar pagamento', {
                    description: 'Tente novamente ou escolha outra forma de pagamento.',
                });
                setIsProcessingOnline(false);
            }
            return;
        }

        // Para outros métodos, continuar com o fluxo normal
        onConfirm(paymentMethod);
    };

    const handleCopyPixKey = () => {
        navigator.clipboard.writeText(PIX_KEY);
        toast.success('Chave Pix copiada!', {
            description: 'A chave foi copiada para a área de transferência.',
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-card border-border">
                <DialogHeader>
                    <DialogTitle className="font-display text-2xl text-primary">Confirmar Presença</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Você está se inscrevendo para: <span className="font-medium text-foreground">{ceremonyTitle}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Valor da cerimônia */}
                    <div className="bg-primary/10 p-4 rounded-lg border border-primary/20 text-center">
                        <p className="text-sm text-muted-foreground mb-1">Valor da contribuição</p>
                        <p className="text-2xl font-bold text-primary font-display">
                            {formatValue(ceremonyValue)}
                        </p>
                    </div>

                    <div className="bg-secondary/10 p-4 rounded-lg border border-secondary/20 flex gap-3">
                        <AlertCircle className="w-6 h-6 text-secondary shrink-0" />
                        <p className="text-sm text-foreground font-medium">
                            Sua vaga fica garantida mediante o pagamento, que pode ser realizado até <span className="font-bold">5 dias antes</span> da cerimônia.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="payment">Forma de Pagamento</Label>
                        <Select onValueChange={setPaymentMethod} value={paymentMethod}>
                            <SelectTrigger id="payment" className="w-full">
                                <SelectValue placeholder="Selecione como deseja pagar" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="online">
                                    <div className="flex items-center gap-2">
                                        <CreditCard className="w-4 h-4" />
                                        Pagar Online (Pix, Cartão)
                                    </div>
                                </SelectItem>
                                <SelectItem value="pix">Pix Manual (Chave Pix)</SelectItem>
                                <SelectItem value="dinheiro">Dinheiro (no local)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {paymentMethod === 'online' && (
                        <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/20 space-y-3">
                            <div className="flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-green-600 shrink-0" />
                                <p className="text-sm font-medium text-foreground">Pagamento Seguro</p>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Você será redirecionado para o Mercado Pago onde poderá pagar com:
                            </p>
                            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                                <li>Pix (aprovação instantânea)</li>
                                <li>Cartão de crédito (até 12x)</li>
                                <li>Cartão de débito</li>
                                <li>Boleto bancário</li>
                            </ul>
                            <p className="text-xs text-green-600 font-medium">
                                ✓ Sua inscrição será confirmada automaticamente após o pagamento
                            </p>
                        </div>
                    )}

                    {paymentMethod === 'pix' && (
                        <div className="bg-primary/5 p-4 rounded-lg border border-primary/20 space-y-3">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                                <p className="text-sm font-medium text-foreground">Dados para Pagamento via Pix</p>
                            </div>
                            <div className="bg-background p-3 rounded border border-border space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Chave Pix (Celular)</p>
                                        <code className="text-sm font-mono text-foreground">{PIX_KEY}</code>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={handleCopyPixKey}
                                        className="shrink-0"
                                        title="Copiar chave Pix"
                                    >
                                        <Copy className="w-4 h-4" />
                                    </Button>
                                </div>
                                <div className="pt-2 border-t border-border">
                                    <p className="text-xs text-muted-foreground">Favorecido</p>
                                    <p className="text-sm font-medium text-foreground">{PIX_NOME}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Banco</p>
                                    <p className="text-sm text-foreground">{PIX_BANCO}</p>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Copie a chave acima e faça a transferência via Pix. Sua inscrição será confirmada assim que recebermos o pagamento.
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={!paymentMethod || isPending || isProcessingOnline}
                        className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                        {isProcessingOnline ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Redirecionando...
                            </>
                        ) : isPending ? (
                            "Confirmando..."
                        ) : paymentMethod === 'online' ? (
                            "Pagar Agora"
                        ) : (
                            "Confirmar Inscrição"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default PaymentModal;
