import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useActiveHouse } from './useActiveHouse';

// Códigos de features disponíveis
export type PlanFeature = 
  | 'cerimonias'
  | 'inscricoes'
  | 'pagamentos'
  | 'pagina_publica'
  | 'loja'
  | 'cursos'
  | 'relatorios_basicos'
  | 'galeria'
  | 'depoimentos'
  | 'multiplos_admins'
  | 'relatorios_avancados'
  | 'dominio_personalizado'
  | 'api'
  | 'biblioteca';

interface HousePlan {
  id: string;
  name: string;
  price_cents: number;
  allowed_features: PlanFeature[];
}

/**
 * Hook para buscar o plano da casa ativa e suas features
 */
export function useHousePlan() {
  const { data: activeHouse } = useActiveHouse();

  return useQuery({
    queryKey: ['house-plan', activeHouse?.id],
    queryFn: async (): Promise<HousePlan | null> => {
      if (!activeHouse?.id) return null;

      // Buscar o plano da casa
      const { data: house } = await supabase
        .from('houses')
        .select('plan_id')
        .eq('id', activeHouse.id)
        .single();

      if (!house?.plan_id) return null;

      // Buscar detalhes do plano
      const { data: plan } = await supabase
        .from('house_plans')
        .select('id, name, price_cents, allowed_features')
        .eq('id', house.plan_id)
        .single();

      if (!plan) return null;

      return {
        ...plan,
        allowed_features: (plan.allowed_features as PlanFeature[]) || [],
      };
    },
    enabled: !!activeHouse?.id,
    staleTime: 1000 * 60 * 2, // 2 minutos - reduzido para pegar mudanças de plano mais rápido
    refetchOnWindowFocus: true, // Refetch ao voltar para a aba
  });
}

/**
 * Hook para verificar se uma feature está disponível no plano atual
 */
export function usePlanFeature(feature: PlanFeature): { hasFeature: boolean; isLoading: boolean; planName: string | null } {
  const { data: plan, isLoading } = useHousePlan();

  const hasFeature = plan?.allowed_features?.includes(feature) ?? false;

  return {
    hasFeature,
    isLoading,
    planName: plan?.name ?? null,
  };
}

/**
 * Hook para verificar múltiplas features
 */
export function useCheckPlanFeatures() {
  const { data: plan, isLoading, refetch } = useHousePlan();

  const hasFeature = (feature: PlanFeature): boolean => {
    return plan?.allowed_features?.includes(feature) ?? false;
  };

  const hasAnyFeature = (features: PlanFeature[]): boolean => {
    return features.some(f => plan?.allowed_features?.includes(f));
  };

  const hasAllFeatures = (features: PlanFeature[]): boolean => {
    return features.every(f => plan?.allowed_features?.includes(f));
  };

  return {
    hasFeature,
    hasAnyFeature,
    hasAllFeatures,
    isLoading,
    plan,
    refetchPlan: refetch, // Expor função para forçar refresh
  };
}
