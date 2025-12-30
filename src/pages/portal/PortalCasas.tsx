import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from '@/components/ui/drawer';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Building2,
  Search,
  MoreVertical,
  Eye,
  CheckCircle,
  XCircle,
  ExternalLink,
  MapPin,
  Star,
  Clock,
  Calendar,
  CreditCard,
  AlertTriangle,
  Play,
  Pause,
  RefreshCw,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { getHouseRoute } from '@/constants';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useIsMobile } from '@/hooks/use-mobile';

const statusColors: Record<string, string> = {
  active: 'bg-green-500',
  trial: 'bg-yellow-500',
  suspended: 'bg-orange-500',
  cancelled: 'bg-red-500',
};

const statusLabels: Record<string, string> = {
  active: 'Ativa',
  trial: 'Trial',
  suspended: 'Suspensa',
  cancelled: 'Cancelada',
};

const PortalCasas = () => {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedHouse, setSelectedHouse] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isExtendTrialOpen, setIsExtendTrialOpen] = useState(false);
  const [isChangePlanOpen, setIsChangePlanOpen] = useState(false);
  const [extendDays, setExtendDays] = useState('7');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');

  // Buscar todas as casas
  const { data: houses, isLoading } = useQuery({
    queryKey: ['portal-houses'],
    queryFn: async () => {
      const { data: housesData, error } = await supabase
        .from('houses')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      if (housesData && housesData.length > 0) {
        const ownerIds = [...new Set(housesData.map(h => h.owner_id).filter(Boolean))];
        
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', ownerIds);

        const { data: users } = await supabase.rpc('get_users_emails', { user_ids: ownerIds });

        return housesData.map(house => ({
          ...house,
          owner: {
            full_name: profiles?.find(p => p.id === house.owner_id)?.full_name || 'N/A',
            email: users?.find((u: any) => u.id === house.owner_id)?.email || 'N/A'
          }
        }));
      }

      return housesData || [];
    },
    staleTime: 1000 * 60 * 2,
  });

  // Buscar planos
  const { data: plans } = useQuery({
    queryKey: ['portal-plans-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('house_plans')
        .select('id, name, price_cents, billing_period')
        .eq('active', true)
        .order('price_cents');
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 10,
  });

  // Filtrar casas
  const filteredHouses = useMemo(() => {
    return houses?.filter(house => {
      const matchesSearch = !searchTerm || 
        house.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        house.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        house.owner?.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || house.subscription_status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [houses, searchTerm, statusFilter]);

  // Contagem por status
  const statusCounts = useMemo(() => {
    if (!houses) return { all: 0, active: 0, trial: 0, suspended: 0, cancelled: 0 };
    return {
      all: houses.length,
      active: houses.filter(h => h.subscription_status === 'active').length,
      trial: houses.filter(h => h.subscription_status === 'trial').length,
      suspended: houses.filter(h => h.subscription_status === 'suspended').length,
      cancelled: houses.filter(h => h.subscription_status === 'cancelled').length,
    };
  }, [houses]);

  // Mutation para ativar/desativar casa
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from('houses')
        .update({ active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-houses'] });
      toast.success('Status atualizado!');
    },
    onError: () => toast.error('Erro ao atualizar status'),
  });

  // Mutation para verificar casa
  const verifyMutation = useMutation({
    mutationFn: async ({ id, verified }: { id: string; verified: boolean }) => {
      const { error } = await supabase
        .from('houses')
        .update({ verified, verified_at: verified ? new Date().toISOString() : null })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-houses'] });
      toast.success('Verificação atualizada!');
    },
    onError: () => toast.error('Erro ao atualizar verificação'),
  });

  // Mutation para mudar status de assinatura
  const changeSubscriptionMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { subscription_status: status };
      if (status === 'active') {
        updates.subscription_started_at = new Date().toISOString();
      } else if (status === 'suspended' || status === 'cancelled') {
        updates.subscription_canceled_at = new Date().toISOString();
      }
      const { error } = await supabase.from('houses').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-houses'] });
      queryClient.invalidateQueries({ queryKey: ['portal-dashboard-stats'] });
      toast.success('Status de assinatura atualizado!');
    },
    onError: () => toast.error('Erro ao atualizar assinatura'),
  });

  // Mutation para estender trial
  const extendTrialMutation = useMutation({
    mutationFn: async ({ id, days }: { id: string; days: number }) => {
      const house = houses?.find(h => h.id === id);
      const currentEnd = house?.trial_ends_at ? new Date(house.trial_ends_at) : new Date();
      const newEnd = addDays(currentEnd, days);
      
      const { error } = await supabase
        .from('houses')
        .update({ 
          trial_ends_at: newEnd.toISOString(),
          subscription_status: 'trial'
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-houses'] });
      setIsExtendTrialOpen(false);
      toast.success('Trial estendido!');
    },
    onError: () => toast.error('Erro ao estender trial'),
  });

  // Mutation para mudar plano
  const changePlanMutation = useMutation({
    mutationFn: async ({ id, planId }: { id: string; planId: string }) => {
      const { error } = await supabase
        .from('houses')
        .update({ plan_id: planId })
        .eq('id', id);
      if (error) throw error;

      // Registrar no histórico
      await supabase.from('house_subscription_history').insert({
        house_id: id,
        plan_id: planId,
        action: 'upgraded',
        notes: 'Plano alterado pelo admin do portal',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-houses'] });
      setIsChangePlanOpen(false);
      toast.success('Plano alterado!');
    },
    onError: () => toast.error('Erro ao alterar plano'),
  });

  // Exportar CSV
  const exportCSV = () => {
    if (!filteredHouses) return;
    
    const headers = ['Nome', 'Slug', 'Cidade', 'Estado', 'Status', 'Proprietário', 'Email', 'Criado em'];
    const rows = filteredHouses.map(h => [
      h.name,
      h.slug,
      h.city || '',
      h.state || '',
      statusLabels[h.subscription_status] || h.subscription_status,
      h.owner?.full_name || '',
      h.owner?.email || '',
      h.created_at ? format(new Date(h.created_at), 'dd/MM/yyyy') : '',
    ]);
    
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `casas-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    toast.success('CSV exportado!');
  };

  const handleViewDetails = (house: any) => {
    setSelectedHouse(house);
    setIsDetailOpen(true);
  };

  const handleExtendTrial = (house: any) => {
    setSelectedHouse(house);
    setExtendDays('7');
    setIsExtendTrialOpen(true);
  };

  const handleChangePlan = (house: any) => {
    setSelectedHouse(house);
    setSelectedPlanId(house.plan_id || '');
    setIsChangePlanOpen(true);
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Casas</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Gerencie as casas cadastradas no portal</p>
        </div>
        <Button variant="outline" onClick={exportCSV} disabled={!filteredHouses?.length} className="w-full sm:w-auto">
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Tabs de status */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList className="w-full flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="all" className="gap-1 text-xs sm:text-sm flex-1 sm:flex-none">
            Todas <Badge variant="secondary" className="hidden sm:inline-flex">{statusCounts.all}</Badge>
          </TabsTrigger>
          <TabsTrigger value="active" className="gap-1 text-xs sm:text-sm flex-1 sm:flex-none">
            Ativas <Badge variant="secondary" className="hidden sm:inline-flex">{statusCounts.active}</Badge>
          </TabsTrigger>
          <TabsTrigger value="trial" className="gap-1 text-xs sm:text-sm flex-1 sm:flex-none">
            Trial <Badge variant="secondary" className="hidden sm:inline-flex">{statusCounts.trial}</Badge>
          </TabsTrigger>
          <TabsTrigger value="suspended" className="gap-1 text-xs sm:text-sm flex-1 sm:flex-none">
            Suspensas <Badge variant="secondary" className="hidden sm:inline-flex">{statusCounts.suspended}</Badge>
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="gap-1 text-xs sm:text-sm flex-1 sm:flex-none">
            Canceladas <Badge variant="secondary" className="hidden sm:inline-flex">{statusCounts.cancelled}</Badge>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Busca */}
      <Card>
        <CardContent className="pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, cidade ou email do proprietário..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 sm:p-6 space-y-4">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : filteredHouses && filteredHouses.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Casa</TableHead>
                    <TableHead className="min-w-[120px]">Localização</TableHead>
                    <TableHead className="min-w-[150px] hidden md:table-cell">Proprietário</TableHead>
                    <TableHead className="min-w-[100px]">Assinatura</TableHead>
                    <TableHead className="min-w-[120px] hidden sm:table-cell">Trial/Vencimento</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
              <TableBody>
                {filteredHouses.map((house) => {
                  const isTrialExpired = house.subscription_status === 'trial' && 
                    house.trial_ends_at && new Date(house.trial_ends_at) < new Date();
                  
                  return (
                    <TableRow key={house.id} className={isTrialExpired ? 'bg-red-500/5' : ''}>
                      <TableCell>
                        <div className="flex items-center gap-2 sm:gap-3">
                          {house.logo_url ? (
                            <img src={house.logo_url} alt="" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium truncate">{house.name}</p>
                              {house.verified && (
                                <CheckCircle className="h-4 w-4 text-blue-500 shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">/{house.slug}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">{house.city || 'N/A'}, {house.state || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <p className="text-sm truncate">{house.owner?.full_name || 'N/A'}</p>
                        <p className="text-xs text-muted-foreground truncate">{house.owner?.email}</p>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[house.subscription_status]}>
                          {statusLabels[house.subscription_status] || house.subscription_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {house.subscription_status === 'trial' && house.trial_ends_at ? (
                          <div className={`flex items-center gap-1 text-sm ${isTrialExpired ? 'text-red-500' : ''}`}>
                            <Clock className="h-3 w-3 shrink-0" />
                            <span className="whitespace-nowrap">{isTrialExpired ? 'Vencido ' : 'Vence '}
                            {format(new Date(house.trial_ends_at), 'dd/MM/yyyy', { locale: ptBR })}</span>
                          </div>
                        ) : house.subscription_ends_at ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3 shrink-0" />
                            {format(new Date(house.subscription_ends_at), 'dd/MM/yyyy', { locale: ptBR })}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(house)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to={getHouseRoute(house.slug)} target="_blank">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Abrir página
                              </Link>
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator />
                            
                            {/* Ações de assinatura */}
                            {house.subscription_status === 'trial' && (
                              <DropdownMenuItem onClick={() => handleExtendTrial(house)}>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Estender trial
                              </DropdownMenuItem>
                            )}
                            
                            <DropdownMenuItem onClick={() => handleChangePlan(house)}>
                              <CreditCard className="h-4 w-4 mr-2" />
                              Alterar plano
                            </DropdownMenuItem>
                            
                            {house.subscription_status !== 'active' && (
                              <DropdownMenuItem 
                                onClick={() => changeSubscriptionMutation.mutate({ id: house.id, status: 'active' })}
                              >
                                <Play className="h-4 w-4 mr-2" />
                                Ativar assinatura
                              </DropdownMenuItem>
                            )}
                            
                            {house.subscription_status === 'active' && (
                              <DropdownMenuItem 
                                onClick={() => changeSubscriptionMutation.mutate({ id: house.id, status: 'suspended' })}
                                className="text-orange-600"
                              >
                                <Pause className="h-4 w-4 mr-2" />
                                Suspender
                              </DropdownMenuItem>
                            )}
                            
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuItem
                              onClick={() => verifyMutation.mutate({ id: house.id, verified: !house.verified })}
                            >
                              {house.verified ? (
                                <><XCircle className="h-4 w-4 mr-2" />Remover verificação</>
                              ) : (
                                <><CheckCircle className="h-4 w-4 mr-2" />Verificar casa</>
                              )}
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem
                              onClick={() => toggleActiveMutation.mutate({ id: house.id, active: !house.active })}
                              className={house.active ? 'text-red-600' : 'text-green-600'}
                            >
                              {house.active ? (
                                <><XCircle className="h-4 w-4 mr-2" />Desativar</>
                              ) : (
                                <><CheckCircle className="h-4 w-4 mr-2" />Ativar</>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhuma casa encontrada</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalhes - Responsivo */}
      {isMobile ? (
        <Drawer open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DrawerContent className="max-h-[90vh]">
            <DrawerHeader>
              <DrawerTitle>Detalhes da Casa</DrawerTitle>
            </DrawerHeader>
            {selectedHouse && (
              <div className="px-4 pb-4 space-y-4 overflow-y-auto">
                <div className="flex items-center gap-4">
                  {selectedHouse.logo_url ? (
                    <img src={selectedHouse.logo_url} alt="" className="w-16 h-16 rounded-lg object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-8 w-8 text-primary" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold truncate">{selectedHouse.name}</h3>
                      {selectedHouse.verified && <CheckCircle className="h-5 w-5 text-blue-500 shrink-0" />}
                    </div>
                    <p className="text-muted-foreground text-sm truncate">/{selectedHouse.slug}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Localização</p>
                    <p className="truncate">{selectedHouse.city}, {selectedHouse.state}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Proprietário</p>
                    <p className="truncate">{selectedHouse.owner?.full_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Telefone</p>
                    <p>{selectedHouse.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">WhatsApp</p>
                    <p>{selectedHouse.whatsapp || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <Badge variant={selectedHouse.active ? 'default' : 'secondary'}>
                      {selectedHouse.active ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Assinatura</p>
                    <Badge className={statusColors[selectedHouse.subscription_status]}>
                      {statusLabels[selectedHouse.subscription_status]}
                    </Badge>
                  </div>
                </div>

                <DrawerFooter className="px-0">
                  <Button asChild className="w-full">
                    <Link to={getHouseRoute(selectedHouse.slug)} target="_blank">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Abrir Página
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => { setIsDetailOpen(false); handleExtendTrial(selectedHouse); }}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Estender Trial
                  </Button>
                </DrawerFooter>
              </div>
            )}
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes da Casa</DialogTitle>
            </DialogHeader>
            {selectedHouse && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  {selectedHouse.logo_url ? (
                    <img src={selectedHouse.logo_url} alt="" className="w-20 h-20 rounded-lg object-cover" />
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-10 w-10 text-primary" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-semibold">{selectedHouse.name}</h3>
                      {selectedHouse.verified && <CheckCircle className="h-5 w-5 text-blue-500" />}
                    </div>
                    <p className="text-muted-foreground">/{selectedHouse.slug}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Localização</p>
                    <p>{selectedHouse.city}, {selectedHouse.state}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Proprietário</p>
                    <p>{selectedHouse.owner?.full_name || 'N/A'}</p>
                    <p className="text-xs text-muted-foreground">{selectedHouse.owner?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Telefone</p>
                    <p>{selectedHouse.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">WhatsApp</p>
                    <p>{selectedHouse.whatsapp || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status da Casa</p>
                    <Badge variant={selectedHouse.active ? 'default' : 'secondary'}>
                      {selectedHouse.active ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Assinatura</p>
                    <Badge className={statusColors[selectedHouse.subscription_status]}>
                      {statusLabels[selectedHouse.subscription_status]}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avaliação</p>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{selectedHouse.rating_avg?.toFixed(1) || '0.0'}</span>
                      <span className="text-muted-foreground text-xs">({selectedHouse.rating_count || 0})</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cadastro</p>
                    <p>{selectedHouse.created_at ? format(new Date(selectedHouse.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : 'N/A'}</p>
                  </div>
                </div>

                {selectedHouse.description && (
                  <div>
                    <p className="text-sm text-muted-foreground">Descrição</p>
                    <p className="text-sm">{selectedHouse.description}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button asChild>
                    <Link to={getHouseRoute(selectedHouse.slug)} target="_blank">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Abrir Página
                    </Link>
                  </Button>
                  <Button variant="outline" onClick={() => { setIsDetailOpen(false); handleExtendTrial(selectedHouse); }}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Estender Trial
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Modal Estender Trial - Responsivo */}
      {isMobile ? (
        <Drawer open={isExtendTrialOpen} onOpenChange={setIsExtendTrialOpen}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Estender Trial</DrawerTitle>
              <DrawerDescription>
                Estender o período de trial para {selectedHouse?.name}
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4 space-y-4">
              <div className="space-y-2">
                <Label>Dias para estender</Label>
                <Select value={extendDays} onValueChange={setExtendDays}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 dias</SelectItem>
                    <SelectItem value="7">7 dias</SelectItem>
                    <SelectItem value="14">14 dias</SelectItem>
                    <SelectItem value="30">30 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {selectedHouse?.trial_ends_at && (
                <p className="text-sm text-muted-foreground">
                  Trial atual termina em: {format(new Date(selectedHouse.trial_ends_at), 'dd/MM/yyyy', { locale: ptBR })}
                </p>
              )}
            </div>
            <DrawerFooter>
              <Button 
                onClick={() => extendTrialMutation.mutate({ id: selectedHouse?.id, days: parseInt(extendDays) })}
                disabled={extendTrialMutation.isPending}
                className="w-full"
              >
                {extendTrialMutation.isPending ? 'Estendendo...' : 'Estender'}
              </Button>
              <Button variant="outline" onClick={() => setIsExtendTrialOpen(false)} className="w-full">Cancelar</Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={isExtendTrialOpen} onOpenChange={setIsExtendTrialOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Estender Trial</DialogTitle>
              <DialogDescription>
                Estender o período de trial para {selectedHouse?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Dias para estender</Label>
                <Select value={extendDays} onValueChange={setExtendDays}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 dias</SelectItem>
                    <SelectItem value="7">7 dias</SelectItem>
                    <SelectItem value="14">14 dias</SelectItem>
                    <SelectItem value="30">30 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {selectedHouse?.trial_ends_at && (
                <p className="text-sm text-muted-foreground">
                  Trial atual termina em: {format(new Date(selectedHouse.trial_ends_at), 'dd/MM/yyyy', { locale: ptBR })}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsExtendTrialOpen(false)}>Cancelar</Button>
              <Button 
                onClick={() => extendTrialMutation.mutate({ id: selectedHouse?.id, days: parseInt(extendDays) })}
                disabled={extendTrialMutation.isPending}
              >
                {extendTrialMutation.isPending ? 'Estendendo...' : 'Estender'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal Alterar Plano - Responsivo */}
      {isMobile ? (
        <Drawer open={isChangePlanOpen} onOpenChange={setIsChangePlanOpen}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Alterar Plano</DrawerTitle>
              <DrawerDescription>
                Alterar o plano de {selectedHouse?.name}
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4 space-y-4">
              <div className="space-y-2">
                <Label>Selecione o plano</Label>
                <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um plano" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans?.map(plan => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name} - R$ {(plan.price_cents / 100).toFixed(2)}/{plan.billing_period === 'monthly' ? 'mês' : plan.billing_period === 'quarterly' ? 'trim' : 'ano'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DrawerFooter>
              <Button 
                onClick={() => changePlanMutation.mutate({ id: selectedHouse?.id, planId: selectedPlanId })}
                disabled={changePlanMutation.isPending || !selectedPlanId}
                className="w-full"
              >
                {changePlanMutation.isPending ? 'Alterando...' : 'Alterar Plano'}
              </Button>
              <Button variant="outline" onClick={() => setIsChangePlanOpen(false)} className="w-full">Cancelar</Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={isChangePlanOpen} onOpenChange={setIsChangePlanOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Alterar Plano</DialogTitle>
              <DialogDescription>
                Alterar o plano de {selectedHouse?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Selecione o plano</Label>
                <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um plano" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans?.map(plan => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name} - R$ {(plan.price_cents / 100).toFixed(2)}/{plan.billing_period === 'monthly' ? 'mês' : plan.billing_period === 'quarterly' ? 'trim' : 'ano'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsChangePlanOpen(false)}>Cancelar</Button>
              <Button 
                onClick={() => changePlanMutation.mutate({ id: selectedHouse?.id, planId: selectedPlanId })}
                disabled={changePlanMutation.isPending || !selectedPlanId}
              >
                {changePlanMutation.isPending ? 'Alterando...' : 'Alterar Plano'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default PortalCasas;
