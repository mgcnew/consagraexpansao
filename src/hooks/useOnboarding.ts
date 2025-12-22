import { useState, useEffect, useCallback } from 'react';

const ONBOARDING_KEY = 'onboarding_completed';

export const useOnboarding = () => {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);

  // Verificar se já completou o onboarding
  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_KEY);
    setHasCompletedOnboarding(completed === 'true');
    
    // Se não completou, mostrar automaticamente
    if (completed !== 'true') {
      setShowTutorial(true);
    }
  }, []);

  // Marcar como completado
  const completeOnboarding = useCallback(() => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setHasCompletedOnboarding(true);
    setShowTutorial(false);
  }, []);

  // Abrir tutorial manualmente (para rever)
  const openTutorial = useCallback(() => {
    setShowTutorial(true);
  }, []);

  // Fechar tutorial sem marcar como completado
  const closeTutorial = useCallback(() => {
    setShowTutorial(false);
  }, []);

  // Resetar onboarding (para testes)
  const resetOnboarding = useCallback(() => {
    localStorage.removeItem(ONBOARDING_KEY);
    setHasCompletedOnboarding(false);
  }, []);

  return {
    hasCompletedOnboarding,
    showTutorial,
    completeOnboarding,
    openTutorial,
    closeTutorial,
    resetOnboarding,
  };
};
