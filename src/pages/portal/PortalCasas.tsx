import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Building2,
  Search,
  MoreVertical,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  ExternalLink,
  MapPin,
  Star,
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { getHouseRoute } from '@/constants';

const PortalCasas = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHouse, setSelectedHouse] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Buscar todas as casas
  const { data: houses, isLoading } = useQuery({
    queryKey: ['portal-houses', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('houses')
        .select('*')
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%`);
      }

      const { data: housesData, error } = await query;
      if (error) throw error;

      // Buscar owners separadamente
      if (housesData && housesData.length > 0) {
        const ownerIds = [...new Set(housesData.map(h => h.owner_id).filter(Boolean))];
        
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', ownerIds);

        const { data: users } = await supabase.rpc('get_users_emails', { user_ids: ownerIds });

        // Mapear owners para as casas
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
  });

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
    onError: () => {
      toast.error('Erro ao atualizar status');
    },
  });

  // Mutation para verificar casa
  const verifyMutation = useMutation({
    mutationFn: async ({ id, verified }: { id: string; verified: boolean }) => {
      const { error } = await supabase
        .from('houses')
        .update({ verified })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-houses'] });
      toast.success('Verificação atualizada!');
    },
    onError: () => {
      toast.error('Erro ao atualizar verificação');
    },
  });

  const handleViewDetails = (house: any) => {
    setSelectedHouse(house);
    setIsDetailOpen(true);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Casas</h1>
          <p className="text-muted-foreground">Gerencie as casas cadastradas no portal</p>
        </div>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou cidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : houses && houses.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Casa</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead>Proprietário</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Avaliação</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {houses.map((house) => (
                  <TableRow key={house.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {house.logo_url ? (
                          <img
                            src={house.logo_url}
                            alt=""
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-primary" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{house.name}</p>
                          <p className="text-xs text-muted-foreground">/{house.slug}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3" />
                        {house.city}, {house.state}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{house.owner?.full_name || 'N/A'}</p>
                      <p className="text-xs text-muted-foreground">{house.owner?.email}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant={house.active ? 'default' : 'secondary'}>
                          {house.active ? 'Ativa' : 'Inativa'}
                        </Badge>
                        {house.verified && (
                          <Badge variant="outline" className="gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Verificada
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{house.rating_avg?.toFixed(1) || '0.0'}</span>
                        <span className="text-muted-foreground text-xs">
                          ({house.rating_count || 0})
                        </span>
                      </div>
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
                          <DropdownMenuItem
                            onClick={() => toggleActiveMutation.mutate({ 
                              id: house.id, 
                              active: !house.active 
                            })}
                          >
                            {house.active ? (
                              <>
                                <XCircle className="h-4 w-4 mr-2" />
                                Desativar
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Ativar
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => verifyMutation.mutate({ 
                              id: house.id, 
                              verified: !house.verified 
                            })}
                          >
                            {house.verified ? (
                              <>
                                <XCircle className="h-4 w-4 mr-2" />
                                Remover verificação
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Verificar casa
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhuma casa encontrada</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalhes */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Casa</DialogTitle>
            <DialogDescription>
              Informações completas sobre a casa
            </DialogDescription>
          </DialogHeader>
          {selectedHouse && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {selectedHouse.logo_url ? (
                  <img
                    src={selectedHouse.logo_url}
                    alt=""
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-10 w-10 text-primary" />
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-semibold">{selectedHouse.name}</h3>
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
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p>{selectedHouse.email || selectedHouse.owner?.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Telefone</p>
                  <p>{selectedHouse.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={selectedHouse.active ? 'default' : 'secondary'}>
                    {selectedHouse.active ? 'Ativa' : 'Inativa'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Assinatura</p>
                  <Badge variant="outline">{selectedHouse.subscription_status}</Badge>
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
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PortalCasas;
