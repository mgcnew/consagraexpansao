import React from 'react';
import { usePlanFeature, useHousePlan, type PlanFeature } from '@/hooks/usePlanFeatures';
import { Loader2, Lock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface PlanGateProps {
  /** Feature necessária para ver o conteúdo */
  feature: PlanFeature;
  /** Conteúdo a ser exibido se tiver a feature */
  children: React.ReactNode;
  /** Conteúdo alternativo se não tiver a feature (opcional) */
  fallback?: React.ReactNode;
  /** Se true, mostra loading enquanto verifica */
  showLoading?: boolean;
  /** Se true, esconde completamente ao invés de mostrar fallback */
  hideIfBlocked?: boolean;
}

/**
 * Componente para proteger áreas da UI baseado no plano da casa
 * 
 * @example
 * <PlanGate feature="loja">
 *   <LojaTab />
 * </PlanGate>
 * 
 * @example
 * <PlanGate feature="cursos" hideIfBlocked>
 *   <CursosLink />
 * </PlanGate>
 */
export const PlanGate: React.FC<PlanGateProps> = ({
  feature,
  children,
  fallback,
  showLoading = false,
  hideIfBlocked = false,
}) => {
  const { hasFeature, isLoading, planName } = usePlanFeature(feature);
  const navigate = useNavigate();

  if (isLoading) {
    if (showLoading) {
      return (
        <div className="flex items-center justify-center p-4">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      );
    }
    return null;
  }

  if (hasFeature) {
    return <>{children}</>;
  }

  // Sem a feature
  if (hideIfBlocked) {
    return null;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  // Fallback padrão - upgrade prompt
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/30 rounded-lg border border-dashed">
      <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
        <Lock className="w-6 h-6 text-amber-600" />
      </div>
      <h3 className="font-semibold text-lg mb-2">Recurso não disponível</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-sm">
        Este recurso não está incluído no seu plano atual ({planName || 'Básico'}).
        Faça upgrade para desbloquear mais funcionalidades.
      </p>
      <Button 
        variant="outline" 
        className="gap-2"
        onClick={() => navigate('/app/configuracoes?tab=plano')}
      >
        <Sparkles className="w-4 h-4" />
        Ver planos
      </Button>
    </div>
  );
};

/**
 * Componente para mostrar badge de upgrade em itens bloqueados
 */
export const PlanBadge: React.FC<{ feature: PlanFeature }> = ({ feature }) => {
  const { hasFeature } = usePlanFeature(feature);

  if (hasFeature) return null;

  return (
    <span className="ml-2 px-1.5 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded">
      PRO
    </span>
  );
};

export default PlanGate;
