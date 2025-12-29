import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Users,
  Search,
  Shield,
  Building2,
  Calendar,
  MoreVertical,
  Eye,
  Ban,
  CheckCircle,
  Crown,
  Download,
  Mail,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const PortalUsuarios = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Buscar todos os usuários (profiles)
  const { data: users, isLoading } = useQuery({
    queryKey: ['portal-users'],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;

      if (!profiles || profiles.length === 0) return [];

      const userIds = profiles.map(p => p.id);
      
      // Buscar emails, roles e casas em paralelo
      const [emailsRes, rolesRes, ownedHousesRes, memberHousesRes] = await Promise.all([
        supabase.rpc('get_users_emails', { user_ids: userIds }),
        supabase.from('user_roles').select('user_id, role_id, roles(role)').in('user_id', userIds),
        supabase.from('houses').select('id, name, owner_id').in('owner_id', userIds),
        supabase.from('house_members').select('user_id, house_id, role, houses(name)').in('user_id', userIds),
      ]);

      return profiles.map(profile => ({
        ...profile,
        email: emailsRes.data?.find((e: any) => e.id === profile.id)?.email || 'N/A',
        roles: rolesRes.data?.filter((r: any) => r.user_id === profile.id).map((r: any) => r.roles?.role) || [],
        ownedHouse: ownedHousesRes.data?.find(h => h.owner_id === profile.id),
        memberOf: memberHousesRes.data?.filter((m: any) => m.user_id === profile.id) || [],
      }));
    },
    staleTime: 1000 * 60 * 2,
  });

  // Filtrar usuários
  const filteredUsers = useMemo(() => {
    return users?.filter(user => {
      const matchesSearch = !searchTerm || 
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || 
        (roleFilter === 'super_admin' && user.roles?.includes('super_admin')) ||
        (roleFilter === 'owner' && user.ownedHouse) ||
        (roleFilter === 'member' && user.memberOf?.length > 0 && !user.ownedHouse) ||
        (roleFilter === 'user' && !user.ownedHouse && user.memberOf?.length === 0);
      
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  // Contagem por tipo
  const roleCounts = useMemo(() => {
    if (!users) return { all: 0, super_admin: 0, owner: 0, member: 0, user: 0 };
    return {
      all: users.length,
      super_admin: users.filter(u => u.roles?.includes('super_admin')).length,
      owner: users.filter(u => u.ownedHouse).length,
      member: users.filter(u => u.memberOf?.length > 0 && !u.ownedHouse).length,
      user: users.filter(u => !u.ownedHouse && u.memberOf?.length === 0).length,
    };
  }, [users]);

  // Mutation para bloquear/desbloquear usuário
  const toggleBlockMutation = useMutation({
    mutationFn: async ({ id, blocked }: { id: string; blocked: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          bloqueado: blocked,
          bloqueado_em: blocked ? new Date().toISOString() : null,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { blocked }) => {
      queryClient.invalidateQueries({ queryKey: ['portal-users'] });
      toast.success(blocked ? 'Usuário bloqueado!' : 'Usuário desbloqueado!');
    },
    onError: () => toast.error('Erro ao atualizar usuário'),
  });

  // Mutation para adicionar/remover super_admin
  const toggleSuperAdminMutation = useMutation({
    mutationFn: async ({ userId, add }: { userId: string; add: boolean }) => {
      if (add) {
        // Buscar role_id do super_admin
        const { data: role } = await supabase
          .from('roles')
          .select('id')
          .eq('role', 'super_admin')
          .single();
        
        if (!role) throw new Error('Role não encontrada');
        
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role_id: role.id });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId);
        if (error) throw error;
      }
    },
    onSuccess: (_, { add }) => {
      queryClient.invalidateQueries({ queryKey: ['portal-users'] });
      toast.success(add ? 'Super admin adicionado!' : 'Super admin removido!');
    },
    onError: () => toast.error('Erro ao atualizar permissões'),
  });

  // Exportar CSV
  const exportCSV = () => {
    if (!filteredUsers) return;
    
    const headers = ['Nome', 'Email', 'Tipo', 'Casa', 'Bloqueado', 'Cadastro'];
    const rows = filteredUsers.map(u => [
      u.full_name || '',
      u.email || '',
      u.roles?.includes('super_admin') ? 'Super Admin' : u.ownedHouse ? 'Dono de Casa' : u.memberOf?.length > 0 ? 'Membro' : 'Usuário',
      u.ownedHouse?.name || u.memberOf?.[0]?.houses?.name || '',
      u.bloqueado ? 'Sim' : 'Não',
      u.created_at ? format(new Date(u.created_at), 'dd/MM/yyyy') : '',
    ]);
    
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `usuarios-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    toast.success('CSV exportado!');
  };

  const handleViewDetails = (user: any) => {
    setSelectedUser(user);
    setIsDetailOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Usuários</h1>
          <p className="text-muted-foreground">Todos os usuários cadastrados na plataforma</p>
        </div>
        <Button variant="outline" onClick={exportCSV} disabled={!filteredUsers?.length}>
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Tabs de tipo */}
      <Tabs value={roleFilter} onValueChange={setRoleFilter}>
        <TabsList>
          <TabsTrigger value="all" className="gap-2">
            Todos <Badge variant="secondary">{roleCounts.all}</Badge>
          </TabsTrigger>
          <TabsTrigger value="super_admin" className="gap-2">
            Super Admin <Badge variant="secondary">{roleCounts.super_admin}</Badge>
          </TabsTrigger>
          <TabsTrigger value="owner" className="gap-2">
            Donos <Badge variant="secondary">{roleCounts.owner}</Badge>
          </TabsTrigger>
          <TabsTrigger value="member" className="gap-2">
            Membros <Badge variant="secondary">{roleCounts.member}</Badge>
          </TabsTrigger>
          <TabsTrigger value="user" className="gap-2">
            Usuários <Badge variant="secondary">{roleCounts.user}</Badge>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Busca */}
      <Card>
        <CardContent className="pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
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
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : filteredUsers && filteredUsers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Casa</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className={user.bloqueado ? 'bg-red-500/5' : ''}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {user.full_name?.charAt(0)?.toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{user.full_name || 'Sem nome'}</p>
                            {user.bloqueado && <Ban className="h-4 w-4 text-red-500" />}
                          </div>
                          <p className="text-xs text-muted-foreground">{user.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{user.email}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.roles?.includes('super_admin') && (
                          <Badge className="gap-1 bg-purple-500">
                            <Crown className="h-3 w-3" />
                            Super Admin
                          </Badge>
                        )}
                        {user.ownedHouse && (
                          <Badge variant="default" className="gap-1">
                            <Building2 className="h-3 w-3" />
                            Dono
                          </Badge>
                        )}
                        {user.memberOf?.length > 0 && !user.ownedHouse && (
                          <Badge variant="secondary" className="gap-1">
                            <Users className="h-3 w-3" />
                            Membro
                          </Badge>
                        )}
                        {!user.ownedHouse && user.memberOf?.length === 0 && !user.roles?.includes('super_admin') && (
                          <Badge variant="outline">Usuário</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.ownedHouse ? (
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-primary" />
                          <span className="text-sm">{user.ownedHouse.name}</span>
                        </div>
                      ) : user.memberOf?.length > 0 ? (
                        <div className="text-sm text-muted-foreground">
                          {user.memberOf.length} casa(s)
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {user.created_at ? format(new Date(user.created_at), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
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
                          <DropdownMenuItem onClick={() => handleViewDetails(user)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver detalhes
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem onClick={() => window.open(`mailto:${user.email}`)}>
                            <Mail className="h-4 w-4 mr-2" />
                            Enviar email
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem
                            onClick={() => toggleSuperAdminMutation.mutate({ 
                              userId: user.id, 
                              add: !user.roles?.includes('super_admin') 
                            })}
                          >
                            <Crown className="h-4 w-4 mr-2" />
                            {user.roles?.includes('super_admin') ? 'Remover Super Admin' : 'Tornar Super Admin'}
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem
                            onClick={() => toggleBlockMutation.mutate({ id: user.id, blocked: !user.bloqueado })}
                            className={user.bloqueado ? 'text-green-600' : 'text-red-600'}
                          >
                            {user.bloqueado ? (
                              <><CheckCircle className="h-4 w-4 mr-2" />Desbloquear</>
                            ) : (
                              <><Ban className="h-4 w-4 mr-2" />Bloquear</>
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
              <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum usuário encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalhes */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes do Usuário</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedUser.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xl">
                    {selectedUser.full_name?.charAt(0)?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{selectedUser.full_name || 'Sem nome'}</h3>
                  <p className="text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">ID</p>
                  <p className="text-sm font-mono">{selectedUser.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cadastro</p>
                  <p>{selectedUser.created_at ? format(new Date(selectedUser.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={selectedUser.bloqueado ? 'destructive' : 'default'}>
                    {selectedUser.bloqueado ? 'Bloqueado' : 'Ativo'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data Nascimento</p>
                  <p>{selectedUser.birth_date ? format(new Date(selectedUser.birth_date), 'dd/MM/yyyy') : 'N/A'}</p>
                </div>
              </div>

              {selectedUser.ownedHouse && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Casa que administra</p>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                    <Building2 className="h-5 w-5 text-primary" />
                    <span className="font-medium">{selectedUser.ownedHouse.name}</span>
                  </div>
                </div>
              )}

              {selectedUser.memberOf?.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Membro de</p>
                  <div className="space-y-2">
                    {selectedUser.memberOf.map((m: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span>{m.houses?.name}</span>
                        </div>
                        <Badge variant="outline">{m.role}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => window.open(`mailto:${selectedUser.email}`)}>
                  <Mail className="h-4 w-4 mr-2" />
                  Enviar Email
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PortalUsuarios;
