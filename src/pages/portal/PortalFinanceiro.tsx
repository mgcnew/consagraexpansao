import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Building2,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  CreditCard,
} from 'lucide-react';

// Formatar valor em centavos para reais
const formatCurrency = (cents: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100);
};

const PortalFinanceiro = () => {
  // Buscar casas com planos e status de assinatura
  const { data: housesData, isLoading: loadingHouses } = useQuery({
    queryKey: ['portal-financeiro-houses'],
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
          plan_id,
          created_at
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Buscar planos
  const { data: plansData, isLoading: loadingPlans } = useQuery({
    queryKey: ['portal-financeiro-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('house_plans')
        .select('*')
        .eq('active', true);
      if (error) throw error;
      return data;
    },
  });

  // Calcular métricas financeiras
  const metrics = (() => {
    if (!housesData || !plansData) return null;

    const plansMap = new Map(plansData.map(p => [p.id, p]));
    
    // Casas por status
    const byStatus = {
      trial: housesData.filter(h => h.subscription_status === 'trial'),
      active: housesData.filter(h => h.subscription_status === 'active'),
      suspended: housesData.filter(h => h.subscription_status === 'suspended'),
      cancelled: housesData.filter(h => h.subscription_status === 'cancelled'),
    };

    // MRR (Monthly Recurring Revenue) - apenas casas ativas
    let mrrCents = 0;
    const revenueByPeriod = { monthly: 0, quarterly: 0, yearly: 0 };
    
    byStatus.active.forEach(house => {
      const plan = plansMap.get(house.plan_id);
      if (plan) {
        const monthlyValue = plan.billing_period === 'monthly' 
          ? plan.price_cents 
          : plan.billing_period === 'quarterly'
            ? plan.price_cents / 3
            : plan.price_cents / 12;
        
        mrrCents += monthlyValue;
        revenueByPeriod[plan.billing_period as keyof typeof revenueByPeriod] += plan.price_cents;
      }
    });

    // ARR (Annual Recurring Revenue)
    const arrCents = mrrCents * 12;

    // Trials prestes a vencer (próximos 7 dias)
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const trialsExpiringSoon = byStatus.trial.filter(h => {
      if (!h.trial_ends_at) return false;
      const trialEnd = new Date(h.trial_ends_at);
      return trialEnd >= now && trialEnd <= in7Days;
    });

    // Trials vencidos
    const trialsExpired = byStatus.trial.filter(h => {
      if (!h.trial_ends_at) return false;
      return new Date(h.trial_ends_at) < now;
    });

    // Taxa de conversão (casas ativas / total de casas que já passaram do trial)
    const totalPastTrial = byStatus.active.length + byStatus.suspended.length + byStatus.cancelled.length + trialsExpired.length;
    const conversionRate = totalPastTrial > 0 ? (byStatus.active.length / totalPastTrial) * 100 : 0;

    return {
      mrrCents,
      arrCents,
      revenueByPeriod,
      byStatus,
      trialsExpiringSoon,
      trialsExpired,
      conversionRate,
      totalHouses: housesData.length,
    };
  })();

  const isLoading = loadingHouses || loadingPlans;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Financeiro</h1>
        <p className="text-muted-foreground">Visão geral de receitas e assinaturas</p>
      </div>

      {/* Cards principais de receita */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">MRR</p>
                <p className="text-xs text-muted-foreground mb-1">Receita Mensal Recorrente</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(metrics?.mrrCents || 0)}
                  </p>
                )}
              </div>
              <div className="p-3 rounded-full bg-green-500/10">
                <DollarSign className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ARR</p>
                <p className="text-xs text-muted-foreground mb-1">Receita Anual Recorrente</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(metrics?.arrCents || 0)}
                  </p>
                )}
              </div>
              <div className="p-3 rounded-full bg-blue-500/10">
                <TrendingUp className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Casas Ativas</p>
                <p className="text-xs text-muted-foreground mb-1">Pagando assinatura</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold">{metrics?.byStatus.active.length || 0}</p>
                )}
              </div>
              <div className="p-3 rounded-full bg-purple-500/10">
                <CheckCircle className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa Conversão</p>
                <p className="text-xs text-muted-foreground mb-1">Trial → Pagante</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold">{metrics?.conversionRate.toFixed(1) || 0}%</p>
                )}
              </div>
              <div className="p-3 rounded-full bg-orange-500/10">
                <TrendingUp className="h-6 w-6 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs com detalhes */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="trials">
            Trials
            {metrics && metrics.trialsExpiringSoon.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {metrics.trialsExpiringSoon.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="subscriptions">Assinaturas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Receita por período */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Receita por Período de Cobrança
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <span>Mensal</span>
                      <span className="font-semibold">{formatCurrency(metrics?.revenueByPeriod.monthly || 0)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <span>Trimestral</span>
                      <span className="font-semibold">{formatCurrency(metrics?.revenueByPeriod.quarterly || 0)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <span>Anual</span>
                      <span className="font-semibold">{formatCurrency(metrics?.revenueByPeriod.yearly || 0)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Status das casas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Status das Casas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Ativas</span>
                      </div>
                      <span className="font-semibold">{metrics?.byStatus.active.length || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/10">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        <span>Em Trial</span>
                      </div>
                      <span className="font-semibold">{metrics?.byStatus.trial.length || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-orange-500/10">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        <span>Suspensas</span>
                      </div>
                      <span className="font-semibold">{metrics?.byStatus.suspended.length || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10">
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-red-600" />
                        <span>Canceladas</span>
                      </div>
                      <span className="font-semibold">{metrics?.byStatus.cancelled.length || 0}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trials" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Trials vencendo em breve */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Trials Vencendo (7 dias)
                </CardTitle>
                <CardDescription>Casas que precisam converter em breve</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-32 w-full" />
                ) : metrics?.trialsExpiringSoon.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum trial vencendo nos próximos 7 dias
                  </p>
                ) : (
                  <div className="space-y-2">
                    {metrics?.trialsExpiringSoon.map(house => (
                      <div key={house.id} className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                        <div>
                          <p className="font-medium">{house.name}</p>
                          <p className="text-xs text-muted-foreground">/{house.slug}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="text-yellow-600 border-yellow-500">
                            {new Date(house.trial_ends_at!).toLocaleDateString('pt-BR')}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Trials vencidos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-red-500" />
                  Trials Vencidos
                </CardTitle>
                <CardDescription>Casas com trial expirado sem conversão</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-32 w-full" />
                ) : metrics?.trialsExpired.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum trial vencido
                  </p>
                ) : (
                  <div className="space-y-2">
                    {metrics?.trialsExpired.map(house => (
                      <div key={house.id} className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                        <div>
                          <p className="font-medium">{house.name}</p>
                          <p className="text-xs text-muted-foreground">/{house.slug}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="text-red-600 border-red-500">
                            Venceu {new Date(house.trial_ends_at!).toLocaleDateString('pt-BR')}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Casas com Assinatura Ativa</CardTitle>
              <CardDescription>Detalhes das assinaturas pagantes</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : metrics?.byStatus.active.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma casa com assinatura ativa ainda
                </p>
              ) : (
                <div className="space-y-2">
                  {metrics?.byStatus.active.map(house => {
                    const plan = plansData?.find(p => p.id === house.plan_id);
                    return (
                      <div key={house.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-medium">{house.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Desde {house.subscription_started_at 
                              ? new Date(house.subscription_started_at).toLocaleDateString('pt-BR')
                              : 'N/A'}
                          </p>
                        </div>
                        <div className="text-right">
                          {plan && (
                            <>
                              <p className="font-semibold text-green-600">{formatCurrency(plan.price_cents)}</p>
                              <Badge variant="secondary" className="text-xs">
                                {plan.billing_period === 'monthly' ? 'Mensal' : 
                                 plan.billing_period === 'quarterly' ? 'Trimestral' : 'Anual'}
                              </Badge>
                            </>
                          )}
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

export default PortalFinanceiro;
