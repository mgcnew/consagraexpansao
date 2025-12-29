import { useMemo } from 'react';
import { useActiveHouse } from './useActiveHouse';

export interface TrialStatus {
  /** Se a casa está em período de trial */
  isTrial: boolean;
  /** Se o trial expirou */
  isExpired: boolean;
  /** Se a casa tem assinatura ativa */
  isActive: boolean;
  /** Dias restantes do trial (0 se não está em trial ou expirou) */
  daysRemaining: number;
  /** Data de expiração do trial */
  trialEndsAt: Date | null;
  /** Status da assinatura */
  subscriptionStatus: 'trial' | 'active' | 'canceled' | 'expired' | null;
  /** Se está carregando */
  isLoading: boolean;
}

export function useTrialStatus(): TrialStatus {
  const { data: house, isLoading } = useActiveHouse();

  return useMemo(() => {
    if (!house) {
      return {
        isTrial: false,
        isExpired: false,
        isActive: false,
        daysRemaining: 0,
        trialEndsAt: null,
        subscriptionStatus: null,
        isLoading,
      };
    }

    const status = house.subscription_status as 'trial' | 'active' | 'canceled' | 'expired';
    const trialEndsAt = house.trial_ends_at ? new Date(house.trial_ends_at) : null;
    const now = new Date();

    // Calcular dias restantes
    let daysRemaining = 0;
    if (status === 'trial' && trialEndsAt) {
      const diffTime = trialEndsAt.getTime() - now.getTime();
      daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }

    // Verificar se expirou
    const isExpired = status === 'expired' || (status === 'trial' && trialEndsAt && trialEndsAt < now);

    return {
      isTrial: status === 'trial' && !isExpired,
      isExpired,
      isActive: status === 'active',
      daysRemaining,
      trialEndsAt,
      subscriptionStatus: status,
      isLoading,
    };
  }, [house, isLoading]);
}
