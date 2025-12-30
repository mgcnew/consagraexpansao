/**
 * Constantes de rotas do portal Ahoo
 * Centraliza todas as rotas para facilitar manutenção e evitar strings hardcoded
 */

export const ROUTES = {
  // === ROTAS PÚBLICAS (sem login) ===
  AUTH: '/auth',
  ENTRAR: '/entrar',
  LANDING: '/',
  BUSCAR_CASAS: '/buscar',
  CONVITE_CASA: '/convite/:slug',
  
  // === ROTAS DA CASA (públicas) ===
  CASA: '/casa/:slug',
  CASA_CERIMONIAS: '/casa/:slug/cerimonias',
  CASA_LOJA: '/casa/:slug/loja',
  CASA_CURSOS: '/casa/:slug/cursos',
  CASA_MATERIAIS: '/casa/:slug/materiais',
  CASA_GALERIA: '/casa/:slug/galeria',
  CASA_FAQ: '/casa/:slug/faq',
  CASA_SOBRE: '/casa/:slug/sobre',
  
  // === ÁREA DO CONSAGRADOR (logado, dentro da casa) ===
  CASA_MINHA_AREA: '/casa/:slug/minha-area',
  CASA_ANAMNESE: '/casa/:slug/anamnese',
  CASA_HISTORICO: '/casa/:slug/historico',
  CASA_BIBLIOTECA: '/casa/:slug/biblioteca',
  CASA_LEITURA: '/casa/:slug/biblioteca/ler',
  CASA_ESTUDOS: '/casa/:slug/estudos',
  CASA_PARTILHAS: '/casa/:slug/partilhas',
  CASA_CHAT: '/casa/:slug/chat',
  
  // === PAINEL ADMIN DA CASA ===
  ADMIN: '/admin',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_CERIMONIAS: '/admin/cerimonias',
  ADMIN_INSCRICOES: '/admin/inscricoes',
  ADMIN_CURSOS: '/admin/cursos',
  ADMIN_PRODUTOS: '/admin/produtos',
  ADMIN_MATERIAIS: '/admin/materiais',
  ADMIN_FINANCEIRO: '/admin/financeiro',
  ADMIN_USUARIOS: '/admin/usuarios',
  ADMIN_CONFIG: '/admin/configuracoes',
  
  // === PAINEL SUPER ADMIN (portal) ===
  PORTAL: '/portal',
  PORTAL_DASHBOARD: '/portal/dashboard',
  PORTAL_CASAS: '/portal/casas',
  PORTAL_PLANOS: '/portal/planos',
  PORTAL_REPASSES: '/portal/repasses',
  PORTAL_USUARIOS: '/portal/usuarios',
  PORTAL_CONFIG: '/portal/configuracoes',
  
  // === ÁREA DO USUÁRIO (global) ===
  PERFIL: '/perfil',
  CONFIGURACOES: '/configuracoes',
  MINHAS_CASAS: '/minhas-casas',
  
  // === PÁGINAS GLOBAIS ===
  MEDICINAS: '/medicinas',
  EMERGENCIA: '/emergencia',
  
  // === LEGADO (manter compatibilidade temporária) ===
  HOME: '/app',
  ANAMNESE: '/anamnese',
  CERIMONIAS: '/cerimonias',
  PARTILHAS: '/partilhas',
  GALERIA: '/galeria',
  LOJA: '/loja',
  SOBRE_NOS: '/sobre-nos',
  HISTORICO: '/historico',
  FAQ: '/faq',
  BIBLIOTECA: '/biblioteca',
  LEITURA: '/biblioteca/ler',
  ESTUDOS: '/estudos',
  CURSOS: '/cursos',
  CHAT: '/chat',
} as const;

/**
 * Tipo para as rotas disponíveis
 */
export type AppRoute = typeof ROUTES[keyof typeof ROUTES];

/**
 * Rotas que não requerem autenticação
 */
export const PUBLIC_ROUTES: string[] = [
  ROUTES.AUTH,
  ROUTES.LANDING,
  ROUTES.BUSCAR_CASAS,
  '/convite/:slug',
  '/casa/:slug',
  '/casa/:slug/cerimonias',
  '/casa/:slug/loja',
  '/casa/:slug/cursos',
  '/casa/:slug/materiais',
  '/casa/:slug/galeria',
  '/casa/:slug/faq',
  '/casa/:slug/sobre',
];

/**
 * Rotas que requerem permissão de admin da casa
 */
export const HOUSE_ADMIN_ROUTES: string[] = [
  ROUTES.ADMIN,
  ROUTES.ADMIN_DASHBOARD,
  ROUTES.ADMIN_CERIMONIAS,
  ROUTES.ADMIN_INSCRICOES,
  ROUTES.ADMIN_CURSOS,
  ROUTES.ADMIN_PRODUTOS,
  ROUTES.ADMIN_MATERIAIS,
  ROUTES.ADMIN_FINANCEIRO,
  ROUTES.ADMIN_USUARIOS,
  ROUTES.ADMIN_CONFIG,
];

/**
 * Rotas que requerem permissão de super admin (portal)
 */
export const PORTAL_ADMIN_ROUTES: string[] = [
  ROUTES.PORTAL,
  ROUTES.PORTAL_DASHBOARD,
  ROUTES.PORTAL_CASAS,
  ROUTES.PORTAL_PLANOS,
  ROUTES.PORTAL_REPASSES,
  ROUTES.PORTAL_USUARIOS,
  ROUTES.PORTAL_CONFIG,
];

/**
 * Helper para gerar URL da casa
 */
export const getHouseRoute = (slug: string, path: string = '') => {
  return `/casa/${slug}${path}`;
};

/**
 * Helper para gerar URL de convite da casa
 */
export const getInviteRoute = (slug: string) => {
  return `/convite/${slug}`;
};

/**
 * Helper para gerar URL do admin da casa
 */
export const getAdminRoute = (path: string = '') => {
  return `/admin${path}`;
};
