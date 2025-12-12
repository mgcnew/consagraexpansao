import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  mainNavItems,
  secondaryNavItems,
  settingsNavItem,
  adminNavItem,
  NavItem,
} from '@/constants/navigation';

interface SidebarProps {
  isAdmin: boolean;
  collapsed: boolean;
  onToggle: () => void;
  onSignOut: () => void;
}

const NavButton: React.FC<{
  item: NavItem;
  isActive: boolean;
  collapsed: boolean;
  onClick: () => void;
}> = ({ item, isActive, collapsed, onClick }) => {
  const button = (
    <Button
      variant="ghost"
      className={cn(
        'w-full justify-start gap-3 h-10 transition-all',
        collapsed ? 'px-2 justify-center' : 'px-3',
        isActive
          ? 'bg-primary/10 text-primary font-medium hover:bg-primary/15'
          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
      )}
      onClick={onClick}
    >
      <item.icon className={cn('w-5 h-5 shrink-0', isActive && 'text-primary')} />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Button>
  );

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={10}>
          {item.label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return button;
};

export const Sidebar: React.FC<SidebarProps> = ({
  isAdmin,
  collapsed,
  onToggle,
  onSignOut,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <TooltipProvider>
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen border-r border-border bg-background transition-all duration-300',
          collapsed ? 'w-16' : 'w-56'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className={cn(
            'flex h-14 items-center border-b border-border px-3',
            collapsed ? 'justify-center' : 'justify-between'
          )}>
            {!collapsed && (
              <div className="flex items-center gap-2">
                <img
                  src="/logo-topbar.png"
                  alt="Logo"
                  className="h-8 w-8 object-contain"
                />
                <span className="font-semibold text-sm">Consciência Divinal</span>
              </div>
            )}
            {collapsed && (
              <img
                src="/logo-topbar.png"
                alt="Logo"
                className="h-8 w-8 object-contain"
              />
            )}
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-2 py-4">
            <nav className="flex flex-col gap-1">
              {/* Main Items */}
              {mainNavItems.map((item) => (
                <NavButton
                  key={item.path}
                  item={item}
                  isActive={location.pathname === item.path}
                  collapsed={collapsed}
                  onClick={() => navigate(item.path)}
                />
              ))}

              {/* Separator */}
              <div className="my-3 h-px bg-border" />

              {/* Secondary Items */}
              {secondaryNavItems.map((item) => (
                <NavButton
                  key={item.path}
                  item={item}
                  isActive={location.pathname === item.path}
                  collapsed={collapsed}
                  onClick={() => navigate(item.path)}
                />
              ))}

              {/* Separator */}
              <div className="my-3 h-px bg-border" />

              {/* Settings */}
              <NavButton
                item={settingsNavItem}
                isActive={location.pathname === settingsNavItem.path}
                collapsed={collapsed}
                onClick={() => navigate(settingsNavItem.path)}
              />

              {/* Admin */}
              {isAdmin && (
                <NavButton
                  item={adminNavItem}
                  isActive={location.pathname === adminNavItem.path}
                  collapsed={collapsed}
                  onClick={() => navigate(adminNavItem.path)}
                />
              )}
            </nav>
          </ScrollArea>

          {/* Footer */}
          <div className="border-t border-border p-2">
            {/* Toggle Button */}
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'w-full justify-center h-9 text-muted-foreground hover:text-foreground',
                !collapsed && 'justify-start px-3 gap-3'
              )}
              onClick={onToggle}
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <>
                  <ChevronLeft className="w-4 h-4" />
                  <span>Recolher</span>
                </>
              )}
            </Button>

            {/* Sign Out */}
            {collapsed ? (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-center h-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={onSignOut}
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={10}>
                  Sair
                </TooltipContent>
              </Tooltip>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start px-3 gap-3 h-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={onSignOut}
              >
                <LogOut className="w-4 h-4" />
                <span>Sair</span>
              </Button>
            )}
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
};

export default Sidebar;
