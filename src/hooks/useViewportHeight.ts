import { useEffect } from 'react';

/**
 * Hook que atualiza a variável CSS --app-height com a altura real do viewport
 * Considera o teclado virtual no mobile usando visualViewport API
 */
export function useViewportHeight() {
  useEffect(() => {
    const updateHeight = () => {
      // Usa visualViewport se disponível (melhor para mobile com teclado)
      const height = window.visualViewport?.height || window.innerHeight;
      document.documentElement.style.setProperty('--app-height', `${height}px`);
    };

    // Atualiza na montagem
    updateHeight();

    // Listeners para mudanças de viewport
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateHeight);
      window.visualViewport.addEventListener('scroll', updateHeight);
    } else {
      window.addEventListener('resize', updateHeight);
    }

    // Cleanup
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateHeight);
        window.visualViewport.removeEventListener('scroll', updateHeight);
      } else {
        window.removeEventListener('resize', updateHeight);
      }
    };
  }, []);
}
