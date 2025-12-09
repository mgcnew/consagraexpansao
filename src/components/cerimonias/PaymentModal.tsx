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
import { AlertCircle, CheckCircle2, Copy } from "lucide-react";
import { toast } from 'sonner';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (paymentMethod: string) => void;
    ceremonyTitle: string;
    isPending: boolean;
}

// TODO: Replace with actual Pix key from environment or database
const PIX_KEY = "conscienciadivinal@email.com";

const PaymentModal: React.FC<PaymentModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    ceremonyTitle,
    isPending
}) => {
    const [paymentMethod, setPaymentMethod] = useState<string>("");

    const handleConfirm = () => {
        if (paymentMethod) {
            onConfirm(paymentMethod);
        }
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
                                <SelectItem value="pix">Pix (Instantâneo)</SelectItem>
                                <SelectItem value="dinheiro">Dinheiro (no local)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {paymentMethod === 'pix' && (
                        <div className="bg-primary/5 p-4 rounded-lg border border-primary/20 space-y-3">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                                <p className="text-sm font-medium text-foreground">Chave Pix para Pagamento</p>
                            </div>
                            <div className="bg-background p-3 rounded border border-border flex items-center justify-between gap-2">
                                <code className="text-sm font-mono text-foreground break-all">{PIX_KEY}</code>
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
                        disabled={!paymentMethod || isPending}
                        className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                        {isPending ? "Confirmando..." : "Confirmar Inscrição"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default PaymentModal;
