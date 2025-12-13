import React from 'react';
import { CheckCircle2, XCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SuccessAnimationProps {
  type?: 'success' | 'error' | 'warning' | 'info';
  message?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const SuccessAnimation: React.FC<SuccessAnimationProps> = ({
  type = 'success',
  message,
  className,
  size = 'md',
}) => {
  const icons = {
    success: CheckCircle2,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
  };

  const colors = {
    success: 'text-green-500 bg-green-500/10',
    error: 'text-red-500 bg-red-500/10',
    warning: 'text-amber-500 bg-amber-500/10',
    info: 'text-blue-500 bg-blue-500/10',
  };

  const sizes = {
    sm: { container: 'w-12 h-12', icon: 'w-6 h-6', text: 'text-sm' },
    md: { container: 'w-16 h-16', icon: 'w-8 h-8', text: 'text-base' },
    lg: { container: 'w-20 h-20', icon: 'w-10 h-10', text: 'text-lg' },
  };

  const Icon = icons[type];

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <div
        className={cn(
          'rounded-full flex items-center justify-center animate-scale-in',
          colors[type],
          sizes[size].container
        )}
      >
        <Icon className={cn('animate-check-mark', sizes[size].icon)} />
      </div>
      {message && (
        <p className={cn('text-center text-muted-foreground animate-fade-in', sizes[size].text)}>
          {message}
        </p>
      )}
    </div>
  );
};

export default SuccessAnimation;
