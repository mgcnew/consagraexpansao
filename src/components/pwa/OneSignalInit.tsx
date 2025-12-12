import { useEffect } from 'react';
import { useOneSignal } from '@/hooks/useOneSignal';

/**
 * Componente invisível que inicializa o OneSignal
 * Deve ser colocado dentro do AuthProvider
 */
const OneSignalInit: React.FC = () => {
  const { isInitialized } = useOneSignal();

  useEffect(() => {
    if (isInitialized) {
      console.log('OneSignal pronto para uso');
    }
  }, [isInitialized]);

  return null;
};

export default OneSignalInit;
