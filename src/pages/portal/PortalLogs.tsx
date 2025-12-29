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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Logs de Atividade</h1>
          <p className="text-muted-foreground">Auditoria de ações no sistema</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por ação, entidade, casa ou usuário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {entityTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={String(limit)} onValueChange={(v) => setLimit(Number(v))}>
              <SelectTrigger className="w-full sm:w-[120px]">
                <SelectValue placeholder="Limite" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25 logs</SelectItem>
                <SelectItem value="50">50 logs</SelectItem>
                <SelectItem value="100">100 logs</SelectItem>
                <SelectItem value="200">200 logs</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de logs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Atividades Recentes
          </CardTitle>
          <CardDescription>
            {filteredLogs?.length || 0} registro(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : filteredLogs?.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum log de atividade encontrado</p>
              <p className="text-sm text-muted-foreground mt-1">
                Os logs serão registrados conforme ações forem realizadas no sistema
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLogs?.map((log) => {
                const house = housesMap?.get(log.house_id);
                const userEmail = usersMap?.get(log.user_id);
                const IconComponent = entityIcons[log.entity_type] || Activity;
                const actionColor = actionColors[log.action] || 'bg-gray-500';
                const details = formatDetails(log.details as Record<string, unknown>);

                return (
                  <div 
                    key={log.id} 
                    className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
                  >
                    <div className={`p-2 rounded-full ${actionColor}/10`}>
                      <IconComponent className={`h-4 w-4 ${actionColor.replace('bg-', 'text-')}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {log.action}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {log.entity_type}
                        </Badge>
                      </div>
                      
                      <div className="mt-1 text-sm">
                        {userEmail && (
                          <span className="text-muted-foreground">
                            <User className="h-3 w-3 inline mr-1" />
                            {userEmail}
                          </span>
                        )}
                        {house && (
                          <span className="text-muted-foreground ml-3">
                            <Building2 className="h-3 w-3 inline mr-1" />
                            {house.name}
                          </span>
                        )}
                      </div>
                      
                      {details && (
                        <div className="mt-1 flex flex-wrap gap-2 text-muted-foreground">
                          {details}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right text-xs text-muted-foreground whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(log.created_at).toLocaleDateString('pt-BR')}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
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
