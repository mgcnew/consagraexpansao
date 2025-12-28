import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Shield, Key, Users, Settings, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useActiveHouse } from '@/hooks/useActiveHouse';
import { useAuth } from '@/contexts/AuthContext';
import {
  usePermissoesDisponiveis,
  useTodasPermissoesUsuarios,
  useConcederPermissao,
  useRevogarPermissao,
  type Permissao,
} from '@/hooks/queries';

interface HouseUser {
  id: string;
  full_name: string | null;
  email: string | null;
  isOwner?: boolean;
}

// Mapeamento de categorias para ícones e cores
const categoriaConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  usuarios: { icon: <Users className="w-4 h-4" />, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', label: 'Usuários' },
  cerimonias: { icon: <Settings className="w-4 h-4" />, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', label: 'Cerimônias' },
  financeiro: { icon: <Key className="w-4 h-4" />, color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', label: 'Financeiro' },
  conteudo: { icon: <Settings className="w-4 h-4" />, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', label: 'Conteúdo' },
  loja: { icon: <Settings className="w-4 h-4" />, color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400', label: 'Loja' },
  cursos: { icon: <Settings className="w-4 h-4" />, color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400', label: 'Cursos' },
  relatorios: { icon: <Settings className="w-4 h-4" />, color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400', label: 'Relatórios' },
  sistema: { icon: <Shield className="w-4 h-4" />, color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', label: 'Sistema' },
};

export const PermissoesTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const { user } = useAuth();
  const { data: activeHouse } = useActiveHouse();
  
  // Buscar dono da casa
  const { data: ownerProfile, isLoading: isLoadingOwner } = useQuery({
    queryKey: ['house-owner', activeHouse?.owner_id],
    enabled: !!activeHouse?.owner_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('id', activeHouse!.owner_id)
        .single();
      
      if (error) throw error;
      return { ...data, isOwner: true } as HouseUser;
    },
  });

  // Buscar membros da casa (user_houses) - query separada para evitar join problemático
  const { data: houseMembers, isLoading: isLoadingMembers } = useQuery({
    queryKey: ['house-members-ids', activeHouse?.id],
    enabled: !!activeHouse?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_houses')
        .select('user_id')
        .eq('house_id', activeHouse!.id)
        .eq('status', 'active');
      
      if (error) throw error;
      return data?.map(uh => uh.user_id) || [];
    },
  });

  // Buscar profiles dos membros
  const { data: memberProfiles, isLoading: isLoadingProfiles } = useQuery({
    queryKey: ['house-member-profiles', houseMembers],
    enabled: !!houseMembers && houseMembers.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', houseMembers!);
      
      if (error) throw error;
      return data as HouseUser[];
    },
  });

  // Combinar dono + membros
  const houseUsers = useMemo(() => {
    const users: HouseUser[] = [];
    
    // Adicionar dono primeiro
    if (ownerProfile) {
      users.push(ownerProfile);
    }
    
    // Adicionar membros (exceto o dono que já foi adicionado)
    if (memberProfiles) {
      memberProfiles.forEach(member => {
        if (member.id !== activeHouse?.owner_id) {
          users.push(member);
        }
      });
    }
    
    return users;
  }, [ownerProfile, memberProfiles, activeHouse?.owner_id]);

  const { data: permissoes, isLoading: isLoadingPermissoes } = usePermissoesDisponiveis();
  const { data: userPermissoes, isLoading: isLoadingUserPermissoes } = useTodasPermissoesUsuarios();
  const concederMutation = useConcederPermissao();
  const revogarMutation = useRevogarPermissao();

  // Lista de usuários com permissões (incluindo dono)
  const admins = useMemo(() => {
    const result: HouseUser[] = [];
    
    // Dono sempre aparece primeiro
    if (ownerProfile) {
      result.push(ownerProfile);
    }
    
    // Adicionar outros usuários que têm permissões
    if (houseUsers && userPermissoes) {
      houseUsers.forEach(u => {
        if (u.id !== activeHouse?.owner_id && userPermissoes.some(up => up.user_id === u.id)) {
          result.push(u);
        }
      });
    }
    
    return result;
  }, [ownerProfile, houseUsers, userPermissoes, activeHouse?.owner_id]);

  // Todos os usuários filtrados por busca
  const filteredProfiles = useMemo(() => {
    if (!houseUsers) return [];
    if (!searchTerm) return [];
    const term = searchTerm.toLowerCase();
    return houseUsers.filter(p =>
      p.full_name?.toLowerCase().includes(term) ||
      p.email?.toLowerCase().includes(term)
    );
  }, [houseUsers, searchTerm]);

  // Verificar se usuário tem uma permissão específica
  const temPermissao = (userId: string, permissaoId: string): boolean => {
    // Dono tem todas as permissões implicitamente
    if (userId === activeHouse?.owner_id) return true;
    return userPermissoes?.some(up => up.user_id === userId && up.permissao_id === permissaoId) || false;
  };

  // Obter permissões de um usuário
  const getPermissoesUsuario = (userId: string) => {
    return userPermissoes?.filter(up => up.user_id === userId) || [];
  };

  // Toggle permissão
  const handleTogglePermissao = async (userId: string, permissaoId: string, temAtualmente: boolean) => {
    // Não permitir alterar permissões do dono
    if (userId === activeHouse?.owner_id) {
      toast.info('O dono da casa tem todas as permissões automaticamente');
      return;
    }
    
    try {
      if (temAtualmente) {
        await revogarMutation.mutateAsync({ userId, permissaoId });
        toast.success('Permissão revogada');
      } else {
        await concederMutation.mutateAsync({ userId, permissaoId });
        toast.success('Permissão concedida');
      }
    } catch {
      toast.error('Erro ao alterar permissão');
    }
  };

  // Agrupar permissões por categoria
  const permissoesPorCategoria = useMemo(() => {
    if (!permissoes) return {};
    return permissoes.reduce((acc, p) => {
      if (!acc[p.categoria]) acc[p.categoria] = [];
      acc[p.categoria].push(p);
      return acc;
    }, {} as Record<string, Permissao[]>);
  }, [permissoes]);

  const selectedProfile = houseUsers?.find(p => p.id === selectedUserId);
  const isSelectedOwner = selectedUserId === activeHouse?.owner_id;

  const isLoading = isLoadingOwner || isLoadingMembers || isLoadingProfiles || isLoadingPermissoes || isLoadingUserPermissoes;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumo de admins com permissões */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Usuários com Permissões
          </CardTitle>
          <CardDescription>
            Gerencie as permissões de acesso ao painel administrativo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {admins.map(admin => {
              const isOwner = admin.id === activeHouse?.owner_id;
              const perms = getPermissoesUsuario(admin.id);
              
              return (
                <div
                  key={admin.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => setSelectedUserId(admin.id)}
                >
                  <div className="flex items-center gap-3">
                    {isOwner && <Crown className="w-5 h-5 text-yellow-500" />}
                    <div>
                      <p className="font-medium">{admin.full_name || 'Sem nome'}</p>
                      <p className="text-xs text-muted-foreground">{admin.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isOwner ? (
                      <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                        Dono da Casa
                      </Badge>
                    ) : perms.length > 0 ? (
                      <Badge variant="secondary">{perms.length} permissões</Badge>
                    ) : null}
                  </div>
                </div>
              );
            })}
            {admins.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum usuário encontrado.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Adicionar permissões a usuário */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-primary" />
            Gerenciar Permissões
          </CardTitle>
          <CardDescription>
            Busque um usuário para adicionar ou remover permissões.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Busca com autosugestão */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Buscar usuário por nome ou email..."
              className="pl-10"
              value={searchTerm}
              autoComplete="off"
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (selectedUserId && e.target.value === '') {
                  setSelectedUserId(null);
                }
              }}
            />
            
            {/* Dropdown de sugestões */}
            {searchTerm && searchTerm.length >= 1 && !selectedUserId && filteredProfiles.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg z-50 max-h-[250px] overflow-y-auto">
                {filteredProfiles.slice(0, 8).map(profile => {
                  const isOwner = profile.id === activeHouse?.owner_id;
                  return (
                    <div
                      key={profile.id}
                      className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted border-b last:border-b-0"
                      onClick={() => {
                        setSelectedUserId(profile.id);
                        setSearchTerm(profile.full_name || profile.email || '');
                      }}
                    >
                      <div className="flex items-center gap-2">
                        {isOwner && <Crown className="w-4 h-4 text-yellow-500" />}
                        <div>
                          <p className="text-sm font-medium">{profile.full_name || 'Sem nome'}</p>
                          <p className="text-xs text-muted-foreground">{profile.email}</p>
                        </div>
                      </div>
                      {isOwner ? (
                        <Badge variant="outline" className="text-xs">Dono</Badge>
                      ) : getPermissoesUsuario(profile.id).length > 0 ? (
                        <Badge variant="outline" className="text-xs">
                          {getPermissoesUsuario(profile.id).length} perms
                        </Badge>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Permissões do usuário selecionado */}
          {selectedProfile && (
            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isSelectedOwner && <Crown className="w-5 h-5 text-yellow-500" />}
                  <div>
                    <h4 className="font-medium">{selectedProfile.full_name}</h4>
                    <p className="text-sm text-muted-foreground">{selectedProfile.email}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => {
                  setSelectedUserId(null);
                  setSearchTerm('');
                }}>
                  Fechar
                </Button>
              </div>

              {isSelectedOwner && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <Crown className="w-4 h-4 inline mr-2" />
                    Como dono da casa, você tem todas as permissões automaticamente.
                  </p>
                </div>
              )}

              <div className="space-y-4">
                {Object.entries(permissoesPorCategoria).map(([categoria, perms]) => {
                  const config = categoriaConfig[categoria] || { 
                    icon: <Settings className="w-4 h-4" />, 
                    color: 'bg-gray-100 text-gray-700',
                    label: categoria 
                  };
                  
                  return (
                    <div key={categoria} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge className={config.color}>
                          {config.icon}
                          <span className="ml-1">{config.label}</span>
                        </Badge>
                      </div>
                      <div className="grid gap-2 pl-2">
                        {perms.map(perm => {
                          const tem = temPermissao(selectedProfile.id, perm.id);
                          const isLoading = concederMutation.isPending || revogarMutation.isPending;
                          
                          return (
                            <div
                              key={perm.id}
                              className="flex items-center justify-between py-2 px-3 border rounded hover:bg-muted/50"
                            >
                              <div>
                                <p className="text-sm font-medium">{perm.nome}</p>
                                <p className="text-xs text-muted-foreground">{perm.descricao}</p>
                              </div>
                              <Switch
                                checked={tem}
                                disabled={isLoading || isSelectedOwner}
                                onCheckedChange={() => handleTogglePermissao(selectedProfile.id, perm.id, tem)}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PermissoesTab;
