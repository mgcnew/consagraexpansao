import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface RatingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ceremonyId: string;
  ceremonyName: string;
  houseId: string;
  houseName: string;
}

export function RatingModal({
  open,
  onOpenChange,
  ceremonyId,
  ceremonyName,
  houseId,
  houseName,
}: RatingModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [score, setScore] = useState(0);
  const [hoverScore, setHoverScore] = useState(0);
  const [comment, setComment] = useState('');

  const submitRating = useMutation({
    mutationFn: async () => {
      if (!user?.id || score === 0) {
        throw new Error('Selecione uma nota');
      }

      const { error } = await supabase.from('house_ratings').insert({
        house_id: houseId,
        user_id: user.id,
        ceremony_id: ceremonyId,
        score,
        comment: comment.trim() || null,
        approved: false, // Aguarda aprovação do admin
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-ratings'] });
      toast.success('Avaliação enviada!', {
        description: 'Obrigado pelo seu feedback. Sua avaliação será revisada.',
      });
      onOpenChange(false);
      setScore(0);
      setComment('');
    },
    onError: (error: any) => {
      toast.error('Erro ao enviar avaliação', {
        description: error.message,
      });
    },
  });

  const displayScore = hoverScore || score;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Avaliar experiência</DialogTitle>
          <DialogDescription>
            Como foi sua experiência na cerimônia "{ceremonyName}" em {houseName}?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Estrelas */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setScore(value)}
                  onMouseEnter={() => setHoverScore(value)}
                  onMouseLeave={() => setHoverScore(0)}
                  className="p-1 transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star
                    className={cn(
                      'h-8 w-8 transition-colors',
                      value <= displayScore
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-muted-foreground/30'
                    )}
                  />
                </button>
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              {displayScore === 0 && 'Toque para avaliar'}
              {displayScore === 1 && 'Ruim'}
              {displayScore === 2 && 'Regular'}
              {displayScore === 3 && 'Bom'}
              {displayScore === 4 && 'Muito bom'}
              {displayScore === 5 && 'Excelente'}
            </span>
          </div>

          {/* Comentário */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Comentário (opcional)
            </label>
            <Textarea
              placeholder="Conte um pouco sobre sua experiência..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {comment.length}/500
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Depois
          </Button>
          <Button
            onClick={() => submitRating.mutate()}
            disabled={score === 0 || submitRating.isPending}
            className="flex-1"
          >
            {submitRating.isPending ? 'Enviando...' : 'Enviar avaliação'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
