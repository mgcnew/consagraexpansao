import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, Smartphone, Banknote } from 'lucide-react';

interface TaxaMP {
  id: string;
  forma_pagamento: string;
  nome_exibicao: string;
  taxa_percentual: number;
  parcelas: number;
  ativo: boolean;
  ordem: number;
}

interface PaymentMethodSelectorProps {
  valorBase: number; // em centavos
  onSelect: (forma: string, valorFinal: number) => void;
  selectedMethod: string;
  houseId?: string;
}

const formatCurrency = (centavos: number): string => {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  valorBase,
  onSelect,
  selectedMethod,
  houseId,
}) => {
  const [taxas, setTaxas] = useState<TaxaMP[]>([]);
  const [loading, setLoading] = useState(true);
  const [tipoPagamento, setTipoPagamento] = useState<string>('');
  const [parcelaSelecionada, setParcelaSelecionada] = useState<string>('');

  useEffect(() => {
    const fetchTaxas = async () => {
      let query = supabase
        .from('config_taxas_mp')
        .select('*')
        .eq('ativo', true)
        .order('ordem');

      if (houseId) {
        query = query.eq('house_id', houseId);
      }

      const { data, error } = await query;

      if (!error && data) {
        setTaxas(data);
      }
      setLoading(false);
    };

    fetchTaxas();
  }, [houseId]);

  const calcularValorFinal = (taxa: TaxaMP): number => {
    const taxaValor = Math.round(valorBase * (taxa.taxa_percentual / 100));
    return valorBase + taxaValor;
  };

  // Agrupar taxas por tipo
  const taxaPix = taxas.find(t => t.forma_pagamento === 'pix');
  const taxaDebito = taxas.find(t => t.forma_pagamento === 'debito');
  const taxasCredito = taxas.filter(t => t.forma_pagamento.startsWith('credito'));

  const handleTipoPagamentoChange = (tipo: string) => {
    setTipoPagamento(tipo);
    setParcelaSelecionada('');

    if (tipo === 'pix' && taxaPix) {
      const valorFinal = calcularValorFinal(taxaPix);
      onSelect('pix', valorFinal);
    } else if (tipo === 'debito' && taxaDebito) {
      const valorFinal = calcularValorFinal(taxaDebito);
      onSelect('debito', valorFinal);
    } else if (tipo === 'credito') {
      // Seleciona credito 1x por padrao
      const credito1x = taxasCredito.find(t => t.parcelas === 1);
      if (credito1x) {
        setParcelaSelecionada(credito1x.forma_pagamento);
        const valorFinal = calcularValorFinal(credito1x);
        onSelect(credito1x.forma_pagamento, valorFinal);
      }
    }
  };

  const handleParcelaChange = (forma: string) => {
    setParcelaSelecionada(forma);
    const taxa = taxasCredito.find(t => t.forma_pagamento === forma);
    if (taxa) {
      const valorFinal = calcularValorFinal(taxa);
      onSelect(forma, valorFinal);
    }
  };

  // Calcular valor selecionado para exibir
  const getValorSelecionado = (): { valorFinal: number; taxa: TaxaMP } | null => {
    if (tipoPagamento === 'pix' && taxaPix) {
      return { valorFinal: calcularValorFinal(taxaPix), taxa: taxaPix };
    }
    if (tipoPagamento === 'debito' && taxaDebito) {
      return { valorFinal: calcularValorFinal(taxaDebito), taxa: taxaDebito };
    }
    if (tipoPagamento === 'credito' && parcelaSelecionada) {
      const taxa = taxasCredito.find(t => t.forma_pagamento === parcelaSelecionada);
      if (taxa) {
        return { valorFinal: calcularValorFinal(taxa), taxa };
      }
    }
    return null;
  };

  const valorSelecionado = getValorSelecionado();

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Valor base: <span className="font-semibold text-foreground">{formatCurrency(valorBase)}</span>
      </p>

      {/* Tipo de pagamento */}
      <div className="space-y-2">
        <Label>Forma de pagamento</Label>
        <Select value={tipoPagamento} onValueChange={handleTipoPagamentoChange}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione como pagar" />
          </SelectTrigger>
          <SelectContent>
            {taxaPix && (
              <SelectItem value="pix">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-green-500" />
                  PIX - {formatCurrency(calcularValorFinal(taxaPix))}
                </div>
              </SelectItem>
            )}
            {taxaDebito && (
              <SelectItem value="debito">
                <div className="flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-blue-500" />
                  Debito - {formatCurrency(calcularValorFinal(taxaDebito))}
                </div>
              </SelectItem>
            )}
            {taxasCredito.length > 0 && (
              <SelectItem value="credito">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-purple-500" />
                  Cartao de Credito
                </div>
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Parcelas (apenas para credito) */}
      {tipoPagamento === 'credito' && taxasCredito.length > 0 && (
        <div className="space-y-2">
          <Label>Parcelas</Label>
          <Select value={parcelaSelecionada} onValueChange={handleParcelaChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione as parcelas" />
            </SelectTrigger>
            <SelectContent>
              {taxasCredito
                .filter(t => t.parcelas <= 10)
                .map((taxa) => {
                  const valorFinal = calcularValorFinal(taxa);
                  const valorParcela = Math.ceil(valorFinal / taxa.parcelas);
                  return (
                    <SelectItem key={taxa.id} value={taxa.forma_pagamento}>
                      {taxa.parcelas === 1 ? (
                        <span>A vista - {formatCurrency(valorFinal)}</span>
                      ) : (
                        <span>
                          {taxa.parcelas}x de {formatCurrency(valorParcela)} = {formatCurrency(valorFinal)}
                        </span>
                      )}
                    </SelectItem>
                  );
                })}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Resumo do valor */}
      {valorSelecionado && (
        <div className="bg-green-500/10 p-3 rounded-lg border border-green-500/20 text-center">
          <p className="text-xs text-muted-foreground">Total a pagar</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(valorSelecionado.valorFinal)}</p>
          {valorSelecionado.taxa.taxa_percentual > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Inclui taxa de {valorSelecionado.taxa.taxa_percentual}%
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default PaymentMethodSelector;
