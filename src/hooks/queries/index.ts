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

// Histórico de Consagrações (Admin)
export { 
  useHistoricoConsagracoes, 
  useUpdateObservacao, 
  calcularStats,
  type ConsagracaoHistorico,
  type HistoricoStats,
} from './useHistoricoConsagracoes';

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

// Galeria
export {
  useGaleria,
  useGaleriaByCerimonia,
  useUploadGaleria,
  useUpdateGaleria,
  useDeleteGaleria,
} from './useGaleria';

// Dashboard Index Page (Req 1, 2, 3, 4)
export { useLatestPhotos } from './useLatestPhotos';
export { useUpcomingCeremonies, type CerimoniasComVagas } from './useUpcomingCeremonies';
export { useMyInscriptions, type MyInscription } from './useMyInscriptions';
export { useMyTestimonials, type MyTestimonial } from './useMyTestimonials';

// Permissões
export {
  usePermissoesDisponiveis,
  useMinhasPermissoes,
  useTemPermissao,
  useTemAlgumaPermissao,
  useTodasPermissoesUsuarios,
  useConcederPermissao,
  useRevogarPermissao,
  type Permissao,
  type UserPermissao,
  type PermissaoNome,
} from './usePermissoes';
