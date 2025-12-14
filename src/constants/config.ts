/**
 * Constantes de configuração do portal
 */

/**
 * Configurações de paginação
 */
export const PAGINATION = {
  /** Número de itens por página nas tabelas do Admin */
  ITEMS_PER_PAGE: 20,
  /** Número de itens por página em listas menores */
  ITEMS_PER_PAGE_SMALL: 10,
} as const;

/**
 * Chaves do localStorage
 */
export const STORAGE_KEYS = {
  /** Rascunho da anamnese */
  ANAMNESE_DRAFT: 'anamnese_draft',
  /** Preferências do tema */
  THEME: 'vite-ui-theme',
} as const;
