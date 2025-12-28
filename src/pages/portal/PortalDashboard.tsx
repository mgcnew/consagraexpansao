import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Building2,
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

const PortalDashboard = () => {
  // Estatísticas gerais
  const { data: stats, isLoading } = useQuery({
    queryKey: ['portal-stats'],
    queryFn: async () => {
      const [housesRes, usersRes, cerimoniasRes] = await Promise.all([
        supabase.from('houses').select('id, subscription_status', { count: 'exact' }),
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('cerimonias').select('id', { count: 'exact' }).gte('data', new Date().toISOString().split('T')[0]),
      ]);

      const activeHouses = housesRes.data?.filter(h => h.subscription_status === 'active').length || 0;

      return {
        totalHouses: housesRes.count || 0,
        activeHouses,
        totalUsers: usersRes.count || 0,
        upcomingCerimonias: cerimoniasRes.count || 0,
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

  const statCards = [
    {
      title: 'Total de Casas',
      value: stats?.totalHouses || 0,
      icon: Building2,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Casas Ativas',
      value: stats?.activeHouses || 0,
      icon: TrendingUp,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Usuários',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Cerimônias Agendadas',
      value: stats?.upcomingCerimonias || 0,
      icon: Calendar,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do portal Ahoo</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16 mt-1" />
                  ) : (
                    <p className="text-3xl font-bold">{stat.value}</p>
                  )}
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Houses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Casas Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentHouses && recentHouses.length > 0 ? (
            <div className="space-y-4">
              {recentHouses.map((house) => (
                <div key={house.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">{house.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {house.city}, {house.state}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      house.subscription_status === 'active' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {house.subscription_status === 'active' ? 'Ativa' : 'Pendente'}
                    </span>
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
    </div>
  );
};

export default PortalDashboard;
