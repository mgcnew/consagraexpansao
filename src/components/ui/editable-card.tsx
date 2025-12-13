import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Pencil, Trash2, Copy, MoreVertical, type LucideIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CardAction {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'destructive';
}

interface EditableCardProps {
  children: React.ReactNode;
  isAdmin?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  customActions?: CardAction[];
  className?: string;
  showBorder?: boolean;
}

/**
 * Card com indicador visual de modo admin e ações contextuais
 * - Desktop: Ações aparecem no hover
 * - Mobile: Menu dropdown no canto
 */
export const EditableCard: React.FC<EditableCardProps> = ({
  children,
  isAdmin = false,
  onEdit,
  onDelete,
  onDuplicate,
  customActions = [],
  className,
  showBorder = true,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  if (!isAdmin) {
    return <Card className={className}>{children}</Card>;
  }

  const actions: CardAction[] = [
    ...(onEdit ? [{ icon: Pencil, label: 'Editar', onClick: onEdit }] : []),
    ...(onDuplicate ? [{ icon: Copy, label: 'Duplicar', onClick: onDuplicate }] : []),
    ...customActions,
    ...(onDelete ? [{ icon: Trash2, label: 'Excluir', onClick: onDelete, variant: 'destructive' as const }] : []),
  ];

  return (
    <Card
      className={cn(
        'relative transition-all duration-200',
        showBorder && 'border-l-2 border-l-primary/50',
        isHovered && 'shadow-md',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Indicador de editável */}
      {showBorder && (
        <div className="absolute -left-px top-2 bottom-2 w-0.5 bg-primary/50 rounded-full" />
      )}

      {/* Ações no hover - Desktop */}
      <div
        className={cn(
          'absolute top-2 right-2 hidden md:flex gap-1 transition-all duration-200',
          isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1 pointer-events-none'
        )}
      >
        {actions.slice(0, 2).map((action, index) => (
          <Button
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              action.onClick();
            }}
            variant="secondary"
            size="icon"
            className={cn(
              'h-8 w-8 shadow-sm',
              action.variant === 'destructive' && 'hover:bg-destructive hover:text-destructive-foreground'
            )}
            title={action.label}
          >
            <action.icon className="w-4 h-4" />
          </Button>
        ))}
        {actions.length > 2 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="h-8 w-8 shadow-sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {actions.slice(2).map((action, index) => (
                <React.Fragment key={index}>
                  {action.variant === 'destructive' && index > 0 && <DropdownMenuSeparator />}
                  <DropdownMenuItem
                    onClick={action.onClick}
                    className={cn(action.variant === 'destructive' && 'text-destructive')}
                  >
                    <action.icon className="w-4 h-4 mr-2" />
                    {action.label}
                  </DropdownMenuItem>
                </React.Fragment>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Menu dropdown - Mobile */}
      <div className="absolute top-2 right-2 md:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {actions.map((action, index) => (
              <React.Fragment key={index}>
                {action.variant === 'destructive' && index > 0 && <DropdownMenuSeparator />}
                <DropdownMenuItem
                  onClick={action.onClick}
                  className={cn(action.variant === 'destructive' && 'text-destructive')}
                >
                  <action.icon className="w-4 h-4 mr-2" />
                  {action.label}
                </DropdownMenuItem>
              </React.Fragment>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {children}
    </Card>
  );
};

export default EditableCard;
