/**
 * Constantes de rotas do portal
 * Centraliza todas as rotas para facilitar manutenção e evitar strings hardcoded
 */

export const ROUTES = {
  // Autenticação
  AUTH: '/auth',
  
  // Páginas principais (protegidas)
  HOME: '/',
  ANAMNESE: '/anamnese',
  CERIMONIAS: '/cerimonias',
  MEDICINAS: '/medicinas',
  DEPOIMENTOS: '/depoimentos',
  HISTORICO: '/historico',
  FAQ: '/faq',
  EMERGENCIA: '/emergencia',
  CONFIGURACOES: '/configuracoes',
  
  // Admin (requer permissão)
  ADMIN: '/admin',
} as const;

/**
 * Tipo para as rotas disponíveis
 */
export type AppRoute = typeof ROUTES[keyof typeof ROUTES];

/**
 * Rotas que não requerem autenticação
 */
export const PUBLIC_ROUTES: AppRoute[] = [
  ROUTES.AUTH,
];

/**
 * Rotas que requerem permissão de admin
 */
export const ADMIN_ROUTES: AppRoute[] = [
  ROUTES.ADMIN,
];
