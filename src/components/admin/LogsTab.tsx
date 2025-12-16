import { useState, useMemo, useCallback, memo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Virtuoso } from 'react-virtuoso';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Filter, RefreshCw, Activity, User, Calendar, FileText, ShoppingBag, CreditCard, MessageSquare, X } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ActivityLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

const PAGE_SIZE = 50;

const ACTION_LABELS: Record<string, string> = {
  inscricao_cerimonia_criado: 'Inscrição em cerimônia',
  inscricao_cerimonia_excluido: 'Cancelamento de inscrição',
  pagamento_criado: 'Pagamento iniciado',
  pagamento_atualizado: 'Pagamento atualizado',
  cerimonia_criado: 'Cerimônia criada',
  cerimonia_atualizado: 'Cerimônia atualizada',
  cerimonia_excluido: 'Cerimônia excluída',
  depoimento_criado: 'Partilha enviada',
  depoimento_atualizado: 'Partilha atualizada',
  anamnese_criado: 'Anamnese preenchida',
  anamnese_atualizado: 'Anamnese atualizada',
  produto_criado: 'Produto criado',
  produto_atualizado: 'Produto atualizado',
  produto_excluido: 'Produto excluído',
  curso_criado: 'Curso criado',
  curso_atualizado: 'Curso atualizado',
  curso_excluido: 'Curso excluído',
  inscricao_curso_criado: 'Inscrição em curso',
  inscricao_curso_excluido: 'Cancelamento de inscrição em curso',
  // Novos
  usuario_criado: 'Novo usuário',
  usuario_atualizado: 'Perfil atualizado',
  lista_espera_criado: 'Entrou na lista de espera',
  lista_espera_excluido: 'Saiu da lista de espera',
  galeria_criado: 'Mídia adicionada',
  galeria_excluido: 'Mídia removida',
  permissao_concedida: 'Permissão concedida',
  permissao_revogada: 'Permissão revogada',
  transacao_criada: 'Transação criada',
  transacao_atualizada: 'Transação atualizada',
  transacao_excluida: 'Transação excluída',
};

const ENTITY_ICONS: Record<string, React.ReactNode> = {
  inscricoes: <Calendar className="w-4 h-4" />,
  cerimonias: <Calendar className="w-4 h-4" />,
  pagamentos: <CreditCard className="w-4 h-4" />,
  depoimentos: <MessageSquare className="w-4 h-4" />,
  anamneses: <FileText className="w-4 h-4" />,
  produtos: <ShoppingBag className="w-4 h-4" />,
  cursos: <FileText className="w-4 h-4" />,
  inscricoes_cursos: <Calendar className="w-4 h-4" />,
  profiles: <User className="w-4 h-4" />,
  lista_espera: <Calendar className="w-4 h-4" />,
  galeria: <FileText className="w-4 h-4" />,
  permissoes: <User className="w-4 h-4" />,
  transacoes: <CreditCard className="w-4 h-4" />,
};

// Função para gerar mensagem amigável baseada na ação
const formatFriendlyMessage = (action: string, details: Record<string, unknown>): string => {
  const nome = details?.nome_completo || details?.full_name || details?.nome || 'Usuário';
  const cerimoniaTitulo = details?.cerimonia_titulo || details?.titulo;
  const cermoniaData = details?.cerimonia_data || details?.data;
  const cursoTitulo = details?.curso_titulo || details?.titulo;
  const produtoNome = details?.produto_nome || details?.nome;
  const valor = details?.valor || details?.amount;
  const status = details?.status;

  // Formatar data se existir
  const formatarData = (data: unknown): string => {
    if (!data) return '';
    try {
      const date = new Date(String(data));
      return format(date, "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return String(data);
    }
  };

  switch (action) {
    case 'inscricao_cerimonia_criado':
      if (cerimoniaTitulo && cermoniaData) {
        return `se inscreveu na cerimônia "${cerimoniaTitulo}" do dia ${formatarData(cermoniaData)}`;
      }
      if (cerimoniaTitulo) {
        return `se inscreveu na cerimônia "${cerimoniaTitulo}"`;
      }
      return 'se inscreveu em uma cerimônia';

    case 'inscricao_cerimonia_excluido':
      if (cerimoniaTitulo && cermoniaData) {
        return `cancelou inscrição na cerimônia "${cerimoniaTitulo}" do dia ${formatarData(cermoniaData)}`;
      }
      if (cerimoniaTitulo) {
        return `cancelou inscrição na cerimônia "${cerimoniaTitulo}"`;
      }
      return 'cancelou inscrição em uma cerimônia';

    case 'pagamento_criado':
      if (valor) {
        return `iniciou um pagamento de R$ ${Number(valor).toFixed(2).replace('.', ',')}`;
      }
      return 'iniciou um pagamento';

    case 'pagamento_atualizado':
      if (status === 'approved' || status === 'aprovado') {
        return valor 
          ? `teve pagamento de R$ ${Number(valor).toFixed(2).replace('.', ',')} aprovado`
          : 'teve pagamento aprovado';
      }
      if (status === 'rejected' || status === 'rejeitado') {
        return 'teve pagamento rejeitado';
      }
      if (status === 'pending' || status === 'pendente') {
        return 'tem pagamento pendente';
      }
      return `atualizou status do pagamento${status ? ` para ${status}` : ''}`;

    case 'cerimonia_criado':
      if (cerimoniaTitulo && cermoniaData) {
        return `criou a cerimônia "${cerimoniaTitulo}" para o dia ${formatarData(cermoniaData)}`;
      }
      return `criou uma nova cerimônia${cerimoniaTitulo ? `: "${cerimoniaTitulo}"` : ''}`;

    case 'cerimonia_atualizado':
      return `atualizou a cerimônia${cerimoniaTitulo ? ` "${cerimoniaTitulo}"` : ''}`;

    case 'cerimonia_excluido':
      return `excluiu a cerimônia${cerimoniaTitulo ? ` "${cerimoniaTitulo}"` : ''}`;

    case 'depoimento_criado':
      const textoPreview = details?.texto 
        ? String(details.texto).substring(0, 50) + (String(details.texto).length > 50 ? '...' : '')
        : null;
      return textoPreview 
        ? `enviou uma partilha: "${textoPreview}"`
        : 'enviou uma partilha';

    case 'depoimento_atualizado':
      return 'atualizou sua partilha';

    case 'anamnese_criado':
      return 'preencheu a ficha de anamnese';

    case 'anamnese_atualizado':
      return 'atualizou a ficha de anamnese';

    case 'produto_criado':
      return `criou o produto${produtoNome ? ` "${produtoNome}"` : ''}`;

    case 'produto_atualizado':
      return `atualizou o produto${produtoNome ? ` "${produtoNome}"` : ''}`;

    case 'produto_excluido':
      return `excluiu o produto${produtoNome ? ` "${produtoNome}"` : ''}`;

    case 'curso_criado':
      return `criou o curso${cursoTitulo ? ` "${cursoTitulo}"` : ''}`;

    case 'curso_atualizado':
      return `atualizou o curso${cursoTitulo ? ` "${cursoTitulo}"` : ''}`;

    case 'curso_excluido':
      return `excluiu o curso${cursoTitulo ? ` "${cursoTitulo}"` : ''}`;

    case 'inscricao_curso_criado':
      return `se inscreveu no curso${cursoTitulo ? ` "${cursoTitulo}"` : ''}`;

    case 'inscricao_curso_excluido':
      return `cancelou inscrição no curso${cursoTitulo ? ` "${cursoTitulo}"` : ''}`;

    // Novos tipos
    case 'usuario_criado':
      return 'se cadastrou no sistema';

    case 'usuario_atualizado':
      return 'atualizou seu perfil';

    case 'lista_espera_criado':
      if (cerimoniaTitulo && cermoniaData) {
        return `entrou na lista de espera da cerimônia "${cerimoniaTitulo}" do dia ${formatarData(cermoniaData)}`;
      }
      return 'entrou na lista de espera de uma cerimônia';

    case 'lista_espera_excluido':
      if (cerimoniaTitulo) {
        return `saiu da lista de espera da cerimônia "${cerimoniaTitulo}"`;
      }
      return 'saiu da lista de espera';

    case 'galeria_criado':
      const tituloMidia = details?.titulo;
      const tipoMidia = details?.tipo === 'video' ? 'vídeo' : 'foto';
      if (cerimoniaTitulo) {
        return `adicionou ${tipoMidia}${tituloMidia ? ` "${tituloMidia}"` : ''} na galeria da cerimônia "${cerimoniaTitulo}"`;
      }
      return `adicionou ${tipoMidia}${tituloMidia ? ` "${tituloMidia}"` : ''} na galeria`;

    case 'galeria_excluido':
      return `removeu mídia da galeria`;

    case 'permissao_concedida':
      const permissao = details?.permissao;
      const usuarioPermissao = details?.nome_completo;
      return permissao 
        ? `concedeu permissão "${permissao}" para ${usuarioPermissao || 'usuário'}`
        : 'concedeu uma permissão';

    case 'permissao_revogada':
      const permissaoRevogada = details?.permissao;
      return permissaoRevogada 
        ? `revogou permissão "${permissaoRevogada}"`
        : 'revogou uma permissão';

    case 'transacao_criada':
      const tipoTransacao = details?.tipo === 'entrada' ? 'entrada' : 'saída';
      const valorTransacao = details?.valor;
      const categoriaTransacao = details?.categoria;
      if (valorTransacao) {
        return `registrou ${tipoTransacao} de R$ ${Number(valorTransacao).toFixed(2).replace('.', ',')}${categoriaTransacao ? ` (${categoriaTransacao})` : ''}`;
      }
      return `registrou uma ${tipoTransacao}`;

    case 'transacao_atualizada':
      return 'atualizou uma transação financeira';

    case 'transacao_excluida':
      return 'excluiu uma transação financeira';

    default:
      return action.replace(/_/g, ' ');
  }
};

const ACTION_COLORS: Record<string, string> = {
  inscricao_cerimonia_criado: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  inscricao_cerimonia_excluido: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  pagamento_criado: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  pagamento_atualizado: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  cerimonia_criado: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  cerimonia_atualizado: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  cerimonia_excluido: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  depoimento_criado: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  depoimento_atualizado: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  anamnese_criado: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
  anamnese_atualizado: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
  produto_criado: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  produto_atualizado: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  produto_excluido: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  curso_criado: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  curso_atualizado: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  curso_excluido: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  inscricao_curso_criado: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  inscricao_curso_excluido: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  // Novos
  usuario_criado: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  usuario_atualizado: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  lista_espera_criado: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  lista_espera_excluido: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  galeria_criado: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
  galeria_excluido: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  permissao_concedida: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
  permissao_revogada: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  transacao_criada: 'bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-400',
  transacao_atualizada: 'bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-400',
  transacao_excluida: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

// Componente de item do log memoizado
const LogItem = memo(({ log }: { log: ActivityLog }) => {
  const actionLabel = ACTION_LABELS[log.action] || log.action;
  const actionColor = ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  const entityIcon = ENTITY_ICONS[log.entity_type] || <Activity className="w-4 h-4" />;
  
  // Tenta pegar o nome dos details
  const details = log.details as Record<string, unknown>;
  const userName = details?.nome_completo as string || 
                   details?.full_name as string || 
                   details?.nome as string ||
                   'Usuário';
  
  // Gera mensagem amigável
  const friendlyMessage = formatFriendlyMessage(log.action, details);
  
  const timeAgo = formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR });
  const fullDate = format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

  return (
    <div className="flex items-start gap-3 p-3 border-b border-border/50 hover:bg-muted/30 transition-colors">
      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
        {entityIcon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={`text-xs ${actionColor}`}>{actionLabel}</Badge>
          <span className="text-xs text-muted-foreground" title={fullDate}>{timeAgo}</span>
        </div>
        <p className="mt-1.5 text-sm">
          <span className="font-medium">{userName}</span>
          <span className="text-muted-foreground"> {friendlyMessage}</span>
        </p>
      </div>
    </div>
  );
});
LogItem.displayName = 'LogItem';

// Skeleton para loading
const LogSkeleton = () => (
  <div className="flex items-start gap-3 p-3 border-b border-border/50">
    <Skeleton className="w-8 h-8 rounded-full" />
    <div className="flex-1 space-y-2">
      <div className="flex gap-2">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-4 w-32" />
    </div>
  </div>
);

export const LogsTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [entityFilter, setEntityFilter] = useState<string>('all');

  // Query com infinite scroll
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: ['activity-logs', actionFilter, entityFilter],
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from('activity_logs')
        .select(`
          id,
          user_id,
          action,
          entity_type,
          entity_id,
          details,
          created_at
        `)
        .order('created_at', { ascending: false })
        .range(pageParam, pageParam + PAGE_SIZE - 1);

      if (actionFilter !== 'all') {
        query = query.eq('action', actionFilter);
      }
      if (entityFilter !== 'all') {
        query = query.eq('entity_type', entityFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ActivityLog[];
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return allPages.flat().length;
    },
    initialPageParam: 0,
    staleTime: 1000 * 60, // 1 minuto
  });

  // Flatten pages e filtrar por busca
  const logs = useMemo(() => {
    const allLogs = data?.pages.flat() || [];
    if (!searchTerm) return allLogs;
    const term = searchTerm.toLowerCase();
    return allLogs.filter(log => 
      log.action.toLowerCase().includes(term) ||
      log.entity_type.toLowerCase().includes(term) ||
      JSON.stringify(log.details).toLowerCase().includes(term)
    );
  }, [data, searchTerm]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setActionFilter('all');
    setEntityFilter('all');
  }, []);

  const hasActiveFilters = searchTerm || actionFilter !== 'all' || entityFilter !== 'all';

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="w-5 h-5 text-primary" />
            Logs de Atividades
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${isRefetching ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por usuário, ação..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Ação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as ações</SelectItem>
              {Object.entries(ACTION_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Entidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="inscricoes">Inscrições</SelectItem>
              <SelectItem value="cerimonias">Cerimônias</SelectItem>
              <SelectItem value="pagamentos">Pagamentos</SelectItem>
              <SelectItem value="depoimentos">Partilhas</SelectItem>
              <SelectItem value="anamneses">Anamneses</SelectItem>
              <SelectItem value="produtos">Produtos</SelectItem>
            </SelectContent>
          </Select>
          {hasActiveFilters && (
            <Button variant="ghost" size="icon" onClick={clearFilters}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Lista virtualizada */}
        <div className="border rounded-lg overflow-hidden">
          {isLoading ? (
            <div>
              {Array.from({ length: 10 }).map((_, i) => (
                <LogSkeleton key={i} />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Activity className="w-12 h-12 mb-2 opacity-40" />
              <p>Nenhum log encontrado</p>
              {hasActiveFilters && (
                <Button variant="link" onClick={clearFilters} className="mt-2">
                  Limpar filtros
                </Button>
              )}
            </div>
          ) : (
            <Virtuoso
              style={{ height: '500px' }}
              data={logs}
              endReached={handleEndReached}
              itemContent={(_, log) => <LogItem log={log} />}
              components={{
                Footer: () => isFetchingNextPage ? (
                  <div className="p-4 text-center">
                    <div className="inline-block w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : null,
              }}
            />
          )}
        </div>

        {/* Info */}
        <p className="text-xs text-muted-foreground text-center">
          {logs.length} logs carregados {hasNextPage && '• Role para carregar mais'}
        </p>
      </CardContent>
    </Card>
  );
};

export default memo(LogsTab);
