/**
 * Constantes de cores do tema para referência
 * 
 * CORES PRINCIPAIS (usar via classes Tailwind):
 * 
 * - primary: Violeta místico profundo - Cor principal para CTAs, links, destaques
 *   Classes: text-primary, bg-primary, border-primary
 *   Variantes: primary/10, primary/20, primary/30 para backgrounds sutis
 * 
 * - secondary: Teal profundo - Cor de cura e natureza
 *   Classes: text-secondary, bg-secondary, border-secondary
 *   Variantes: secondary/10, secondary/20 para backgrounds sutis
 * 
 * - accent: Âmbar/Dourado vibrante - Iluminação, destaques especiais
 *   Classes: text-accent, bg-accent, border-accent
 * 
 * - destructive: Vermelho - Ações destrutivas, erros, alertas críticos
 *   Classes: text-destructive, bg-destructive, border-destructive
 * 
 * - muted: Cinza neutro - Textos secundários, backgrounds sutis
 *   Classes: text-muted-foreground, bg-muted
 * 
 * CORES SAGRADAS CUSTOMIZADAS:
 * 
 * - sacred-gold: Dourado sagrado - Para elementos especiais espirituais
 *   Classes: text-sacred-gold, bg-sacred-gold
 * 
 * - forest: Verde floresta - Natureza, cura
 *   Classes: text-forest, bg-forest
 * 
 * PADRÕES DE USO:
 * 
 * 1. Botões primários: bg-primary text-primary-foreground hover:bg-primary/90
 * 2. Botões secundários: bg-secondary text-secondary-foreground hover:bg-secondary/90
 * 3. Botões outline: border-primary text-primary hover:bg-primary/10
 * 4. Botões destrutivos: bg-destructive text-destructive-foreground hover:bg-destructive/90
 * 5. Links: text-primary hover:text-primary/80
 * 6. Ícones em containers: bg-primary/10 com ícone text-primary
 * 7. Badges: bg-primary/10 text-primary border-primary/20
 * 8. Cards destacados: border-primary/30 bg-primary/5
 * 9. Textos secundários: text-muted-foreground
 * 10. Backgrounds sutis: bg-muted/30 ou bg-card/50
 * 
 * ESTADOS ESPECIAIS:
 * 
 * - Sucesso: bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100
 * - Aviso: bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200
 * - Erro: bg-destructive/10 text-destructive
 * - Info: bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-200
 */

export const THEME_COLORS = {
  // Cores semânticas principais
  primary: 'primary',
  secondary: 'secondary',
  accent: 'accent',
  destructive: 'destructive',
  muted: 'muted',
  
  // Cores sagradas customizadas
  sacredGold: 'sacred-gold',
  forest: 'forest',
  
  // Estados
  success: {
    bg: 'bg-green-100 dark:bg-green-900',
    text: 'text-green-800 dark:text-green-100',
    border: 'border-green-200 dark:border-green-800',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    text: 'text-amber-800 dark:text-amber-200',
    border: 'border-amber-200 dark:border-amber-900',
  },
  error: {
    bg: 'bg-destructive/10',
    text: 'text-destructive',
    border: 'border-destructive/30',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    text: 'text-blue-800 dark:text-blue-200',
    border: 'border-blue-200 dark:border-blue-900',
  },
} as const;

/**
 * Classes padrão para componentes comuns
 */
export const COMPONENT_STYLES = {
  // Containers de ícones
  iconContainer: {
    primary: 'bg-primary/10',
    secondary: 'bg-secondary/10',
    accent: 'bg-accent/10',
    muted: 'bg-muted',
  },
  
  // Badges
  badge: {
    primary: 'bg-primary/10 text-primary border-primary/20',
    secondary: 'bg-secondary/10 text-secondary border-secondary/20',
    success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 border-green-200',
    warning: 'bg-amber-50 text-amber-800 dark:bg-amber-950/20 dark:text-amber-200 border-amber-200',
  },
  
  // Cards destacados
  highlightCard: {
    primary: 'border-primary/30 bg-primary/5',
    warning: 'border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900',
    error: 'border-destructive/30 bg-destructive/5',
  },
} as const;
