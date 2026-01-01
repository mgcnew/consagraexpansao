import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
}

/**
 * Wrapper simples para secoes - sem animacao para evitar piscadas
 */
export function AnimatedSection({ 
  children, 
  className,
}: AnimatedSectionProps) {
  return (
    <div className={cn(className)}>
      {children}
    </div>
  );
}
