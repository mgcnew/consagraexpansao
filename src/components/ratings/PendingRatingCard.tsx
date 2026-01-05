import { useState } from 'react';
import { Star, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RatingModal } from './RatingModal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PendingRatingCardProps {
  ceremonyId: string;
  ceremonyName: string;
  ceremonyDate: string;
  houseId: string;
  houseName: string;
  onDismiss?: () => void;
}

export function PendingRatingCard({
  ceremonyId,
  ceremonyName,
  ceremonyDate,
  houseId,
  houseName,
  onDismiss,
}: PendingRatingCardProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 dark:border-amber-800/50">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
              <Star className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">
                Como foi sua experiência?
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {ceremonyName} • {format(new Date(ceremonyDate), "dd 'de' MMMM", { locale: ptBR })}
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-2 h-8 text-xs border-amber-300 hover:bg-amber-100 dark:border-amber-700 dark:hover:bg-amber-900/30"
                onClick={() => setShowModal(true)}
              >
                <Star className="h-3 w-3 mr-1" />
                Avaliar agora
              </Button>
            </div>
            {onDismiss && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={onDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <RatingModal
        open={showModal}
        onOpenChange={setShowModal}
        ceremonyId={ceremonyId}
        ceremonyName={ceremonyName}
        houseId={houseId}
        houseName={houseName}
      />
    </>
  );
}
