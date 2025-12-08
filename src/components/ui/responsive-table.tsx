import * as React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ResponsiveTableProps {
  children: React.ReactNode;
  className?: string;
}

interface MobileCardProps {
  children: React.ReactNode;
  className?: string;
}

interface MobileCardRowProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

interface MobileCardActionsProps {
  children: React.ReactNode;
  className?: string;
}

// Container que alterna entre tabela e cards baseado no tamanho da tela
export function ResponsiveTable({ children, className }: ResponsiveTableProps) {
  return (
    <div className={cn("w-full", className)}>
      {children}
    </div>
  );
}

// Wrapper para conteúdo desktop (tabela)
export function DesktopTable({ children, className }: ResponsiveTableProps) {
  const isMobile = useIsMobile();
  
  if (isMobile) return null;
  
  return <div className={cn("hidden md:block", className)}>{children}</div>;
}

// Wrapper para conteúdo mobile (cards)
export function MobileCards({ children, className }: ResponsiveTableProps) {
  const isMobile = useIsMobile();
  
  if (!isMobile) return null;
  
  return (
    <div className={cn("md:hidden space-y-3", className)}>
      {children}
    </div>
  );
}

// Card individual para visualização mobile
export function MobileCard({ children, className }: MobileCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-4 space-y-3">
        {children}
      </CardContent>
    </Card>
  );
}

// Linha de dados dentro do card mobile
export function MobileCardRow({ label, children, className }: MobileCardRowProps) {
  return (
    <div className={cn("flex items-center justify-between gap-2", className)}>
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <div className="text-sm font-medium text-right">{children}</div>
    </div>
  );
}

// Header do card mobile (nome/título principal)
export function MobileCardHeader({ children, className }: MobileCardProps) {
  return (
    <div className={cn("font-medium text-base pb-2 border-b border-border", className)}>
      {children}
    </div>
  );
}

// Área de ações do card mobile
export function MobileCardActions({ children, className }: MobileCardActionsProps) {
  return (
    <div className={cn("flex items-center gap-2 pt-2 border-t border-border mt-2", className)}>
      {children}
    </div>
  );
}
