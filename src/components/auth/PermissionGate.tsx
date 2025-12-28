import React from 'react';
import { useMinhasPermissoes, type PermissaoNome } from '@/hooks/queries/usePermissoes';
import { useActiveHouse } from '@/hooks/useActiveHouse';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Lock } from 'lucide-react';

interface PermissionGateProps {
  /** Permissão necessária para ver o conteúdo */
  permissao?: PermissaoNome;
  /** Lista de permissões - usuário precisa ter QUALQUER uma */
  permissoes?: PermissaoNome[];
  /** Conteúdo a ser exibido se tiver permissão */
  children: React.ReactNode;
  /** Conteúdo alternativo se não tiver permissão (opcional) */
  fallback?: React.ReactNode;
  /** Se true, mostra loading enquanto verifica */
  showLoading?: boolean;
  /** Se true, esconde completamente ao invés de mostrar fallback */
  hideIfDenied?: boolean;
}

/**
 * Componente para proteger áreas da UI baseado em permissões
 * 
 * @example
 * // Permissão única
 * <PermissionGate permissao="ver_financeiro">
 *   <FinanceiroTab />
 * </PermissionGate>
 * 
 * @example
 * // Múltiplas permissões (qualquer uma)
 * <PermissionGate permissoes={['ver_financeiro', 'gerenciar_pagamentos']}>
 *   <FinanceiroTab />
 * </PermissionGate>
 * 
 * @example
 * // Com fallback customizado
 * <PermissionGate permissao="super_admin" fallback={<p>Sem acesso</p>}>
 *   <AdminConfig />
 * </PermissionGate>
 */
export const PermissionGate: React.FC<PermissionGateProps> = ({
  permissao,
  permissoes,
  children,
  fallback,
  showLoading = false,
  hideIfDenied = false,
}) => {
  const { data: minhasPermissoes, isLoading } = useMinhasPermissoes();
  const { data: activeHouse } = useActiveHouse();
  const { user } = useAuth();

  // Loading state
  if (isLoading) {
    if (showLoading) {
      return (
        <div className="flex items-center justify-center p-4">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      );
    }
    return null;
  }

  // Verificar permissões
  const temPermissao = (): boolean => {
    // Owner da casa tem todas as permissões da casa dele
    const isHouseOwner = activeHouse && user && activeHouse.owner_id === user.id;
    if (isHouseOwner) return true;

    if (!minhasPermissoes) return false;

    // Super admin tem todas as permissões
    const isSuperAdmin = minhasPermissoes.some((p) => p.permissao?.nome === 'super_admin');
    if (isSuperAdmin) return true;

    // Verificar permissão única
    if (permissao) {
      return minhasPermissoes.some((p) => p.permissao?.nome === permissao);
    }

    // Verificar lista de permissões (qualquer uma)
    if (permissoes && permissoes.length > 0) {
      return permissoes.some((perm) => 
        minhasPermissoes.some((p) => p.permissao?.nome === perm)
      );
    }

    return false;
  };

  if (temPermissao()) {
    return <>{children}</>;
  }

  // Sem permissão
  if (hideIfDenied) {
    return null;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  // Fallback padrão
  return (
    <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
      <Lock className="w-8 h-8 mb-2 opacity-50" />
      <p className="text-sm">Você não tem permissão para acessar este conteúdo.</p>
    </div>
  );
};

/**
 * Hook helper para usar em condicionais
 */
export const useCheckPermissao = () => {
  const { data: minhasPermissoes, isLoading } = useMinhasPermissoes();
  const { data: activeHouse } = useActiveHouse();
  const { user } = useAuth();

  // Owner da casa tem todas as permissões da casa dele
  const isHouseOwner = activeHouse && user && activeHouse.owner_id === user.id;

  const temPermissao = (permissao: PermissaoNome): boolean => {
    // Owner da casa tem todas as permissões
    if (isHouseOwner) return true;

    if (isLoading || !minhasPermissoes) return false;

    const isSuperAdmin = minhasPermissoes.some((p) => p.permissao?.nome === 'super_admin');
    if (isSuperAdmin) return true;

    return minhasPermissoes.some((p) => p.permissao?.nome === permissao);
  };

  /**
   * Verifica permissão EXPLÍCITA sem bypass de super_admin ou house_owner
   * Use para permissões que devem ser concedidas individualmente
   * Ex: ver_logs - precisa ser atribuída explicitamente
   */
  const temPermissaoExplicita = (permissao: PermissaoNome): boolean => {
    if (isLoading || !minhasPermissoes) return false;
    return minhasPermissoes.some((p) => p.permissao?.nome === permissao);
  };

  const temAlgumaPermissao = (permissoes: PermissaoNome[]): boolean => {
    // Owner da casa tem todas as permissões
    if (isHouseOwner) return true;

    if (isLoading || !minhasPermissoes) return false;

    const isSuperAdmin = minhasPermissoes.some((p) => p.permissao?.nome === 'super_admin');
    if (isSuperAdmin) return true;

    return permissoes.some((perm) => 
      minhasPermissoes.some((p) => p.permissao?.nome === perm)
    );
  };

  const isSuperAdmin = (): boolean => {
    // Owner da casa é "super admin" da casa dele
    if (isHouseOwner) return true;

    if (isLoading || !minhasPermissoes) return false;
    return minhasPermissoes.some((p) => p.permissao?.nome === 'super_admin');
  };

  return { temPermissao, temPermissaoExplicita, temAlgumaPermissao, isSuperAdmin, isLoading, isHouseOwner };
};

export default PermissionGate;
