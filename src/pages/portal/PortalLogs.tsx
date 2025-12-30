import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Activity,
  Search,
  Filter,
  User,
  Building2,
  Calendar,
  Clock,
  Shield,
  FileText,
  Settings,
  CreditCard,
  Users,
  Image,
  BookOpen,
  RefreshCw,
} from 'lucide-react';

const entityIcons: Record<string, typeof Activity> = {
  house: Building2,
  user: User,
  cerimonia: Calendar,
  curso: BookOpen,
  produto: CreditCard,
  galeria: Image,
  depoimento: FileText,
  permissao: Shield,
  settings: Settings,
  member: Users,
};

const actionColors: Record<string, string> = {
  create: 'bg-green-500',
  update: 'bg-blue-500',
  delete: 'bg-red-500',
  login: 'bg-purple-500',
  logout: 'bg-gray-500',
  approve: 'bg-green-500',
  reject: 'bg-red-500',
  invite: 'bg-blue-500',
  block: 'bg-orange-500',
  unblock: 'bg-green-500',
};

const PortalLogs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [limit, setLimit] = useState(50);

  // Buscar logs de atividade
  const { data: logs, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['portal-activity-logs', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select(`
          id,
          house_id,
          user_id,
          action,
          entity_type,
          entity_id,
          details,
          ip_address,
          user_agent,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 1, // 1 minuto
  });

  // Buscar casas para mapear IDs
  const { data: housesMap } = useQuery({
    queryKey: ['portal-houses-map'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('houses')
        .select('id, name, slug');
      if (error) throw error;
      return new Map(data.map(h => [h.id, h]));
    },
    staleTime: 1000 * 60 * 5,
  });

  // Buscar emails dos usuários
  const { data: usersMap } = useQuery({
    queryKey: ['portal-users-emails-logs'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_users_emails');
      if (error) throw error;
      return new Map((data as { id: string; email: string }[]).map(u => [u.id, u.email]));
    },
    staleTime: 1000 * 60 * 5,
  });

  // Filtrar logs - memoizado
  const filteredLogs = useMemo(() => {
    return logs?.filter(log => {
      const house = housesMap?.get(log.house_id);
      const userEmail = usersMap?.get(log.user_id);
      
      const matchesSearch = 
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entity_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        house?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        userEmail?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesEntity = entityFilter === 'all' || log.entity_type === entityFilter;
      
      return matchesSearch && matchesEntity;
    });
  }, [logs, housesMap, usersMap, searchTerm, entityFilter]);

  // Tipos de entidade únicos para o filtro - memoizado
  const entityTypes = useMemo(() => 
    [...new Set(logs?.map(l => l.entity_type) || [])],
    [logs]
  );

  const formatDetails = (details: Record<string, unknown> | null) => {
    if (!details || Object.keys(details).length === 0) return null;
    
    // Mostrar apenas campos relevantes
    const relevantKeys = ['nome', 'name', 'email', 'status', 'role', 'old_value', 'new_value'];
    const filtered = Object.entries(details)
      .filter(([key]) => relevantKeys.some(k => key.toLowerCase().includes(k)))
      .slice(0, 3);
    
    if (filtered.length === 0) return null;
    
    return filtered.map(([key, value]) => (
      <span key={key} className="text-xs">
        {key}: <span className="font-medium">{String(value)}</span>
      </span>
    ));
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Logs de Atividade</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Auditoria de ações no sistema</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => refetch()}
          disabled={isFetching}
          className="w-full sm:w-auto"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger className="flex-1 sm:w-[140px]">
                  <Filter className="h-4 w-4 mr-2 shrink-0" />
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {entityTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={String(limit)} onValueChange={(v) => setLimit(Number(v))}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Limite" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="200">200</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de logs */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Activity className="h-4 w-4 sm:h-5 sm:w-5" />
            Atividades Recentes
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {filteredLogs?.length || 0} registro(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 sm:h-20 w-full" />
              ))}
            </div>
          ) : filteredLogs?.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <Activity className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-sm sm:text-base">Nenhum log de atividade encontrado</p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {filteredLogs?.map((log) => {
                const house = housesMap?.get(log.house_id);
                const userEmail = usersMap?.get(log.user_id);
                const IconComponent = entityIcons[log.entity_type] || Activity;
                const actionColor = actionColors[log.action] || 'bg-gray-500';

                return (
                  <div 
                    key={log.id} 
                    className="flex items-start gap-2 sm:gap-4 p-3 sm:p-4 rounded-lg bg-muted/50"
                  >
                    <div className={`p-1.5 sm:p-2 rounded-full ${actionColor}/10 shrink-0`}>
                      <IconComponent className={`h-3 w-3 sm:h-4 sm:w-4 ${actionColor.replace('bg-', 'text-')}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                        <Badge variant="outline" className="text-[10px] sm:text-xs">
                          {log.action}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px] sm:text-xs">
                          {log.entity_type}
                        </Badge>
                      </div>
                      
                      <div className="mt-1 text-xs sm:text-sm flex flex-wrap gap-x-2 gap-y-1">
                        {userEmail && (
                          <span className="text-muted-foreground truncate max-w-[150px] sm:max-w-none">
                            <User className="h-3 w-3 inline mr-1" />
                            {userEmail}
                          </span>
                        )}
                        {house && (
                          <span className="text-muted-foreground truncate max-w-[100px] sm:max-w-none">
                            <Building2 className="h-3 w-3 inline mr-1" />
                            {house.name}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap text-right shrink-0">
                      <div className="flex items-center gap-1 justify-end">
                        <Calendar className="h-3 w-3 hidden sm:inline" />
                        {new Date(log.created_at).toLocaleDateString('pt-BR')}
                      </div>
                      <div className="flex items-center gap-1 mt-1 justify-end">
                        <Clock className="h-3 w-3 hidden sm:inline" />
                        {new Date(log.created_at).toLocaleTimeString('pt-BR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PortalLogs;
