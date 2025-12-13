import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingStateProps {
  message?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'spinner' | 'dots' | 'pulse';
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message,
  className,
  size = 'md',
  variant = 'spinner',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  if (variant === 'dots') {
    return (
      <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                'rounded-full bg-primary animate-bounce',
                size === 'sm' ? 'w-1.5 h-1.5' : size === 'md' ? 'w-2 h-2' : 'w-3 h-3'
              )}
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
        {message && (
          <p className={cn('text-muted-foreground', textSizes[size])}>{message}</p>
        )}
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
        <div
          className={cn(
            'rounded-full bg-primary/20 animate-pulse',
            size === 'sm' ? 'w-8 h-8' : size === 'md' ? 'w-12 h-12' : 'w-16 h-16'
          )}
        />
        {message && (
          <p className={cn('text-muted-foreground', textSizes[size])}>{message}</p>
        )}
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
      {message && (
        <p className={cn('text-muted-foreground', textSizes[size])}>{message}</p>
      )}
    </div>
  );
};

// Componente de loading para página inteira
export const PageLoading: React.FC<{ message?: string }> = ({ message = 'Carregando...' }) => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <LoadingState message={message} size="lg" />
  </div>
);

// Componente de loading inline
export const InlineLoading: React.FC<{ message?: string }> = ({ message }) => (
  <LoadingState message={message} size="sm" variant="dots" className="py-4" />
);

export default LoadingState;
