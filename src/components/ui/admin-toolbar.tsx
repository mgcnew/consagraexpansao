import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Settings, type LucideIcon } from 'lucide-react';

interface ToolbarAction {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'ghost';
}

interface AdminToolbarProps {
  title?: string;
  actions: ToolbarAction[];
  className?: string;
}

/**
 * Barra de ferramentas de admin que aparece no topo da página
 * Indica visualmente que o usuário está em modo admin
 */
export const AdminToolbar: React.FC<AdminToolbarProps> = ({
  title = 'Modo Admin',
  actions,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 px-4 py-2 mb-4 rounded-lg',
        'bg-primary/5 border border-primary/20',
        'animate-fade-in',
        className
      )}
    >
      <div className="flex items-center gap-2">
        <Settings className="w-4 h-4 text-primary" />
        <Badge variant="outline" className="border-primary/30 text-primary text-xs">
          {title}
        </Badge>
      </div>

      <div className="flex items-center gap-2">
        {actions.map((action, index) => (
          <Button
            key={index}
            onClick={action.onClick}
            variant={action.variant || 'outline'}
            size="sm"
            className={cn(
              'h-8 text-xs',
              action.variant === 'default' && 'bg-primary text-primary-foreground hover:bg-primary/90'
            )}
          >
            <action.icon className="w-3.5 h-3.5 mr-1.5" />
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default AdminToolbar;
