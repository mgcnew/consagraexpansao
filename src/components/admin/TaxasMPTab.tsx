import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { CreditCard, Percent, Save, Loader2 } from 'lucide-react';

interface TaxaMP {
  id: string;
  forma_pagamento: string;
  nome_exibicao: string;
  taxa_percentual: number;
  parcelas: number;
  ativo: boolean;
  ordem: number;
}

export const TaxasMPTab: React.FC = () => {
  const queryClient = useQueryClient();
  const [editedTaxas, setEditedTaxas] = useState<Record<string, Partial<TaxaMP>>>({});

  const { data: taxas, isLoading } = useQuery({
    queryKey: ['config-taxas-mp'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('config_taxas_mp')
        .select('*')
        .order('ordem');
      if (error) throw error;
      return data as TaxaMP[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (taxa: Partial<TaxaMP> & { id: string }) => {
      const { error } = await supabase
        .from('config_taxas_mp')
        .update({
          nome_exibicao: taxa.nome_exibicao,
          taxa_percentual: taxa.taxa_percentual,
          ativo: taxa.ativo,
        })
        .eq('id', taxa.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config-taxas-mp'] });
      toast.success('Taxa atualizada com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao atualizar taxa');
    },
  });

  const handleChange = (id: string, field: keyof TaxaMP, value: any) => {
    setEditedTaxas(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const handleSave = (taxa: TaxaMP) => {
    const edited = editedTaxas[taxa.id];
    if (!edited) return;

    updateMutation.mutate({
      id: taxa.id,
      nome_exibicao: edited.nome_exibicao ?? taxa.nome_exibicao,
      taxa_percentual: edited.taxa_percentual ?? taxa.taxa_percentual,
      ativo: edited.ativo ?? taxa.ativo,
    });

    // Limpar edições após salvar
    setEditedTaxas(prev => {
      const { [taxa.id]: _, ...rest } = prev;
      return rest;
    });
  };

  const getValue = (taxa: TaxaMP, field: keyof TaxaMP) => {
    return editedTaxas[taxa.id]?.[field] ?? taxa[field];
  };

  const hasChanges = (id: string) => {
    return !!editedTaxas[id] && Object.keys(editedTaxas[id]).length > 0;
  };

  const formatCurrency = (centavos: number): string => {
    return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Exemplo de cálculo
  const exemploValor = 15000; // R$ 150,00

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Taxas do Mercado Pago
          </CardTitle>
          <CardDescription>
            Configure as taxas que serão repassadas ao cliente em cada forma de pagamento.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {taxas?.map((taxa) => (
            <div
              key={taxa.id}
              className={`p-4 rounded-lg border ${
                getValue(taxa, 'ativo') ? 'border-border' : 'border-border/50 bg-muted/30'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <Switch
                    checked={getValue(taxa, 'ativo') as boolean}
                    onCheckedChange={(v) => handleChange(taxa.id, 'ativo', v)}
                  />
                  <div className="flex-1">
                    <Input
                      value={getValue(taxa, 'nome_exibicao') as string}
                      onChange={(e) => handleChange(taxa.id, 'nome_exibicao', e.target.value)}
                      className="font-medium"
                    />
                    {taxa.parcelas > 1 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Parcelado em {taxa.parcelas}x
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-muted-foreground" />
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={getValue(taxa, 'taxa_percentual') as number}
                      onChange={(e) => handleChange(taxa.id, 'taxa_percentual', parseFloat(e.target.value) || 0)}
                      className="w-24"
                    />
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleSave(taxa)}
                    disabled={!hasChanges(taxa.id) || updateMutation.isPending}
                  >
                    {updateMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Preview do valor */}
              <div className="mt-3 pt-3 border-t border-border/50 text-sm text-muted-foreground">
                <span>Exemplo com {formatCurrency(exemploValor)}: </span>
                <span className="font-medium text-foreground">
                  {formatCurrency(
                    exemploValor + Math.round(exemploValor * ((getValue(taxa, 'taxa_percentual') as number) / 100))
                  )}
                </span>
                <span className="text-xs ml-2">
                  (+{formatCurrency(Math.round(exemploValor * ((getValue(taxa, 'taxa_percentual') as number) / 100)))} de taxa)
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Como funciona</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            • As taxas configuradas aqui serão <strong>adicionadas ao valor original</strong> quando o usuário escolher pagar pelo Mercado Pago.
          </p>
          <p>
            • O usuário verá todas as opções com os valores finais antes de confirmar o pagamento.
          </p>
          <p>
            • Desative uma forma de pagamento para não exibi-la como opção.
          </p>
          <p>
            • As taxas devem cobrir: taxa de transação + taxa de antecipação (se receber na hora).
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default TaxasMPTab;
