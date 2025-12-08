import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Users,
  Calendar,
  Search,
  FileText,
  Shield,
  Eye,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Bell,
  DollarSign,
  CreditCard,
  MessageSquareQuote
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

// Interfaces
interface Profile {
  id: string;
  full_name: string | null;
  birth_date: string | null;
  referral_source: string | null;
  referral_name: string | null;
  created_at: string;
  email?: string;
}

interface Anamnese {
  id: string;
  user_id: string;
  nome_completo: string;
  pressao_alta: boolean;
  problemas_cardiacos: boolean;
  historico_convulsivo: boolean;
  uso_antidepressivos: boolean;
  uso_medicamentos: string | null;
  alergias: string | null;
  ja_consagrou: boolean;
  updated_at: string;
}

interface Cerimonia {
  id: string;
  data: string;
  horario: string;
  nome: string | null;
  medicina_principal: string | null;
  local: string;
  vagas: number | null;
}

interface Inscricao {
  id: string;
  user_id: string;
  cerimonia_id: string;
  data_inscricao: string;
  forma_pagamento: string | null;
  pago: boolean;
  profiles: Profile;
  cerimonias: Cerimonia;
}

interface Notificacao {
  id: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
  created_at: string;
}

interface Role {
  id: string;
  role: string;
}

interface UserRole {
  id: string;
  user_id: string;
  role_id: string;
}

const Admin: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [selectedAnamnese, setSelectedAnamnese] = useState<Anamnese | null>(null);

  // Queries
  const { data: profiles, isLoading: isLoadingProfiles } = useQuery({
    queryKey: ['admin-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Profile[];
    },
  });

  // Roles
  const { data: roles } = useQuery({
    queryKey: ['admin-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roles')
        .select('*');
      if (error) throw error;
      return data as Role[];
    },
  });

  // User Roles
  const { data: userRoles } = useQuery({
    queryKey: ['admin-user-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*');
      if (error) throw error;
      return data as UserRole[];
    },
  });

  const { data: anamneses } = useQuery({
    queryKey: ['admin-anamneses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('anamneses')
        .select('*');
      if (error) throw error;
      return data as Anamnese[];
    },
  });

  const { data: cerimonias } = useQuery({
    queryKey: ['admin-cerimonias'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cerimonias')
        .select('*')
        .order('data', { ascending: false });
      if (error) throw error;
      return data as Cerimonia[];
    },
  });

  const { data: inscricoes } = useQuery({
    queryKey: ['admin-inscricoes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inscricoes')
        .select(`
          *,
          profiles:user_id (*),
          cerimonias:cerimonia_id (*)
        `)
        .order('data_inscricao', { ascending: false });
      if (error) throw error;
      return data as Inscricao[];
    },
  });

  // Notificações
  const { data: notificacoes } = useQuery({
    queryKey: ['admin-notificacoes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notificacoes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as Notificacao[];
    },
  });

  // Depoimentos pendentes
  const { data: depoimentosPendentes } = useQuery({
    queryKey: ['admin-depoimentos-pendentes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('depoimentos')
        .select(`
          *,
          profiles:user_id (full_name),
          cerimonias:cerimonia_id (nome, medicina_principal, data)
        `)
        .eq('aprovado', false)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const unreadCount = notificacoes?.filter(n => !n.lida).length || 0;

  // Mutation para marcar notificação como lida
  const markAsReadMutation = useMutation({
    mutationFn: async (notificacaoId: string) => {
      const { error } = await supabase
        .from('notificacoes')
        .update({ lida: true })
        .eq('id', notificacaoId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notificacoes'] });
    }
  });

  // Mutation para aprovar depoimento
  const approveDepoimentoMutation = useMutation({
    mutationFn: async (depoimentoId: string) => {
      const { error } = await supabase
        .from('depoimentos')
        .update({ aprovado: true, approved_at: new Date().toISOString() })
        .eq('id', depoimentoId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Depoimento aprovado!');
      queryClient.invalidateQueries({ queryKey: ['admin-depoimentos-pendentes'] });
      queryClient.invalidateQueries({ queryKey: ['depoimentos-aprovados'] });
    },
    onError: () => {
      toast.error('Erro ao aprovar depoimento.');
    }
  });

  // Mutation para rejeitar/deletar depoimento
  const rejectDepoimentoMutation = useMutation({
    mutationFn: async (depoimentoId: string) => {
      const { error } = await supabase
        .from('depoimentos')
        .delete()
        .eq('id', depoimentoId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Depoimento rejeitado.');
      queryClient.invalidateQueries({ queryKey: ['admin-depoimentos-pendentes'] });
    },
    onError: () => {
      toast.error('Erro ao rejeitar depoimento.');
    }
  });

  // Mutation para atualizar status de pagamento
  const togglePaymentMutation = useMutation({
    mutationFn: async ({ inscricaoId, pago }: { inscricaoId: string; pago: boolean }) => {
      const { error } = await supabase
        .from('inscricoes')
        .update({ pago })
        .eq('id', inscricaoId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Status de pagamento atualizado!');
      queryClient.invalidateQueries({ queryKey: ['admin-inscricoes'] });
    },
    onError: () => {
      toast.error('Erro ao atualizar pagamento.');
    }
  });

  // Mutation para alterar role de usuário
  const changeRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: string | null }) => {
      // Primeiro, remover roles existentes do usuário
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      // Se newRole é null (consagrador), não adiciona nenhum role
      if (newRole === null) return;

      // Buscar o ID do role
      const roleData = roles?.find(r => r.role === newRole);
      if (!roleData) throw new Error('Role não encontrado');

      // Adicionar novo role
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role_id: roleData.id });

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      toast.success('Papel do usuário atualizado!');
      queryClient.invalidateQueries({ queryKey: ['admin-user-roles'] });
    },
    onError: (error) => {
      console.error(error);
      toast.error('Erro ao atualizar papel do usuário.');
    }
  });

  // Filtered Profiles
  const filteredProfiles = profiles?.filter(profile =>
    profile.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.referral_source?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper to get anamnese for a user
  const getAnamnese = (userId: string) => {
    return anamneses?.find(a => a.user_id === userId);
  };

  // Helper to get user's role
  const getUserRole = (userId: string): string => {
    const userRole = userRoles?.find(ur => ur.user_id === userId);
    if (!userRole) return 'consagrador';
    const role = roles?.find(r => r.id === userRole.role_id);
    return role?.role || 'consagrador';
  };

  // Helper to get role label
  const getRoleLabel = (role: string): string => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'guardiao': return 'Guardião';
      default: return 'Consagrador';
    }
  };

  // Helper to get role badge color
  const getRoleBadgeClass = (role: string): string => {
    switch (role) {
      case 'admin': return 'bg-primary text-primary-foreground';
      case 'guardiao': return 'bg-amber-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  // Helper to count inscriptions per ceremony
  const getInscritosCount = (cerimoniaId: string) => {
    return inscricoes?.filter(i => i.cerimonia_id === cerimoniaId).length || 0;
  };

  // Helper to get paid count
  const getPagosCount = (cerimoniaId: string) => {
    return inscricoes?.filter(i => i.cerimonia_id === cerimoniaId && i.pago).length || 0;
  };

  const hasContraindicacao = (anamnese: Anamnese) => {
    return anamnese.pressao_alta ||
      anamnese.problemas_cardiacos ||
      anamnese.historico_convulsivo ||
      anamnese.uso_antidepressivos;
  };

  return (
    <div className="min-h-screen py-8 px-4 bg-background/50 pb-24">
      <div className="container max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-medium text-foreground">
                Painel Administrativo
              </h1>
              <p className="text-muted-foreground font-body">
                Gestão de consagradores, cerimônias e inscrições.
              </p>
            </div>
          </div>

          {/* Notificações */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-bold">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="p-4 border-b">
                <h4 className="font-display font-medium">Notificações</h4>
              </div>
              <ScrollArea className="h-[300px]">
                {notificacoes && notificacoes.length > 0 ? (
                  <div className="divide-y">
                    {notificacoes.map((notificacao) => (
                      <div
                        key={notificacao.id}
                        className={`p-3 hover:bg-muted/50 cursor-pointer transition-colors ${!notificacao.lida ? 'bg-primary/5' : ''}`}
                        onClick={() => markAsReadMutation.mutate(notificacao.id)}
                      >
                        <div className="flex items-start gap-2">
                          {!notificacao.lida && (
                            <span className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                          )}
                          <div className={notificacao.lida ? 'ml-4' : ''}>
                            <p className="text-sm font-medium">{notificacao.titulo}</p>
                            <p className="text-xs text-muted-foreground">{notificacao.mensagem}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(notificacao.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhuma notificação</p>
                  </div>
                )}
              </ScrollArea>
            </PopoverContent>
          </Popover>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-[600px]">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="consagradores">Consagradores</TabsTrigger>
            <TabsTrigger value="inscricoes">Inscrições</TabsTrigger>
            <TabsTrigger value="depoimentos" className="relative">
              Depoimentos
              {depoimentosPendentes && depoimentosPendentes.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center font-bold">
                  {depoimentosPendentes.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="cerimonias">Cerimônias</TabsTrigger>
          </TabsList>

          {/* DASHBOARD TAB */}
          <TabsContent value="dashboard" className="space-y-6 animate-fade-in-up">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Consagradores</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{profiles?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Cadastrados na plataforma
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Fichas Preenchidas</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{anamneses?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Anamneses completas
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Cerimônias Realizadas</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{cerimonias?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Eventos criados
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Inscrições Totais</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{inscricoes?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Participações registradas
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Últimos Cadastros</CardTitle>
                <CardDescription>
                  Novos usuários registrados recentemente.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Data Cadastro</TableHead>
                      <TableHead>Origem</TableHead>
                      <TableHead>Status Ficha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profiles?.slice(0, 5).map((profile) => {
                      const ficha = getAnamnese(profile.id);
                      return (
                        <TableRow key={profile.id}>
                          <TableCell className="font-medium">{profile.full_name || 'Sem nome'}</TableCell>
                          <TableCell>{new Date(profile.created_at).toLocaleDateString('pt-BR')}</TableCell>
                          <TableCell>{profile.referral_source || '-'}</TableCell>
                          <TableCell>
                            {ficha ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Preenchida</Badge>
                            ) : (
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pendente</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CONSAGRADORES TAB */}
          <TabsContent value="consagradores" className="space-y-6 animate-fade-in-up">
            <div className="flex items-center justify-between">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome Completo</TableHead>
                      <TableHead>Nascimento</TableHead>
                      <TableHead>Papel</TableHead>
                      <TableHead>Anamnese</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProfiles?.map((profile) => {
                      const ficha = getAnamnese(profile.id);
                      const alerta = ficha && hasContraindicacao(ficha);
                      const currentRole = getUserRole(profile.id);

                      return (
                        <TableRow key={profile.id}>
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <span>{profile.full_name}</span>
                              {profile.referral_source && (
                                <span className="text-xs text-muted-foreground">
                                  via {profile.referral_source}
                                  {profile.referral_name && ` (${profile.referral_name})`}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {profile.birth_date ? new Date(profile.birth_date).toLocaleDateString('pt-BR') : '-'}
                          </TableCell>
                          <TableCell>
                            <select
                              value={currentRole}
                              onChange={(e) => {
                                const newValue = e.target.value === 'consagrador' ? null : e.target.value;
                                changeRoleMutation.mutate({ userId: profile.id, newRole: newValue });
                              }}
                              className={`px-2 py-1 rounded-md text-xs font-medium border cursor-pointer ${getRoleBadgeClass(currentRole)}`}
                            >
                              <option value="consagrador">Consagrador</option>
                              <option value="guardiao">Guardião</option>
                              <option value="admin">Administrador</option>
                            </select>
                          </TableCell>
                          <TableCell>
                            {ficha ? (
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">OK</Badge>
                                {alerta && (
                                  <Badge variant="destructive" className="flex gap-1 items-center">
                                    <AlertTriangle className="w-3 h-3" /> Atenção
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <Badge variant="secondary">Pendente</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => {
                                  setSelectedUser(profile);
                                  setSelectedAnamnese(ficha || null);
                                }}>
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Detalhes do Consagrador</DialogTitle>
                                  <DialogDescription>Informações completas e ficha de saúde.</DialogDescription>
                                </DialogHeader>

                                <div className="grid gap-6 py-4">
                                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                                    <div>
                                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Nome</h4>
                                      <p>{profile.full_name}</p>
                                    </div>
                                    <div>
                                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Data de Nascimento</h4>
                                      <p>{profile.birth_date ? new Date(profile.birth_date).toLocaleDateString('pt-BR') : '-'}</p>
                                    </div>
                                    <div>
                                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Origem</h4>
                                      <p>{profile.referral_source}</p>
                                    </div>
                                    <div>
                                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Cadastro em</h4>
                                      <p>{new Date(profile.created_at).toLocaleDateString('pt-BR')}</p>
                                    </div>
                                  </div>

                                  {selectedAnamnese ? (
                                    <div className="space-y-4">
                                      <div className="flex items-center justify-between">
                                        <h3 className="font-display text-lg font-medium flex items-center gap-2">
                                          <FileText className="w-5 h-5 text-primary" />
                                          Ficha de Anamnese
                                        </h3>
                                        <span className="text-xs text-muted-foreground">
                                          Atualizada em {new Date(selectedAnamnese.updated_at).toLocaleDateString('pt-BR')}
                                        </span>
                                      </div>

                                      <div className="border rounded-lg p-4 space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          <div className="space-y-2">
                                            <h4 className="font-medium text-sm">Condições de Saúde</h4>
                                            <div className="space-y-1">
                                              <div className="flex items-center justify-between text-sm border-b py-1">
                                                <span>Pressão Alta</span>
                                                {selectedAnamnese.pressao_alta ? <XCircle className="w-4 h-4 text-red-500" /> : <CheckCircle2 className="w-4 h-4 text-green-500" />}
                                              </div>
                                              <div className="flex items-center justify-between text-sm border-b py-1">
                                                <span>Problemas Cardíacos</span>
                                                {selectedAnamnese.problemas_cardiacos ? <XCircle className="w-4 h-4 text-red-500" /> : <CheckCircle2 className="w-4 h-4 text-green-500" />}
                                              </div>
                                              <div className="flex items-center justify-between text-sm border-b py-1">
                                                <span>Histórico Convulsivo</span>
                                                {selectedAnamnese.historico_convulsivo ? <XCircle className="w-4 h-4 text-red-500" /> : <CheckCircle2 className="w-4 h-4 text-green-500" />}
                                              </div>
                                              <div className="flex items-center justify-between text-sm py-1">
                                                <span>Uso de Antidepressivos</span>
                                                {selectedAnamnese.uso_antidepressivos ? <XCircle className="w-4 h-4 text-red-500" /> : <CheckCircle2 className="w-4 h-4 text-green-500" />}
                                              </div>
                                            </div>
                                          </div>

                                          <div className="space-y-4">
                                            <div>
                                              <h4 className="font-medium text-sm mb-1">Medicamentos</h4>
                                              <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                                                {selectedAnamnese.uso_medicamentos || 'Nenhum relatado'}
                                              </p>
                                            </div>
                                            <div>
                                              <h4 className="font-medium text-sm mb-1">Alergias</h4>
                                              <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                                                {selectedAnamnese.alergias || 'Nenhuma relatada'}
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg text-muted-foreground">
                                      <FileText className="w-8 h-8 mb-2 opacity-50" />
                                      <p>Usuário ainda não preencheu a ficha de anamnese.</p>
                                    </div>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* INSCRICOES TAB */}
          <TabsContent value="inscricoes" className="space-y-6 animate-fade-in-up">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  Gestão de Pagamentos
                </CardTitle>
                <CardDescription>
                  Controle os pagamentos das inscrições nas cerimônias.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Consagrador</TableHead>
                      <TableHead>Cerimônia</TableHead>
                      <TableHead>Data Inscrição</TableHead>
                      <TableHead>Forma Pagamento</TableHead>
                      <TableHead className="text-center">Pago</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inscricoes?.map((inscricao) => (
                      <TableRow key={inscricao.id}>
                        <TableCell className="font-medium">
                          {inscricao.profiles?.full_name || 'Sem nome'}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{inscricao.cerimonias?.nome || inscricao.cerimonias?.medicina_principal}</span>
                            <span className="text-xs text-muted-foreground">
                              {inscricao.cerimonias?.data ? format(new Date(inscricao.cerimonias.data), "dd/MM/yyyy", { locale: ptBR }) : '-'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {inscricao.data_inscricao ? format(new Date(inscricao.data_inscricao), "dd/MM 'às' HH:mm", { locale: ptBR }) : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {inscricao.forma_pagamento || 'Não informado'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Switch
                              checked={inscricao.pago || false}
                              onCheckedChange={(checked) => togglePaymentMutation.mutate({ inscricaoId: inscricao.id, pago: checked })}
                            />
                            {inscricao.pago ? (
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                                <DollarSign className="w-3 h-3 mr-1" /> Pago
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-amber-600 border-amber-300">
                                Pendente
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* DEPOIMENTOS TAB */}
          <TabsContent value="depoimentos" className="space-y-6 animate-fade-in-up">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquareQuote className="w-5 h-5 text-primary" />
                  Moderação de Depoimentos
                </CardTitle>
                <CardDescription>
                  Aprove ou rejeite depoimentos enviados pelos consagradores.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {depoimentosPendentes && depoimentosPendentes.length > 0 ? (
                  <div className="space-y-4">
                    {depoimentosPendentes.map((depoimento: any) => (
                      <Card key={depoimento.id} className="border-amber-200 bg-amber-50/30 dark:bg-amber-950/20 dark:border-amber-900">
                        <CardContent className="pt-4">
                          <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 space-y-3">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                  <span className="text-xs font-medium text-primary">
                                    {depoimento.profiles?.full_name?.charAt(0).toUpperCase() || '?'}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium text-foreground">{depoimento.profiles?.full_name || 'Anônimo'}</p>
                                  <p className="text-xs">
                                    {format(new Date(depoimento.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                  </p>
                                </div>
                                {depoimento.cerimonias && (
                                  <Badge variant="outline" className="ml-auto">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    {depoimento.cerimonias.nome || depoimento.cerimonias.medicina_principal}
                                  </Badge>
                                )}
                              </div>

                              <p className="text-foreground italic border-l-2 border-primary/30 pl-4">
                                "{depoimento.texto}"
                              </p>
                            </div>

                            <div className="flex md:flex-col gap-2 justify-end shrink-0">
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => approveDepoimentoMutation.mutate(depoimento.id)}
                                disabled={approveDepoimentoMutation.isPending}
                              >
                                <CheckCircle2 className="w-4 h-4 mr-1" /> Aprovar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                                onClick={() => rejectDepoimentoMutation.mutate(depoimento.id)}
                                disabled={rejectDepoimentoMutation.isPending}
                              >
                                <XCircle className="w-4 h-4 mr-1" /> Rejeitar
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">Nenhum depoimento pendente</p>
                    <p className="text-sm">Todos os depoimentos foram moderados.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* CERIMONIAS TAB */}
          <TabsContent value="cerimonias" className="space-y-6 animate-fade-in-up">
            <Card>
              <CardHeader>
                <CardTitle>Gestão de Cerimônias</CardTitle>
                <CardDescription>
                  Visualize e gerencie os eventos do portal.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Medicina</TableHead>
                      <TableHead>Local</TableHead>
                      <TableHead>Inscritos</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cerimonias?.map((cerimonia) => {
                      const inscritos = getInscritosCount(cerimonia.id);
                      const isPast = new Date(cerimonia.data) < new Date();

                      return (
                        <TableRow key={cerimonia.id} className={isPast ? 'opacity-60' : ''}>
                          <TableCell className="font-medium">
                            {format(new Date(cerimonia.data), "dd/MM/yyyy", { locale: ptBR })}
                            <div className="text-xs text-muted-foreground">{cerimonia.horario.slice(0, 5)}</div>
                          </TableCell>
                          <TableCell>{cerimonia.medicina_principal}</TableCell>
                          <TableCell>{cerimonia.local}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-muted-foreground" />
                              <span>{inscritos} / {cerimonia.vagas || '∞'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {isPast ? (
                              <Badge variant="secondary">Realizada</Badge>
                            ) : (
                              <Badge className="bg-green-600">Agendada</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
