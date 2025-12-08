import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  iconClassName?: string;
  iconContainerClassName?: string;
  centered?: boolean;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Componente reutilizável para headers de página
 * Padroniza título + descrição + ícone em todas as páginas
 */
const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  icon: Icon,
  iconClassName,
  iconContainerClassName,
  centered = false,
  children,
  className,
}) => {
  if (centered) {
    return (
      <div className={cn('text-center mb-8 md:mb-12 animate-fade-in', className)}>
        {Icon && (
          <div
            className={cn(
              'w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 md:mb-6',
              iconContainerClassName
            )}
          >
            <Icon className={cn('w-8 h-8 md:w-10 md:h-10 text-primary', iconClassName)} />
          </div>
        )}
        <h1 className="font-display text-3xl md:text-4xl font-medium text-foreground mb-3 md:mb-4">
          {title}
        </h1>
        {description && (
          <p className="text-base md:text-lg text-muted-foreground font-body max-w-2xl mx-auto">
            {description}
          </p>
        )}
        {children}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 animate-fade-in',
        className
      )}
    >
      <div className="flex items-center gap-4">
        {Icon && (
          <div
            className={cn(
              'w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0',
              iconContainerClassName
            )}
          >
            <Icon className={cn('w-6 h-6 text-primary', iconClassName)} />
          </div>
        )}
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-medium text-foreground">
            {title}
          </h1>
          {description && (
            <p className="text-muted-foreground font-body mt-1">{description}</p>
          )}
        </div>
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
};

export default PageHeader;
