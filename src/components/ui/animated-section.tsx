import { ReactNode, Suspense, lazy, ComponentType } from 'react';
import { useInView } from '@/hooks/useInView';
import { cn } from '@/lib/utils';

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  animation?: 'fade-up' | 'fade-in' | 'fade-left' | 'fade-right' | 'scale';
}

/**
 * Wrapper que anima elementos quando entram na viewport
 */
export function AnimatedSection({ 
  children, 
  className,
  delay = 0,
  animation = 'fade-up'
}: AnimatedSectionProps) {
  const { ref, inView } = useInView({ threshold: 0.1, rootMargin: '50px' });

  const animationClasses = {
    'fade-up': 'translate-y-8 opacity-0',
    'fade-in': 'opacity-0',
    'fade-left': '-translate-x-8 opacity-0',
    'fade-right': 'translate-x-8 opacity-0',
    'scale': 'scale-95 opacity-0',
  };

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all duration-700 ease-out',
        inView ? 'translate-y-0 translate-x-0 scale-100 opacity-100' : animationClasses[animation],
        className
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

interface LazyLoadSectionProps {
  component: ComponentType<any>;
  fallback?: ReactNode;
  props?: Record<string, any>;
}

/**
 * Carrega componente apenas quando visivel na viewport
 */
export function LazyLoadSection({ component: Component, fallback, props = {} }: LazyLoadSectionProps) {
  const { ref, inView } = useInView({ threshold: 0, rootMargin: '200px' });

  return (
    <div ref={ref}>
      {inView ? (
        <Suspense fallback={fallback || <SectionSkeleton />}>
          <AnimatedSection>
            <Component {...props} />
          </AnimatedSection>
        </Suspense>
      ) : (
        <SectionSkeleton />
      )}
    </div>
  );
}

function SectionSkeleton() {
  return (
    <div className="py-20">
      <div className="container mx-auto px-4">
        <div className="h-8 w-48 bg-muted rounded-lg mx-auto mb-4 animate-pulse" />
        <div className="h-4 w-96 max-w-full bg-muted rounded mx-auto mb-8 animate-pulse" />
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
