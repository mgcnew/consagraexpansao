import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { History, Calendar, MapPin, Leaf, Save, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import {
  useHistoricoConsagracoes,
  useAllHistoricoConsagracoes,
  useUpdateObservacao,
  calcularStats,
  type ConsagracaoHistorico,
} from '@/hooks/queries/useHistoricoConsagracoes';

interface HistoricoConsagracoesDialogProps {
  userId: string;
  userName: string;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Componente de estatísticas do histórico
 * Requirements: 4.1, 4.2, 4.3
 * Mobile: Layout em 2 colunas com cards compactos
 */
function StatsHeader({ consagracoes, isMobile }: { consagracoes: ConsagracaoHistorico[]; isMobile: boolean }) {
  const stats = calcularStats(consagracoes);

  if (isMobile) {
    // Layout mobile: cards compactos em grid 2x2
    return (
      <div className="grid grid-cols-2 gap-2">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-primary">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Consagrações</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-sm font-medium">
              {stats.primeiraConsagracao
                ? format(new Date(stats.primeiraConsagracao), 'dd/MM/yy', { locale: ptBR })
                : '-'}
            </p>
            <p className="text-xs text-muted-foreground">Primeira</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-sm font-medium">
              {stats.ultimaConsagracao
                ? format(new Date(stats.ultimaConsagracao), 'dd/MM/yy', { locale: ptBR })
                : '-'}
            </p>
            <p className="text-xs text-muted-foreground">Última</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="flex flex-wrap justify-center gap-1">
              {stats.medicinas.length > 0 ? (
                stats.medicinas.slice(0, 2).map((med) => (
                  <Badge key={med} variant="secondary" className="text-[10px] px-1.5">
                    {med}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">-</span>
              )}
              {stats.medicinas.length > 2 && (
                <Badge variant="outline" className="text-[10px] px-1.5">
                  +{stats.medicinas.length - 2}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Medicinas</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Layout desktop: grid horizontal
  return (
    <div className="grid grid-cols-4 gap-3 p-4 bg-muted/30 rounded-lg">
      <div className="text-center">
        <p className="text-2xl font-bold text-primary">{stats.total}</p>
        <p className="text-xs text-muted-foreground">Consagrações</p>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium">
          {stats.primeiraConsagracao
            ? format(new Date(stats.primeiraConsagracao), 'dd/MM/yyyy', { locale: ptBR })
            : '-'}
        </p>
        <p className="text-xs text-muted-foreground">Primeira</p>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium">
          {stats.ultimaConsagracao
            ? format(new Date(stats.ultimaConsagracao), 'dd/MM/yyyy', { locale: ptBR })
            : '-'}
        </p>
        <p className="text-xs text-muted-foreground">Última</p>
      </div>
      <div className="text-center">
        <div className="flex flex-wrap justify-center gap-1">
          {stats.medicinas.length > 0 ? (
            stats.medicinas.map((med) => (
              <Badge key={med} variant="secondary" className="text-xs">
                {med}
              </Badge>
            ))
          ) : (
            <span className="text-sm text-muted-foreground">-</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">Medicinas</p>
      </div>
    </div>
  );
}


/**
 * Skeleton loading para o histórico
 * Requirements: 3.4
 * Mobile: Layout adaptado para telas pequenas
 */
function HistoricoSkeleton({ isMobile }: { isMobile: boolean }) {
  return (
    <div className="space-y-4">
      {/* Stats skeleton */}
      <div className={cn(
        "gap-3",
        isMobile ? "grid grid-cols-2 gap-2" : "grid grid-cols-4 p-4 bg-muted/30 rounded-lg"
      )}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className={cn(
            "flex flex-col items-center gap-2",
            isMobile && "p-3 border rounded-lg"
          )}>
            <Skeleton className="h-6 w-12" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
      {/* Cards skeleton */}
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <CardContent className={cn("space-y-3", isMobile ? "p-3" : "p-4")}>
            <div className={cn(
              "gap-2",
              isMobile ? "space-y-2" : "flex justify-between"
            )}>
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-20" />
            </div>
            <Skeleton className="h-4 w-32" />
            <Skeleton className={cn("w-full", isMobile ? "h-16" : "h-20")} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Estado vazio quando não há consagrações
 * Requirements: 1.4
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <History className="w-12 h-12 text-muted-foreground/50 mb-4" />
      <p className="text-muted-foreground font-medium">
        Nenhuma consagração registrada
      </p>
      <p className="text-sm text-muted-foreground mt-1">
        Este consagrador ainda não participou de nenhuma cerimônia.
      </p>
    </div>
  );
}

/**
 * Card individual de consagração
 * Requirements: 1.3, 2.1, 2.4
 * Mobile: Layout compacto em formato de card otimizado para toque
 */
function ConsagracaoCard({
  consagracao,
  onSaveObservacao,
  isSaving,
  isMobile,
}: {
  consagracao: ConsagracaoHistorico;
  onSaveObservacao: (inscricaoId: string, observacao: string) => void;
  isSaving: boolean;
  isMobile: boolean;
}) {
  const [observacao, setObservacao] = useState(consagracao.observacoes_admin || '');
  const [isDirty, setIsDirty] = useState(false);

  const handleChange = (value: string) => {
    setObservacao(value);
    setIsDirty(value !== (consagracao.observacoes_admin || ''));
  };

  const handleSave = () => {
    onSaveObservacao(consagracao.id, observacao);
    setIsDirty(false);
  };

  if (isMobile) {
    // Layout mobile: card compacto otimizado para toque
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-3 space-y-2">
          {/* Header mobile: data destacada com badge de medicina */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-sm font-medium">
                {format(new Date(consagracao.cerimonia.data), "dd/MM/yyyy", {
                  locale: ptBR,
                })}
              </span>
            </div>
            {consagracao.cerimonia.medicina_principal && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 flex items-center gap-1">
                <Leaf className="w-2.5 h-2.5" />
                {consagracao.cerimonia.medicina_principal}
              </Badge>
            )}
          </div>

          {/* Local mobile: compacto */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{consagracao.cerimonia.local}</span>
            {consagracao.cerimonia.nome && (
              <>
                <span className="text-muted-foreground/50">•</span>
                <span className="truncate">{consagracao.cerimonia.nome}</span>
              </>
            )}
          </div>

          {/* Campo de observação mobile: altura reduzida */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-medium text-muted-foreground">
              Observações
            </label>
            <Textarea
              value={observacao}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="Adicione observações..."
              className="min-h-[60px] text-sm resize-none"
            />
            {isDirty && (
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="w-full gap-2"
              >
                {isSaving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                Salvar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Layout desktop
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-3">
        {/* Header com data e medicina */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="font-medium">
              {format(new Date(consagracao.cerimonia.data), "dd 'de' MMMM 'de' yyyy", {
                locale: ptBR,
              })}
            </span>
          </div>
          {consagracao.cerimonia.medicina_principal && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Leaf className="w-3 h-3" />
              {consagracao.cerimonia.medicina_principal}
            </Badge>
          )}
        </div>

        {/* Local e nome da cerimônia */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4" />
          <span>{consagracao.cerimonia.local}</span>
          {consagracao.cerimonia.nome && (
            <>
              <span className="text-muted-foreground/50">•</span>
              <span>{consagracao.cerimonia.nome}</span>
            </>
          )}
        </div>

        {/* Campo de observação */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            Observações do Admin
          </label>
          <Textarea
            value={observacao}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Adicione observações sobre esta consagração..."
            className="min-h-[80px] resize-none"
          />
          {isDirty && (
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="gap-2"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Salvar
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


/**
 * Dialog principal do histórico de consagrações
 * Requirements: 1.1, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3
 * Mobile: Full-screen dialog com layout em cards otimizado para toque
 */
export function HistoricoConsagracoesDialog({
  userId,
  userName,
  isOpen,
  onClose,
}: HistoricoConsagracoesDialogProps) {
  const isMobile = useIsMobile();
  const [savingId, setSavingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Paginated data for display
  const { data: paginatedResult, isLoading, error } = useHistoricoConsagracoes(userId, currentPage);
  // All data for stats calculation
  const { data: allConsagracoes } = useAllHistoricoConsagracoes(userId);
  const updateObservacao = useUpdateObservacao();

  const handleSaveObservacao = async (inscricaoId: string, observacao: string) => {
    setSavingId(inscricaoId);
    try {
      await updateObservacao.mutateAsync({ inscricaoId, observacao });
      toast.success('Observação salva', {
        description: 'A observação foi salva com sucesso.',
      });
    } catch {
      toast.error('Erro ao salvar', {
        description: 'Não foi possível salvar a observação. Tente novamente.',
      });
    } finally {
      setSavingId(null);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Reset page when dialog opens with new user
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      setCurrentPage(1);
    }
  };

  const consagracoes = paginatedResult?.data || [];
  const totalPages = paginatedResult?.totalPages || 1;
  const showPagination = totalPages > 1;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent 
        className={cn(
          "flex flex-col p-0",
          isMobile 
            ? "w-full h-full max-w-full max-h-full rounded-none" 
            : "max-w-2xl max-h-[90vh]"
        )}
      >
        {/* Header */}
        <DialogHeader className={cn(
          "border-b shrink-0",
          isMobile ? "p-4 pb-3" : "p-6 pb-4"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "rounded-full bg-primary/10 flex items-center justify-center",
                isMobile ? "w-8 h-8" : "w-10 h-10"
              )}>
                <History className={cn("text-primary", isMobile ? "w-4 h-4" : "w-5 h-5")} />
              </div>
              <div>
                <DialogTitle className={cn(isMobile ? "text-base" : "text-lg")}>
                  Histórico de Consagrações
                </DialogTitle>
                <DialogDescription className={cn(isMobile && "text-xs")}>
                  {userName}
                </DialogDescription>
              </div>
            </div>
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 shrink-0"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Fechar</span>
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* Content */}
        <ScrollArea className={cn(
          "flex-1",
          isMobile ? "px-4 py-3" : "px-6 py-4"
        )}>
          {isLoading ? (
            <HistoricoSkeleton isMobile={isMobile} />
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-destructive font-medium">Erro ao carregar histórico</p>
              <p className="text-sm text-muted-foreground mt-1">
                Não foi possível carregar o histórico. Tente novamente.
              </p>
            </div>
          ) : consagracoes.length === 0 && currentPage === 1 ? (
            <EmptyState />
          ) : (
            <div className={cn("space-y-4", isMobile && "space-y-3")}>
              {/* Stats use all consagracoes for accurate totals */}
              <StatsHeader consagracoes={allConsagracoes || []} isMobile={isMobile} />
              
              <div className={cn("space-y-3", isMobile && "space-y-2")}>
                {consagracoes.map((consagracao) => (
                  <ConsagracaoCard
                    key={consagracao.id}
                    consagracao={consagracao}
                    onSaveObservacao={handleSaveObservacao}
                    isSaving={savingId === consagracao.id}
                    isMobile={isMobile}
                  />
                ))}
              </div>

              {/* Pagination Controls - Requirements: 3.2 */}
              {showPagination && (
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  isLoading={isLoading}
                />
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export default HistoricoConsagracoesDialog;
