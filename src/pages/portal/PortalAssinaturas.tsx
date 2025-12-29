import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CreditCard,
  Search,
  Building2,
  History,
  Filter,
} from 'lucide-react';

// Memoizar formatador
const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const formatCurrency = (cents: number) => currencyFormatter.format(cents / 100);

const formatDate = (date: string | null) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('pt-BR');
};

const actionLabels: Record<string, { label: string; color: string }> = {
  created: { label: 'Criada', color: 'bg-blue-500' },
  upgraded: { label: 'Upgrade', color: 'bg-green-500' },
  downgraded: { label: 'Downgrade', color: 'bg-yellow-500' },
  canceled: { label: 'Cancelada', color: 'bg-red-500' },
  reactivated: { label: 'Reativada', color: 'bg-purple-500' },
  renewed: { label: 'Renovada', color: 'bg-green-500' },
  trial_started: { label: 'Trial Iniciado', color: 'bg-blue-500' },
  trial_ended: { label: 'Trial Encerrado', color: 'bg-orange-500' },
};

const PortalAssinaturas = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Buscar casas com dados de assinatura
  const { data: subscriptions, isLoading: loadingSubs } = useQuery({
    queryKey: ['portal-subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('houses')
        .select(`
          id,
          name,
          slug,
          subscription_status,
          trial_ends_at,
          subscription_started_at,
          subscription_ends_at,
          subscription_canceled_at,
          plan_id,
          created_at
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 2,
  });

  // Buscar planos
  const { data: plans } = useQuery({
    queryKey: ['portal-plans-map'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('house_plans')
        .select('id, name, price_cents, billing_period');
      if (error) throw error;
      return new Map(data.map(p => [p.id, p]));
    },
    staleTime: 1000 * 60 * 10,
  });

  // Buscar histórico de assinaturas
  const { data: history, isLoading: loadingHistory } = useQuery({
    queryKey: ['portal-subscription-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('house_subscription_history')
        .select(`
          id,
          house_id,
          plan_id,
          action,
          previous_plan_id,
          amount_cents,
          proration_credit_cents,
          notes,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 2,
  });

  // Filtrar assinaturas - memoizado
  const filteredSubscriptions = useMemo(() => {
    return subscriptions?.filter(sub => {
      const matchesSearch = sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           sub.slug.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || sub.subscription_status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [subscriptions, searchTerm, statusFilter]);

  // Mapa de casas para o histórico - memoizado
  const housesMap = useMemo(() => 
    new Map(subscriptions?.map(h => [h.id, h]) || []),
    [subscriptions]
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Assinaturas</h1>
        <p className="text-muted-foreground">Gerencie as assinaturas das casas</p>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Assinaturas
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome ou slug..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Ativas</SelectItem>
                    <SelectItem value="trial">Em Trial</SelectItem>
                    <SelectItem value="suspended">Suspensas</SelectItem>
                    <SelectItem value="cancelled">Canceladas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de assinaturas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Lista de Assinaturas</CardTitle>
              <CardDescription>
                {filteredSubscriptions?.length || 0} assinatura(s) encontrada(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSubs ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Casa</TableHead>
                        <TableHead>Plano</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Início</TableHead>
                        <TableHead>Vencimento</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSubscriptions?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            Nenhuma assinatura encontrada
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredSubscriptions?.map((sub) => {
                          const plan = plans?.get(sub.plan_id);
                          return (
                            <TableRow key={sub.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Building2 className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <p className="font-medium">{sub.name}</p>
                                    <p className="text-xs text-muted-foreground">/{sub.slug}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                {plan ? (
                                  <div>
                                    <p className="font-medium">{plan.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {plan.billing_period === 'monthly' ? 'Mensal' :
                                       plan.billing_period === 'quarterly' ? 'Trimestral' : 'Anual'}
                                    </p>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={sub.subscription_status === 'active' ? 'default' : 'secondary'}
                                  className={
                                    sub.subscription_status === 'active' ? 'bg-green-500' :
                                    sub.subscription_status === 'trial' ? 'bg-yellow-500' :
                                    sub.subscription_status === 'suspended' ? 'bg-orange-500' :
                                    'bg-red-500'
                                  }
                                >
                                  {sub.subscription_status === 'active' ? 'Ativa' :
                                   sub.subscription_status === 'trial' ? 'Trial' :
                                   sub.subscription_status === 'suspended' ? 'Suspensa' : 'Cancelada'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {plan ? (
                                  <span className="font-medium text-green-600">
                                    {formatCurrency(plan.price_cents)}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {sub.subscription_status === 'trial' ? (
                                  <span className="text-muted-foreground">Trial</span>
                                ) : (
                                  formatDate(sub.subscription_started_at)
                                )}
                              </TableCell>
                              <TableCell>
                                {sub.subscription_status === 'trial' ? (
                                  <span className={new Date(sub.trial_ends_at!) < new Date() ? 'text-red-500' : ''}>
                                    {formatDate(sub.trial_ends_at)}
                                  </span>
                                ) : sub.subscription_ends_at ? (
                                  formatDate(sub.subscription_ends_at)
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="h-5 w-5" />
                Histórico de Alterações
              </CardTitle>
              <CardDescription>
                Últimas 50 alterações em assinaturas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingHistory ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : history?.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum histórico de alterações ainda
                </p>
              ) : (
                <div className="space-y-3">
                  {history?.map((item) => {
                    const house = housesMap.get(item.house_id);
                    const plan = plans?.get(item.plan_id);
                    const previousPlan = item.previous_plan_id ? plans?.get(item.previous_plan_id) : null;
                    const actionInfo = actionLabels[item.action] || { label: item.action, color: 'bg-gray-500' };

                    return (
                      <div key={item.id} className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                        <div className={`w-2 h-2 rounded-full mt-2 ${actionInfo.color}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{house?.name || 'Casa removida'}</span>
                            <Badge variant="outline">{actionInfo.label}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {item.action === 'upgraded' || item.action === 'downgraded' ? (
                              <span>
                                {previousPlan?.name || 'Plano anterior'} → {plan?.name || 'Novo plano'}
                              </span>
                            ) : plan ? (
                              <span>Plano: {plan.name}</span>
                            ) : null}
                            {item.amount_cents && item.amount_cents > 0 && (
                              <span className="ml-2">• {formatCurrency(item.amount_cents)}</span>
                            )}
                          </div>
                          {item.notes && (
                            <p className="text-sm text-muted-foreground mt-1 italic">
                              "{item.notes}"
                            </p>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(item.created_at).toLocaleDateString('pt-BR')}
                          <br />
                          {new Date(item.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PortalAssinaturas;
