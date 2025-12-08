import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Users,
  Calendar,
  Search,
  FileText,
  Shield,
  Eye,
  MoreHorizontal,
  AlertTriangle,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Interfaces
interface Profile {
  id: string;
  full_name: string | null;
  birth_date: string | null;
  referral_source: string | null;
  referral_name: string | null;
  created_at: string;
  email?: string; // Email vem de auth.users, mas vamos tentar pegar se possível ou usar mock
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
  medicina_principal: string | null;
  local: string;
  vagas: number | null;
}

interface Inscricao {
  id: string;
  user_id: string;
  cerimonia_id: string;
  status: string;
  created_at: string;
  profiles: Profile; // Join
  cerimonias: Cerimonia; // Join
}

const Admin: React.FC = () => {
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
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
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

  // Helper to count inscriptions per ceremony
  const getInscritosCount = (cerimoniaId: string) => {
    return inscricoes?.filter(i => i.cerimonia_id === cerimoniaId).length || 0;
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
        <div className="flex items-center gap-4 mb-8 animate-fade-in">
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

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="consagradores">Consagradores</TabsTrigger>
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
                      <TableHead>Indicação</TableHead>
                      <TableHead>Anamnese</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProfiles?.map((profile) => {
                      const ficha = getAnamnese(profile.id);
                      const alerta = ficha && hasContraindicacao(ficha);

                      return (
                        <TableRow key={profile.id}>
                          <TableCell className="font-medium">{profile.full_name}</TableCell>
                          <TableCell>
                            {profile.birth_date ? new Date(profile.birth_date).toLocaleDateString('pt-BR') : '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm">{profile.referral_source}</span>
                              {profile.referral_name && (
                                <span className="text-xs text-muted-foreground">por {profile.referral_name}</span>
                              )}
                            </div>
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
