import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Building2,
  CheckCircle,
  Clock,
  Search,
  Send,
  Copy,
  AlertTriangle,
  TrendingUp,
  Loader2,
  Eye,
  Wallet,
  Zap,
  RefreshCw,
  Link2,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const formatCurrency = (cents: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100);
};

interface HouseWithPendingAmount {
  house_id: string;
  house_name: string;
  house_slug: string;
  pix_key: string | null;
  pix_key_type: string | null;
  pix_holder_name: string | null;
  pending_amount: number;
  pending_count: number;
  has_mp_connected: boolean;
}

interface PortalBalance {
  available_balance?: number;
  total_amount?: number;
  currency_id?: string;
}

interface PaymentSplit {
  id: string;
  payment_id: string;
  house_id: string;
  total_amount_cents: number;
  portal_amount_cents: number;
  house_amount_cents: number;
  commission_percent: number;
  commission_type: string;
  transfer_status: string;
  transferred_at: string | null;
  transfer_reference: string | null;
  created_at: string;
  houses: {
    name: string;
    slug: string;
    pix_key: string | null;
  };
  pagamentos: {
    descricao: string;
    mp_status: string;
    paid_at: string | null;
  };
}

const PortalRepasses = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHouse, setSelectedHouse] = useState<HouseWithPendingAmount | null>(null);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [transferReference, setTransferReference] = useState('');
  const [selectedSplits, setSelectedSplits] = useState<string[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [transferMode, setTransferMode] = useState<'manual' | 'pix'>('manual');

  // Buscar saldo do portal no MP
  const { data: portalBalance, isLoading: isLoadingBalance, refetch: refetchBalance } = useQuery({
    queryKey: ['portal-mp-balance'],
    queryFn: async (): Promise<PortalBalance | null> => {
      const { data, error } = await supabase.functions.invoke('process-pix-transfer', {
        body: { action: 'check_balance' },
      });

      if (error || !data?.success) {
        console.error('Erro ao buscar saldo:', error || data?.error);
        return null;
      }

      return data.balance;
    },
    staleTime: 60000, // 1 minuto
  });

  // Buscar resumo por casa (pendentes)
  const { data: pendingByHouse, isLoading: isLoadingPending } = useQuery({
    queryKey: ['portal-pending-transfers'],
    queryFn: async () => {
      // Buscar splits pendentes
      const { data: splitsData, error: splitsError } = await supabase
        .from('payment_splits')
        .select(`
          house_id,
          house_amount_cents,
          houses!inner(name, slug, pix_key, pix_key_type, pix_holder_name)
        `)
        .eq('transfer_status', 'pending');

      if (splitsError) throw splitsError;

      // Buscar casas com MP conectado
      const { data: mpCredentials } = await supabase
        .from('house_mp_credentials')
        .select('house_id')
        .eq('is_active', true);

      const housesWithMP = new Set((mpCredentials || []).map(c => c.house_id));

      // Agrupar por casa
      const grouped = (splitsData || []).reduce((acc, split) => {
        const key = split.house_id;
        if (!acc[key]) {
          acc[key] = {
            house_id: split.house_id,
            house_name: (split.houses as any).name,
            house_slug: (split.houses as any).slug,
            pix_key: (split.houses as any).pix_key,
            pix_key_type: (split.houses as any).pix_key_type,
            pix_holder_name: (split.houses as any).pix_holder_name,
            pending_amount: 0,
            pending_count: 0,
            has_mp_connected: housesWithMP.has(split.house_id),
          };
        }
        acc[key].pending_amount += split.house_amount_cents;
        acc[key].pending_count += 1;
        return acc;
      }, {} as Record<string, HouseWithPendingAmount>);

      return Object.values(grouped).sort((a, b) => b.pending_amount - a.pending_amount);
    },
  });

  // Buscar splits de uma casa especifica
  const { data: houseSplits, isLoading: isLoadingSplits } = useQuery({
    queryKey: ['portal-house-splits', selectedHouse?.house_id],
    queryFn: async () => {
      if (!selectedHouse) return [];

      const { data, error } = await supabase
        .from('payment_splits')
        .select(`
          *,
          houses(name, slug, pix_key),
          pagamentos(descricao, mp_status, paid_at)
        `)
        .eq('house_id', selectedHouse.house_id)
        .eq('transfer_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PaymentSplit[];
    },
    enabled: !!selectedHouse,
  });

  // Buscar historico de transferencias
  const { data: transferHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['portal-transfer-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_splits')
        .select(`
          *,
          houses(name, slug),
          pagamentos(descricao)
        `)
        .eq('transfer_status', 'completed')
        .order('transferred_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as PaymentSplit[];
    },
  });

  // Estatisticas gerais
  const { data: stats } = useQuery({
    queryKey: ['portal-transfer-stats'],
    queryFn: async () => {
      const [pendingRes, completedRes] = await Promise.all([
        supabase
          .from('payment_splits')
          .select('house_amount_cents')
          .eq('transfer_status', 'pending'),
        supabase
          .from('payment_splits')
          .select('house_amount_cents, portal_amount_cents')
          .eq('transfer_status', 'completed'),
      ]);

      const pendingTotal = (pendingRes.data || []).reduce((sum, s) => sum + s.house_amount_cents, 0);
      const transferredTotal = (completedRes.data || []).reduce((sum, s) => sum + s.house_amount_cents, 0);
      const portalTotal = (completedRes.data || []).reduce((sum, s) => sum + s.portal_amount_cents, 0);

      return {
        pendingTotal,
        transferredTotal,
        portalTotal,
        pendingCount: pendingRes.data?.length || 0,
        completedCount: completedRes.data?.length || 0,
      };
    },
  });

  // Mutation para marcar como transferido
  const markAsTransferred = useMutation({
    mutationFn: async ({ splitIds, reference }: { splitIds: string[]; reference: string }) => {
      const { data, error } = await supabase.functions.invoke('process-pix-transfer', {
        body: {
          action: 'mark_manual',
          split_ids: splitIds,
          reference,
        },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || 'Erro ao marcar repasse');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-pending-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['portal-house-splits'] });
      queryClient.invalidateQueries({ queryKey: ['portal-transfer-history'] });
      queryClient.invalidateQueries({ queryKey: ['portal-transfer-stats'] });
      toast.success('Repasse marcado como realizado!');
      setShowTransferDialog(false);
      setShowConfirmDialog(false);
      setSelectedSplits([]);
      setTransferReference('');
      setSelectedHouse(null);
    },
    onError: (error: any) => {
      toast.error('Erro ao marcar repasse', { description: error.message });
    },
  });

  // Mutation para transferir via PIX automatico
  const pixTransfer = useMutation({
    mutationFn: async ({ houseId, splitIds }: { houseId: string; splitIds: string[] }) => {
      const { data, error } = await supabase.functions.invoke('process-pix-transfer', {
        body: {
          action: 'transfer',
          house_id: houseId,
          split_ids: splitIds,
        },
      });

      if (error) {
        throw new Error('Erro de conexao com o servidor');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Erro na transferencia PIX');
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['portal-pending-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['portal-house-splits'] });
      queryClient.invalidateQueries({ queryKey: ['portal-transfer-history'] });
      queryClient.invalidateQueries({ queryKey: ['portal-transfer-stats'] });
      queryClient.invalidateQueries({ queryKey: ['portal-mp-balance'] });
      toast.success('Transferencia PIX realizada!', {
        description: data.message,
      });
      setShowTransferDialog(false);
      setShowConfirmDialog(false);
      setSelectedSplits([]);
      setSelectedHouse(null);
    },
    onError: (error: any) => {
      toast.error('Erro na transferencia PIX', { description: error.message });
    },
  });

  const handleTransferAll = (mode: 'manual' | 'pix') => {
    if (!houseSplits) return;
    setSelectedSplits(houseSplits.map(s => s.id));
    setTransferMode(mode);
    setShowConfirmDialog(true);
  };

  const handleConfirmTransfer = () => {
    if (selectedSplits.length === 0 || !selectedHouse) return;
    
    if (transferMode === 'pix') {
      pixTransfer.mutate({
        houseId: selectedHouse.house_id,
        splitIds: selectedSplits,
      });
    } else {
      markAsTransferred.mutate({
        splitIds: selectedSplits,
        reference: transferReference || `PIX_${format(new Date(), 'yyyyMMdd_HHmmss')}`,
      });
    }
  };

  const canTransferPix = (house: HouseWithPendingAmount) => {
    // Pode transferir via PIX se: tem chave PIX E nao tem MP conectado
    return house.pix_key && !house.has_mp_connected;
  };

  const hasEnoughBalance = (amount: number) => {
    if (!portalBalance?.available_balance) return false;
    return portalBalance.available_balance >= amount / 100;
  };

  const copyPixKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success('Chave PIX copiada!');
  };

  const filteredHouses = pendingByHouse?.filter(h =>
    h.house_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Repasses</h1>
        <p className="text-muted-foreground">Gerencie os repasses para as casas</p>
      </div>

      {/* Cards de estatisticas */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-yellow-500/10">
                <Clock className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pendente</p>
                <p className="text-xl font-bold">{formatCurrency(stats?.pendingTotal || 0)}</p>
                <p className="text-xs text-muted-foreground">{stats?.pendingCount || 0} pagamentos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-500/10">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Transferido</p>
                <p className="text-xl font-bold">{formatCurrency(stats?.transferredTotal || 0)}</p>
                <p className="text-xs text-muted-foreground">{stats?.completedCount || 0} repasses</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-purple-500/10">
                <TrendingUp className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Comissao Portal</p>
                <p className="text-xl font-bold">{formatCurrency(stats?.portalTotal || 0)}</p>
                <p className="text-xs text-muted-foreground">total retido</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-500/10">
                <Building2 className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Casas</p>
                <p className="text-xl font-bold">{pendingByHouse?.length || 0}</p>
                <p className="text-xs text-muted-foreground">com pendencias</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-[#009ee3]/10">
                <Wallet className="h-5 w-5 text-[#009ee3]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">Saldo MP</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => refetchBalance()}
                    disabled={isLoadingBalance}
                  >
                    <RefreshCw className={`h-3 w-3 ${isLoadingBalance ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
                <p className="text-xl font-bold">
                  {isLoadingBalance ? (
                    <Skeleton className="h-6 w-20" />
                  ) : portalBalance?.available_balance !== undefined ? (
                    formatCurrency(portalBalance.available_balance * 100)
                  ) : (
                    '-'
                  )}
                </p>
                <p className="text-xs text-muted-foreground">disponivel</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="history">Historico</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {/* Busca */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar casa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Lista de casas com pendencias */}
          {isLoadingPending ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : filteredHouses && filteredHouses.length > 0 ? (
            <div className="grid gap-4">
              {filteredHouses.map((house) => (
                <Card key={house.house_id} className="hover:border-primary/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{house.house_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {house.pending_count} pagamento{house.pending_count > 1 ? 's' : ''} pendente{house.pending_count > 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">
                            {formatCurrency(house.pending_amount)}
                          </p>
                          <TooltipProvider>
                            <div className="flex items-center gap-1 justify-end">
                              {house.has_mp_connected ? (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Badge variant="secondary" className="text-xs bg-[#009ee3]/10 text-[#009ee3]">
                                      <Link2 className="h-3 w-3 mr-1" />
                                      MP
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Mercado Pago conectado - Split automatico</p>
                                  </TooltipContent>
                                </Tooltip>
                              ) : house.pix_key ? (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Badge variant="secondary" className="text-xs">
                                      <Zap className="h-3 w-3 mr-1" />
                                      PIX
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Chave PIX: {house.pix_key_type?.toUpperCase()}</p>
                                    <p className="text-xs text-muted-foreground">Transferencia automatica disponivel</p>
                                  </TooltipContent>
                                </Tooltip>
                              ) : (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Badge variant="destructive" className="text-xs">
                                      <AlertTriangle className="h-3 w-3 mr-1" />
                                      Manual
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Sem PIX cadastrado - Repasse manual</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </TooltipProvider>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedHouse(house);
                            setShowTransferDialog(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                <p className="text-lg font-medium">Nenhum repasse pendente!</p>
                <p className="text-muted-foreground">Todas as casas estao em dia.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history">
          {isLoadingHistory ? (
            <Skeleton className="h-64 w-full" />
          ) : transferHistory && transferHistory.length > 0 ? (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Casa</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Referencia</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transferHistory.map((split) => (
                    <TableRow key={split.id}>
                      <TableCell className="font-medium">
                        {(split.houses as any)?.name}
                      </TableCell>
                      <TableCell className="text-green-600 font-medium">
                        {formatCurrency(split.house_amount_cents)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {split.transfer_reference || '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {split.transferred_at
                          ? format(new Date(split.transferred_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Nenhum repasse realizado ainda.
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog de detalhes da casa */}
      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {selectedHouse?.house_name}
            </DialogTitle>
            <DialogDescription>
              Detalhes dos pagamentos pendentes de repasse
            </DialogDescription>
          </DialogHeader>

          {selectedHouse && (
            <div className="space-y-4">
              {/* Info PIX */}
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Chave PIX</p>
                      {selectedHouse.pix_key ? (
                        <>
                          <p className="font-mono font-medium">{selectedHouse.pix_key}</p>
                          <p className="text-xs text-muted-foreground">
                            {selectedHouse.pix_key_type?.toUpperCase()} - {selectedHouse.pix_holder_name}
                          </p>
                        </>
                      ) : (
                        <p className="text-destructive">Nao cadastrada</p>
                      )}
                    </div>
                    {selectedHouse.pix_key && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyPixKey(selectedHouse.pix_key!)}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copiar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Total */}
              <div className="flex items-center justify-between p-4 bg-green-500/10 rounded-lg">
                <span className="font-medium">Total a repassar:</span>
                <span className="text-2xl font-bold text-green-600">
                  {formatCurrency(selectedHouse.pending_amount)}
                </span>
              </div>

              {/* Lista de pagamentos */}
              {isLoadingSplits ? (
                <Skeleton className="h-32 w-full" />
              ) : houseSplits && houseSplits.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {houseSplits.map((split) => (
                    <div
                      key={split.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {(split.pagamentos as any)?.descricao || 'Pagamento'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(split.created_at), "dd/MM/yyyy", { locale: ptBR })}
                          {' - '}
                          <Badge variant="outline" className="text-xs">
                            {split.commission_type}
                          </Badge>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-green-600">
                          {formatCurrency(split.house_amount_cents)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          -{formatCurrency(split.portal_amount_cents)} ({split.commission_percent}%)
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          )}

          <DialogFooter className="gap-2 flex-col sm:flex-row">
            <Button variant="outline" onClick={() => setShowTransferDialog(false)}>
              Fechar
            </Button>
            
            {selectedHouse?.has_mp_connected ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link2 className="h-4 w-4 text-[#009ee3]" />
                Split automatico via MP
              </div>
            ) : selectedHouse?.pix_key ? (
              <>
                <Button 
                  variant="outline"
                  onClick={() => handleTransferAll('manual')}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Marcar Manual
                </Button>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button 
                          onClick={() => handleTransferAll('pix')}
                          disabled={!hasEnoughBalance(selectedHouse.pending_amount)}
                          className="bg-[#009ee3] hover:bg-[#008bcf]"
                        >
                          <Zap className="h-4 w-4 mr-2" />
                          Transferir PIX
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {!hasEnoughBalance(selectedHouse.pending_amount) && (
                      <TooltipContent>
                        <p>Saldo insuficiente no Mercado Pago</p>
                        <p className="text-xs">Necessario: {formatCurrency(selectedHouse.pending_amount)}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              </>
            ) : (
              <Button disabled>
                <AlertTriangle className="h-4 w-4 mr-2" />
                PIX nao cadastrado
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmacao */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {transferMode === 'pix' ? (
                <>
                  <Zap className="h-5 w-5 text-[#009ee3]" />
                  Transferir via PIX
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  Confirmar Repasse Manual
                </>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {transferMode === 'pix' ? (
                <>
                  Sera realizada uma transferencia PIX automatica de{' '}
                  <strong>{formatCurrency(selectedHouse?.pending_amount || 0)}</strong> para{' '}
                  <strong>{selectedHouse?.house_name}</strong>.
                </>
              ) : (
                <>
                  Voce esta marcando {selectedSplits.length} pagamento(s) como transferido(s) para{' '}
                  <strong>{selectedHouse?.house_name}</strong>.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3">
            {transferMode === 'manual' && (
              <div>
                <label className="text-sm font-medium">Referencia do PIX (opcional)</label>
                <Input
                  placeholder="Ex: ID da transacao, comprovante..."
                  value={transferReference}
                  onChange={(e) => setTransferReference(e.target.value)}
                />
              </div>
            )}
            
            {transferMode === 'pix' && selectedHouse && (
              <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Chave PIX:</span>
                  <span className="font-mono">{selectedHouse.pix_key}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tipo:</span>
                  <span>{selectedHouse.pix_key_type?.toUpperCase()}</span>
                </div>
                {selectedHouse.pix_holder_name && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Titular:</span>
                    <span>{selectedHouse.pix_holder_name}</span>
                  </div>
                )}
              </div>
            )}
            
            <div className="p-3 bg-green-500/10 rounded-lg">
              <p className="text-sm text-muted-foreground">Valor total:</p>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(selectedHouse?.pending_amount || 0)}
              </p>
            </div>

            {transferMode === 'pix' && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <AlertTriangle className="h-3 w-3" />
                A transferencia sera processada via API do Mercado Pago
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmTransfer}
              disabled={markAsTransferred.isPending || pixTransfer.isPending}
              className={transferMode === 'pix' ? 'bg-[#009ee3] hover:bg-[#008bcf]' : ''}
            >
              {(markAsTransferred.isPending || pixTransfer.isPending) ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : transferMode === 'pix' ? (
                <Zap className="h-4 w-4 mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              {transferMode === 'pix' ? 'Transferir' : 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PortalRepasses;
