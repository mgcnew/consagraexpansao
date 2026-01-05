import { useQuery } from '@tanstack/react-query';
import { Star, MessageCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface HouseRatingsProps {
  houseId: string;
  limit?: number;
}

export function HouseRatings({ houseId, limit = 5 }: HouseRatingsProps) {
  const { data: ratings, isLoading } = useQuery({
    queryKey: ['house-ratings', houseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('house_ratings')
        .select(`
          id,
          score,
          comment,
          created_at,
          profiles:user_id(full_name)
        `)
        .eq('house_id', houseId)
        .eq('approved', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },
    enabled: !!houseId,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="py-4">
              <div className="h-4 bg-muted rounded w-24 mb-2" />
              <div className="h-3 bg-muted rounded w-full mb-1" />
              <div className="h-3 bg-muted rounded w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!ratings || ratings.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <MessageCircle className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <p>Ainda não há avaliações.</p>
          <p className="text-sm mt-1">Seja o primeiro a avaliar!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {ratings.map((rating: any) => (
        <Card key={rating.id}>
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1">
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
              <span className="text-xs text-muted-foreground">
                {format(new Date(rating.created_at), "dd/MM/yyyy", { locale: ptBR })}
              </span>
            </div>
            {rating.comment && (
              <p className="text-sm text-muted-foreground italic mb-2">
                "{rating.comment}"
              </p>
            )}
            <p className="text-xs font-medium">
              — {rating.profiles?.full_name || 'Consagrador'}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
