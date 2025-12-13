import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  CalendarX,
  FileQuestion,
  Inbox,
  Search,
  ShoppingBag,
  Users,
  BookOpen,
  Bell,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  variant?: 'default' | 'compact' | 'inline';
}

const iconMap: Record<string, LucideIcon> = {
  calendar: CalendarX,
  file: FileQuestion,
  inbox: Inbox,
  search: Search,
  shop: ShoppingBag,
  users: Users,
  book: BookOpen,
  bell: Bell,
  wallet: Wallet,
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
  variant = 'default',
}) => {
  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center gap-3 py-4 text-muted-foreground', className)}>
        <Icon className="w-5 h-5 opacity-50" />
        <span className="text-sm">{title}</span>
        {action && (
          <Button variant="link" size="sm" onClick={action.onClick} className="p-0 h-auto">
            {action.label}
          </Button>
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn('text-center py-6', className)}>
        <Icon className="w-10 h-10 mx-auto mb-2 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">{title}</p>
        {action && (
          <Button variant="link" size="sm" onClick={action.onClick} className="mt-1">
            {action.label}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn('text-center py-12 px-4', className)}>
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
        <Icon className="w-8 h-8 text-muted-foreground/50" />
      </div>
      <h3 className="text-lg font-medium text-foreground mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick} size="sm">
          {action.label}
        </Button>
      )}
    </div>
  );
};

// Componentes pré-configurados para casos comuns
export const NoCeremoniesState = ({ onAction }: { onAction?: () => void }) => (
  <EmptyState
    icon={CalendarX}
    title="Nenhuma cerimônia disponível"
    description="No momento não há cerimônias agendadas. Volte em breve!"
    action={onAction ? { label: 'Ver histórico', onClick: onAction } : undefined}
  />
);

export const NoInscriptionsState = ({ onAction }: { onAction?: () => void }) => (
  <EmptyState
    icon={BookOpen}
    title="Você ainda não tem inscrições"
    description="Inscreva-se em uma cerimônia para começar sua jornada."
    action={onAction ? { label: 'Ver cerimônias', onClick: onAction } : undefined}
  />
);

export const NoResultsState = ({ query }: { query?: string }) => (
  <EmptyState
    icon={Search}
    title="Nenhum resultado encontrado"
    description={query ? `Não encontramos resultados para "${query}"` : 'Tente ajustar os filtros'}
    variant="compact"
  />
);

export const NoNotificationsState = () => (
  <EmptyState
    icon={Bell}
    title="Nenhuma notificação"
    description="Você está em dia!"
    variant="compact"
  />
);

export const NoTransactionsState = () => (
  <EmptyState
    icon={Wallet}
    title="Nenhuma transação"
    description="As transações aparecerão aqui quando houver movimentações."
    variant="compact"
  />
);

export default EmptyState;
