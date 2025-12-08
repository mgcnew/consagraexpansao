/**
 * Hooks de queries centralizados
 * Requirements: 6.2
 */

// Cerimônias e Vagas
export { useVagasPorCerimonia, calcularVagasDisponiveis } from './useCerimoniasVagas';
export { useCerimoniasFuturas, useCerimoniasAdmin, useCerimoniasSelect } from './useCerimonias';

// Perfis e Anamneses
export { useProfiles, useAnamneses, useUserAnamnese } from './useProfiles';

// Inscrições
export { useMinhasInscricoes, useInscricoesAdmin, useHistoricoInscricoes, useCerimoniasProximas } from './useInscricoes';

// Depoimentos
export { 
  useDepoimentosInfinito, 
  useDepoimentosPendentes, 
  useMeusDepoimentosPendentes,
  useMeusDepoimentosAprovados 
} from './useDepoimentos';

// Roles
export { useRoles, useUserRoles, getUserRoleFromData } from './useRoles';

// Notificações
export { useNotificacoes, getUnreadCount } from './useNotificacoes';
