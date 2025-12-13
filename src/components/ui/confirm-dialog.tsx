import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, Trash2, LogOut, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'default';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'default',
  isLoading = false,
}) => {
  const icons = {
    danger: Trash2,
    warning: AlertTriangle,
    default: XCircle,
  };

  const colors = {
    danger: 'bg-red-100 text-red-600 dark:bg-red-900/30',
    warning: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30',
    default: 'bg-muted text-muted-foreground',
  };

  const buttonColors = {
    danger: 'bg-destructive hover:bg-destructive/90',
    warning: 'bg-amber-500 hover:bg-amber-600',
    default: '',
  };

  const Icon = icons[variant];

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-start gap-4">
            <div className={cn('p-3 rounded-full', colors[variant])}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <AlertDialogTitle className="text-lg">{title}</AlertDialogTitle>
              {description && (
                <AlertDialogDescription className="mt-2">
                  {description}
                </AlertDialogDescription>
              )}
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel disabled={isLoading}>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(buttonColors[variant])}
          >
            {isLoading ? 'Aguarde...' : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

// Componentes pré-configurados
export const DeleteConfirmDialog: React.FC<Omit<ConfirmDialogProps, 'variant' | 'confirmText'>> = (props) => (
  <ConfirmDialog {...props} variant="danger" confirmText="Excluir" />
);

export const LogoutConfirmDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}> = ({ open, onOpenChange, onConfirm }) => (
  <ConfirmDialog
    open={open}
    onOpenChange={onOpenChange}
    onConfirm={onConfirm}
    title="Sair da conta?"
    description="Você precisará fazer login novamente para acessar o portal."
    confirmText="Sair"
    variant="warning"
  />
);

export default ConfirmDialog;
