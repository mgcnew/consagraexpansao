/**
 * Templates de banners e logos pré-cadastrados
 * Os donos de casas podem escolher da biblioteca ou fazer upload próprio
 * 
 * INSTRUÇÕES PARA ADICIONAR IMAGENS:
 * 
 * Banners: Coloque em public/templates/banners/
 * - Formato: JPG ou WebP
 * - Tamanho recomendado: 1920x400px (ou proporção 4.8:1)
 * - Peso máximo: 200KB por imagem
 * 
 * Logos: Coloque em public/templates/logos/
 * - Formato: PNG (com transparência) ou SVG
 * - Tamanho recomendado: 200x200px
 * - Peso máximo: 50KB por imagem
 */

export interface BannerTemplate {
  id: string;
  name: string;
  url: string; // URL única (usada para light e dark)
  thumbnail?: string; // Miniatura opcional
}

export interface LogoTemplate {
  id: string;
  name: string;
  url: string;
  thumbnail?: string;
}

// 10 Banners pré-cadastrados
export const BANNER_TEMPLATES: BannerTemplate[] = [
  {
    id: 'padrao-light',
    name: 'Padrão Claro',
    url: '/hero-light.png',
  },
  {
    id: 'padrao-dark',
    name: 'Padrão Escuro',
    url: '/hero-dark.png',
  },
  {
    id: 'floresta',
    name: 'Floresta Sagrada',
    url: '/templates/banners/floresta.jpg',
  },
  {
    id: 'cosmos',
    name: 'Cosmos',
    url: '/templates/banners/cosmos.jpg',
  },
  {
    id: 'mandala',
    name: 'Mandala',
    url: '/templates/banners/mandala.jpg',
  },
  {
    id: 'agua',
    name: 'Águas Sagradas',
    url: '/templates/banners/agua.jpg',
  },
  {
    id: 'fogo',
    name: 'Fogo Sagrado',
    url: '/templates/banners/fogo.jpg',
  },
  {
    id: 'natureza',
    name: 'Natureza',
    url: '/templates/banners/natureza.jpg',
  },
  {
    id: 'por-do-sol',
    name: 'Pôr do Sol',
    url: '/templates/banners/por-do-sol.jpg',
  },
  {
    id: 'minimalista',
    name: 'Minimalista',
    url: '/templates/banners/minimalista.jpg',
  },
];

// 5 Logos pré-cadastrados
export const LOGO_TEMPLATES: LogoTemplate[] = [
  {
    id: 'padrao',
    name: 'Logo Ahoo',
    url: '/logo-topbar.png',
  },
  {
    id: 'lotus',
    name: 'Flor de Lótus',
    url: '/templates/logos/lotus.png',
  },
  {
    id: 'arvore',
    name: 'Árvore da Vida',
    url: '/templates/logos/arvore.png',
  },
  {
    id: 'lua',
    name: 'Lua Crescente',
    url: '/templates/logos/lua.png',
  },
  {
    id: 'geometria',
    name: 'Geometria Sagrada',
    url: '/templates/logos/geometria.png',
  },
];
