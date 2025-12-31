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

// Banners pre-cadastrados
export const BANNER_TEMPLATES: BannerTemplate[] = [
  {
    id: 'padrao-light',
    name: 'Padrao Claro',
    url: '/hero-light.png',
  },
  {
    id: 'padrao-dark',
    name: 'Padrao Escuro',
    url: '/hero-dark.png',
  },
  {
    id: 'suplica',
    name: 'Suplica',
    url: '/templates/banners/banner-suplica-01.webp',
  },
  {
    id: 'luz',
    name: 'Luz',
    url: '/templates/banners/banner-luz-02.webp',
  },
  {
    id: 'cruz',
    name: 'Cruz',
    url: '/templates/banners/banner-cruz-03.webp',
  },
  {
    id: 'vida',
    name: 'Vida',
    url: '/templates/banners/banner-vida-04.webp',
  },
];

// Logos pre-cadastrados (adicione quando tiver)
export const LOGO_TEMPLATES: LogoTemplate[] = [
  {
    id: 'padrao',
    name: 'Logo Ahoo',
    url: '/logo-topbar.png',
  },
];
