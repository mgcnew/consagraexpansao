import { Link } from 'react-router-dom';
import { Clock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTrialStatus } from '@/hooks/useTrialStatus';

export function TrialBanner() {
  const { isTrial, daysRemaining, isLoading } = useTrialStatus();

  if (isLoading || !isTrial) {
    return null;
  }

  const isUrgent = daysRemaining <= 2;

  return (
    <div className={`w-full py-2 px-4 text-center text-sm ${
      isUrgent 
        ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white' 
        : 'bg-gradient-to-r from-primary to-amber-600 text-white'
    }`}>
      <div className="container mx-auto flex items-center justify-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span>
            {daysRemaining === 0 
              ? 'Seu período de teste termina hoje!' 
              : daysRemaining === 1 
                ? 'Seu período de teste termina amanhã!' 
                : `${daysRemaining} dias restantes no período de teste`
            }
          </span>
        </div>
        <Link to="/app/configuracoes?tab=assinatura">
          <Button size="sm" variant="secondary" className="h-7 text-xs gap-1">
            <Sparkles className="h-3 w-3" />
            Assinar Agora
          </Button>
        </Link>
      </div>
    </div>
  );
}
