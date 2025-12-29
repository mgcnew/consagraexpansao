import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Building2,
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertTriangle,
  Activity,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const formatCurrency = (cents: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100);
};

const PortalDashboard = () => {
  // Estatísticas gerais
  const { data: stats, isLoading } = useQuery({
    queryKey: ['portal-dashboard-stats'],
    queryFn: async () => {
      const [housesRes, usersRes, cerimoniasRes, plansRes] = await Promise.all([
        supabase.from('houses').select('id, subscription_status, plan_id, trial_ends_at, created_at'),
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('cerimonias').select('id', { count: 'exact' }).gte('data', new Date().toISOString().split('T')[0]),
        supabase.from('house_plans').select('id, price_cents, billing_period').eq('active', true),
      ]);

      const houses = housesRes.data || [];
      const plans = new Map(plansRes.data?.map(p => [p.id, p]) || []);
      
      // Contagens por status
      const byStatus = {
        active: houses.filter(h => h.subscription_status === 'active'),
        trial: houses.filter(h => h.subscription_status === 'trial'),
        suspended: houses.filter(h => h.subscription_status === 'suspended'),
        cancelled: houses.filter(h => h.subscription_status === 'cancelled'),
      };

      // MRR
      let mrrCents = 0;
      byStatus.active.forEach(house => {
        const plan = plans.get(house.plan_id);
        if (plan) {
          const monthlyValue = plan.billing_period === 'monthly' 
            ? plan.price_cents 
            : plan.billing_period === 'quarterly'
              ? plan.price_cents / 3
              : plan.price_cents / 12;
          mrrCents += monthlyValue;
        }
      });

      // Trials vencendo em 7 dias
      const now = new Date();
      const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const trialsExpiringSoon = byStatus.trial.filter(h => {
        if (!h.trial_ends_at) return false;
        const trialEnd = new Date(h.trial_ends_at);
        return trialEnd >= now && trialEnd <= in7Days;
      });

      // Casas criadas este mês
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const newThisMonth = houses.filter(h => new Date(h.created_at) >= startOfMonth);

      // Taxa de conversão
      const trialsExpired = byStatus.trial.filter(h => {
        if (!h.trial_ends_at) return false;
        return new Date(h.trial_ends_at) < now;
      });
      const totalPastTrial = byStatus.active.length + byStatus.suspended.length + byStatus.cancelled.length + trialsExpired.length;
      const conversionRate = totalPastTrial > 0 ? (byStatus.active.length / totalPastTrial) * 100 : 0;

      return {
        totalHouses: houses.length,
        byStatus,
        totalUsers: usersRes.count || 0,
        upcomingCerimonias: cerimoniasRes.count || 0,
        mrrCents,
        trialsExpiringSoon: trialsExpiringSoon.length,
        newThisMonth: newThisMonth.length,
        conversionRate,
      };
    },
  });

  // Últimas casas cadastradas
  const { data: recentHouses } = useQuery({
    queryKey: ['portal-recent-houses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('houses')
        .select('id, name, slug, city, state, created_at, subscription_status')
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  // Últimos logs de atividade
  const { data: recentLogs } = useQuery({
    queryKey: ['portal-recent-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('id, action, entity_type, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do portal Ahoo</p>
      </div>

      {/* Cards principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">MRR</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-24 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(stats?.mrrCents || 0)}
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
                <p className="text-sm text-muted-foreground">Casas Ativas</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold">{stats?.byStatus.active.length || 0}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  de {stats?.totalHouses || 0} total
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-500/10">
                <Building2 className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Usuários</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold">{stats?.totalUsers || 0}</p>
                )}
              </div>
              <div className="p-3 rounded-full bg-purple-500/10">
                <Users className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Conversão</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold">{stats?.conversionRate.toFixed(0) || 0}%</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">trial → pagante</p>
              </div>
              <div className="p-3 rounded-full bg-orange-500/10">
                <TrendingUp className="h-6 w-6 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas e métricas secundárias */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Trials vencendo */}
        <Link to="/portal/financeiro">
          <Card className={`cursor-pointer hover:border-yellow-500/50 transition-colors ${stats?.trialsExpiringSoon ? 'border-yellow-500/30' : ''}`}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-yellow-500/10">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Trials Vencendo</p>
                  {isLoading ? (
                    <Skeleton className="h-6 w-8" />
                  ) : (
                    <p className="text-xl font-bold">{stats?.trialsExpiringSoon || 0}</p>
                  )}
                  <p className="text-xs text-muted-foreground">próximos 7 dias</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Novas este mês */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-500/10">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Novas Este Mês</p>
                {isLoading ? (
                  <Skeleton className="h-6 w-8" />
                ) : (
                  <p className="text-xl font-bold">{stats?.newThisMonth || 0}</p>
                )}
                <p className="text-xs text-muted-foreground">casas cadastradas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cerimônias agendadas */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-purple-500/10">
                <Calendar className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cerimônias</p>
                {isLoading ? (
                  <Skeleton className="h-6 w-8" />
                ) : (
                  <p className="text-xl font-bold">{stats?.upcomingCerimonias || 0}</p>
                )}
                <p className="text-xs text-muted-foreground">agendadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status das casas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Status das Casas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-full" />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 min-w-[100px]">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Ativas</span>
                </div>
                <Progress 
                  value={(stats?.byStatus.active.length || 0) / (stats?.totalHouses || 1) * 100} 
                  className="flex-1 h-2"
                />
                <span className="text-sm font-medium w-8">{stats?.byStatus.active.length || 0}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 min-w-[100px]">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">Trial</span>
                </div>
                <Progress 
                  value={(stats?.byStatus.trial.length || 0) / (stats?.totalHouses || 1) * 100} 
                  className="flex-1 h-2"
                />
                <span className="text-sm font-medium w-8">{stats?.byStatus.trial.length || 0}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 min-w-[100px]">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <span className="text-sm">Suspensas</span>
                </div>
                <Progress 
                  value={(stats?.byStatus.suspended.length || 0) / (stats?.totalHouses || 1) * 100} 
                  className="flex-1 h-2"
                />
                <span className="text-sm font-medium w-8">{stats?.byStatus.suspended.length || 0}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 min-w-[100px]">
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  <span className="text-sm">Canceladas</span>
                </div>
                <Progress 
                  value={(stats?.byStatus.cancelled.length || 0) / (stats?.totalHouses || 1) * 100} 
                  className="flex-1 h-2"
                />
                <span className="text-sm font-medium w-8">{stats?.byStatus.cancelled.length || 0}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grid de casas recentes e logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Casas Recentes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Casas Recentes
            </CardTitle>
            <Link to="/portal/casas" className="text-sm text-primary hover:underline">
              Ver todas
            </Link>
          </CardHeader>
          <CardContent>
            {recentHouses && recentHouses.length > 0 ? (
              <div className="space-y-3">
                {recentHouses.map((house) => (
                  <div key={house.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">{house.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {house.city}, {house.state}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant="secondary"
                        className={
                          house.subscription_status === 'active' ? 'bg-green-500/10 text-green-600' :
                          house.subscription_status === 'trial' ? 'bg-yellow-500/10 text-yellow-600' :
                          'bg-gray-500/10 text-gray-600'
                        }
                      >
                        {house.subscription_status === 'active' ? 'Ativa' : 
                         house.subscription_status === 'trial' ? 'Trial' : house.subscription_status}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(house.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma casa cadastrada ainda.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Atividade Recente */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Atividade Recente
            </CardTitle>
            <Link to="/portal/logs" className="text-sm text-primary hover:underline">
              Ver todos
            </Link>
          </CardHeader>
          <CardContent>
            {recentLogs && recentLogs.length > 0 ? (
              <div className="space-y-3">
                {recentLogs.map((log) => (
                  <div key={log.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{log.action}</Badge>
                        <Badge variant="secondary" className="text-xs">{log.entity_type}</Badge>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma atividade registrada ainda.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PortalDashboard;
