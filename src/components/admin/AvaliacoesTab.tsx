import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, Check, X, Clock, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useActiveHouse } from '@/hooks/useActiveHouse';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Rating {
  id: string;
  score: number;
  comment: string | null;
  approved: boolean;
  created_at: string;
  profiles: { full_name: string | null } | { full_name: string | null }[] | null;
  cerimonias: { nome: string | null; medicina_principal: string | null } | { nome: string | null; medicina_principal: string | null }[] | null;
}

export function AvaliacoesTab() {
  const { data: house } = useActiveHouse();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'pending' | 'approved' | 'all'>('pending');

  const { data: ratings, isLoading } = useQuery({
    queryKey: ['admin-ratings', house?.id, filter],
    queryFn: async () => {
      if (!house?.id) return [];

      let query = supabase
        .from('house_ratings')
        .select(`
          id,
          score,
          comment,
          approved,
          created_at,
          profiles:user_id(full_name),
          cerimonias:ceremony_id(nome, medicina_principal)
        `)
        .eq('house_id', house.id)
        .order('created_at', { ascending: false });

      if (filter === 'pending') {
        query = query.eq('approved', false);
      } else if (filter === 'approved') {
        query = query.eq('approved', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Rating[];
    },
    enabled: !!house?.id,
  });

  const approveRating = useMutation({
    mutationFn: async (ratingId: string) => {
      const { error } = await supabase
        .from('house_ratings')
        .update({
          approved: true,
          approved_at: new Date().toISOString(),
          approved_by: user?.id,
        })
        .eq('id', ratingId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ratings'] });
      toast.success('Avaliação aprovada!');
    },
    onError: () => {
      toast.error('Erro ao aprovar avaliação');
    },
  });

  const rejectRating = useMutation({
    mutationFn: async (ratingId: string) => {
      const { error } = await supabase
        .from('house_ratings')
        .delete()
        .eq('id', ratingId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ratings'] });
      toast.success('Avaliação removida');
    },
    onError: () => {
      toast.error('Erro ao remover avaliação');
    },
  });

  const pendingCount = ratings?.filter(r => !r.approved).length || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5" />
          Avaliações
          {pendingCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {pendingCount} pendente{pendingCount !== 1 ? 's' : ''}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Gerencie as avaliações dos consagradores sobre sua casa.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
          <TabsList className="mb-4">
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />
              Pendentes
            </TabsTrigger>
            <TabsTrigger value="approved" className="gap-2">
              <Check className="h-4 w-4" />
              Aprovadas
            </TabsTrigger>
            <TabsTrigger value="all">Todas</TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : ratings && ratings.length > 0 ? (
              ratings.map((rating) => (
                <Card key={rating.id} className="border-muted">
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= rating.score
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-muted-foreground/30'
                                }`}
                              />
                            ))}
                          </div>
                          {!rating.approved && (
                            <Badge variant="outline" className="text-xs">
                              Pendente
                            </Badge>
                          )}
                        </div>
                        
                        {rating.comment && (
                          <p className="text-sm text-muted-foreground mb-2">
                            "{rating.comment}"
                          </p>
                        )}
                        
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="font-medium">
                            {Array.isArray(rating.profiles) 
                              ? rating.profiles[0]?.full_name 
                              : rating.profiles?.full_name || 'Consagrador'}
                          </span>
                          <span>•</span>
                          <span>
                            {Array.isArray(rating.cerimonias)
                              ? rating.cerimonias[0]?.nome || rating.cerimonias[0]?.medicina_principal
                              : rating.cerimonias?.nome || rating.cerimonias?.medicina_principal || 'Cerimônia'}
                          </span>
                          <span>•</span>
                          <span>
                            {format(new Date(rating.created_at), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        </div>
                      </div>

                      {!rating.approved && (
                        <div className="flex gap-2 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => approveRating.mutate(rating.id)}
                            disabled={approveRating.isPending}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => rejectRating.mutate(rating.id)}
                            disabled={rejectRating.isPending}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Star className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                <p>Nenhuma avaliação {filter === 'pending' ? 'pendente' : filter === 'approved' ? 'aprovada' : ''}.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
