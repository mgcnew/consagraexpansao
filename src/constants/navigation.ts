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
  History,
  Image,
  Info,
  ShoppingBag,
  Library,
  GraduationCap,
  LucideIcon,
} from 'lucide-react';
import { ROUTES, AppRoute } from '@/constants/routes';

export interface NavItem {
  icon: LucideIcon;
  label: string;
  path: AppRoute;
  adminOnly?: boolean;
}

// Itens principais de navegação
export const mainNavItems: NavItem[] = [
  { icon: Home, label: 'Início', path: ROUTES.HOME },
  { icon: FileText, label: 'Minha Ficha', path: ROUTES.ANAMNESE },
  { icon: Calendar, label: 'Cerimônias', path: ROUTES.CERIMONIAS },
  { icon: GraduationCap, label: 'Cursos', path: ROUTES.CURSOS },
  { icon: Leaf, label: 'Medicinas', path: ROUTES.MEDICINAS },
];

// Itens secundários
export const secondaryNavItems: NavItem[] = [
  { icon: MessageSquareQuote, label: 'Partilhas', path: ROUTES.PARTILHAS },
  { icon: Image, label: 'Galeria', path: ROUTES.GALERIA },
  { icon: ShoppingBag, label: 'Loja', path: ROUTES.LOJA },
  { icon: Library, label: 'Biblioteca', path: ROUTES.BIBLIOTECA },
  { icon: Info, label: 'Sobre Nós', path: ROUTES.SOBRE_NOS },
  { icon: History, label: 'Histórico', path: ROUTES.HISTORICO },
  { icon: HelpCircle, label: 'FAQ', path: ROUTES.FAQ },
  { icon: Heart, label: 'Emergência', path: ROUTES.EMERGENCIA },
];

// Item de configurações
export const settingsNavItem: NavItem = {
  icon: Settings,
  label: 'Configurações',
  path: ROUTES.CONFIGURACOES,
};

// Item de admin
export const adminNavItem: NavItem = {
  icon: Shield,
  label: 'Admin',
  path: ROUTES.ADMIN,
  adminOnly: true,
};

// Todos os itens (para menu mobile)
export const getAllNavItems = (isAdmin: boolean): NavItem[] => {
  const items = [...mainNavItems, ...secondaryNavItems, settingsNavItem];
  if (isAdmin) {
    items.push(adminNavItem);
  }
  return items;
};
