import { useEffect, useRef, RefObject } from 'react';

/**
 * Hook que gerencia auto-scroll suave para o final da lista de mensagens
 * Ativa quando mensagens mudam ou viewport é redimensionado
 */
export function useChatAutoScroll<T>(
  dependencies: T[],
  enabled: boolean = true
): RefObject<HTMLDivElement> {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isUserScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<number>();

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (!scrollRef.current || !enabled) return;
    
    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior,
    });
  };

  // Detecta se usuário está rolando manualmente
  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = element;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      
      // Se não está no final, usuário está rolando
      isUserScrollingRef.current = !isAtBottom;
      
      // Reset após 2s de inatividade
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = window.setTimeout(() => {
        isUserScrollingRef.current = false;
      }, 2000);
    };

    element.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      element.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Auto-scroll quando dependências mudam (novas mensagens)
  useEffect(() => {
    if (!isUserScrollingRef.current) {
      // Pequeno delay para garantir que o DOM foi atualizado
      setTimeout(() => scrollToBottom('smooth'), 50);
    }
  }, dependencies);

  // Auto-scroll quando viewport muda (teclado abre/fecha)
  useEffect(() => {
    if (!enabled) return;

    const handleResize = () => {
      if (!isUserScrollingRef.current) {
        scrollToBottom('auto'); // Sem animação para resize
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      return () => window.visualViewport.removeEventListener('resize', handleResize);
    } else {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [enabled]);

  return scrollRef;
}
