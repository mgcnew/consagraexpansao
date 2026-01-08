import {
  Home,
  FileText,
  Calendar,
  Leaf,
  HelpCircle,
  Settings,
  Heart,
  Shield,
  MessageSquareQuote,
  MessageCircle,
  Image,
  Info,
  ShoppingBag,
  Library,
  GraduationCap,
  BookOpen,
  LucideIcon,
} from 'lucide-react';
import { ROUTES, AppRoute } from '@/constants/routes';
import type { PlanFeature } from '@/hooks/usePlanFeatures';

export interface NavItem {
  icon: LucideIcon;
  label: string;
  path: AppRoute;
  adminOnly?: boolean;
  highlight?: boolean; // Para itens que precisam de destaque visual
  requiredFeature?: PlanFeature; // Feature do plano necessária
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

// ========================================
// GRUPOS DE NAVEGAÇÃO (organizados por contexto)
// ========================================

// 📌 Essencial - ações frequentes do usuário (disponível em todos os planos)
export const essentialNavItems: NavItem[] = [
  { icon: Home, label: 'Início', path: ROUTES.HOME },
  { icon: FileText, label: 'Minha Ficha', path: ROUTES.ANAMNESE },
  { icon: Calendar, label: 'Cerimônias', path: ROUTES.CERIMONIAS },
  { icon: GraduationCap, label: 'Cursos', path: ROUTES.CURSOS, requiredFeature: 'cursos' },
];

// 📚 Conteúdo - exploração e aprendizado
export const contentNavItems: NavItem[] = [
  { icon: Leaf, label: 'Medicinas', path: ROUTES.MEDICINAS },
  { icon: BookOpen, label: 'Estudos', path: ROUTES.ESTUDOS },
  { icon: Library, label: 'Biblioteca', path: ROUTES.BIBLIOTECA, requiredFeature: 'biblioteca' },
  { icon: Image, label: 'Galeria', path: ROUTES.GALERIA, requiredFeature: 'galeria' },
];

// 🛒 Comunidade & Loja
export const communityNavItems: NavItem[] = [
  { icon: MessageSquareQuote, label: 'Partilhas', path: ROUTES.PARTILHAS, requiredFeature: 'depoimentos' },
  // { icon: MessageCircle, label: 'Mensagens', path: ROUTES.CHAT }, // Temporariamente desabilitado
  { icon: ShoppingBag, label: 'Loja', path: ROUTES.LOJA, requiredFeature: 'loja' },
];

// ℹ️ Informações & Suporte (disponível em todos os planos)
export const supportNavItems: NavItem[] = [
  { icon: Info, label: 'Sobre Nós', path: ROUTES.SOBRE_NOS },
  { icon: HelpCircle, label: 'FAQ', path: ROUTES.FAQ },
  { icon: Heart, label: 'Emergência', path: ROUTES.EMERGENCIA, highlight: true },
];

// ⚙️ Sistema
export const settingsNavItem: NavItem = {
  icon: Settings,
  label: 'Configurações',
  path: ROUTES.CONFIGURACOES,
};

export const adminNavItem: NavItem = {
  icon: Shield,
  label: 'Admin',
  path: ROUTES.ADMIN,
  adminOnly: true,
};

// ========================================
// EXPORTS PARA COMPATIBILIDADE
// ========================================

// Mantém compatibilidade com código existente
export const mainNavItems = essentialNavItems;
export const secondaryNavItems = [
  ...contentNavItems,
  ...communityNavItems,
  ...supportNavItems,
];

// Grupos organizados para sidebar desktop
export const getNavGroups = (isAdmin: boolean): NavGroup[] => {
  const groups: NavGroup[] = [
    { label: 'Principal', items: essentialNavItems },
    { label: 'Conteúdo', items: contentNavItems },
    { label: 'Comunidade', items: communityNavItems },
    { label: 'Suporte', items: supportNavItems },
    { label: 'Sistema', items: [settingsNavItem, ...(isAdmin ? [adminNavItem] : [])] },
  ];
  return groups;
};

// Lista plana para menu mobile
export const getAllNavItems = (isAdmin: boolean): NavItem[] => {
  const items = [
    ...essentialNavItems,
    ...contentNavItems,
    ...communityNavItems,
    ...supportNavItems,
    settingsNavItem,
  ];
  if (isAdmin) {
    items.push(adminNavItem);
  }
  return items;
};
