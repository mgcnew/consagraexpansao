import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Building2, ChevronDown, Plus, Search } from 'lucide-react';
import { useUserHouses, setLastAccessedHouse, getRoleLabel, getRoleBadgeColor } from '@/hooks/useUserHouses';
import { useActiveHouse } from '@/hooks/useActiveHouse';
import { ROUTES } from '@/constants';
import { cn } from '@/lib/utils';

interface HouseSelectorProps {
  collapsed?: boolean;
}

const HouseSelector: React.FC<HouseSelectorProps> = ({ collapsed = false }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: houses, isLoading } = useUserHouses();
  const { data: activeHouse } = useActiveHouse();

  // Se não tem casas ou está carregando, não mostrar
  if (isLoading || !houses || houses.length === 0) {
    return null;
  }

  // Se só tem uma casa, mostrar apenas o nome sem dropdown
  if (houses.length === 1) {
    const house = houses[0];
    return (
      <div className={cn(
        "flex items-center gap-2 px-2 py-1.5 rounded-lg bg-muted/50",
        collapsed && "justify-center px-1"
      )}>
        <Avatar className="h-7 w-7">
          <AvatarImage src={house.logo_url || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary text-xs">
            {house.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{house.name}</p>
            <p className="text-[10px] text-muted-foreground">{getRoleLabel(house.role)}</p>
          </div>
        )}
      </div>
    );
  }

  // Encontrar a casa ativa na lista
  const currentHouse = houses.find(h => h.id === activeHouse?.id) || houses[0];

  const handleSelectHouse = (houseId: string) => {
    setLastAccessedHouse(houseId);
    // Invalidar queries para recarregar dados da nova casa
    queryClient.invalidateQueries({ queryKey: ['active-house'] });
    // Recarregar a página para aplicar a mudança
    window.location.reload();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className={cn(
            "w-full justify-start gap-2 h-auto py-2 px-2 hover:bg-muted/80",
            collapsed && "justify-center px-1"
          )}
        >
          <Avatar className="h-7 w-7 shrink-0">
            <AvatarImage src={currentHouse.logo_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {currentHouse.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium truncate">{currentHouse.name}</p>
                <p className="text-[10px] text-muted-foreground">{getRoleLabel(currentHouse.role)}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          Suas casas ({houses.length})
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {houses.map((house) => (
          <DropdownMenuItem
            key={house.id}
            onClick={() => handleSelectHouse(house.id)}
            className={cn(
              "flex items-center gap-3 py-2.5 cursor-pointer",
              house.id === activeHouse?.id && "bg-primary/10"
            )}
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={house.logo_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {house.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{house.name}</p>
              <Badge 
                variant="secondary" 
                className={cn("text-[10px] px-1.5 py-0", getRoleBadgeColor(house.role))}
              >
                {getRoleLabel(house.role)}
              </Badge>
            </div>
            {house.id === activeHouse?.id && (
              <div className="w-2 h-2 rounded-full bg-primary" />
            )}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={() => navigate(ROUTES.BUSCAR_CASAS)}
          className="flex items-center gap-2 text-muted-foreground"
        >
          <Search className="h-4 w-4" />
          Buscar outras casas
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => navigate(ROUTES.AUTH + '?demo=true')}
          className="flex items-center gap-2 text-primary"
        >
          <Plus className="h-4 w-4" />
          Criar nova casa
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default HouseSelector;
