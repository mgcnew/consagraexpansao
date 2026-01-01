import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useHouse } from '@/contexts/HouseContext';
import { useActiveHouse, useIsHouseAdmin } from '@/hooks/useActiveHouse';
import { useMinhasPermissoes, type PermissaoNome } from '@/hooks/queries/usePermissoes';

/**
 * Hook centralizado para verificar permissões do usuário na casa
 * O dono da casa tem TODAS as permissões automaticamente
 * NOTA: super_admin do portal NAO tem permissoes automaticas nas casas
 */
export function useHousePermissions() {
  const { user } = useAuth();
  const { isHouseOwner, isHouseAdmin: isHouseAdminFromContext } = useHouse();
  const { data: activeHouse } = useActiveHouse();
  const { data: isActiveHouseAdmin } = useIsHouseAdmin();
  const { data: minhasPermissoes, isLoading } = useMinhasPermissoes();

  // Verificar se é dono da casa (tem todas as permissões)
  const isDono = useMemo(() => {
    return Boolean(activeHouse && user && activeHouse.owner_id === user.id) || isHouseOwner;
  }, [activeHouse, user, isHouseOwner]);

  // Verificar se é admin da casa (owner, admin ou facilitator)
  const isHouseAdmin = useMemo(() => {
    return isDono || isHouseAdminFromContext || isActiveHouseAdmin || false;
  }, [isDono, isHouseAdminFromContext, isActiveHouseAdmin]);

  // Verificar se pode gerenciar (dono ou admin da casa)
  // NOTA: super_admin do portal NAO tem permissoes automaticas nas casas
  const canManage = useMemo(() => {
    return isDono || isHouseAdmin;
  }, [isDono, isHouseAdmin]);

  // Verificar permissão específica
  const hasPermission = (permissao: PermissaoNome): boolean => {
    // Dono tem todas as permissões
    if (isDono) return true;
    
    // Admin da casa (owner/admin/facilitator) tem todas as permissões
    if (isHouseAdmin) return true;
    
    // Verificar permissão específica
    return minhasPermissoes?.some(p => p.permissao?.nome === permissao) || false;
  };

  // Verificar se tem alguma das permissões
  const hasAnyPermission = (permissoes: PermissaoNome[]): boolean => {
    if (isDono || isHouseAdmin) return true;
    return permissoes.some(p => hasPermission(p));
  };

  return {
    // Estados
    isLoading,
    isDono,
    isHouseAdmin,
    canManage,
    
    // Funções
    hasPermission,
    hasAnyPermission,
    
    // Permissões específicas comuns (atalhos)
    // Usando nomes válidos do tipo PermissaoNome
    canManageCerimonias: isDono || isHouseAdmin || hasPermission('gerenciar_cerimonias'),
    canManageCursos: isDono || isHouseAdmin || hasPermission('gerenciar_cerimonias'), // cursos usa mesma permissão de cerimônias
    canManageMateriais: isDono || isHouseAdmin || hasPermission('gerenciar_materiais'),
    canManageProdutos: isDono || isHouseAdmin || hasPermission('gerenciar_produtos'),
    canManageFinanceiro: isDono || isHouseAdmin || hasPermission('ver_financeiro') || hasPermission('gerenciar_pagamentos'),
    canManageUsuarios: isDono || isHouseAdmin || hasPermission('ver_consagradores') || hasPermission('editar_consagradores'),
    canApproveDepoimentos: isDono || isHouseAdmin || hasPermission('aprovar_depoimentos'),
    canViewRelatorios: isDono || isHouseAdmin || hasPermission('ver_financeiro'),
    canViewLogs: isDono || isHouseAdmin || hasPermission('ver_logs'),
  };
}

export default useHousePermissions;
