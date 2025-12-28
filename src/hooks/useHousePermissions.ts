import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useHouse } from '@/contexts/HouseContext';
import { useActiveHouse } from '@/hooks/useActiveHouse';
import { useMinhasPermissoes, type PermissaoNome } from '@/hooks/queries/usePermissoes';

/**
 * Hook centralizado para verificar permissões do usuário na casa
 * O dono da casa tem TODAS as permissões automaticamente
 */
export function useHousePermissions() {
  const { user, isAdmin: isPortalAdmin } = useAuth();
  const { isHouseOwner, isHouseAdmin } = useHouse();
  const { data: activeHouse } = useActiveHouse();
  const { data: minhasPermissoes, isLoading } = useMinhasPermissoes();

  // Verificar se é dono da casa (tem todas as permissões)
  const isDono = useMemo(() => {
    return Boolean(activeHouse && user && activeHouse.owner_id === user.id) || isHouseOwner;
  }, [activeHouse, user, isHouseOwner]);

  // Verificar se pode gerenciar (dono, admin do portal, ou admin da casa)
  const canManage = useMemo(() => {
    return isDono || isPortalAdmin || isHouseAdmin;
  }, [isDono, isPortalAdmin, isHouseAdmin]);

  // Verificar permissão específica
  const hasPermission = (permissao: PermissaoNome): boolean => {
    // Dono tem todas as permissões
    if (isDono) return true;
    
    // Admin do portal tem todas as permissões
    if (isPortalAdmin) return true;
    
    // Verificar permissão específica
    return minhasPermissoes?.some(p => p.permissao?.nome === permissao) || false;
  };

  // Verificar se tem alguma das permissões
  const hasAnyPermission = (permissoes: PermissaoNome[]): boolean => {
    if (isDono || isPortalAdmin) return true;
    return permissoes.some(p => hasPermission(p));
  };

  return {
    // Estados
    isLoading,
    isDono,
    isPortalAdmin,
    isHouseAdmin,
    canManage,
    
    // Funções
    hasPermission,
    hasAnyPermission,
    
    // Permissões específicas comuns (atalhos)
    // Usando nomes válidos do tipo PermissaoNome
    canManageCerimonias: isDono || isPortalAdmin || hasPermission('gerenciar_cerimonias'),
    canManageCursos: isDono || isPortalAdmin || hasPermission('gerenciar_cerimonias'), // cursos usa mesma permissão de cerimônias
    canManageMateriais: isDono || isPortalAdmin || hasPermission('gerenciar_materiais'),
    canManageProdutos: isDono || isPortalAdmin || hasPermission('gerenciar_produtos'),
    canManageFinanceiro: isDono || isPortalAdmin || hasPermission('ver_financeiro') || hasPermission('gerenciar_pagamentos'),
    canManageUsuarios: isDono || isPortalAdmin || hasPermission('ver_consagradores') || hasPermission('editar_consagradores'),
    canApproveDepoimentos: isDono || isPortalAdmin || hasPermission('aprovar_depoimentos'),
    canViewRelatorios: isDono || isPortalAdmin || hasPermission('ver_financeiro'),
    canViewLogs: isDono || isPortalAdmin || hasPermission('ver_logs'),
  };
}

export default useHousePermissions;
