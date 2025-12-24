import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Camera,
  CameraOff,
  Clock,
  CreditCard,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { formatDateBR } from '@/lib/date-utils';

interface InscritoComDetalhes {
  id: string;
  user_id: string;
  cerimonia_id: string;
  status: string;
  forma_pagamento: string | null;
  created_at: string;
  profile: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  anamnese: {
    id: string;
    tem_doencas: boolean;
    doencas_detalhes: string | null;
    autoriza_imagem: boolean;
  } | null;
  pagamento: {
    id: string;
    mp_status: string | null;
    valor_centavos: number;
  } | null;
}

interface Cerimonia {
  id: string;
  nome: string | null;
  medicina_principal: string;
  data: string;
}

const ListaPresentes: React.FC = () => {
  const [selectedCerimonia, setSelectedCerimonia] = useState<string>('');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  // Buscar cerimônias futuras
  const { data: cerimonias, isLoading: loadingCerimonias } = useQuery({
    queryKey: ['cerimonias-futuras-lista'],
    queryFn: async () => {
      const hoje = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('cerimonias')
        .select('id, nome, medicina_principal, data')
        .gte('data', hoje)
        .order('data', { ascending: true });
      if (error) throw error;
      return data as Cerimonia[];
    },
  });

  // Buscar inscritos da cerimônia selecionada
  const { data: inscritos, isLoading: loadingInscritos } = useQuery({
    queryKey: ['inscritos-cerimonia', selectedCerimonia],
    enabled: !!selectedCerimonia,
    queryFn: async () => {
      // Buscar inscrições
      const { data: inscricoes, error: errInsc } = await supabase
        .from('inscricoes')
        .select('id, user_id, cerimonia_id, status, forma_pagamento, created_at')
        .eq('cerimonia_id', selectedCerimonia)
        .order('created_at', { ascending: true });

      if (errInsc) throw errInsc;
      if (!inscricoes?.length) return [];

      const userIds = inscricoes.map(i => i.user_id);

      // Buscar profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      // Buscar anamneses
      const { data: anamneses } = await supabase
        .from('anamneses')
        .select('id, user_id, tem_doencas, doencas_detalhes, autoriza_imagem')
        .in('user_id', userIds);

      // Buscar pagamentos
      const inscricaoIds = inscricoes.map(i => i.id);
      const { data: pagamentos } = await supabase
        .from('pagamentos')
        .select('id, inscricao_id, mp_status, valor_centavos')
        .in('inscricao_id', inscricaoIds);

      // Montar dados completos
      return inscricoes.map(insc => ({
        ...insc,
        profile: profiles?.find(p => p.id === insc.user_id) || null,
        anamnese: anamneses?.find(a => a.user_id === insc.user_id) || null,
        pagamento: pagamentos?.find(p => p.inscricao_id === insc.id) || null,
      })) as InscritoComDetalhes[];
    },
  });

  // Estatísticas
  const stats = useMemo(() => {
    if (!inscritos) return { total: 0, pagos: 0, pendentes: 0, comDoencas: 0, autorizamImagem: 0 };
    
    const pagos = inscritos.filter(i => i.pagamento?.mp_status === 'approved' || i.forma_pagamento === 'presencial').length;
    const comDoencas = inscritos.filter(i => i.anamnese?.tem_doencas).length;
    const autorizamImagem = inscritos.filter(i => i.anamnese?.autoriza_imagem).length;
    
    return {
      total: inscritos.length,
      pagos,
      pendentes: inscritos.length - pagos,
      comDoencas,
      autorizamImagem,
    };
  }, [inscritos]);

  const toggleExpand = (id: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getStatusPagamento = (inscrito: InscritoComDetalhes) => {
    if (inscrito.forma_pagamento === 'presencial') {
      return { label: 'Presencial', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: Clock };
    }
    if (inscrito.pagamento?.mp_status === 'approved') {
      return { label: 'Pago', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle };
    }
    if (inscrito.pagamento?.mp_status === 'pending') {
      return { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Clock };
    }
    return { label: 'Aguardando', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400', icon: CreditCard };
  };

  const cerimoniaSelecionada = cerimonias?.find(c => c.id === selectedCerimonia);

  return (
    <div className="space-y-4">
      {/* Seletor de Cerimônia */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex-1 w-full">
              <Select value={selectedCerimonia} onValueChange={setSelectedCerimonia}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione uma cerimônia..." />
                </SelectTrigger>
                <SelectContent>
                  {loadingCerimonias ? (
                    <div className="p-2 text-center text-muted-foreground">Carregando...</div>
                  ) : cerimonias?.length === 0 ? (
                    <div className="p-2 text-center text-muted-foreground">Nenhuma cerimônia futura</div>
                  ) : (
                    cerimonias?.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome || c.medicina_principal} - {formatDateBR(c.data)}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      {selectedCerimonia && inscritos && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-lg font-bold">{stats.total}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <div>
                <p className="text-xs text-muted-foreground">Pagos</p>
                <p className="text-lg font-bold text-green-600">{stats.pagos}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <div>
                <p className="text-xs text-muted-foreground">Pendentes</p>
                <p className="text-lg font-bold text-amber-600">{stats.pendentes}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <div>
                <p className="text-xs text-muted-foreground">Com Doenças</p>
                <p className="text-lg font-bold text-red-600">{stats.comDoencas}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-xs text-muted-foreground">Autorizam Img</p>
                <p className="text-lg font-bold text-blue-600">{stats.autorizamImagem}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Lista de Inscritos */}
      {!selectedCerimonia ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground">Selecione uma cerimônia para ver os inscritos</p>
          </CardContent>
        </Card>
      ) : loadingInscritos ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : inscritos?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground">Nenhum inscrito nesta cerimônia</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {inscritos?.map((inscrito, index) => {
            const statusPag = getStatusPagamento(inscrito);
            const isExpanded = expandedCards.has(inscrito.id);
            const StatusIcon = statusPag.icon;

            return (
              <Card key={inscrito.id} className="overflow-hidden">
                <CardContent className="p-0">
                  {/* Header do card - sempre visível */}
                  <button
                    onClick={() => toggleExpand(inscrito.id)}
                    className="w-full p-3 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
                  >
                    <span className="text-xs text-muted-foreground w-6">{index + 1}.</span>
                    <Avatar className="w-9 h-9">
                      <AvatarImage src={inscrito.profile?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {inscrito.profile?.full_name?.charAt(0)?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {inscrito.profile?.full_name || 'Sem nome'}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={cn("text-xs", statusPag.color)}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusPag.label}
                        </Badge>
                        {inscrito.anamnese?.tem_doencas && (
                          <Badge variant="outline" className="text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Atenção
                          </Badge>
                        )}
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>

                  {/* Detalhes expandidos */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t bg-muted/30 space-y-3">
                      {/* Ficha de Anamnese */}
                      <div className="flex items-start gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Ficha de Anamnese</p>
                          {inscrito.anamnese ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                {inscrito.anamnese.tem_doencas ? (
                                  <Badge variant="destructive" className="text-xs">
                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                    Possui doenças/condições
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Sem doenças declaradas
                                  </Badge>
                                )}
                              </div>
                              {inscrito.anamnese.tem_doencas && inscrito.anamnese.doencas_detalhes && (
                                <p className="text-xs text-muted-foreground bg-red-50 dark:bg-red-950/30 p-2 rounded">
                                  {inscrito.anamnese.doencas_detalhes}
                                </p>
                              )}
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-xs bg-gray-100 text-gray-600">
                              <XCircle className="w-3 h-3 mr-1" />
                              Ficha não preenchida
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Autorização de Imagem */}
                      <div className="flex items-center gap-2">
                        {inscrito.anamnese?.autoriza_imagem ? (
                          <>
                            <Camera className="w-4 h-4 text-green-500" />
                            <span className="text-xs text-green-600">Autoriza uso de imagem</span>
                          </>
                        ) : (
                          <>
                            <CameraOff className="w-4 h-4 text-red-500" />
                            <span className="text-xs text-red-600">NÃO autoriza uso de imagem</span>
                          </>
                        )}
                      </div>

                      {/* Data de inscrição */}
                      <p className="text-xs text-muted-foreground">
                        Inscrito em: {format(new Date(inscrito.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ListaPresentes;
