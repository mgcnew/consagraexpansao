import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CheckCircle2, Clock, XCircle, AlertTriangle, DollarSign } from 'lucide-react';

type StatusType = 'success' | 'warning' | 'error' | 'pending' | 'info' | 'paid' | 'unpaid';

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  showIcon?: boolean;
  className?: string;
}

const statusConfig: Record<StatusType, {
  classes: string;
  icon: React.ElementType;
  defaultLabel: string;
}> = {
  success: {
    classes: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 border-green-200 dark:border-green-800',
    icon: CheckCircle2,
    defaultLabel: 'Sucesso',
  },
  warning: {
    classes: 'bg-amber-50 text-amber-800 dark:bg-amber-950/20 dark:text-amber-200 border-amber-200 dark:border-amber-900',
    icon: AlertTriangle,
    defaultLabel: 'Atenção',
  },
  error: {
    classes: 'bg-destructive/10 text-destructive border-destructive/30',
    icon: XCircle,
    defaultLabel: 'Erro',
  },
  pending: {
    classes: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/20 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800',
    icon: Clock,
    defaultLabel: 'Pendente',
  },
  info: {
    classes: 'bg-blue-50 text-blue-800 dark:bg-blue-950/20 dark:text-blue-200 border-blue-200 dark:border-blue-900',
    icon: AlertTriangle,
    defaultLabel: 'Info',
  },
  paid: {
    classes: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 border-green-200 dark:border-green-800',
    icon: DollarSign,
    defaultLabel: 'Pago',
  },
  unpaid: {
    classes: 'text-amber-600 border-amber-300 dark:text-amber-400 dark:border-amber-700',
    icon: Clock,
    defaultLabel: 'Pendente',
  },
};

/**
 * Badge padronizado para exibir status
 * Garante consistência visual em todo o portal
 */
const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  showIcon = true,
  className,
}) => {
  const config = statusConfig[status];
  const Icon = config.icon;
  const displayLabel = label || config.defaultLabel;

  return (
    <Badge
      variant={status === 'unpaid' ? 'outline' : 'default'}
      className={cn(config.classes, 'flex items-center gap-1', className)}
    >
      {showIcon && <Icon className="w-3 h-3" />}
      {displayLabel}
    </Badge>
  );
};

export default StatusBadge;
