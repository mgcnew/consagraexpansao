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

// Banners pré-cadastrados
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
  {
    id: 'floresta',
    name: 'Floresta Sagrada',
    description: 'Imagem de floresta com tons verdes e místicos',
    lightUrl: '/templates/banners/floresta-light.jpg',
    darkUrl: '/templates/banners/floresta-dark.jpg',
    category: 'natureza',
    tags: ['floresta', 'verde', 'natureza', 'ayahuasca'],
  },
  {
    id: 'cosmos',
    name: 'Cosmos',
    description: 'Visual cósmico com estrelas e galáxias',
    lightUrl: '/templates/banners/cosmos-light.jpg',
    darkUrl: '/templates/banners/cosmos-dark.jpg',
    category: 'espiritual',
    tags: ['cosmos', 'estrelas', 'universo', 'espiritual'],
  },
  {
    id: 'mandala',
    name: 'Mandala',
    description: 'Mandala geométrica com cores suaves',
    lightUrl: '/templates/banners/mandala-light.jpg',
    darkUrl: '/templates/banners/mandala-dark.jpg',
    category: 'espiritual',
    tags: ['mandala', 'geometria', 'sagrado', 'meditação'],
  },
  {
    id: 'agua',
    name: 'Águas Sagradas',
    description: 'Água cristalina com reflexos de luz',
    lightUrl: '/templates/banners/agua-light.jpg',
    darkUrl: '/templates/banners/agua-dark.jpg',
    category: 'natureza',
    tags: ['água', 'purificação', 'natureza', 'calma'],
  },
  {
    id: 'fogo',
    name: 'Fogo Sagrado',
    description: 'Chamas suaves representando transformação',
    lightUrl: '/templates/banners/fogo-light.jpg',
    darkUrl: '/templates/banners/fogo-dark.jpg',
    category: 'espiritual',
    tags: ['fogo', 'transformação', 'energia', 'força'],
  },
  {
    id: 'minimalista',
    name: 'Minimalista',
    description: 'Design limpo com gradiente suave',
    lightUrl: '/templates/banners/minimal-light.jpg',
    darkUrl: '/templates/banners/minimal-dark.jpg',
    category: 'minimalista',
    tags: ['minimalista', 'clean', 'moderno', 'simples'],
  },
  {
    id: 'por-do-sol',
    name: 'Pôr do Sol',
    description: 'Cores quentes do entardecer',
    lightUrl: '/templates/banners/sunset-light.jpg',
    darkUrl: '/templates/banners/sunset-dark.jpg',
    category: 'natureza',
    tags: ['pôr do sol', 'laranja', 'quente', 'paz'],
  },
];

// Logos pré-cadastrados
export const LOGO_TEMPLATES: LogoTemplate[] = [
  {
    id: 'default',
    name: 'Logo Ahoo',
    description: 'Logo padrão do sistema',
    url: '/logo-topbar.png',
    category: 'combinado',
    tags: ['padrão', 'ahoo'],
  },
  {
    id: 'lotus',
    name: 'Flor de Lótus',
    description: 'Símbolo de pureza e iluminação',
    url: '/templates/logos/lotus.png',
    category: 'simbolo',
    tags: ['lótus', 'flor', 'pureza', 'iluminação'],
  },
  {
    id: 'arvore',
    name: 'Árvore da Vida',
    description: 'Símbolo de conexão e crescimento',
    url: '/templates/logos/arvore.png',
    category: 'simbolo',
    tags: ['árvore', 'vida', 'raízes', 'crescimento'],
  },
  {
    id: 'olho',
    name: 'Olho Divino',
    description: 'Símbolo de visão e consciência',
    url: '/templates/logos/olho.png',
    category: 'simbolo',
    tags: ['olho', 'visão', 'consciência', 'terceiro olho'],
  },
  {
    id: 'serpente',
    name: 'Serpente',
    description: 'Símbolo de sabedoria e transformação',
    url: '/templates/logos/serpente.png',
    category: 'simbolo',
    tags: ['serpente', 'kundalini', 'sabedoria', 'transformação'],
  },
  {
    id: 'lua',
    name: 'Lua Crescente',
    description: 'Símbolo de ciclos e feminino',
    url: '/templates/logos/lua.png',
    category: 'simbolo',
    tags: ['lua', 'ciclos', 'feminino', 'noite'],
  },
  {
    id: 'sol',
    name: 'Sol Radiante',
    description: 'Símbolo de energia e vitalidade',
    url: '/templates/logos/sol.png',
    category: 'simbolo',
    tags: ['sol', 'energia', 'luz', 'vitalidade'],
  },
  {
    id: 'geometria',
    name: 'Geometria Sagrada',
    description: 'Padrão geométrico universal',
    url: '/templates/logos/geometria.png',
    category: 'simbolo',
    tags: ['geometria', 'sagrado', 'flor da vida', 'universal'],
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
