/**
 * Templates de banners e logos pré-cadastrados
 * Os donos de casas podem escolher da biblioteca ou fazer upload próprio
 */

export interface BannerTemplate {
  id: string;
  name: string;
  description: string;
  lightUrl: string;
  darkUrl: string;
  category: 'natureza' | 'espiritual' | 'minimalista' | 'colorido';
  tags: string[];
}

export interface LogoTemplate {
  id: string;
  name: string;
  description: string;
  url: string;
  category: 'simbolo' | 'texto' | 'combinado';
  tags: string[];
}

// Banners pré-cadastrados (apenas 1 para teste)
export const BANNER_TEMPLATES: BannerTemplate[] = [
  {
    id: 'default',
    name: 'Padrão Ahoo',
    description: 'Banner padrão do sistema com visual elegante',
    lightUrl: '/hero-light.png',
    darkUrl: '/hero-dark.png',
    category: 'espiritual',
    tags: ['padrão', 'elegante', 'medicina'],
  },
];

// Logos pré-cadastrados (apenas 1 para teste)
export const LOGO_TEMPLATES: LogoTemplate[] = [
  {
    id: 'default',
    name: 'Logo Ahoo',
    description: 'Logo padrão do sistema',
    url: '/logo-topbar.png',
    category: 'combinado',
    tags: ['padrão', 'ahoo'],
  },
];

// Categorias para filtro
export const BANNER_CATEGORIES = [
  { id: 'all', label: 'Todos' },
  { id: 'natureza', label: 'Natureza' },
  { id: 'espiritual', label: 'Espiritual' },
  { id: 'minimalista', label: 'Minimalista' },
  { id: 'colorido', label: 'Colorido' },
] as const;

export const LOGO_CATEGORIES = [
  { id: 'all', label: 'Todos' },
  { id: 'simbolo', label: 'Símbolos' },
  { id: 'texto', label: 'Texto' },
  { id: 'combinado', label: 'Combinado' },
] as const;
