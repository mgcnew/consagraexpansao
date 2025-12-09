import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TableSkeleton, CardSkeleton } from '@/components/ui/table-skeleton';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useIsMobile } from '@/hooks/use-mobile';
import { PaginationControls } from '@/components/ui/pagination-controls';
import {
  MobileCard,
  MobileCardHeader,
  MobileCardRow,
  MobileCardActions,
} from '@/components/ui/responsive-table';
import { HistoricoConsagracoesDialog } from '@/components/admin/HistoricoConsagracoesDialog';
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
  MessageSquareQuote,
  Download,
  Filter,
  ChevronDown,
  ChevronUp,
  X,
  History
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { TOAST_MESSAGES, PAGINATION } from '@/constants';
import { exportToCSV } from '@/lib/csv-export';
import {
  useProfiles,
  useAnamneses,
  useCerimoniasAdmin,
  useInscricoesAdmin,
  useDepoimentosPendentes,
  useRoles,
  useUserRoles,
  useNotificacoes,
  getUnreadCount,
} from '@/hooks/queries';
import type {
  Profile,
  Anamnese,
  AnamneseFilterType,
  DateFilterType,
} from '@/types';

const ITEMS_PER_PAGE = PAGINATION.ITEMS_PER_PAGE;

const Admin: React.FC = () => {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [selectedAnamnese, setSelectedAnamnese] = useState<Anamnese | null>(null);
  const [updatingPaymentId, setUpdatingPaymentId] = useState<string | null>(null);
  const [updatingRoleUserId, setUpdatingRoleUserId] = useState<string | null>(null);
  const [consagradoresPage, setConsagradoresPage] = useState(1);
  const [inscricoesPage, setInscricoesPage] = useState(1);
  
  // State para o dialog de histórico de consagrações (Requirements: 1.1)
  const [historicoDialogUserId, setHistoricoDialogUserId] = useState<string | null>(null);
  const [historicoDialogUserName, setHistoricoDialogUserName] = useState<string>('');
  
  // Handlers para abrir/fechar dialog de histórico
  const handleOpenHistorico = (userId: string, userName: string) => {
    setHistoricoDialogUserId(userId);
    setHistoricoDialogUserName(userName);
  };
  
  const handleCloseHistorico = () => {
    setHistoricoDialogUserId(null);
    setHistoricoDialogUserName('');
  };
  
  // New filter states
  const [dateFilter, setDateFilter] = useState<DateFilterType>('todos');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [anamneseFilter, setAnamneseFilter] = useState<AnamneseFilterType>('todos');
  const [expandedCerimonias, setExpandedCerimonias] = useState<Set<string>>(new Set());

  // Queries usando hooks customizados (Requirements: 6.2)
  const { data: profiles, isLoading: isLoadingProfiles } = useProfiles();
  const { data: roles } = useRoles();
  const { data: userRoles } = useUserRoles();
  const { data: anamneses } = useAnamneses();
  const { data: cerimonias, isLoading: isLoadingCerimonias } = useCerimoniasAdmin();
  const { data: inscricoes, isLoading: isLoadingInscricoes } = useInscricoesAdmin();
  const { data: notificacoes } = useNotificacoes();
  const { data: depoimentosPendentes, isLoading: isLoadingDepoimentos, error: depoimentosError } = useDepoimentosPendentes();

  const unreadCount = getUnreadCount(notificacoes);

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
      toast.success(TOAST_MESSAGES.depoimento.aprovado.title, {
        description: TOAST_MESSAGES.depoimento.aprovado.description,
      });
      queryClient.invalidateQueries({ queryKey: ['admin-depoimentos-pendentes'] });
      queryClient.invalidateQueries({ queryKey: ['depoimentos-aprovados'] });
    },
    onError: () => {
      toast.error(TOAST_MESSAGES.depoimento.erroAprovar.title, {
        description: TOAST_MESSAGES.depoimento.erroAprovar.description,
      });
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
      toast.success(TOAST_MESSAGES.depoimento.rejeitado.title, {
        description: TOAST_MESSAGES.depoimento.rejeitado.description,
      });
      queryClient.invalidateQueries({ queryKey: ['admin-depoimentos-pendentes'] });
    },
    onError: () => {
      toast.error(TOAST_MESSAGES.depoimento.erroRejeitar.title, {
        description: TOAST_MESSAGES.depoimento.erroRejeitar.description,
      });
    }
  });

  // Mutation para atualizar status de pagamento
  const togglePaymentMutation = useMutation({
    mutationFn: async ({ inscricaoId, pago }: { inscricaoId: string; pago: boolean }) => {
      setUpdatingPaymentId(inscricaoId);
      const { error } = await supabase
        .from('inscricoes')
        .update({ pago })
        .eq('id', inscricaoId);
      if (error) throw error;
      return pago;
    },
    onSuccess: (pago) => {
      const msg = pago ? TOAST_MESSAGES.pagamento.confirmado : TOAST_MESSAGES.pagamento.pendente;
      toast.success(msg.title, {
        description: msg.description,
      });
      queryClient.invalidateQueries({ queryKey: ['admin-inscricoes'] });
      setUpdatingPaymentId(null);
    },
    onError: () => {
      toast.error(TOAST_MESSAGES.pagamento.erro.title, {
        description: TOAST_MESSAGES.pagamento.erro.description,
      });
      setUpdatingPaymentId(null);
    }
  });

  // Mutation para alterar role de usuário
  const changeRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: string | null }) => {
      setUpdatingRoleUserId(userId);
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
      toast.success(TOAST_MESSAGES.role.atualizado.title, {
        description: TOAST_MESSAGES.role.atualizado.description,
      });
      queryClient.invalidateQueries({ queryKey: ['admin-user-roles'] });
      setUpdatingRoleUserId(null);
    },
    onError: (error) => {
      console.error(error);
      toast.error(TOAST_MESSAGES.role.erro.title, {
        description: TOAST_MESSAGES.role.erro.description,
      });
      setUpdatingRoleUserId(null);
    }
  });

  // Helper to get date range based on filter
  const getDateRange = (filter: DateFilterType): { from: Date | null; to: Date | null } => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (filter) {
      case 'hoje':
        return { from: today, to: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
      case 'semana': {
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        return { from: weekAgo, to: now };
      }
      case 'mes': {
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        return { from: monthAgo, to: now };
      }
      case 'personalizado':
        return {
          from: dateFrom ? new Date(dateFrom) : null,
          to: dateTo ? new Date(dateTo + 'T23:59:59') : null
        };
      default:
        return { from: null, to: null };
    }
  };

  // Filtered Profiles with date and anamnese filters
  const filteredProfiles = profiles?.filter(profile => {
    // Text search filter
    const matchesSearch = 
      profile.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.referral_source?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    // Date filter
    const { from, to } = getDateRange(dateFilter);
    if (from || to) {
      const createdAt = new Date(profile.created_at);
      if (from && createdAt < from) return false;
      if (to && createdAt > to) return false;
    }
    
    // Anamnese filter
    if (anamneseFilter !== 'todos') {
      const hasAnamnese = anamneses?.some(a => a.user_id === profile.id);
      if (anamneseFilter === 'com_ficha' && !hasAnamnese) return false;
      if (anamneseFilter === 'sem_ficha' && hasAnamnese) return false;
    }
    
    return true;
  });

  // Helper to toggle ceremony expansion
  const toggleCerimonia = (cerimoniaId: string) => {
    setExpandedCerimonias(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cerimoniaId)) {
        newSet.delete(cerimoniaId);
      } else {
        newSet.add(cerimoniaId);
      }
      return newSet;
    });
  };

  // Helper to get inscriptions for a specific ceremony
  const getInscritosByCerimonia = (cerimoniaId: string) => {
    return inscricoes?.filter(i => i.cerimonia_id === cerimoniaId) || [];
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setDateFilter('todos');
    setDateFrom('');
    setDateTo('');
    setAnamneseFilter('todos');
    setConsagradoresPage(1);
  };

  // Check if any filter is active
  const hasActiveFilters = searchTerm || dateFilter !== 'todos' || anamneseFilter !== 'todos';

  // Paginated Profiles
  const totalConsagradoresPages = Math.ceil((filteredProfiles?.length || 0) / ITEMS_PER_PAGE);
  const paginatedConsagradores = filteredProfiles?.slice(
    (consagradoresPage - 1) * ITEMS_PER_PAGE,
    consagradoresPage * ITEMS_PER_PAGE
  );

  // Paginated Inscricoes
  const totalInscricoesPages = Math.ceil((inscricoes?.length || 0) / ITEMS_PER_PAGE);
  const paginatedInscricoes = inscricoes?.slice(
    (inscricoesPage - 1) * ITEMS_PER_PAGE,
    inscricoesPage * ITEMS_PER_PAGE
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

  // Helper to export consagradores to CSV
  const handleExportConsagradores = () => {
    if (!filteredProfiles || filteredProfiles.length === 0) {
      toast.error('Nenhum consagrador para exportar');
      return;
    }

    const dataToExport = filteredProfiles.map(profile => {
      const ficha = getAnamnese(profile.id);
      return {
        'Nome Completo': profile.full_name || '-',
        'Email': profile.email || '-',
        'Data Cadastro': profile.created_at ? new Date(profile.created_at).toLocaleDateString('pt-BR') : '-',
        'Status Anamnese': ficha ? 'Preenchida' : 'Pendente',
        'Origem': profile.referral_source || '-',
        'Indicado por': profile.referral_name || '-',
      };
    });

    const filename = `consagradores_${new Date().toISOString().split('T')[0]}.csv`;
    exportToCSV(dataToExport, filename);
    toast.success('Consagradores exportados com sucesso!');
  };

  // Helper to export inscricoes to CSV
  const handleExportInscricoes = () => {
    if (!inscricoes || inscricoes.length === 0) {
      toast.error('Nenhuma inscrição para exportar');
      return;
    }

    const dataToExport = inscricoes.map(inscricao => {
      return {
        'Consagrador': inscricao.profiles?.full_name || '-',
        'Cerimônia': inscricao.cerimonias?.nome || inscricao.cerimonias?.medicina_principal || '-',
        'Data Cerimônia': inscricao.cerimonias?.data ? new Date(inscricao.cerimonias.data).toLocaleDateString('pt-BR') : '-',
        'Data Inscrição': inscricao.data_inscricao ? format(new Date(inscricao.data_inscricao), "dd/MM/yyyy HH:mm", { locale: ptBR }) : '-',
        'Forma Pagamento': inscricao.forma_pagamento || '-',
        'Status Pagamento': inscricao.pago ? 'Pago' : 'Pendente',
      };
    });

    const filename = `inscricoes_${new Date().toISOString().split('T')[0]}.csv`;
    exportToCSV(dataToExport, filename);
    toast.success('Inscrições exportadas com sucesso!');
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
    <div className="min-h-screen py-4 md:py-6 px-2 md:px-4 bg-background/50 pb-20">
      <div className="container max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8 animate-fade-in">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-xl md:text-3xl font-medium text-foreground">
                Painel Administrativo
              </h1>
              <p className="text-sm md:text-base text-muted-foreground font-body hidden md:block">
                Gestão de consagradores, cerimônias e inscrições.
              </p>
            </div>
          </div>

          {/* Notificações */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="relative self-end md:self-auto">
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
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 lg:w-[600px] h-auto gap-1">
            <TabsTrigger value="dashboard" className="text-xs md:text-sm px-2 py-2">
              {isMobile ? 'Home' : 'Dashboard'}
            </TabsTrigger>
            <TabsTrigger value="consagradores" className="text-xs md:text-sm px-2 py-2">
              {isMobile ? 'Usuários' : 'Consagradores'}
            </TabsTrigger>
            <TabsTrigger value="inscricoes" className="text-xs md:text-sm px-2 py-2">
              Inscrições
            </TabsTrigger>
            <TabsTrigger value="depoimentos" className="relative text-xs md:text-sm px-2 py-2">
              {isMobile ? 'Partilhas' : 'Partilhas'}
              {depoimentosPendentes && depoimentosPendentes.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 md:w-5 md:h-5 rounded-full bg-amber-500 text-white text-[10px] md:text-xs flex items-center justify-center font-bold">
                  {depoimentosPendentes.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="cerimonias" className="text-xs md:text-sm px-2 py-2">
              {isMobile ? 'Eventos' : 'Cerimônias'}
            </TabsTrigger>
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
                {/* Desktop Table */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Data Cadastro</TableHead>
                        <TableHead>Origem</TableHead>
                        <TableHead>Status Ficha</TableHead>
                      </TableRow>
                    </TableHeader>
                    {isLoadingProfiles ? (
                      <TableSkeleton rows={5} columns={4} />
                    ) : (
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
                    )}
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                  {isLoadingProfiles ? (
                    <CardSkeleton count={3} />
                  ) : (
                    profiles?.slice(0, 5).map((profile) => {
                      const ficha = getAnamnese(profile.id);
                      return (
                        <MobileCard key={profile.id}>
                          <MobileCardHeader>
                            {profile.full_name || 'Sem nome'}
                          </MobileCardHeader>
                          <MobileCardRow label="Cadastro">
                            {new Date(profile.created_at).toLocaleDateString('pt-BR')}
                          </MobileCardRow>
                          <MobileCardRow label="Origem">
                            {profile.referral_source || '-'}
                          </MobileCardRow>
                          <MobileCardRow label="Ficha">
                            {ficha ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">Preenchida</Badge>
                            ) : (
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs">Pendente</Badge>
                            )}
                          </MobileCardRow>
                        </MobileCard>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CONSAGRADORES TAB */}
          <TabsContent value="consagradores" className="space-y-6 animate-fade-in-up">
            {/* Search and Filters Card */}
            <Card className="border-primary/10">
              <CardContent className="p-4 space-y-4">
                {/* Search Bar */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                  <div className="relative w-full md:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      placeholder="Buscar consagrador por nome..."
                      className="pl-10 h-11"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setConsagradoresPage(1);
                      }}
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleExportConsagradores}
                    className="gap-2 whitespace-nowrap w-full md:w-auto h-11"
                  >
                    <Download className="w-4 h-4" />
                    Exportar CSV
                  </Button>
                </div>

                {/* Filter Row */}
                <div className="flex flex-col md:flex-row md:flex-wrap md:items-center gap-3 pt-2 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Filtros:</span>
                  </div>

                  <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                  {/* Date Filter */}
                  <Select 
                    value={dateFilter} 
                    onValueChange={(value: DateFilterType) => {
                      setDateFilter(value);
                      setConsagradoresPage(1);
                    }}
                  >
                    <SelectTrigger className="w-full md:w-[160px] h-9">
                      <SelectValue placeholder="Data de cadastro" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas as datas</SelectItem>
                      <SelectItem value="hoje">Hoje</SelectItem>
                      <SelectItem value="semana">Última semana</SelectItem>
                      <SelectItem value="mes">Último mês</SelectItem>
                      <SelectItem value="personalizado">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Custom Date Range */}
                  {dateFilter === 'personalizado' && (
                    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2">
                      <Input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => {
                          setDateFrom(e.target.value);
                          setConsagradoresPage(1);
                        }}
                        className="w-full md:w-[140px] h-9"
                        placeholder="De"
                      />
                      <span className="text-muted-foreground text-center">até</span>
                      <Input
                        type="date"
                        value={dateTo}
                        onChange={(e) => {
                          setDateTo(e.target.value);
                          setConsagradoresPage(1);
                        }}
                        className="w-full md:w-[140px] h-9"
                        placeholder="Até"
                      />
                    </div>
                  )}

                  {/* Anamnese Filter */}
                  <Select 
                    value={anamneseFilter} 
                    onValueChange={(value: AnamneseFilterType) => {
                      setAnamneseFilter(value);
                      setConsagradoresPage(1);
                    }}
                  >
                    <SelectTrigger className="w-full md:w-[160px] h-9">
                      <SelectValue placeholder="Status anamnese" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="com_ficha">Com ficha</SelectItem>
                      <SelectItem value="sem_ficha">Sem ficha</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Clear Filters Button */}
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="h-9 px-2 text-muted-foreground hover:text-foreground w-full md:w-auto"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Limpar filtros
                    </Button>
                  )}
                </div>
              </div>

              {/* Results count */}
              {hasActiveFilters && (
                <p className="text-sm text-muted-foreground mt-2">
                  {filteredProfiles?.length || 0} consagrador(es) encontrado(s)
                </p>
              )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-0 md:p-0">
                {/* Desktop Table */}
                <div className="hidden md:block">
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
                    {isLoadingProfiles ? (
                      <TableSkeleton rows={8} columns={5} />
                    ) : (
                    <TableBody>
                      {paginatedConsagradores?.map((profile) => {
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
                              {updatingRoleUserId === profile.id ? (
                                <div className="flex items-center gap-2 px-2 py-1">
                                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                  <span className="text-xs text-muted-foreground">Atualizando...</span>
                                </div>
                              ) : (
                                <select
                                  value={currentRole}
                                  onChange={(e) => {
                                    const newValue = e.target.value === 'consagrador' ? null : e.target.value;
                                    changeRoleMutation.mutate({ userId: profile.id, newRole: newValue });
                                  }}
                                  disabled={changeRoleMutation.isPending}
                                  className={`px-2 py-1 rounded-md text-xs font-medium border cursor-pointer ${getRoleBadgeClass(currentRole)} disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                  <option value="consagrador">Consagrador</option>
                                  <option value="guardiao">Guardião</option>
                                  <option value="admin">Administrador</option>
                                </select>
                              )}
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
                              <div className="flex items-center justify-end gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => handleOpenHistorico(profile.id, profile.full_name || 'Sem nome')}
                                  title="Ver Histórico"
                                >
                                  <History className="w-4 h-4" />
                                </Button>
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
                                          Atualizada em {selectedAnamnese.updated_at ? new Date(selectedAnamnese.updated_at).toLocaleDateString('pt-BR') : '-'}
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
                              </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                  )}
                </Table>
                </div>

                {/* Mobile Cards - Consagradores */}
                <div className="md:hidden p-4 space-y-3">
                  {isLoadingProfiles ? (
                    <CardSkeleton count={5} />
                  ) : (
                    paginatedConsagradores?.map((profile) => {
                      const ficha = getAnamnese(profile.id);
                      const alerta = ficha && hasContraindicacao(ficha);
                      const currentRole = getUserRole(profile.id);

                      return (
                        <MobileCard key={profile.id}>
                          <MobileCardHeader>
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="block">{profile.full_name || 'Sem nome'}</span>
                                {profile.referral_source && (
                                  <span className="text-xs text-muted-foreground font-normal">
                                    via {profile.referral_source}
                                  </span>
                                )}
                              </div>
                              {alerta && (
                                <Badge variant="destructive" className="flex gap-1 items-center text-xs">
                                  <AlertTriangle className="w-3 h-3" />
                                </Badge>
                              )}
                            </div>
                          </MobileCardHeader>
                          <MobileCardRow label="Nascimento">
                            {profile.birth_date ? new Date(profile.birth_date).toLocaleDateString('pt-BR') : '-'}
                          </MobileCardRow>
                          <MobileCardRow label="Papel">
                            {updatingRoleUserId === profile.id ? (
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                <span className="text-xs">...</span>
                              </div>
                            ) : (
                              <select
                                value={currentRole}
                                onChange={(e) => {
                                  const newValue = e.target.value === 'consagrador' ? null : e.target.value;
                                  changeRoleMutation.mutate({ userId: profile.id, newRole: newValue });
                                }}
                                disabled={changeRoleMutation.isPending}
                                className={`px-2 py-1 rounded-md text-xs font-medium border cursor-pointer ${getRoleBadgeClass(currentRole)} disabled:opacity-50`}
                              >
                                <option value="consagrador">Consagrador</option>
                                <option value="guardiao">Guardião</option>
                                <option value="admin">Admin</option>
                              </select>
                            )}
                          </MobileCardRow>
                          <MobileCardRow label="Ficha">
                            {ficha ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">OK</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">Pendente</Badge>
                            )}
                          </MobileCardRow>
                          <MobileCardActions>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1"
                                onClick={() => handleOpenHistorico(profile.id, profile.full_name || 'Sem nome')}
                              >
                                <History className="w-4 h-4 mr-2" /> Histórico
                              </Button>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="flex-1" onClick={() => {
                                    setSelectedUser(profile);
                                    setSelectedAnamnese(ficha || null);
                                  }}>
                                    <Eye className="w-4 h-4 mr-2" /> Detalhes
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-[95vw] max-h-[85vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Detalhes do Consagrador</DialogTitle>
                                  <DialogDescription>Informações completas e ficha de saúde.</DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                  <div className="grid grid-cols-1 gap-3 p-3 bg-muted/30 rounded-lg text-sm">
                                    <div>
                                      <h4 className="font-medium text-muted-foreground mb-1">Nome</h4>
                                      <p>{profile.full_name}</p>
                                    </div>
                                    <div>
                                      <h4 className="font-medium text-muted-foreground mb-1">Nascimento</h4>
                                      <p>{profile.birth_date ? new Date(profile.birth_date).toLocaleDateString('pt-BR') : '-'}</p>
                                    </div>
                                    <div>
                                      <h4 className="font-medium text-muted-foreground mb-1">Origem</h4>
                                      <p>{profile.referral_source || '-'}</p>
                                    </div>
                                    <div>
                                      <h4 className="font-medium text-muted-foreground mb-1">Cadastro</h4>
                                      <p>{new Date(profile.created_at).toLocaleDateString('pt-BR')}</p>
                                    </div>
                                  </div>
                                  {ficha ? (
                                    <div className="space-y-3">
                                      <h3 className="font-medium flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-primary" />
                                        Ficha de Anamnese
                                      </h3>
                                      <div className="border rounded-lg p-3 space-y-2 text-sm">
                                        <div className="flex items-center justify-between py-1 border-b">
                                          <span>Pressão Alta</span>
                                          {ficha.pressao_alta ? <XCircle className="w-4 h-4 text-red-500" /> : <CheckCircle2 className="w-4 h-4 text-green-500" />}
                                        </div>
                                        <div className="flex items-center justify-between py-1 border-b">
                                          <span>Problemas Cardíacos</span>
                                          {ficha.problemas_cardiacos ? <XCircle className="w-4 h-4 text-red-500" /> : <CheckCircle2 className="w-4 h-4 text-green-500" />}
                                        </div>
                                        <div className="flex items-center justify-between py-1 border-b">
                                          <span>Histórico Convulsivo</span>
                                          {ficha.historico_convulsivo ? <XCircle className="w-4 h-4 text-red-500" /> : <CheckCircle2 className="w-4 h-4 text-green-500" />}
                                        </div>
                                        <div className="flex items-center justify-between py-1">
                                          <span>Uso de Antidepressivos</span>
                                          {ficha.uso_antidepressivos ? <XCircle className="w-4 h-4 text-red-500" /> : <CheckCircle2 className="w-4 h-4 text-green-500" />}
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg text-muted-foreground">
                                      <FileText className="w-6 h-6 mb-2 opacity-50" />
                                      <p className="text-sm">Ficha não preenchida</p>
                                    </div>
                                  )}
                                </div>
                              </DialogContent>
                              </Dialog>
                            </div>
                          </MobileCardActions>
                        </MobileCard>
                      );
                    })
                  )}
                </div>

                {/* Pagination */}
                {totalConsagradoresPages > 1 && (
                  <PaginationControls
                    currentPage={consagradoresPage}
                    totalPages={totalConsagradoresPages}
                    onPageChange={setConsagradoresPage}
                    isLoading={isLoadingProfiles}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* INSCRICOES TAB */}
          <TabsContent value="inscricoes" className="space-y-6 animate-fade-in-up">
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportInscricoes}
                className="gap-2 w-full md:w-auto"
              >
                <Download className="w-4 h-4" />
                Exportar CSV
              </Button>
            </div>
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
                {/* Desktop Table */}
                <div className="hidden md:block">
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
                    {isLoadingInscricoes ? (
                      <TableSkeleton rows={8} columns={5} />
                    ) : (
                    <TableBody>
                      {paginatedInscricoes?.map((inscricao) => (
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
                              {updatingPaymentId === inscricao.id ? (
                                <div className="w-9 h-5 flex items-center justify-center">
                                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                </div>
                              ) : (
                                <Switch
                                  checked={inscricao.pago || false}
                                  onCheckedChange={(checked) => togglePaymentMutation.mutate({ inscricaoId: inscricao.id, pago: checked })}
                                  disabled={togglePaymentMutation.isPending}
                                />
                              )}
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
                    )}
                  </Table>
                </div>

                {/* Mobile Cards - Inscrições */}
                <div className="md:hidden space-y-3">
                  {isLoadingInscricoes ? (
                    <CardSkeleton count={5} />
                  ) : (
                    paginatedInscricoes?.map((inscricao) => (
                      <MobileCard key={inscricao.id}>
                        <MobileCardHeader>
                          <div className="flex items-center justify-between">
                            <span>{inscricao.profiles?.full_name || 'Sem nome'}</span>
                            {inscricao.pago ? (
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 text-xs">
                                <DollarSign className="w-3 h-3 mr-1" /> Pago
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs">
                                Pendente
                              </Badge>
                            )}
                          </div>
                        </MobileCardHeader>
                        <MobileCardRow label="Cerimônia">
                          <div className="text-right">
                            <span className="block">{inscricao.cerimonias?.nome || inscricao.cerimonias?.medicina_principal}</span>
                            <span className="text-xs text-muted-foreground">
                              {inscricao.cerimonias?.data ? format(new Date(inscricao.cerimonias.data), "dd/MM/yyyy", { locale: ptBR }) : '-'}
                            </span>
                          </div>
                        </MobileCardRow>
                        <MobileCardRow label="Inscrição">
                          {inscricao.data_inscricao ? format(new Date(inscricao.data_inscricao), "dd/MM HH:mm", { locale: ptBR }) : '-'}
                        </MobileCardRow>
                        <MobileCardRow label="Pagamento">
                          <Badge variant="outline" className="capitalize text-xs">
                            {inscricao.forma_pagamento || 'Não informado'}
                          </Badge>
                        </MobileCardRow>
                        <MobileCardActions>
                          <div className="flex items-center justify-between w-full">
                            <span className="text-sm text-muted-foreground">Marcar como pago</span>
                            {updatingPaymentId === inscricao.id ? (
                              <div className="w-9 h-5 flex items-center justify-center">
                                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                              </div>
                            ) : (
                              <Switch
                                checked={inscricao.pago || false}
                                onCheckedChange={(checked) => togglePaymentMutation.mutate({ inscricaoId: inscricao.id, pago: checked })}
                                disabled={togglePaymentMutation.isPending}
                              />
                            )}
                          </div>
                        </MobileCardActions>
                      </MobileCard>
                    ))
                  )}
                </div>

                {/* Pagination */}
                {totalInscricoesPages > 1 && (
                  <PaginationControls
                    currentPage={inscricoesPage}
                    totalPages={totalInscricoesPages}
                    onPageChange={setInscricoesPage}
                    isLoading={isLoadingInscricoes}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* DEPOIMENTOS TAB */}
          <TabsContent value="depoimentos" className="space-y-6 animate-fade-in-up">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquareQuote className="w-5 h-5 text-primary" />
                  Moderação de Partilhas
                </CardTitle>
                <CardDescription>
                  Aprove ou rejeite partilhas enviadas pelos consagradores.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingDepoimentos ? (
                  <CardSkeleton count={3} />
                ) : depoimentosError ? (
                  <div className="text-center py-12 text-destructive">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-70" />
                    <p className="font-medium">Erro ao carregar partilhas</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Verifique se você tem permissão de administrador para visualizar as partilhas pendentes.
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Se o problema persistir, entre em contato com o suporte técnico.
                    </p>
                  </div>
                ) : depoimentosPendentes && depoimentosPendentes.length > 0 ? (
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

                            <div className="flex flex-row md:flex-col gap-2 justify-end shrink-0 w-full md:w-auto">
                              <LoadingButton
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 flex-1 md:flex-none"
                                onClick={() => approveDepoimentoMutation.mutate(depoimento.id)}
                                loading={approveDepoimentoMutation.isPending}
                                loadingText="..."
                              >
                                <CheckCircle2 className="w-4 h-4 mr-1" /> Aprovar
                              </LoadingButton>
                              <LoadingButton
                                size="sm"
                                variant="outline"
                                className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground flex-1 md:flex-none"
                                onClick={() => rejectDepoimentoMutation.mutate(depoimento.id)}
                                loading={rejectDepoimentoMutation.isPending}
                                loadingText="..."
                              >
                                <XCircle className="w-4 h-4 mr-1" /> Rejeitar
                              </LoadingButton>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">Nenhuma partilha pendente</p>
                    <p className="text-sm">Todas as partilhas foram moderadas.</p>
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
                  Clique em uma cerimônia para expandir e ver a lista de inscritos.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Desktop View */}
                <div className="hidden md:block space-y-2">
                  {isLoadingCerimonias ? (
                    <TableSkeleton rows={6} columns={5} />
                  ) : (
                    cerimonias?.map((cerimonia) => {
                      const inscritos = getInscritosCount(cerimonia.id);
                      const pagos = getPagosCount(cerimonia.id);
                      const isPast = new Date(cerimonia.data) < new Date();
                      const isExpanded = expandedCerimonias.has(cerimonia.id);
                      const inscritosList = getInscritosByCerimonia(cerimonia.id);

                      return (
                        <Collapsible
                          key={cerimonia.id}
                          open={isExpanded}
                          onOpenChange={() => toggleCerimonia(cerimonia.id)}
                        >
                          <CollapsibleTrigger asChild>
                            <div className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors ${isPast ? 'opacity-60' : ''} ${isExpanded ? 'bg-muted/30 border-primary/30' : ''}`}>
                              <div className="flex items-center gap-6">
                                <div className="min-w-[100px]">
                                  <p className="font-medium">{format(new Date(cerimonia.data), "dd/MM/yyyy", { locale: ptBR })}</p>
                                  <p className="text-xs text-muted-foreground">{cerimonia.horario.slice(0, 5)}</p>
                                </div>
                                <div className="min-w-[120px]">
                                  <p className="font-medium">{cerimonia.medicina_principal}</p>
                                </div>
                                <div className="min-w-[150px] text-muted-foreground">
                                  {cerimonia.local}
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 min-w-[100px]">
                                  <Users className="w-4 h-4 text-muted-foreground" />
                                  <span className="font-medium">{inscritos}</span>
                                  <span className="text-muted-foreground">/ {cerimonia.vagas || '∞'}</span>
                                </div>
                                <div className="min-w-[80px]">
                                  {isPast ? (
                                    <Badge variant="secondary">Realizada</Badge>
                                  ) : (
                                    <Badge className="bg-green-600">Agendada</Badge>
                                  )}
                                </div>
                                {isExpanded ? (
                                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                                ) : (
                                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                                )}
                              </div>
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="mt-2 ml-4 p-4 bg-muted/20 rounded-lg border border-dashed">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-medium text-sm flex items-center gap-2">
                                  <Users className="w-4 h-4 text-primary" />
                                  Lista de Inscritos ({inscritos})
                                </h4>
                                <div className="flex items-center gap-2 text-sm">
                                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    <DollarSign className="w-3 h-3 mr-1" />
                                    {pagos} pago(s)
                                  </Badge>
                                  <Badge variant="outline" className="text-amber-600 border-amber-300">
                                    {inscritos - pagos} pendente(s)
                                  </Badge>
                                </div>
                              </div>
                              {inscritosList.length > 0 ? (
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Nome</TableHead>
                                      <TableHead>Data Inscrição</TableHead>
                                      <TableHead>Forma Pagamento</TableHead>
                                      <TableHead className="text-center">Status</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {inscritosList.map((inscricao) => (
                                      <TableRow key={inscricao.id}>
                                        <TableCell className="font-medium">
                                          {inscricao.profiles?.full_name || 'Sem nome'}
                                        </TableCell>
                                        <TableCell>
                                          {inscricao.data_inscricao ? format(new Date(inscricao.data_inscricao), "dd/MM/yyyy HH:mm", { locale: ptBR }) : '-'}
                                        </TableCell>
                                        <TableCell>
                                          <Badge variant="outline" className="capitalize">
                                            {inscricao.forma_pagamento || 'Não informado'}
                                          </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                          {inscricao.pago ? (
                                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                                              <DollarSign className="w-3 h-3 mr-1" /> Pago
                                            </Badge>
                                          ) : (
                                            <Badge variant="outline" className="text-amber-600 border-amber-300">
                                              Pendente
                                            </Badge>
                                          )}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                  Nenhum inscrito nesta cerimônia.
                                </p>
                              )}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      );
                    })
                  )}
                </div>

                {/* Mobile Cards - Cerimônias */}
                <div className="md:hidden space-y-3">
                  {isLoadingCerimonias ? (
                    <CardSkeleton count={4} />
                  ) : (
                    cerimonias?.map((cerimonia) => {
                      const inscritos = getInscritosCount(cerimonia.id);
                      const pagos = getPagosCount(cerimonia.id);
                      const isPast = new Date(cerimonia.data) < new Date();
                      const isExpanded = expandedCerimonias.has(cerimonia.id);
                      const inscritosList = getInscritosByCerimonia(cerimonia.id);

                      return (
                        <Collapsible
                          key={cerimonia.id}
                          open={isExpanded}
                          onOpenChange={() => toggleCerimonia(cerimonia.id)}
                        >
                          <MobileCard className={isPast ? 'opacity-60' : ''}>
                            <CollapsibleTrigger asChild>
                              <div className="cursor-pointer">
                                <MobileCardHeader>
                                  <div className="flex items-center justify-between">
                                    <span>{cerimonia.medicina_principal}</span>
                                    <div className="flex items-center gap-2">
                                      {isPast ? (
                                        <Badge variant="secondary" className="text-xs">Realizada</Badge>
                                      ) : (
                                        <Badge className="bg-green-600 text-xs">Agendada</Badge>
                                      )}
                                      {isExpanded ? (
                                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                                      ) : (
                                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                      )}
                                    </div>
                                  </div>
                                </MobileCardHeader>
                                <MobileCardRow label="Data">
                                  <div className="text-right">
                                    <span className="block">{format(new Date(cerimonia.data), "dd/MM/yyyy", { locale: ptBR })}</span>
                                    <span className="text-xs text-muted-foreground">{cerimonia.horario.slice(0, 5)}</span>
                                  </div>
                                </MobileCardRow>
                                <MobileCardRow label="Local">
                                  {cerimonia.local}
                                </MobileCardRow>
                                <MobileCardRow label="Inscritos">
                                  <div className="flex items-center gap-1">
                                    <Users className="w-3 h-3 text-muted-foreground" />
                                    <span>{inscritos} / {cerimonia.vagas || '∞'}</span>
                                  </div>
                                </MobileCardRow>
                              </div>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <div className="mt-3 pt-3 border-t border-dashed">
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-sm font-medium">Inscritos</span>
                                  <div className="flex gap-2">
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                                      {pagos} pago(s)
                                    </Badge>
                                    <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs">
                                      {inscritos - pagos} pend.
                                    </Badge>
                                  </div>
                                </div>
                                {inscritosList.length > 0 ? (
                                  <div className="space-y-2">
                                    {inscritosList.map((inscricao) => (
                                      <div key={inscricao.id} className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm">
                                        <span className="font-medium truncate max-w-[150px]">
                                          {inscricao.profiles?.full_name || 'Sem nome'}
                                        </span>
                                        {inscricao.pago ? (
                                          <Badge className="bg-green-100 text-green-800 text-xs">Pago</Badge>
                                        ) : (
                                          <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs">Pend.</Badge>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground text-center py-2">
                                    Nenhum inscrito.
                                  </p>
                                )}
                              </div>
                            </CollapsibleContent>
                          </MobileCard>
                        </Collapsible>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Dialog de Histórico de Consagrações - Requirements: 1.1 */}
      <HistoricoConsagracoesDialog
        userId={historicoDialogUserId || ''}
        userName={historicoDialogUserName}
        isOpen={!!historicoDialogUserId}
        onClose={handleCloseHistorico}
      />
    </div>
  );
};

export default Admin;
