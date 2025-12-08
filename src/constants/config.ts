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

/**
 * Configurações de tempo (em milissegundos)
 */
export const TIMEOUTS = {
  /** Tempo de debounce para busca */
  SEARCH_DEBOUNCE: 300,
  /** Tempo de exibição de toast */
  TOAST_DURATION: 5000,
  /** Tempo para considerar cerimônia próxima (3 dias em ms) */
  CEREMONY_REMINDER_DAYS: 3 * 24 * 60 * 60 * 1000,
} as const;

/**
 * Configurações de validação
 */
export const VALIDATION = {
  /** Tamanho mínimo do nome completo */
  MIN_NAME_LENGTH: 3,
  /** Tamanho máximo do depoimento */
  MAX_DEPOIMENTO_LENGTH: 2000,
  /** Tamanho mínimo do depoimento */
  MIN_DEPOIMENTO_LENGTH: 10,
} as const;
